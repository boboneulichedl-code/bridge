import { registerSW } from "virtual:pwa-register";
import { bridgeApi } from "./api";

type Tab = "home" | "investigate" | "status" | "settings";

const state = {
  tab: "home" as Tab,
  mode: "agent" as "agent" | "plan" | "ask",
  version: "",
  updateAvailable: false,
  maxAccess: false,
  studioClients: 0,
  queuedJobs: 0,
  log: [] as string[],
};

const app = document.getElementById("app")!;
const toastEl = document.createElement("div");
toastEl.className = "toast";
document.body.appendChild(toastEl);

function toast(msg: string): void {
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2800);
}

function log(msg: string): void {
  state.log.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
  state.log = state.log.slice(0, 50);
  render();
}

function render(): void {
  app.innerHTML = `
    <header>
      <h1>Bridge Control</h1>
      <div class="meta">
        v${state.version || "…"}
        ${state.updateAvailable ? '<span class="badge warn">Update</span>' : '<span class="badge ok">Online</span>'}
        ${state.maxAccess ? '<span class="badge ok">Max Access</span>' : ""}
        ${state.studioClients ? `<span class="badge ok">${state.studioClients} Studio</span>` : ""}
        ${state.queuedJobs ? `<span class="badge warn">${state.queuedJobs} queued</span>` : ""}
      </div>
    </header>
    <main>
      ${panelHome()}
      ${panelInvestigate()}
      ${panelStatus()}
      ${panelSettings()}
    </main>
    ${nav()}
  `;
  bind();
}

function panelHome(): string {
  return `
    <section class="panel ${state.tab === "home" ? "active" : ""}" data-panel="home">
      <div class="card">
        <h2>Prompt</h2>
        <div class="chips">
          ${(["agent", "plan", "ask"] as const)
            .map(
              (m) =>
                `<button type="button" class="chip ${state.mode === m ? "active" : ""}" data-mode="${m}">${m}</button>`
            )
            .join("")}
        </div>
        <textarea id="prompt" placeholder="Was soll der Agent tun?"></textarea>
        <div class="row">
          <button type="button" class="primary" id="send-prompt">Senden</button>
        </div>
      </div>
      <div class="card">
        <h2>Log</h2>
        <div class="log">${state.log.join("\n") || "—"}</div>
      </div>
    </section>`;
}

function panelInvestigate(): string {
  return `
    <section class="panel ${state.tab === "investigate" ? "active" : ""}" data-panel="investigate">
      <div class="card">
        <h2>Multi-Source</h2>
        <p style="color:var(--muted);font-size:0.9rem;margin-bottom:10px">
          Git, Errors, Logs, MCP-Plugins parallel untersuchen.
        </p>
        <input type="text" id="investigate-topic" placeholder="z.B. Login 500, CI fail, Logcat crash" />
        <div class="row">
          <button type="button" class="primary" id="run-investigate">Untersuchen</button>
        </div>
      </div>
    </section>`;
}

function panelStatus(): string {
  return `
    <section class="panel ${state.tab === "status" ? "active" : ""}" data-panel="status">
      <div class="card" id="studio-card"><h2>Studio Clients</h2><p style="color:var(--muted)">Laden…</p></div>
      <div class="card" id="integrations-card"><h2>Integrationen</h2><p style="color:var(--muted)">Laden…</p></div>
      <div class="card">
        <div class="toggle">
          <span>Max Access</span>
          <input type="checkbox" id="max-access" ${state.maxAccess ? "checked" : ""} />
        </div>
      </div>
      ${
        state.updateAvailable
          ? `<div class="card"><button type="button" class="primary" id="apply-update">Update installieren</button></div>`
          : ""
      }
    </section>`;
}

function panelSettings(): string {
  return `
    <section class="panel ${state.tab === "settings" ? "active" : ""}" data-panel="settings">
      <div class="card">
        <h2>API Token</h2>
        <input type="password" id="api-token" placeholder="BRIDGE_API_TOKEN (optional)" value="${localStorage.getItem("bridge_token") || ""}" />
        <div class="row">
          <button type="button" class="ghost" id="save-token">Speichern</button>
        </div>
      </div>
      <div class="card">
        <h2>API</h2>
        <p style="font-size:0.85rem;color:var(--muted)">Cursor <code>/api/v1</code> · Studio <code>/api/v1/studio</code></p>
      </div>
    </section>`;
}

function nav(): string {
  const items: { id: Tab; label: string; icon: string }[] = [
    { id: "home", label: "Prompt", icon: "⌘" },
    { id: "investigate", label: "Debug", icon: "🔍" },
    { id: "status", label: "Status", icon: "◉" },
    { id: "settings", label: "Setup", icon: "⚙" },
  ];
  return `<nav>${items
    .map(
      (i) =>
        `<button type="button" class="${state.tab === i.id ? "active" : ""}" data-tab="${i.id}"><span class="icon">${i.icon}</span>${i.label}</button>`
    )
    .join("")}</nav>`;
}

