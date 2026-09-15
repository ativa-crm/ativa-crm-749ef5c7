import React from "react";

/**
 * Traçados Lucide copiados de lucide-icons/lucide (assets/icons/*.svg), embutidos
 * para que o ícone funcione offline e sem depender do tipo MIME do servidor.
 */
export const TRACOS_ICONES = {"bell":"<path d=\"M10.268 21a2 2 0 0 0 3.464 0\"></path> <path d=\"M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326\"></path>","calendar":"<path d=\"M8 2v3\"></path> <path d=\"M16 2v3\"></path> <rect x=\"3\" y=\"3\" width=\"18\" height=\"18\" rx=\"2\"></rect> <path d=\"M3 9h18\"></path>","check":"<path d=\"M20 6 9 17l-5-5\"></path>","chevron-down":"<path d=\"m6 9 6 6 6-6\"></path>","chevron-left":"<path d=\"m15 18-6-6 6-6\"></path>","chevron-right":"<path d=\"m9 18 6-6-6-6\"></path>","chevron-up":"<path d=\"m18 15-6-6-6 6\"></path>","clipboard-list":"<rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\" ry=\"1\"></rect> <path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"></path> <path d=\"M12 11h4\"></path> <path d=\"M12 16h4\"></path> <path d=\"M8 11h.01\"></path> <path d=\"M8 16h.01\"></path>","clock-3":"<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"M12 6v6h4\"></path>","download":"<path d=\"M12 15V3\"></path> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path> <path d=\"m7 10 5 5 5-5\"></path>","ellipsis-vertical":"<circle cx=\"12\" cy=\"12\" r=\"1\"></circle> <circle cx=\"12\" cy=\"5\" r=\"1\"></circle> <circle cx=\"12\" cy=\"19\" r=\"1\"></circle>","file-check":"<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"></path> <path d=\"M14 2v5a1 1 0 0 0 1 1h5\"></path> <path d=\"m9 15 2 2 4-4\"></path>","file-pen-line":"<path d=\"M14.364 13.634a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506l4.013-4.009a1 1 0 0 0-3.004-3.004z\"></path> <path d=\"M14.487 7.858A1 1 0 0 1 14 7V2\"></path> <path d=\"M20 19.645V20a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l2.516 2.516\"></path> <path d=\"M8 18h1\"></path>","file-text":"<path d=\"M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z\"></path> <path d=\"M14 2v5a1 1 0 0 0 1 1h5\"></path> <path d=\"M10 9H8\"></path> <path d=\"M16 13H8\"></path> <path d=\"M16 17H8\"></path>","flame":"<path d=\"M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4\"></path>","funnel":"<path d=\"M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z\"></path>","house":"<path d=\"M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8\"></path> <path d=\"M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z\"></path>","loader-circle":"<path d=\"M21 12a9 9 0 1 1-6.219-8.56\"></path>","log-out":"<path d=\"m16 17 5-5-5-5\"></path> <path d=\"M21 12H9\"></path> <path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"></path>","mail":"<path d=\"m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7\"></path> <rect x=\"2\" y=\"4\" width=\"20\" height=\"16\" rx=\"2\"></rect>","map-pin":"<path d=\"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0\"></path> <circle cx=\"12\" cy=\"10\" r=\"3\"></circle>","map-pinned":"<path d=\"M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0\"></path> <circle cx=\"12\" cy=\"8\" r=\"2\"></circle> <path d=\"M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712\"></path>","moon":"<path d=\"M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401\"></path>","move-right":"<path d=\"M18 8L22 12L18 16\"></path> <path d=\"M2 12H22\"></path>","panel-left":"<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"></rect> <path d=\"M9 3v18\"></path>","pencil":"<path d=\"M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z\"></path> <path d=\"m15 5 4 4\"></path>","phone":"<path d=\"M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384\"></path>","plus":"<path d=\"M5 12h14\"></path> <path d=\"M12 5v14\"></path>","route":"<circle cx=\"6\" cy=\"19\" r=\"3\"></circle> <path d=\"M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15\"></path> <circle cx=\"18\" cy=\"5\" r=\"3\"></circle>","search":"<path d=\"m21 21-4.34-4.34\"></path> <circle cx=\"11\" cy=\"11\" r=\"8\"></circle>","settings-2":"<path d=\"M14 17H5\"></path> <path d=\"M19 7h-9\"></path> <circle cx=\"17\" cy=\"17\" r=\"3\"></circle> <circle cx=\"7\" cy=\"7\" r=\"3\"></circle>","shield-alert":"<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"></path> <path d=\"M12 8v4\"></path> <path d=\"M12 16h.01\"></path>","shield-check":"<path d=\"M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z\"></path> <path d=\"m9 12 2 2 4-4\"></path>","sun":"<circle cx=\"12\" cy=\"12\" r=\"4\"></circle> <path d=\"M12 2v2\"></path> <path d=\"M12 20v2\"></path> <path d=\"m4.93 4.93 1.41 1.41\"></path> <path d=\"m17.66 17.66 1.41 1.41\"></path> <path d=\"M2 12h2\"></path> <path d=\"M20 12h2\"></path> <path d=\"m6.34 17.66-1.41 1.41\"></path> <path d=\"m19.07 4.93-1.41 1.41\"></path>","trash":"<path d=\"M10 11v6\"></path> <path d=\"M14 11v6\"></path> <path d=\"M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6\"></path> <path d=\"M3 6h18\"></path> <path d=\"M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2\"></path>","triangle-alert":"<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3\"></path> <path d=\"M12 9v4\"></path> <path d=\"M12 17h.01\"></path>","upload":"<path d=\"M12 3v12\"></path> <path d=\"m17 8-5-5-5 5\"></path> <path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"></path>","users":"<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"></path> <path d=\"M16 3.128a4 4 0 0 1 0 7.744\"></path> <path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"></path> <circle cx=\"9\" cy=\"7\" r=\"4\"></circle>","wrench":"<path d=\"M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.106-3.105c.32-.322.863-.22.983.218a6 6 0 0 1-8.259 7.057l-7.91 7.91a1 1 0 0 1-2.999-3l7.91-7.91a6 6 0 0 1 7.057-8.259c.438.12.54.662.219.984z\"></path>","x":"<path d=\"M18 6 6 18\"></path> <path d=\"m6 6 12 12\"></path>"};

/** Base de fallback quando o nome não está embutido. */
export const ICON_BASE = "https://unpkg.com/lucide-static@latest/icons/";

export function Icon({ name, size = 20, color = "currentColor", base = ICON_BASE, style, ...rest }) {
  const traco = TRACOS_ICONES[name];
  if (traco) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        focusable="false"
        style={{ flex: "none", display: "block", ...style }}
        dangerouslySetInnerHTML={{ __html: traco }}
        {...rest}
      />
    );
  }
  const url = `url("${base}${name}.svg")`;
  return (
    <span
      aria-hidden="true"
      style={{
        display: "inline-block", width: size, height: size, flex: "none", background: color,
        WebkitMaskImage: url, maskImage: url,
        WebkitMaskRepeat: "no-repeat", maskRepeat: "no-repeat",
        WebkitMaskPosition: "center", maskPosition: "center",
        WebkitMaskSize: "contain", maskSize: "contain",
        ...style,
      }}
      {...rest}
    />
  );
}
