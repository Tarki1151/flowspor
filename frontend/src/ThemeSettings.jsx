import React, { useState, useEffect } from "react";

const defaultTheme = {
  primary: "#1976d2",
  background: "#f9fafb",
  card: "#fff",
  text: "#222",
  font: "'Inter', Arial, sans-serif"
};

const fontOptions = [
  { label: "Inter", value: "'Inter', Arial, sans-serif" },
  { label: "Roboto", value: "'Roboto', Arial, sans-serif" },
  { label: "Nunito", value: "'Nunito', Arial, sans-serif" },
  { label: "Montserrat", value: "'Montserrat', Arial, sans-serif" },
  { label: "Arial", value: "Arial, sans-serif" },
];

export default function ThemeSettings({ onClose }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("themeSettings");
    return saved ? JSON.parse(saved) : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", theme.primary);
    document.documentElement.style.setProperty("--background", theme.background);
    document.documentElement.style.setProperty("--card", theme.card);
    document.documentElement.style.setProperty("--text", theme.text);
    document.documentElement.style.setProperty("--font", theme.font);
    localStorage.setItem("themeSettings", JSON.stringify(theme));
  }, [theme]);

  return (
    <div className="modal-bg" style={{zIndex:2000}}>
      <div className="modal" style={{maxWidth:380}}>
        <h3>Tema Ayarları</h3>
        <div className="form-row">
          <label>Ana Renk</label>
          <input type="color" value={theme.primary} onChange={e => setTheme(t => ({ ...t, primary: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Arka Plan</label>
          <input type="color" value={theme.background} onChange={e => setTheme(t => ({ ...t, background: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Kart Rengi</label>
          <input type="color" value={theme.card} onChange={e => setTheme(t => ({ ...t, card: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Yazı Rengi</label>
          <input type="color" value={theme.text} onChange={e => setTheme(t => ({ ...t, text: e.target.value }))} />
        </div>
        <div className="form-row">
          <label>Yazı Tipi</label>
          <select value={theme.font} onChange={e => setTheme(t => ({ ...t, font: e.target.value }))}>
            {fontOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
        </div>
        <button style={{marginTop:12}} onClick={onClose}>Kapat</button>
      </div>
    </div>
  );
}
