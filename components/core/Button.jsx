import React from "react";

const SIZES = {
  default: { height: 36, padding: "0 16px", fontSize: "var(--texto-base)" },
  sm: { height: 32, padding: "0 12px", fontSize: "var(--texto-sm)" },
  lg: { height: 40, padding: "0 32px", fontSize: "var(--texto-base)" },
  icon: { height: 36, width: 36, padding: 0, fontSize: "var(--texto-base)" },
};

function paleta(variant, hover) {
  switch (variant) {
    case "destructive":
      return { background: "var(--destructive)", color: "var(--destructive-foreground)", boxShadow: "var(--sombra-sm)", opacity: hover ? 0.9 : 1 };
    case "outline":
      return { background: hover ? "var(--accent)" : "var(--card)", color: hover ? "var(--accent-foreground)" : "var(--foreground)", border: "1px solid var(--input)", boxShadow: "var(--sombra-sm)" };
    case "secondary":
      return { background: hover ? "var(--background)" : "var(--background-secondary)", color: "var(--primary-foreground)", boxShadow: "var(--sombra-sm)" };
    case "ghost":
      return { background: hover ? "var(--accent)" : "transparent", color: hover ? "var(--accent-foreground)" : "inherit" };
    case "link":
      return { background: "transparent", color: "var(--primary)", textDecoration: hover ? "underline" : "none", textUnderlineOffset: 4 };
    default:
      return { background: hover ? "var(--primary-dark)" : "var(--primary)", color: "var(--primary-foreground)", boxShadow: hover ? "var(--sombra-md)" : "var(--sombra-sm)" };
  }
}

export function Button({ variant = "default", size = "default", disabled = false, fullWidth = false, style, children, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const s = SIZES[size] || SIZES.default;
  return (
    <button
      type="button"
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
        whiteSpace: "nowrap", borderRadius: "var(--radius-pill)", border: "1px solid transparent",
        fontFamily: "var(--font-sans)", fontWeight: "var(--peso-bold)", textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1,
        transition: "all var(--dur-padrao) var(--ease-padrao)",
        width: fullWidth ? "100%" : s.width, height: s.height, padding: s.padding, fontSize: s.fontSize,
        ...paleta(variant, hover && !disabled), ...style,
      }}
      {...rest}
    >
      {children}
    </button>
  );
}
