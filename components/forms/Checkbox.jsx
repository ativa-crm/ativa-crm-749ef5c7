import React from "react";

export function Checkbox({ checked = false, onChange, label, disabled = false, style, ...rest }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.5 : 1, ...style }}>
      <span
        role="checkbox"
        aria-checked={checked}
        onClick={() => !disabled && onChange && onChange(!checked)}
        style={{
          width: 18, height: 18, borderRadius: 5, flex: "none",
          border: `1px solid ${checked ? "var(--primary)" : "var(--input)"}`,
          background: checked ? "var(--primary)" : "var(--card)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          transition: "all var(--dur-padrao) var(--ease-padrao)",
        }}
        {...rest}
      >
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
        ) : null}
      </span>
      {label ? <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--texto-md)", fontWeight: "var(--peso-medio)", color: "var(--foreground)" }}>{label}</span> : null}
    </label>
  );
}
