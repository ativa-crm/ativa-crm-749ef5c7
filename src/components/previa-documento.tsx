/** Folha A4 com a prévia do documento oficial, atualizada a cada alteração do formulário. */
export function PreviaDocumento({ html, titulo }: { html: string; titulo: string }) {
  return (
    <div className="flex min-h-0 justify-center overflow-auto rounded-lg bg-muted p-4 lg:h-[78vh]">
      <iframe
        title={titulo}
        srcDoc={html}
        style={{ colorScheme: "light" }}
        className="aspect-[210/297] w-full max-w-[794px] shrink-0 rounded-sm bg-white shadow-lg lg:h-[1123px] lg:w-[794px]"
      />
    </div>
  );
}