function bind(): void {
  document.querySelectorAll("[data-tab]").forEach((el) => {
    el.addEventListener("click", () => {
      state.tab = (el as HTMLElement).dataset.tab as Tab;
      render();
      if (state.tab === "status") {
        loadStudioClients();
        loadIntegrations();
      }
    });
  });

  document.querySelectorAll("[data-mode]").forEach((el) => {
    el.addEventListener("click", () => {
      state.mode = (el as HTMLElement).dataset.mode as typeof state.mode;
      render();
    });
  });

  document.getElementById("send-prompt")?.addEventListener("click", async () => {
    const prompt = (document.getElementById("prompt") as HTMLTextAreaElement)?.value.trim();
    if (!prompt) return toast("Prompt eingeben");
    try {
      log("Prompt senden…");
      const r = await bridgeApi.prompt(prompt, state.mode);
      log(r.message || (r.ok ? `Prompt OK (${r.via ?? "?"})` : "Prompt Fehler"));
      toast(r.ok ? (r.dispatched === false ? "Warteschlange" : "Gesendet") : "Fehler");
    } catch (e) {
      toast(String(e));
      log(String(e));
    }
  });

  document.getElementById("run-investigate")?.addEventListener("click", async () => {
    const topic = (document.getElementById("investigate-topic") as HTMLInputElement)?.value.trim();
    if (!topic) return toast("Thema eingeben");
    try {
      log(`Investigate: ${topic}`);
      await bridgeApi.investigate(topic);
      toast("Untersuchung gestartet");
      log("Investigate OK");
    } catch (e) {
      toast(String(e));
    }
  });

  document.getElementById("max-access")?.addEventListener("change", async (e) => {
    const enabled = (e.target as HTMLInputElement).checked;
    try {
      await bridgeApi.setMaxAccess(enabled);
      state.maxAccess = enabled;
      toast(enabled ? "Max Access AN" : "Max Access AUS");
    } catch (err) {
      toast(String(err));
    }
  });

  document.getElementById("apply-update")?.addEventListener("click", async () => {
    try {
      const r = await bridgeApi.updateApply();
      toast(r.message);
      await refreshVersion();
    } catch (e) {
      toast(String(e));
    }
  });

  document.getElementById("save-token")?.addEventListener("click", () => {
    const v = (document.getElementById("api-token") as HTMLInputElement).value.trim();
    localStorage.setItem("bridge_token", v);
    toast("Token gespeichert");
  });
}

async function loadStudioClients(): Promise<void> {
  const card = document.getElementById("studio-card");
  if (!card) return;
  try {
    const data = await bridgeApi.studioClients();
    state.studioClients = data.clients.length;
    state.queuedJobs = data.queuedJobs;
    card.innerHTML = `
      <h2>Studio Clients</h2>
      ${
        data.clients.length
          ? data.clients
              .map(
                (c) =>
                  `<div class="list-item"><span>${c.name}</span><span class="badge ${c.maxAccess ? "ok" : "warn"}">${c.maxAccess ? "Max" : "Std"}</span></div>`
              )
              .join("")
          : `<p style="color:var(--muted)">Kein Android Studio verbunden</p>`
      }
      ${data.queuedJobs ? `<p style="color:var(--warn);margin-top:8px">${data.queuedJobs} Job(s) in Warteschlange</p>` : ""}`;
  } catch (e) {
    card.innerHTML = `<h2>Studio Clients</h2><p style="color:var(--muted)">${e}</p>`;
  }
}

async function loadIntegrations(): Promise<void> {
  const card = document.getElementById("integrations-card");
  if (!card) return;
  try {
    const data = await bridgeApi.integrations();
    card.innerHTML = `
      <h2>Integrationen</h2>
      ${data.integrations
        .map(
          (i) =>
            `<div class="list-item"><span>${i.name}</span><span class="badge ${i.configured ? "ok" : "warn"}">${i.configured ? "✓" : "○"}</span></div>`
        )
        .join("")}`;
  } catch (e) {
    card.innerHTML = `<h2>Integrationen</h2><p style="color:var(--danger)">${e}</p>`;
  }
}

async function refreshVersion(): Promise<void> {
  try {
    const v = await bridgeApi.version();
    state.version = v.version;
    state.updateAvailable = v.updateAvailable;
  } catch {
    state.version = "offline";
  }
  render();
}

async function init(): Promise<void> {
  try {
    await bridgeApi.health();
    await refreshVersion();
    const ma = await bridgeApi.maxAccess();
    state.maxAccess = ma.enabled;
    try {
      const sh = await bridgeApi.studioHealth();
      state.studioClients = sh.clients;
      state.queuedJobs = sh.queuedJobs;
    } catch {
      /* studio optional */
    }
  } catch {
    state.version = "offline";
    render();
    toast("API nicht erreichbar — bridge serve starten");
  }

  bridgeApi.connectEvents((e) => {
    if (e.type === "update.available") {
      state.updateAvailable = true;
      toast(`Update: ${e.from} → ${e.to}`);
      render();
    }
    if (e.type === "job.done") log(`Job ${e.jobId}: ${e.ok ? "OK" : "Fehler"}`);
    if (e.type === "log") log(e.message);
  });
}

render();
init();

registerSW({
  immediate: true,
  onOfflineReady() {
    toast("Bridge offline bereit");
  },
  onNeedRefresh() {
    toast("Update verfügbar — Seite neu laden");
  },
});
