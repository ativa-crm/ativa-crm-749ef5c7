import { Phone, User, Video } from "lucide-react";
import { hora } from "@/lib/tempo";

// Aparência de conversa do WhatsApp compartilhada pela Prospecção e pela ficha
// da oportunidade. As cores (fundo de papel de parede, bolhas, cabeçalho) são
// tokens --chat-* em src/styles.css, iguais nos dois temas.
export type MensagemConversa = {
  id: string;
  direcao: string | null;
  conteudo: string | null;
  criado_em: string | null;
};

function rotuloAutor(direcao: string | null): string {
  if (direcao === "recebida") return "Lead";
  if (direcao === "enviada_humano") return "você";
  return "Ativa";
}

export function ConversaWhatsapp({
  titulo,
  mensagens,
}: {
  titulo: string;
  mensagens: MensagemConversa[];
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border-2 border-chat-moldura bg-chat-fundo shadow-lg"
      style={{ colorScheme: "light" }}
    >
      <header className="flex items-center gap-3 bg-chat-cabecalho px-3 py-2">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-chat-cabecalho-foreground/20">
          <User className="size-5 text-chat-cabecalho-foreground" strokeWidth={2.5} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-chat-cabecalho-foreground">
            {titulo.trim() || "Conversa"}
          </p>
          <p className="text-[11px] font-semibold text-chat-cabecalho-foreground/75">
            {mensagens.length} mensagens
          </p>
        </div>
        <Phone className="size-4 shrink-0 text-chat-cabecalho-foreground/75" />
        <Video className="size-4 shrink-0 text-chat-cabecalho-foreground/75" />
      </header>

      <div className="flex max-h-80 flex-col gap-2 overflow-y-auto px-3 py-3">
        {mensagens.map((m) => {
          const recebida = m.direcao === "recebida";
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-xl px-3 py-2 shadow-sm ${
                recebida
                  ? "self-start rounded-tl-none bg-chat-recebida text-chat-texto"
                  : "self-end rounded-tr-none bg-chat-enviada text-chat-texto"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-sm font-medium">
                {m.conteudo?.trim() || "—"}
              </p>
              <p className="mt-1 text-right text-[10px] font-bold text-chat-texto/60">
                {rotuloAutor(m.direcao)} · {hora(m.criado_em)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
