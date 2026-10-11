// apiKeyManager.js
function mentariUseOmp() {
  try {
    return typeof window !== "undefined" && window.mentariAI && window.mentariAI.getProvider() !== "gemini";
  } catch (_) {
    return false;
  }
}
function initializeApiKeyManager() {
  console.log("API Key Manager initializing...");
  // Provider OMP tidak butuh API key — lewati popup Gemini.
  if (mentariUseOmp()) return null;
  const storedApiKey = localStorage.getItem("geminiApiKey");
  if (!storedApiKey) {
    console.log("No API key found, showing popup...");
    setTimeout(() => { showApiKeyPopup(); }, 1000);
    return null;
  }
  return atob(storedApiKey);
}

(function () {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", onDOMReady);
  } else {
    onDOMReady();
  }

  function onDOMReady() {
    setTimeout(() => {
      const apiKey = initializeApiKeyManager();
      if (apiKey && typeof createChatbotInterface === "function") {
        createChatbotInterface(apiKey);
      }
    }, 1500);
  }
  
  window.addEventListener('mentari-update-api-key', () => showApiKeyPopup());
})();

async function verifyApiKeyOnServer(apiKey) {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) return { valid: true };
    const err = await res.json();
    return { valid: false, message: err.error?.message || "API key tidak valid atau expired." };
  } catch (e) {
    return { valid: false, message: "Gagal menghubungi server Google. Periksa koneksi internet." };
  }
}

function showApiKeyPopup() {
  if (document.getElementById("gemini_apiKeyPopup")) return;
  const savedApiKey = localStorage.getItem("geminiApiKey");
  const decodedApiKey = savedApiKey ? atob(savedApiKey) : "";

  const overlay = document.createElement("div");
  overlay.id = "gemini_apiKeyOverlay";
  overlay.className = "mm mm-scrim gemini_api-key-overlay";
  overlay.innerHTML = `
    <div id="gemini_apiKeyPopup" class="mm-dialog gemini_api-key-popup" style="width:380px;">
      <div class="mm-dialog-h" style="display:flex;align-items:center;gap:8px;font-weight:600;">
        <span class="ms" style="color:var(--mm-primary);">vpn_key</span> Gemini API Key
      </div>
      <div class="mm-dialog-sub">
         Dapatkan API key gratis di Google AI Studio:<br>
         <a href="https://aistudio.google.com/api-keys" target="_blank" style="color:var(--mm-primary);text-decoration:none;word-break:break-all;">https://aistudio.google.com/api-keys</a>
      </div>
        
        <div style="position:relative;width:100%;margin-bottom:12px;display:flex;align-items:center;">
          <input type="password" id="gemini_apiKeyInput" class="mm-input" placeholder="Masukkan API Key..." value="${decodedApiKey}"
            style="padding-right:40px;">
          <button id="gemini_toggleVis" class="mm-icon-btn" style="position:absolute;right:4px;width:32px;height:32px;">
             <span class="ms" id="gemini_visIcon">visibility</span>
          </button>
        </div>
        
        <div id="gemini_validationMessage" class="mm-hint" style="display:none;margin-bottom:15px;"></div>
        
        <div class="mm-dialog-actions">
          <button id="gemini_closePopup" class="mm-btn mm-btn-text">Batal</button>
          <button id="gemini_saveApiKeyButton" class="mm-btn">
            <span id="gemini_btnText">Simpan</span>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  addApiKeyPopupStyles();
  setupApiKeyPopupEventListeners();
}

function setupApiKeyPopupEventListeners() {
  const saveBtn = document.getElementById("gemini_saveApiKeyButton");
  const closeBtn = document.getElementById("gemini_closePopup");
  const input = document.getElementById("gemini_apiKeyInput");
  const msg = document.getElementById("gemini_validationMessage");
  const toggleVis = document.getElementById("gemini_toggleVis");
  const visIcon = document.getElementById("gemini_visIcon");
  const btnText = document.getElementById("gemini_btnText");

  if (closeBtn) closeBtn.onclick = () => document.getElementById("gemini_apiKeyOverlay")?.remove();
  
  if (toggleVis) {
    toggleVis.onclick = (e) => {
      e.preventDefault();
      const isPass = input.type === "password";
      input.type = isPass ? "text" : "password";
      visIcon.textContent = isPass ? "visibility_off" : "visibility";
    };
  }

  if (saveBtn && input) {
    saveBtn.onclick = async () => {
      const key = input.value.trim();
      
      if (!key) {
        msg.style.display = "block";
        msg.classList.add("mm-hint-err");
        msg.innerText = "API key tidak boleh kosong";
        input.style.borderColor = "var(--mm-error)";
        return;
      }

      // Validasi Server
      saveBtn.disabled = true;
      btnText.innerText = "Cek...";
      msg.style.display = "none";
      input.style.borderColor = "";

      const valServer = await verifyApiKeyOnServer(key);
      
      if (!valServer.valid) {
        saveBtn.disabled = false;
        btnText.innerText = "Simpan";
        msg.style.display = "block";
        msg.classList.add("mm-hint-err");
        msg.innerText = valServer.message;
        input.style.borderColor = "var(--mm-error)";
        return;
      }

      // Valid - Simpan
      localStorage.setItem("geminiApiKey", btoa(key));
      msg.style.display = "block";
      msg.classList.remove("mm-hint-err");
      msg.innerText = "API key valid dan berhasil disimpan!";
      
      setTimeout(() => {
        document.getElementById("gemini_apiKeyOverlay")?.remove();
        if (typeof createChatbotInterface === "function") createChatbotInterface(key);
        // Dispatch event for other scripts
        window.dispatchEvent(new CustomEvent('gemini-api-key-updated', { detail: { key } }));
      }, 1500);
    };
  }
}

function addApiKeyPopupStyles() {
  if (window.MentariM3) window.MentariM3.ensure();
}

function getGeminiApiKey() {
  const k = localStorage.getItem("geminiApiKey");
  return k ? atob(k) : null;
}
