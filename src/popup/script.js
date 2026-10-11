const extApi = globalThis.browser ?? globalThis.chrome;

const m3 = globalThis.MentariM3;

const themeHost = document.getElementById("themeSplit");
if (themeHost && m3 && m3.createSplitButton) {
  m3.ensure();
  // Options come from the shared table so the popup can never drift from the
  // pet stage or the in-page settings dialog.
  const split = m3.createSplitButton({
    id: "themeSplit-btn",
    color: "tonal",
    size: "sm",
    leadIcon: "palette",
    options: m3.themeOptions(),
    value: m3.getTheme(),
    onPick: (v) => m3.setTheme(v),
  });
  themeHost.appendChild(split.root);
  // Another surface (pet stage dialog, in-page settings) changed the theme.
  m3.onThemeChange((name) => split.setValue(name));
}

document.getElementById("runToken").addEventListener("click", async () => {
  if (!extApi?.tabs?.query || !extApi?.scripting?.executeScript) {
    alert("Ekstensi tidak dapat dijalankan di halaman ini!");
    return;
  }
  const [tab] = await extApi.tabs.query({ active: true, currentWindow: true });
  const run = () => {
    if (typeof window.toggleTokenPopup === "function") {
      window.toggleTokenPopup();
    } else {
      window.dispatchEvent(new CustomEvent("mentari-toggle-popup"));
    }
  };
  try {
    await extApi.scripting.executeScript({ target: { tabId: tab.id }, world: "MAIN", func: run });
  } catch (_) {
    // Firefox tanpa dukungan world:"MAIN": fallback ke isolated world,
    // token.js juga mendengarkan event mentari-toggle-popup.
    await extApi.scripting.executeScript({ target: { tabId: tab.id }, func: run });
  }
});