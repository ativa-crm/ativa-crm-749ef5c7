import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, FileCode2, Loader2, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { mascaraCNPJ, mascaraTelefone, numero, paraNumero } from "@/lib/formato";
import { Bloco, Campo, CampoLongo, CampoOpcoes, Grade } from "@/components/campos";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_app/administracao")({
  beforeLoad: async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) throw redirect({ to: "/entrar" });
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("papel")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (usuario?.papel !== "admin") throw redirect({ to: "/inicio" });
  },
  head: () => ({
    meta: [
      { title: "Administração | CRM de Topografia" },
      {
        name: "description",
        content: "Administração de empresas, usuários e modelos de documento.",
      },
      { property: "og:title", content: "Administração | CRM de Topografia" },
      {
        property: "og:description",
        content: "Gerencie empresas, usuários e modelos de documento.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Pagina,
});

type Empresa = {
  id: string;
  nome: string | null;
  cnpj: string | null;
  telefone_agente: string | null;
  instancia_evolution: string | null;
  raio_atendimento_km: number | null;
  cidade_base: string | null;
  logo_url: string | null;
  ativa: boolean | null;
};

type Usuario = {
  id: string;
  nome: string | null;
  email: string | null;
  papel: string | null;
  ativo: boolean | null;
};

type Modelo = {
  id: string;
  tipo: string | null;
  nome: string | null;
  arquivo_url: string | null;
  campos: unknown;
  padrao: boolean | null;
};

function Pagina() {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [modeloId, setModeloId] = useState<string | null>(null);

  const empresasQuery = useQuery({
    queryKey: ["administracao", "empresas"],
    queryFn: async (): Promise<Empresa[]> => {
      const { data, error } = await supabase.from("empresas").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as Empresa[];
    },
  });
  const usuariosQuery = useQuery({
    queryKey: ["administracao", "usuarios", perfil?.empresa_id],
    enabled: !!perfil?.empresa_id,
    queryFn: async (): Promise<Usuario[]> => {
      const { data, error } = await supabase
        .from("usuarios")
        .select("id, nome, email, papel, ativo")
        .eq("empresa_id", perfil?.empresa_id as string)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Usuario[];
    },
  });
  const modelosQuery = useQuery({
    queryKey: ["administracao", "modelos-documento"],
    queryFn: async (): Promise<Modelo[]> => {
      const { data, error } = await supabase.from("modelos_documento").select("*").order("nome");
      if (error) throw error;
      return (data ?? []) as Modelo[];
    },
  });

  useEffect(() => {
    if (!empresaId && empresasQuery.data?.[0]) setEmpresaId(empresasQuery.data[0].id);
  }, [empresaId, empresasQuery.data]);
  useEffect(() => {
    if (!usuarioId && usuariosQuery.data?.[0]) setUsuarioId(usuariosQuery.data[0].id);
  }, [usuarioId, usuariosQuery.data]);
  useEffect(() => {
    if (!modeloId && modelosQuery.data?.[0]) setModeloId(modelosQuery.data[0].id);
  }, [modeloId, modelosQuery.data]);

  const empresa = empresasQuery.data?.find((item) => item.id === empresaId) ?? null;
  const usuario = usuariosQuery.data?.find((item) => item.id === usuarioId) ?? null;
  const modelo = modelosQuery.data?.find((item) => item.id === modeloId) ?? null;

  const salvar = useMutation({
    mutationFn: async ({
      tabela,
      id,
      mudanca,
    }: {
      tabela: "empresas" | "usuarios" | "modelos_documento";
      id: string;
      mudanca: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from(tabela).update(mudanca).eq("id", id);
      if (error) throw error;
      return tabela;
    },
    onSuccess: (tabela) => {
      void queryClient.invalidateQueries({ queryKey: ["administracao"] });
      if (tabela === "usuarios") void queryClient.invalidateQueries({ queryKey: ["perfil"] });
      toast.success("Alteração salva.");
    },
    onError: () => toast.error("Não foi possível salvar a alteração."),
  });

  const camposModelo = useMemo(() => {
    if (!modelo) return "";
    if (typeof modelo.campos === "string") return modelo.campos;
    return modelo.campos == null ? "" : JSON.stringify(modelo.campos, null, 2);
  }, [modelo]);

  if (empresasQuery.isPending || usuariosQuery.isPending || modelosQuery.isPending) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-9 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <section>
      <header className="flex items-center gap-2">
        <ShieldCheck className="size-7 text-primary" strokeWidth={2.5} />
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
      </header>
      <Tabs defaultValue="empresas" className="mt-5">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="empresas">
            <Building2 /> Empresas
          </TabsTrigger>
          <TabsTrigger value="usuarios">
            <Users /> Usuários
          </TabsTrigger>
          <TabsTrigger value="modelos">
            <FileCode2 /> Modelos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="empresas" className="mt-4">
          <PainelLista
            itens={empresasQuery.data ?? []}
            selecionado={empresaId}
            aoSelecionar={setEmpresaId}
            rotulo={(item) => item.nome || "Empresa sem nome"}
          >
            {empresa ? (
              <Bloco titulo={empresa.nome || "Empresa"}>
                <Grade>
                  <Campo
                    rotulo="Nome"
                    valor={empresa.nome ?? ""}
                    onSalvar={(v) =>
                      salvar.mutate({ tabela: "empresas", id: empresa.id, mudanca: { nome: v } })
                    }
                  />
                  <Campo
                    rotulo="CNPJ"
                    valor={empresa.cnpj ?? ""}
                    mascara={mascaraCNPJ}
                    inputMode="numeric"
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { cnpj: v || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Telefone do agente"
                    valor={empresa.telefone_agente ?? ""}
                    mascara={mascaraTelefone}
                    inputMode="tel"
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { telefone_agente: v || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Instância Evolution"
                    valor={empresa.instancia_evolution ?? ""}
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { instancia_evolution: v || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Raio de atendimento (km)"
                    valor={numero(empresa.raio_atendimento_km)}
                    inputMode="decimal"
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { raio_atendimento_km: paraNumero(v) },
                      })
                    }
                  />
                  <Campo
                    rotulo="Cidade base"
                    valor={empresa.cidade_base ?? ""}
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { cidade_base: v || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="URL do logo"
                    valor={empresa.logo_url ?? ""}
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { logo_url: v || null },
                      })
                    }
                    larguraTotal
                  />
                  <ControleBooleano
                    rotulo="Empresa ativa"
                    marcado={empresa.ativa ?? false}
                    aoMudar={(ativa) =>
                      salvar.mutate({ tabela: "empresas", id: empresa.id, mudanca: { ativa } })
                    }
                  />
                </Grade>
              </Bloco>
            ) : (
              <Vazio />
            )}
          </PainelLista>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <PainelLista
            itens={usuariosQuery.data ?? []}
            selecionado={usuarioId}
            aoSelecionar={setUsuarioId}
            rotulo={(item) => item.nome || item.email || "Usuário sem nome"}
          >
            {usuario ? (
              <Bloco titulo={usuario.nome || "Usuário"}>
                <Grade>
                  <Campo
                    rotulo="Nome"
                    valor={usuario.nome ?? ""}
                    onSalvar={(v) =>
                      salvar.mutate({ tabela: "usuarios", id: usuario.id, mudanca: { nome: v } })
                    }
                  />
                  <Campo
                    rotulo="E-mail"
                    valor={usuario.email ?? ""}
                    inputMode="email"
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "usuarios",
                        id: usuario.id,
                        mudanca: { email: v || null },
                      })
                    }
                  />
                  <CampoOpcoes
                    rotulo="Papel"
                    valor={usuario.papel ?? "usuario"}
                    opcoes={[
                      { valor: "usuario", rotulo: "Usuário" },
                      { valor: "admin", rotulo: "Administrador" },
                    ]}
                    onSalvar={(papel) =>
                      salvar.mutate({ tabela: "usuarios", id: usuario.id, mudanca: { papel } })
                    }
                    larguraTotal
                  />
                  <ControleBooleano
                    rotulo="Usuário ativo"
                    marcado={usuario.ativo ?? false}
                    aoMudar={(ativo) =>
                      salvar.mutate({ tabela: "usuarios", id: usuario.id, mudanca: { ativo } })
                    }
                  />
                </Grade>
              </Bloco>
            ) : (
              <Vazio />
            )}
          </PainelLista>
        </TabsContent>

        <TabsContent value="modelos" className="mt-4">
          <PainelLista
            itens={modelosQuery.data ?? []}
            selecionado={modeloId}
            aoSelecionar={setModeloId}
            rotulo={(item) => item.nome || item.tipo || "Modelo sem nome"}
          >
            {modelo ? (
              <Bloco titulo={modelo.nome || "Modelo de documento"}>
                <Grade>
                  <Campo
                    rotulo="Tipo"
                    valor={modelo.tipo ?? ""}
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "modelos_documento",
                        id: modelo.id,
                        mudanca: { tipo: v || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Nome"
                    valor={modelo.nome ?? ""}
                    onSalvar={(v) =>
                      salvar.mutate({
                        tabela: "modelos_documento",
                        id: modelo.id,
                        mudanca: { nome: v || null },
                      })
                    }
                  />
                </Grade>
                <div className="mt-4">
                  <CampoLongo
                    rotulo="Campos do modelo"
                    valor={camposModelo}
                    placeholder="Lista ou objeto de campos"
                    onSalvar={(v) => {
                      let campos: unknown = v || null;
                      if (v) {
                        try {
                          campos = JSON.parse(v);
                        } catch {
                          toast.error("Use um JSON válido no campo de marcadores.");
                          return;
                        }
                      }
                      salvar.mutate({
                        tabela: "modelos_documento",
                        id: modelo.id,
                        mudanca: { campos },
                      });
                    }}
                  />
                </div>
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-muted-foreground">
                    Edite o HTML usando marcadores como {"{{cliente_nome}}"}, {"{{numero}}"},{" "}
                    {"{{itens}}"} e {"{{total}}"}.
                  </p>
                  <CampoLongo
                    rotulo="HTML do documento"
                    valor={modelo.arquivo_url ?? ""}
                    placeholder="<html>...</html>"
                    onSalvar={(arquivo_url) =>
                      salvar.mutate({
                        tabela: "modelos_documento",
                        id: modelo.id,
                        mudanca: { arquivo_url: arquivo_url || null },
                      })
                    }
                  />
                </div>
                <div className="mt-4">
                  <ControleBooleano
                    rotulo="Modelo padrão"
                    marcado={modelo.padrao ?? false}
                    aoMudar={(padrao) =>
                      salvar.mutate({
                        tabela: "modelos_documento",
                        id: modelo.id,
                        mudanca: { padrao },
                      })
                    }
                  />
                </div>
              </Bloco>
            ) : (
              <Vazio />
            )}
          </PainelLista>
        </TabsContent>
      </Tabs>
    </section>
  );
}

