import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoPadraoAsset from "@/assets/ativa-consultoria-logo.png.asset.json";

export const Route = createFileRoute("/entrar")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar | CRM de Topografia e Georreferenciamento" },
      {
        name: "description",
        content:
          "Acesse o CRM de topografia e georreferenciamento para gerenciar imóveis, serviços e orçamentos.",
      },
      { property: "og:title", content: "Entrar | CRM de Topografia" },
      {
        property: "og:description",
        content: "Acesso restrito à equipe: imóveis, serviços e orçamentos em um só lugar.",
      },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/inicio" });
  },
  component: Entrar,
});

function Entrar() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    setEnviando(false);
    if (error) {
      setErro("E-mail ou senha incorretos. Tente novamente.");
      return;
    }
    navigate({ to: "/inicio", replace: true });
  }

  return (
    <main className="grid min-h-screen bg-background-light lg:grid-cols-2">
      <section className="hidden items-center justify-center bg-background p-12 lg:flex">
        <img
          src={logoPadraoAsset.url}
          alt="Ativa Consultoria — Georreferenciamento e Topografia"
          className="w-full max-w-md object-contain"
        />
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-card sm:p-9">
          <div className="mb-7 text-center">
            <img
              src={logoPadraoAsset.url}
              alt="Logo da Ativa Consultoria"
              className="mx-auto mb-5 h-20 w-40 object-contain"
            />
            <h1 className="text-2xl font-extrabold leading-tight text-foreground">ATIVA CONSULTORIA</h1>
            <p className="mt-1 text-base text-muted-foreground">Topografia e georreferenciamento</p>
          </div>

        <form onSubmit={entrar} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-base font-bold">
              E-mail
            </Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-xl border border-border text-lg"
              placeholder="voce@empresa.com.br"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha" className="text-base font-bold">
              Senha
            </Label>
            <Input
              id="senha"
              type="password"
              autoComplete="current-password"
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-14 rounded-xl border border-border text-lg"
              placeholder="••••••••"
            />
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-xl border-2 border-destructive/40 bg-destructive/10 px-4 py-3 text-base font-semibold text-destructive"
            >
              {erro}
            </p>
          )}

          <Button
            type="submit"
            disabled={enviando}
            className="h-14 w-full rounded-full text-lg font-extrabold uppercase"
          >
            {enviando ? <Loader2 className="size-6 animate-spin" /> : "Entrar"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm font-medium text-muted-foreground">
          O acesso é criado pelo administrador da sua empresa.
        </p>
        </div>
      </section>
    </main>
  );
}
