import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logoPadraoAsset from "@/assets/ativa-consultoria-logo.png.asset.json";

export const Route = createFileRoute("/reset-password")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Criar senha nova | CRM de Topografia e Georreferenciamento" },
      {
        name: "description",
        content: "Defina uma senha nova para acessar o CRM de topografia e georreferenciamento.",
      },
      { property: "og:title", content: "Criar senha nova | CRM de Topografia" },
      {
        property: "og:description",
        content: "Defina uma senha nova para acessar o CRM de topografia e georreferenciamento.",
      },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }
    if (senha !== confirmar) {
      setErro("As duas senhas não são iguais.");
      return;
    }
    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: senha });
    setEnviando(false);
    if (error) {
      setErro(
        "O link expirou ou já foi usado. Peça um e-mail novo na tela de entrada e tente de novo.",
      );
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
            <h1 className="text-2xl font-extrabold leading-tight text-foreground">
              CRIAR SENHA NOVA
            </h1>
            <p className="mt-1 text-base text-muted-foreground">
              Escolha uma senha nova para a sua conta
            </p>
          </div>

          <form onSubmit={salvar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="senha" className="text-base font-bold">
                Senha nova
              </Label>
              <Input
                id="senha"
                type="password"
                autoComplete="new-password"
                required
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="h-14 rounded-xl border border-border text-lg"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmar" className="text-base font-bold">
                Repetir a senha nova
              </Label>
              <Input
                id="confirmar"
                type="password"
                autoComplete="new-password"
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
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
              {enviando ? <Loader2 className="size-6 animate-spin" /> : "Salvar senha nova"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
