import React from "react";

export function Card({ hover = false, style, children, ...rest }) {
  const [over, setOver] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setOver(true)}
      onMouseLeave={() => setOver(false)}
      style={{
        borderRadius: 14, border: "1px solid var(--border)", background: "var(--card)",
        color: "var(--card-foreground)", boxShadow: "var(--card-shadow)",
        transition: "transform var(--dur-rapida) var(--ease-padrao), box-shadow var(--dur-rapida) var(--ease-padrao), background-color var(--dur-rapida) var(--ease-padrao)",
        transform: hover && over ? "translateY(-1px)" : "none",
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ style, children, ...rest }) {
  return <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: 24, ...style }} {...rest}>{children}</div>;
}
export function CardTitle({ style, children, ...rest }) {
  return <div style={{ fontWeight: "var(--peso-semi)", lineHeight: 1, letterSpacing: "-0.01em", ...style }} {...rest}>{children}</div>;
}
export function CardDescription({ style, children, ...rest }) {
  return <div style={{ fontSize: "var(--texto-base)", color: "var(--muted-foreground)", ...style }} {...rest}>{children}</div>;
}
export function CardContent({ style, children, ...rest }) {
  return <div style={{ padding: "0 24px 24px", ...style }} {...rest}>{children}</div>;
}
export function CardFooter({ style, children, ...rest }) {
  return <div style={{ display: "flex", alignItems: "center", padding: "0 24px 24px", ...style }} {...rest}>{children}</div>;
}
