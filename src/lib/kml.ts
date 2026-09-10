// Leitura de KML e KMZ (KML zipado) com extração de pontos e vértices.

export type PontoKml = { codigo: string; lat: number; lon: number };

function codigo(indice: number): string {
  return `P${String(indice).padStart(2, "0")}`;
}

function coordenadas(texto: string): { lat: number; lon: number }[] {
  return texto
    .trim()
    .split(/\s+/)
    .map((par) => {
      const [lon, lat] = par.split(",").map((v) => Number(v));
      if (lon === undefined || lat === undefined) return null;
      if (!Number.isFinite(lon) || !Number.isFinite(lat)) return null;
      return { lat, lon };
    })
    .filter((p): p is { lat: number; lon: number } => p !== null);
}

/** Extrai pontos de <Point> e vértices de <Polygon>/<LinearRing>/<LineString>. */
export function parseKml(texto: string): PontoKml[] {
  const pontos: PontoKml[] = [];
  let indice = 0;

  const placemarks = texto.match(/<Placemark[\s\S]*?<\/Placemark>/gi) ?? [];
  const blocos = placemarks.length > 0 ? placemarks : [texto];

  for (const bloco of blocos) {
    const nome = (bloco.match(/<name>([\s\S]*?)<\/name>/i)?.[1] ?? "").trim();
    const trechos = bloco.match(/<coordinates>([\s\S]*?)<\/coordinates>/gi) ?? [];
    let primeiroDoPlacemark = true;

    for (const trecho of trechos) {
      const bruto = trecho.replace(/<\/?coordinates>/gi, "");
      const lista = coordenadas(bruto);
      for (const c of lista) {
        indice++;
        const rotulo =
          nome && primeiroDoPlacemark && lista.length === 1 && trechos.length === 1
            ? nome
            : nome
              ? `${nome} ${codigo(indice)}`
              : codigo(indice);
        primeiroDoPlacemark = false;
        pontos.push({ codigo: rotulo.slice(0, 60), lat: c.lat, lon: c.lon });
      }
    }
  }

  // Remove vértice repetido de fechamento de polígono (último igual ao primeiro).
  if (pontos.length > 2) {
    const a = pontos[0]!;
    const z = pontos[pontos.length - 1]!;
    if (a.lat === z.lat && a.lon === z.lon) pontos.pop();
  }

  return pontos;
}

/** Extrai o .kml de dentro do .kmz e lê os pontos. */
export async function parseKmz(arquivo: File): Promise<PontoKml[]> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(await arquivo.arrayBuffer());
  const nomes = Object.keys(zip.files).filter((n) => n.toLowerCase().endsWith(".kml"));
  if (nomes.length === 0) throw new Error("Nenhum arquivo KML encontrado dentro do KMZ.");
  let todos: PontoKml[] = [];
  for (const nome of nomes) {
    const conteudo = await zip.files[nome]!.async("text");
    todos = todos.concat(parseKml(conteudo));
  }
  return todos;
}

/** Lê um arquivo KML ou KMZ escolhido pelo usuário. */
export async function lerArquivoGeo(arquivo: File): Promise<PontoKml[]> {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".kmz")) return parseKmz(arquivo);
  return parseKml(await arquivo.text());
}
