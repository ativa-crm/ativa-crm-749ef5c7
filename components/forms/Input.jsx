import React from "react";

const ALTURAS = { default: 36, md: 44, lg: 56 };

export function Input({ size = "default", pill = false, invalid = false, style, ...rest }) {
  const [foco, setFoco] = React.useState(false);
  return (
    <input
      onFocus={(e) => { setFoco(true); rest.onFocus && rest.onFocus(e); }}
      onBlur={(e) => { setFoco(false); rest.onBlur && rest.onBlur(e); }}
      style={{
        display: "flex", width: "100%", height: ALTURAS[size] || ALTURAS.default,
        borderRadius: pill ? "var(--radius-pill)" : "var(--radius-xl)",
        border: `1px solid ${invalid ? "var(--destructive)" : foco ? "var(--primary)" : "var(--input)"}`,
        background: "var(--card)", padding: pill ? "0 16px" : "0 12px",
        fontFamily: "var(--font-sans)", fontSize: size === "lg" ? "var(--texto-lg)" : "var(--texto-md)",
        fontWeight: "var(--peso-medio)", color: "var(--foreground)",
        boxShadow: foco ? "var(--foco-anel)" : "var(--sombra-sm)", outline: "none",
        transition: "all var(--dur-padrao) var(--ease-padrao)", ...style,
      }}
      {...rest}
    />
  );
}
