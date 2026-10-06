import { BatteryFull, Phone, Signal, User, Video, Wifi } from "lucide-react";
import { hora } from "@/lib/tempo";

// Aparência de conversa do WhatsApp dentro de uma moldura de celular, compartilhada
// pela Prospecção (versão compacta) e pela ficha da oportunidade. As cores são
// tokens --chat-* e --celular-* em src/styles.css, iguais nos dois temas.
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
  className,
  compacto = false,
}: {
  titulo: string;
  mensagens: MensagemConversa[];
  /** Classe extra para o aparelho (ex.: limitar altura). */
  className?: string;
  /** Versão com altura menor, para painéis laterais estreitos. */
  compacto?: boolean;
}) {
  const agora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="flex justify-center" style={{ colorScheme: "light" }}>
      <div
        className={`relative w-full max-w-[380px] rounded-[3rem] bg-gradient-to-br from-celular-titanio-claro via-celular-titanio to-celular-titanio-claro p-[3px] shadow-2xl ${
          compacto ? "" : "aspect-[9/19.5]"
        } ${className ?? ""}`}
      >
        {/* Botões laterais */}
        <span className="absolute -left-[3px] top-[18%] h-8 w-[3px] rounded-l bg-celular-titanio" />
        <span className="absolute -left-[3px] top-[26%] h-12 w-[3px] rounded-l bg-celular-titanio" />
        <span className="absolute -left-[3px] top-[35%] h-12 w-[3px] rounded-l bg-celular-titanio" />
        <span className="absolute -right-[3px] top-[28%] h-16 w-[3px] rounded-r bg-celular-titanio" />

        {/* Bezel */}
        <div className="h-full rounded-[2.85rem] bg-celular-bezel p-2.5">
          {/* Tela */}
          <div
            className={`relative flex h-full flex-col overflow-hidden rounded-[2.4rem] bg-chat-fundo ${
              compacto ? "max-h-[32rem]" : ""
            }`}
          >
            {/* Barra de status + Dynamic Island */}
            <div className="relative flex h-11 shrink-0 items-center justify-between bg-chat-cabecalho px-7 text-chat-cabecalho-foreground">
              <span className="text-xs font-bold">{agora}</span>
              <span className="absolute left-1/2 top-2 h-7 w-24 -translate-x-1/2 rounded-full bg-celular-bezel" />
              <span className="flex items-center gap-1">
                <Signal className="size-3.5" strokeWidth={2.5} />
                <Wifi className="size-3.5" strokeWidth={2.5} />
                <BatteryFull className="size-4" strokeWidth={2.5} />
              </span>
            </div>

            <header className="flex shrink-0 items-center gap-3 bg-chat-cabecalho px-3 pb-2">
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

            <div
              className={`flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3 ${
                compacto ? "max-h-80" : ""
              }`}
            >
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

            {/* Barra de gesto */}
            <div className="flex h-6 shrink-0 items-center justify-center bg-chat-fundo">
              <span className="h-1.5 w-28 rounded-full bg-chat-texto/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
