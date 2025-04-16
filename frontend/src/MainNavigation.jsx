import React from "react";
import "./App.css";

export default function MainNavigation({ screen, setScreen, navOpen, setNavOpen }) {
  return (
    <>
      <button className="hamburger" onClick={() => setNavOpen((o) => !o)} aria-label="Menüyü Aç/Kapat">☰</button>
      <nav className={navOpen ? "nav-open" : ""} style={{ marginBottom: "1rem", display: "flex", gap: "0.3rem", flexWrap: "wrap", justifyContent: "space-between" }}>
        <button onClick={() => { setScreen("members"); setNavOpen(false); }} aria-label="Üye Yönetimi" style={{ fontWeight: screen === "members" ? "bold" : "normal" }}>
          <span className="nav-icon">👤</span><span className="nav-text">Üye</span>
        </button>
        <button onClick={() => { setScreen("staff"); setNavOpen(false); }} aria-label="Personel" style={{ fontWeight: screen === "staff" ? "bold" : "normal" }}>
          <span className="nav-icon">🧑‍💼</span><span className="nav-text">Personel</span>
        </button>
        <button onClick={() => { setScreen("schedule"); setNavOpen(false); }} aria-label="Vardiya" style={{ fontWeight: screen === "schedule" ? "bold" : "normal" }}>
          <span className="nav-icon">📅</span><span className="nav-text">Vardiya</span>
        </button>
        <button onClick={() => { setScreen("performance"); setNavOpen(false); }} aria-label="Performans" style={{ fontWeight: screen === "performance" ? "bold" : "normal" }}>
          <span className="nav-icon">📈</span><span className="nav-text">Performans</span>
        </button>
        <button onClick={() => { setScreen("equipment"); setNavOpen(false); }} aria-label="Ekipman" style={{ fontWeight: screen === "equipment" ? "bold" : "normal" }}>
          <span className="nav-icon">🏋️</span><span className="nav-text">Ekipman</span>
        </button>
        <button onClick={() => { setScreen("inventory"); setNavOpen(false); }} aria-label="Envanter" style={{ fontWeight: screen === "inventory" ? "bold" : "normal" }}>
          <span className="nav-icon">📦</span><span className="nav-text">Envanter</span>
        </button>
        <button onClick={() => { setScreen("reservation"); setNavOpen(false); }} aria-label="Rezervasyon" style={{ fontWeight: screen === "reservation" ? "bold" : "normal" }}>
          <span className="nav-icon">📝</span><span className="nav-text">Rezervasyon</span>
        </button>
        <button onClick={() => { setScreen("payments"); setNavOpen(false); }} aria-label="Ödemeler" style={{ fontWeight: screen === "payments" ? "bold" : "normal" }}>
          <span className="nav-icon">💳</span><span className="nav-text">Ödeme</span>
        </button>
        <button onClick={() => { setScreen("services"); setNavOpen(false); }} aria-label="Hizmetler" style={{ fontWeight: screen === "services" ? "bold" : "normal" }}>
          <span className="nav-icon">💆</span><span className="nav-text">Hizmet</span>
        </button>
        <button onClick={() => { setScreen("invoices"); setNavOpen(false); }} aria-label="Faturalar" style={{ fontWeight: screen === "invoices" ? "bold" : "normal" }}>
          <span className="nav-icon">🧾</span><span className="nav-text">Fatura</span>
        </button>
        <button onClick={() => { setScreen("reports"); setNavOpen(false); }} aria-label="Raporlar" style={{ fontWeight: screen === "reports" ? "bold" : "normal" }}>
          <span className="nav-icon">📊</span><span className="nav-text">Rapor</span>
        </button>
        <button onClick={() => { setScreen("feedback"); setNavOpen(false); }} aria-label="Geri Bildirim" style={{ fontWeight: screen === "feedback" ? "bold" : "normal" }}>
          <span className="nav-icon">💬</span><span className="nav-text">G. Bildirim</span>
        </button>
        <button onClick={() => { setScreen("promotions"); setNavOpen(false); }} aria-label="Promosyonlar" style={{ fontWeight: screen === "promotions" ? "bold" : "normal" }}>
          <span className="nav-icon">🎁</span><span className="nav-text">Promosyon</span>
        </button>
        <button onClick={() => { setScreen("loyalty"); setNavOpen(false); }} aria-label="Sadakat" style={{ fontWeight: screen === "loyalty" ? "bold" : "normal" }}>
          <span className="nav-icon">⭐</span><span className="nav-text">Sadakat</span>
        </button>
      </nav>
    </>
  );
}