function PainelLista<T extends { id: string }>({
  itens,
  selecionado,
  aoSelecionar,
  rotulo,
  children,
}: {
  itens: T[];
  selecionado: string | null;
  aoSelecionar: (id: string) => void;
  rotulo: (item: T) => string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
      <div className="flex gap-2 overflow-x-auto pb-1 lg:block lg:space-y-2 lg:overflow-visible">
        {itens.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => aoSelecionar(item.id)}
            className={`min-h-12 min-w-48 rounded-lg border px-3 py-2 text-left text-sm font-semibold transition-colors lg:w-full lg:min-w-0 ${selecionado === item.id ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:bg-accent"}`}
          >
            {rotulo(item)}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}

function ControleBooleano({
  rotulo,
  marcado,
  aoMudar,
}: {
  rotulo: string;
  marcado: boolean;
  aoMudar: (valor: boolean) => void;
}) {
  return (
    <div className="flex min-h-14 items-center justify-between rounded-xl border-2 border-border px-4 sm:col-span-2">
      <Label className="text-base font-bold">{rotulo}</Label>
      <Switch
        checked={marcado}
        onCheckedChange={aoMudar}
        className="h-7 w-12 [&>span]:size-6 data-[state=checked]:[&>span]:translate-x-5"
      />
    </div>
  );
}

function Vazio() {
  return (
    <p className="py-8 text-lg font-medium text-muted-foreground">Nenhum registro disponível.</p>
  );
}
