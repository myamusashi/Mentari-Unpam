// ompProvider.js — AI provider layer for Mentari Mod.
// Backend "omp" (default): local `omp auth-gateway serve` at
// http://127.0.0.1:4000/v1 (OpenAI-compatible /chat/completions).
// Backend "gemini" (legacy): direct Google Generative Language API.
(function () {
  if (window.mentariAI) return;
  var PROVIDER_KEY = "mentari_ai_provider";
  var ENDPOINT_KEY = "mentari_omp_endpoint";
  var MODEL_KEY = "mentari_omp_model";
  var TOKEN_KEY = "mentari_omp_token";
  var DEFAULT_ENDPOINT = "http://127.0.0.1:4000/v1";
  var DEFAULT_MODEL = "opencode-zen/muse-spark-1.3-contributor-free";

  function getProvider() { return localStorage.getItem(PROVIDER_KEY) || "omp"; }
  function setProvider(name) { localStorage.setItem(PROVIDER_KEY, name); }
  function getOmpEndpoint() { return localStorage.getItem(ENDPOINT_KEY) || DEFAULT_ENDPOINT; }
  function setOmpEndpoint(url) { localStorage.setItem(ENDPOINT_KEY, String(url).replace(/\/+$/, "")); }
  function getOmpModel() { return localStorage.getItem(MODEL_KEY) || DEFAULT_MODEL; }
  function getOmpToken() { return localStorage.getItem(TOKEN_KEY) || ""; }
  function setOmpToken(t) { localStorage.setItem(TOKEN_KEY, t); }
  function setOmpModel(model) { localStorage.setItem(MODEL_KEY, model); }

  function extractOpenAIText(data) {
    var choice = data && data.choices && data.choices[0];
    var msg = choice && choice.message;
    if (msg && typeof msg.content === "string") return msg.content;
    if (msg && Array.isArray(msg.content)) {
      return msg.content.map(function (p) { return typeof p === "string" ? p : (p && p.text) || ""; }).join("");
    }
    if (choice && typeof choice.text === "string") return choice.text;
    return "";
  }

  async function askOmp(prompt, options) {
    options = options || {};
    var endpoint = (options.endpoint || getOmpEndpoint()).replace(/\/+$/, "");
    var model = options.model || getOmpModel();
    var headers = { "Content-Type": "application/json" };
    var _tok = options.gatewayToken || getOmpToken();
    if (_tok) headers.Authorization = "Bearer " + _tok;
    var messages = [];
    if (options.system) messages.push({ role: "system", content: options.system });
    messages.push({ role: "user", content: prompt });
    var response;
    try {
      response = await fetch(endpoint + "/chat/completions", {
        method: "POST",
        headers: headers,
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: options.temperature != null ? options.temperature : 0.7,
          max_tokens: options.maxTokens != null ? options.maxTokens : 4000,
        }),
      });
    } catch (err) {
      throw new Error("Tidak dapat terhubung ke OMP gateway di " + endpoint + ". Jalankan `omp auth-gateway serve` terlebih dahulu. (" + err.message + ")");
    }
    if (!response.ok) {
      var body = await response.text().catch(function () { return ""; });
      throw new Error("OMP gateway error " + response.status + ": " + (body || response.statusText).slice(0, 200));
    }
    var text = extractOpenAIText(await response.json()).trim();
    if (!text) throw new Error("OMP gateway mengembalikan jawaban kosong.");
    return text;
  }

  async function askGemini(prompt, options) {
    options = options || {};
    var apiKey = options.apiKey || (function () {
      var s = localStorage.getItem("geminiApiKey");
      return s ? atob(s) : null;
    })();
    if (!apiKey) {
      if (typeof showApiKeyPopup === "function") showApiKeyPopup();
      throw new Error("API Key Gemini tidak ditemukan di localStorage!");
    }
    var response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" + apiKey,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature != null ? options.temperature : 0.7,
            maxOutputTokens: options.maxTokens != null ? options.maxTokens : 1024,
            topP: 0.95,
            topK: 40,
          },
        }),
      }
    );
    if (!response.ok) throw new Error("Gagal mendapatkan jawaban dari Gemini (" + response.status + ")");
    var data = await response.json();
    return (data && data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0] && data.candidates[0].content.parts[0].text) || "Tidak ada jawaban dari Gemini.";
  }

  async function askAI(prompt, options) {
    options = options || {};
    var providerName = options.provider || getProvider();
    if (providerName === "gemini") return askGemini(prompt, options);
    return askOmp(prompt, options);
  }

  async function checkOmpGateway(endpoint) {
    try {
      var _h = {};
      var _t = getOmpToken();
      if (_t) _h.Authorization = "Bearer " + _t;
      var response = await fetch((endpoint || getOmpEndpoint()).replace(/\/+$/, "") + "/models", { headers: _h });
      if (!response.ok) return { ok: false, message: "HTTP " + response.status };
      var data = await response.json().catch(function () { return null; });
      var models = data && Array.isArray(data.data) ? data.data.map(function (m) { return m.id; }) : [];
      return { ok: true, message: "Gateway terhubung", models: models };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  }

  window.mentariAI = {
    getProvider: getProvider, setProvider: setProvider,
    getOmpEndpoint: getOmpEndpoint, setOmpEndpoint: setOmpEndpoint,
    getOmpModel: getOmpModel, setOmpModel: setOmpModel,
    getOmpToken: getOmpToken, setOmpToken: setOmpToken,
    askAI: askAI, askOmp: askOmp, askGemini: askGemini,
    checkOmpGateway: checkOmpGateway,
    DEFAULT_ENDPOINT: DEFAULT_ENDPOINT, DEFAULT_MODEL: DEFAULT_MODEL,
  };
})();
