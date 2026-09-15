import React from "react";

export function Skeleton({ width = "100%", height = 16, radius = "var(--radius-sm)", style, ...rest }) {
  return (
    <div
      style={{
        width, height, borderRadius: radius, background: "var(--secondary)",
        animation: "ativa-pulse 1.6s ease-in-out infinite", ...style,
      }}
      {...rest}
    >
      <style>{"@keyframes ativa-pulse{0%,100%{opacity:1}50%{opacity:.55}}"}</style>
    </div>
  );
}
