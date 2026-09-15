import React from "react";

export function Tooltip({ texto, children, style, ...rest }) {
  const [vis, setVis] = React.useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-flex", ...style }}
      onMouseEnter={() => setVis(true)}
      onMouseLeave={() => setVis(false)}
      {...rest}
    >
      {children}
      {vis ? (
        <span
          role="tooltip"
          style={{
            position: "absolute", bottom: "calc(100% + 6px)", left: "50%", transform: "translateX(-50%)",
            whiteSpace: "nowrap", borderRadius: "var(--radius-sm)", background: "var(--background-secondary)",
            color: "#fff", padding: "6px 10px", fontFamily: "var(--font-sans)",
            fontSize: "var(--texto-sm)", fontWeight: "var(--peso-semi)", boxShadow: "var(--sombra-md)", zIndex: 40,
          }}
        >
          {texto}
        </span>
      ) : null}
    </span>
  );
}
