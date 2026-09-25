document.getElementById("runToken").addEventListener("click", async () => {
  const extApi = globalThis.browser ?? globalThis.chrome;
  if (!extApi?.tabs?.query || !extApi?.scripting?.executeScript) {
    alert("Ekstensi tidak dapat dijalankan di halaman ini!");
    return;
  }

  let [tab] = await extApi.tabs.query({ active: true, currentWindow: true });

  extApi.scripting.executeScript({
    target: { tabId: tab.id },
    func: () => {
      if (window.runToken) {
        window.runToken();
      } else {
        alert("Ekstensi tidak dapat dijalankan di halaman ini!");
      }
    },
  });
});
