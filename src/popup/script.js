const extApi = globalThis.browser ?? globalThis.chrome;
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
