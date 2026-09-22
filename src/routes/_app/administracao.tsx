import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, ShieldCheck, Users, Wrench } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { usePerfil } from "@/lib/perfil";
import { mascaraCNPJ, mascaraTelefone, numero, paraNumero, reais } from "@/lib/formato";
import { Bloco, Campo, CampoOpcoes, Grade } from "@/components/campos";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Painel, Tabela } from "@/components/painel";

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
        content:
          "Administração de usuários, catálogo de serviços, dados da empresa, metas e gamificação de time.",
      },
      { property: "og:title", content: "Administração | CRM de Topografia" },
      {
        property: "og:description",
        content: "Usuários, serviços, dados cadastrais e metas da empresa.",
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
  meta_mensal_receita: number | null;
  pontos_por_resposta_rapida: number | null;
  mostrar_pontos_barra_superior: boolean | null;
  avisar_lead_sem_resposta_horas: number | null;
};

type Usuario = {
  id: string;
  nome: string | null;
  email: string | null;
  papel: string | null;
  ativo: boolean | null;
};
type ServicoCatalogo = {
  id: string;
  nome: string | null;
  preco_base: number | null;
  prazo_padrao_dias: number | null;
  ativo: boolean | null;
};

type TabelaAdmin = "empresas" | "usuarios" | "servicos_catalogo";

const papeis = [
  { valor: "admin", rotulo: "Dono" },
  { valor: "administrativo", rotulo: "Administrativo" },
  { valor: "eng_responsavel", rotulo: "Eng. responsável" },
];

function papelRotulo(v: string | null | undefined): string {
  return papeis.find((p) => p.valor === v)?.rotulo ?? "Sem papel";
}

