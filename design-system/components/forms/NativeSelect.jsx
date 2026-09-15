import React from "react";

const ALTURAS = { default: 36, md: 44, lg: 56 };

export function NativeSelect({ size = "md", pill = false, children, style, ...rest }) {
  return (
    <select
      style={{
        width: "100%", height: ALTURAS[size] || ALTURAS.md, appearance: "none",
        borderRadius: pill ? "var(--radius-pill)" : "var(--radius-xl)",
        border: "1px solid var(--border)", background: "var(--card)",
        padding: pill ? "0 40px 0 16px" : "0 40px 0 12px",
        fontFamily: "var(--font-sans)", fontSize: size === "lg" ? "var(--texto-lg)" : "var(--texto-md)",
        fontWeight: "var(--peso-semi)", color: "var(--foreground)", cursor: "pointer", outline: "none",
        backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23999999' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")",
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center",
        ...style,
      }}
      {...rest}
    >
      {children}
    </select>
  );
}
