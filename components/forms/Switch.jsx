import React from "react";

export function Switch({ checked = false, onChange, disabled = false, label, style, ...rest }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        role="switch"
        aria-checked={checked}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 40, height: 22, borderRadius: 999, flex: "none", padding: 2,
          background: checked ? "var(--primary)" : "var(--input)",
          display: "inline-flex", alignItems: "center",
          transition: "background-color var(--dur-padrao) var(--ease-padrao)",
        }}
        {...rest}
      >
        <span style={{ width: 18, height: 18, borderRadius: 999, background: "#fff", boxShadow: "var(--sombra-sm)", transform: checked ? "translateX(18px)" : "translateX(0)", transition: "transform var(--dur-padrao) var(--ease-padrao)" }} />
      </span>
      {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-md)", fontWeight: "var(--peso-medio)" }}>{label}</span> : null}
    </label>
  );
}
