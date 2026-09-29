import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

/** Segue o redirecionamento de links curtos do Google Maps (maps.app.goo.gl) e devolve a URL final. */
export const resolverLinkMaps = createServerFn({ method: "POST" })
  .inputValidator((d) =>
    z
      .object({
        url: z
          .string()
          .url()
          .refine((u) => /^https:\/\/(maps\.app\.goo\.gl|goo\.gl\/maps|maps\.google\.com|www\.google\.com\/maps)/.test(u), "Link não é do Google Maps."),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    let atual = data.url;
    for (let i = 0; i < 5; i++) {
      const r = await fetch(atual, { redirect: "manual" });
      const proximo = r.headers.get("location");
      if (!proximo) break;
      atual = new URL(proximo, atual).toString();
    }
    return { url: atual };
  });
