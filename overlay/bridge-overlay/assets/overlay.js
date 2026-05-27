/** @typedef {import('../src/types').GuiSnapshot} GuiSnapshot */
/** @typedef {import('../src/types').GuiNode} GuiNode */

const canvas = document.getElementById("canvas");
const meta = document.getElementById("meta");

function flatten(nodes, ox, oy, list = []) {
  for (const n of nodes) {
    if (n.bounds.width < 4 || n.bounds.height < 4 || !n.visible) continue;
    list.push({ ...n, bounds: {
      x: n.bounds.x - ox,
      y: n.bounds.y - oy,
      width: n.bounds.width,
      height: n.bounds.height,
    }});
    flatten(n.children, ox, oy, list);
  }
  return list;
}

function render(snapshot) {
  if (!canvas) return;
  canvas.innerHTML = "";
  const ox = snapshot.windowBounds.x;
  const oy = snapshot.windowBounds.y;
  const flat = flatten(snapshot.nodes, ox, oy);
  meta.textContent = `${snapshot.processName} v${snapshot.version}`;
  meta.title = `${snapshot.windowTitle} · ${snapshot.fingerprint}`;

  for (const n of flat) {
    const el = document.createElement("div");
    el.className = "node";
    el.style.left = n.bounds.x + "px";
    el.style.top = n.bounds.y + "px";
    el.style.width = n.bounds.width + "px";
    el.style.height = n.bounds.height + "px";
    if (n.name) {
      const lab = document.createElement("span");
      lab.className = "label";
      lab.textContent = n.name;
      el.appendChild(lab);
    }
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      window.bridgeOverlay.control({
        action: "click",
        automationId: n.automationId,
        target: n.name,
      });
    });
    el.addEventListener("dblclick", (e) => {
      e.stopPropagation();
      const text = prompt("Text eingeben für " + n.name);
      if (text) {
        window.bridgeOverlay.control({
          action: "type",
          automationId: n.automationId,
          target: n.name,
          text,
        });
      }
    });
    canvas.appendChild(el);
  }
}

window.bridgeOverlay.onGuiUpdate(render);

document.getElementById("btn-refresh")?.addEventListener("click", () => {
  window.bridgeOverlay.forceRefresh();
});
document.getElementById("btn-ai")?.addEventListener("click", () => {
  document.getElementById("ai-prompt")?.focus();
});
document.getElementById("ai-send")?.addEventListener("click", async () => {
  const input = document.getElementById("ai-prompt");
  const prompt = input?.value?.trim();
  if (!prompt) return;
  input.value = "";
  await window.bridgeOverlay.aiCommand(prompt);
});
document.getElementById("ai-prompt")?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("ai-send")?.click();
});
