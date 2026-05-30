import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Service Worker：僅在 production 啟用（離線殼與推播）。
// dev 模式不註冊，並主動移除既有 SW 與快取，避免舊快取造成白畫面。
if ("serviceWorker" in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* 忽略註冊失敗（例如非安全來源） */
      });
    });
  } else {
    void navigator.serviceWorker
      .getRegistrations()
      .then((regs) => regs.forEach((r) => void r.unregister()));
    if ("caches" in window) {
      void caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
    }
  }
}
