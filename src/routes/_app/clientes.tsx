import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes | CRM de Topografia" },
      { name: "description", content: "Clientes — CRM de topografia e georreferenciamento." },
      { property: "og:title", content: "Clientes | CRM de Topografia" },
      { property: "og:description", content: "Clientes — CRM de topografia e georreferenciamento." },
    ],
  }),
  component: Pagina,
});

function Pagina() {
  return (
    <section>
      <h1 className="text-3xl font-extrabold text-foreground">Clientes</h1>
      <p className="mt-3 text-lg font-medium text-muted-foreground">
        Esta tela será construída nas próximas etapas.
      </p>
    </section>
  );
}
