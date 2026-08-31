import { useQuery } from "@tanstack/react-query";
import { createContext, useContext, type ReactNode } from "react";
import { supabase } from "./supabase";

export type Perfil = {
  id: string;
  empresa_id: string;
  papel: string | null;
  nome: string | null;
  empresa: { nome: string | null; logo_url: string | null } | null;
};

type PerfilContexto = {
  perfil: Perfil | null;
  carregando: boolean;
  semAcesso: boolean;
};

const Ctx = createContext<PerfilContexto>({
  perfil: null,
  carregando: true,
  semAcesso: false,
});

export function usePerfil() {
  return useContext(Ctx);
}

export function perfilQueryOptions() {
  return {
    queryKey: ["perfil"] as const,
    queryFn: async (): Promise<Perfil | null> => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return null;

      const { data, error } = await supabase
        .from("usuarios")
        .select("id, empresa_id, papel, nome, empresas(nome, logo_url)")
        .eq("id", uid)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      const empresaRel = (data as Record<string, unknown>)["empresas"];
      const empresa = Array.isArray(empresaRel) ? empresaRel[0] : empresaRel;

      return {
        id: data.id as string,
        empresa_id: data.empresa_id as string,
        papel: (data.papel as string | null) ?? null,
        nome: (data.nome as string | null) ?? null,
        empresa: (empresa as Perfil["empresa"]) ?? null,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  };
}

export function PerfilProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = useQuery(perfilQueryOptions());

  return (
    <Ctx.Provider
      value={{
        perfil: data ?? null,
        carregando: isPending,
        semAcesso: !isPending && !data,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
