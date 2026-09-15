import React from "react";

export function Textarea({ rows = 4, invalid = false, style, ...rest }) {
  const [foco, setFoco] = React.useState(false);
  return (
    <textarea
      rows={rows}
      onFocus={(e) => { setFoco(true); rest.onFocus && rest.onFocus(e); }}
      onBlur={(e) => { setFoco(false); rest.onBlur && rest.onBlur(e); }}
      style={{
        width: "100%", borderRadius: "var(--radius-xl)",
        border: `1px solid ${invalid ? "var(--destructive)" : foco ? "var(--primary)" : "var(--input)"}`,
        background: "var(--card)", padding: "10px 12px", resize: "vertical",
        fontFamily: "var(--font-sans)", fontSize: "var(--texto-md)", fontWeight: "var(--peso-medio)",
        color: "var(--foreground)", boxShadow: foco ? "var(--foco-anel)" : "var(--sombra-sm)",
        outline: "none", transition: "all var(--dur-padrao) var(--ease-padrao)", ...style,
      }}
      {...rest}
    />
  );
}