function Pagina() {
  const { perfil } = usePerfil();
  const queryClient = useQueryClient();
  const [usuarioId, setUsuarioId] = useState<string | null>(null);
  const [servicoId, setServicoId] = useState<string | null>(null);

  const empresaQuery = useQuery({
    queryKey: ["administracao", "empresa", perfil?.empresa_id],
    enabled: !!perfil?.empresa_id,
    queryFn: async (): Promise<Empresa | null> => {
      const { data, error } = await supabase
        .from("empresas")
        .select(
          "id, nome, cnpj, telefone_agente, instancia_evolution, raio_atendimento_km, cidade_base, logo_url, ativa, meta_mensal_receita, pontos_por_resposta_rapida, mostrar_pontos_barra_superior, avisar_lead_sem_resposta_horas",
        )
        .eq("id", perfil?.empresa_id as string)
        .maybeSingle();
      if (error) throw error;
      return (data as Empresa | null) ?? null;
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
  const servicosQuery = useQuery({
    queryKey: ["administracao", "servicos_catalogo", perfil?.empresa_id],
    enabled: !!perfil?.empresa_id,
    queryFn: async (): Promise<ServicoCatalogo[]> => {
      const { data, error } = await supabase
        .from("servicos_catalogo")
        .select("id, nome, preco_base, prazo_padrao_dias, ativo")
        .order("nome");
      if (error) throw error;
      return (data ?? []) as ServicoCatalogo[];
    },
  });

  useEffect(() => {
    if (!usuarioId && usuariosQuery.data?.[0]) setUsuarioId(usuariosQuery.data[0].id);
  }, [usuarioId, usuariosQuery.data]);
  useEffect(() => {
    if (!servicoId && servicosQuery.data?.[0]) setServicoId(servicosQuery.data[0].id);
  }, [servicoId, servicosQuery.data]);

  const empresa = empresaQuery.data ?? null;
  const usuario = usuariosQuery.data?.find((item) => item.id === usuarioId) ?? null;
  const servico = servicosQuery.data?.find((item) => item.id === servicoId) ?? null;

  const salvar = useMutation({
    mutationFn: async ({
      tabela,
      id,
      mudanca,
    }: {
      tabela: TabelaAdmin;
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

  const resumo = useMemo(() => {
    const usuarios = usuariosQuery.data ?? [];
    const servicos = servicosQuery.data ?? [];
    return {
      donos: usuarios.filter((u) => u.papel === "admin").length,
      administrativos: usuarios.filter((u) => u.papel === "administrativo").length,
      engenheiros: usuarios.filter((u) => u.papel === "eng_responsavel").length,
      servicosAtivos: servicos.filter((s) => s.ativo !== false).length,
    };
  }, [usuariosQuery.data, servicosQuery.data]);

  if (empresaQuery.isPending || usuariosQuery.isPending || servicosQuery.isPending)
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-9 animate-spin text-primary" />
      </div>
    );

  return (
    <section className="space-y-4">
      <header className="flex items-center gap-2">
        <ShieldCheck className="size-7 text-primary" strokeWidth={2.5} />
        <h1 className="text-2xl font-bold text-foreground">Administração</h1>
      </header>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ResumoAdmin rotulo="Donos" valor={resumo.donos} />
        <ResumoAdmin rotulo="Administrativo" valor={resumo.administrativos} />
        <ResumoAdmin rotulo="Engenharia" valor={resumo.engenheiros} />
        <ResumoAdmin rotulo="Serviços ativos" valor={resumo.servicosAtivos} />
      </div>

      <Tabs defaultValue="usuarios" className="space-y-4">
        <TabsList className="h-auto max-w-full flex-wrap justify-start">
          <TabsTrigger value="usuarios">
            <Users className="size-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="servicos">
            <Wrench className="size-4" />
            Serviços
          </TabsTrigger>
          <TabsTrigger value="empresa">
            <Building2 className="size-4" />
            Empresa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios">
          <PainelLista
            itens={usuariosQuery.data ?? []}
            selecionado={usuarioId}
            aoSelecionar={setUsuarioId}
            rotulo={(item) => item.nome || item.email || "Usuário sem nome"}
          >
            <Painel titulo="Usuários e permissões" icone={Users}>
              {usuario ? (
                <Grade>
                  <Campo
                    rotulo="Nome"
                    valor={usuario.nome ?? ""}
                    onSalvar={(nome) =>
                      salvar.mutate({
                        tabela: "usuarios",
                        id: usuario.id,
                        mudanca: { nome: nome || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="E-mail"
                    valor={usuario.email ?? ""}
                    inputMode="email"
                    onSalvar={(email) =>
                      salvar.mutate({
                        tabela: "usuarios",
                        id: usuario.id,
                        mudanca: { email: email || null },
                      })
                    }
                  />
                  <CampoOpcoes
                    rotulo="Papel"
                    valor={usuario.papel ?? "administrativo"}
                    opcoes={papeis}
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
              ) : (
                <Vazio />
              )}
            </Painel>
            <Painel titulo="Lista de usuários" icone={Users}>
              <Tabela>
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                      <th className="px-3 py-2">Nome</th>
                      <th className="px-3 py-2">E-mail</th>
                      <th className="px-3 py-2">Papel</th>
                      <th className="px-3 py-2">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(usuariosQuery.data ?? []).map((u) => (
                      <tr key={u.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-3 font-bold text-foreground">{u.nome ?? "—"}</td>
                        <td className="px-3 py-3 text-sm font-semibold text-muted-foreground">
                          {u.email ?? "—"}
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant="outline"
                            className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                          >
                            <span className="size-2 rounded-full bg-primary" />
                            {papelRotulo(u.papel)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3 text-sm font-bold text-foreground">
                          {u.ativo ? "Ativo" : "Inativo"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tabela>
            </Painel>
          </PainelLista>
        </TabsContent>

        <TabsContent value="servicos">
          <PainelLista
            itens={servicosQuery.data ?? []}
            selecionado={servicoId}
            aoSelecionar={setServicoId}
            rotulo={(item) => item.nome || "Serviço sem nome"}
          >
            <Painel titulo="Catálogo de serviços" icone={Wrench}>
              {servico ? (
                <Grade>
                  <Campo
                    rotulo="Serviço"
                    valor={servico.nome ?? ""}
                    onSalvar={(nome) =>
                      salvar.mutate({
                        tabela: "servicos_catalogo",
                        id: servico.id,
                        mudanca: { nome: nome || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Preço base"
                    valor={numero(servico.preco_base)}
                    inputMode="decimal"
                    onSalvar={(preco) =>
                      salvar.mutate({
                        tabela: "servicos_catalogo",
                        id: servico.id,
                        mudanca: { preco_base: paraNumero(preco) },
                      })
                    }
                  />
                  <Campo
                    rotulo="Prazo padrão em dias"
                    valor={numero(servico.prazo_padrao_dias, 0)}
                    inputMode="numeric"
                    onSalvar={(prazo_padrao_dias) =>
                      salvar.mutate({
                        tabela: "servicos_catalogo",
                        id: servico.id,
                        mudanca: { prazo_padrao_dias: paraNumero(prazo_padrao_dias) },
                      })
                    }
                  />
                  <ControleBooleano
                    rotulo="Serviço ativo"
                    marcado={servico.ativo ?? false}
                    aoMudar={(ativo) =>
                      salvar.mutate({
                        tabela: "servicos_catalogo",
                        id: servico.id,
                        mudanca: { ativo },
                      })
                    }
                  />
                </Grade>
              ) : (
                <Vazio />
              )}
            </Painel>
            <Painel titulo="Serviços cadastrados" icone={Wrench}>
              <Tabela>
                <table className="w-full min-w-[720px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border text-xs font-bold uppercase text-muted-foreground">
                      <th className="px-3 py-2">Serviço</th>
                      <th className="px-3 py-2 text-right">Preço base</th>
                      <th className="px-3 py-2 text-center">Prazo</th>
                      <th className="px-3 py-2">Situação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(servicosQuery.data ?? []).map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-3 font-bold text-foreground">{s.nome ?? "—"}</td>
                        <td className="px-3 py-3 text-right text-sm font-extrabold text-foreground">
                          {reais(s.preco_base)}
                        </td>
                        <td className="px-3 py-3 text-center text-sm font-bold text-muted-foreground">
                          {s.prazo_padrao_dias ?? "—"} dias
                        </td>
                        <td className="px-3 py-3">
                          <Badge
                            variant="outline"
                            className="gap-1.5 rounded-full border-border bg-card px-2.5 py-1 text-xs text-foreground"
                          >
                            <span
                              className={`size-2 rounded-full ${s.ativo !== false ? "bg-primary" : "bg-muted-foreground"}`}
                            />
                            {s.ativo !== false ? "Ativo" : "Desativado"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Tabela>
            </Painel>
          </PainelLista>
        </TabsContent>

        <TabsContent value="empresa">
          {empresa ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <Painel titulo="Dados cadastrais" icone={Building2}>
                <Grade>
                  <Campo
                    rotulo="Nome"
                    valor={empresa.nome ?? ""}
                    onSalvar={(nome) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { nome: nome || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="CNPJ"
                    valor={empresa.cnpj ?? ""}
                    mascara={mascaraCNPJ}
                    inputMode="numeric"
                    onSalvar={(cnpj) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { cnpj: cnpj || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Telefone de atendimento"
                    valor={empresa.telefone_agente ?? ""}
                    mascara={mascaraTelefone}
                    inputMode="tel"
                    onSalvar={(telefone_agente) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { telefone_agente: telefone_agente || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Cidade base"
                    valor={empresa.cidade_base ?? ""}
                    onSalvar={(cidade_base) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { cidade_base: cidade_base || null },
                      })
                    }
                  />
                  <Campo
                    rotulo="Raio de atendimento (km)"
                    valor={numero(empresa.raio_atendimento_km)}
                    inputMode="decimal"
                    onSalvar={(raio_atendimento_km) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { raio_atendimento_km: paraNumero(raio_atendimento_km) },
                      })
                    }
                  />
                  <Campo
                    rotulo="URL do logo"
                    valor={empresa.logo_url ?? ""}
                    onSalvar={(logo_url) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { logo_url: logo_url || null },
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
              </Painel>
              <Painel titulo="Metas e gamificação de time" icone={ShieldCheck}>
                <Grade>
                  <Campo
                    rotulo="Meta mensal de receita"
                    valor={numero(empresa.meta_mensal_receita)}
                    inputMode="decimal"
                    onSalvar={(meta_mensal_receita) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { meta_mensal_receita: paraNumero(meta_mensal_receita) },
                      })
                    }
                  />
                  <Campo
                    rotulo="Pontos por resposta rápida"
                    valor={numero(empresa.pontos_por_resposta_rapida, 0)}
                    inputMode="numeric"
                    onSalvar={(pontos_por_resposta_rapida) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: {
                          pontos_por_resposta_rapida: paraNumero(pontos_por_resposta_rapida),
                        },
                      })
                    }
                  />
                  <Campo
                    rotulo="Avisar lead sem resposta após horas"
                    valor={numero(empresa.avisar_lead_sem_resposta_horas, 0)}
                    inputMode="numeric"
                    onSalvar={(avisar_lead_sem_resposta_horas) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: {
                          avisar_lead_sem_resposta_horas: paraNumero(
                            avisar_lead_sem_resposta_horas,
                          ),
                        },
                      })
                    }
                  />
                  <ControleBooleano
                    rotulo="Mostrar pontos na barra superior"
                    marcado={empresa.mostrar_pontos_barra_superior ?? false}
                    aoMudar={(mostrar_pontos_barra_superior) =>
                      salvar.mutate({
                        tabela: "empresas",
                        id: empresa.id,
                        mudanca: { mostrar_pontos_barra_superior },
                      })
                    }
                  />
                </Grade>
                <p className="mt-4 rounded-lg border border-border bg-background-light p-3 text-sm font-semibold text-muted-foreground">
                  A gamificação é de time e mede resposta ao cliente, sem ranking individual.
                </p>
              </Painel>
            </div>
          ) : (
            <Vazio />
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function ResumoAdmin({ rotulo, valor }: { rotulo: string; valor: ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <span className="block text-2xl font-extrabold text-primary">{valor}</span>
      <span className="mt-1 block text-xs font-bold uppercase text-muted-foreground">{rotulo}</span>
    </div>
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
  children: ReactNode;
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
      <div className="space-y-4">{children}</div>
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
    <div className="flex min-h-14 items-center justify-between rounded-lg border border-border px-4 sm:col-span-2">
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
