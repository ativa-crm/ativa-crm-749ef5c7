import React from "react";

export function Separator({ orientation = "horizontal", style, ...rest }) {
  return (
    <div
      role="separator"
      style={{
        background: "var(--border)", flex: "none",
        width: orientation === "vertical" ? 1 : "100%",
        height: orientation === "vertical" ? "100%" : 1,
        ...style,
      }}
      {...rest}
    />
  );
}
