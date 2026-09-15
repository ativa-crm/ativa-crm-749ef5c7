import React from "react";

export function Label({ forte = false, style, children, ...rest }) {
  return (
    <label
      style={{
        display: "block", fontFamily: "var(--font-sans)",
        fontSize: forte ? "var(--texto-md)" : "var(--texto-base)",
        fontWeight: forte ? "var(--peso-bold)" : "var(--peso-medio)",
        lineHeight: 1, color: "var(--foreground)", ...style,
      }}
      {...rest}
    >
      {children}
    </label>
  );
}
