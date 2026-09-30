/**
 * MENTARI MOD - Discus Helper Module
 * Refactored for modularity and code efficiency.
 */

(function () {
  // Aturan bahasa global, dikirim sebagai system instruction ke semua provider
  // (omp + gemini) sehingga model kecil pun tidak keluar dari Bahasa Indonesia.
  const SYSTEM_PROMPT =
    "Kamu adalah asisten akademik untuk mahasiswa Universitas Pamungkas (UNPAM). " +
    "WAJIB menulis seluruh output dalam Bahasa Indonesia yang natural dan lugas. " +
    "DILARANG keras memakai huruf non-Latin seperti Mandarin/Hanzi, kana, hangul, atau aksara lain; " +
    "istilah yang tidak bisa ditulis dalam huruf Latin harus diterjemahkan ke Bahasa Indonesia. " +
    "Jangan mencampur bahasa lain, jangan menebak-nebak isi sumber berbahasa lain, " +
    "dan jangan menambahkan basa-basi pembuka seperti 'Tentu' atau 'Berikut jawabannya'.";

  // Sisa non-Latin pada hasil model = bug "jawaban tercampur bahasa Mandarin".
  const NON_LATIN_RE =
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Bopomofo}\u3000-\u303F\uFF01-\uFF65]/gu;
  const FOREIGN_RETRY_RATIO = 0.01; // >=1% huruf asing -> generate ulang.
  const Config = {
    GEMINI: {
      MODEL: "gemini-2.5-flash-lite",
      ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models",
    },
    STORAGE_KEYS: {
      API_KEY: "geminiApiKey",
    },
    PROMPTS: {
      DEFAULT: (content) => `Bacalah diskusi berikut, lalu tuliskan jawaban atau rangkuman yang natural, JANGAN GUNAKAN HURUF TEBAL JANGAN GUNAKAN HURUF TEBAL JANGAN BOLD JANGAN PAKE TANDA BINTANG PLAIN TEXT YG BERSIH. dan mudah dipahami seperti jawaban manusia. jangan gunakan tanda seperti (*/#) atau yg lainnya, hanya plain text yg bersih jangan gunakan bold huruf tebal, italic, underline. dan langsung jawab tanpa mengucapkan (berikut jawabannya) atau sejenisnya. Gunakan bahasa yang natural seperti manusia. Berikan penjelasan yang lengkap dan memadai sesuai konteks diskusi, jangan dibatasi jika membutuhkan penjelasan panjang. Jangan ucapkan "Tentu, ini rangkumannya:" atau semacamnya, langsung jawab saja. Jika terdapat soal atau pertanyaan yang berhubungan dengan bahasa pemrograman atau coding, berikan contoh singkat code nya. jika pertanyaannya bernomor maka buat jawaban bernomor juga, hanya pertanyaan saja. WAJIB seluruh jawaban ditulis dalam Bahasa Indonesia huruf Latin saja, DILARANG memakai huruf Mandarin/Hanzi, kana, hangul, atau aksara lain, dan DILARANG memakai bahasa selain Bahasa Indonesia walaupun isian diskusinya berbahasa lain.\n${content}\n\nJawaban yang natural dan mengalir:`,
      // Dipakai saat hasil pertama tercampur bahasa asing: tulis ulang, bukan terjemahan harfiah.
      REPAIR: (badText) => `Jawaban di bawah ini tercampur bahasa asing (sebagian besar huruf Mandarin/Hanzi) sehingga tidak bisa dipakai. Tulis ulang dari awal seluruh isinya menjadi jawaban yang sama persis dalam Bahasa Indonesia huruf Latin saja. Jangan menyalin, mengutip, atau menerjemahkan huruf Mandarin/Hanzi, kana, maupun hangul sama sekali. Abaikan setiap kalimat yang tidak bisa ditulis dalam huruf Latin dan ganti dengan padanannya dalam Bahasa Indonesia. Jawab langsung tanpa pembuka.\n\nTeks yang perlu ditulis ulang:\n${badText}\n\nJawaban dalam Bahasa Indonesia:`,
      REVISE: (mode, prevAnswer) => {
        const modes = {
          shorten: `Ringkas jawaban berikut menjadi lebih singkat, tetap natural dan mudah dipahami, tanpa bullet atau penomoran:\n\n${prevAnswer}`,
          paragraph: `Ubah jawaban berikut menjadi satu paragraf, tetap natural dan mudah dipahami, tanpa bullet atau penomoran:\n\n${prevAnswer}`,
          clarify: `Perjelas dan buat jawaban berikut lebih mudah dipahami, tetap natural dan tidak seperti AI, tanpa bullet atau penomoran:\n\n${prevAnswer}`,
          lengthen: `Perpanjang dan tambahkan detail pada jawaban berikut, tetap natural dan mudah dipahami, tanpa bullet atau penomoran:\n\n${prevAnswer}`,
          numbered: `Ubah jawaban berikut menjadi nomor, tetap natural dan mudah dipahami, tanpa bullet atau paragraf:\n\n${prevAnswer}`
        };
        const rule = " Tulis hasil akhir dalam Bahasa Indonesia huruf Latin saja, tanpa huruf Mandarin/Hanzi, kana, hangul, atau aksara lain.";
        return (modes[mode] || prevAnswer) + rule;
      },
      QUESTIONS: (content) => `Bacalah diskusi berikut, lalu buatkan beberapa saran pertanyaan yang natural, relevan, dan menarik untuk diajukan pada diskusi ini. Hindari bullet, penomoran, huruf tebal, italic, underline dan buat seolah-olah pertanyaan dari manusia. Pisahkan setiap pertanyaan dengan baris baru. Pastikan setiap saran pertanyaan berdiri sendiri, tidak saling terhubung, dan tidak menggunakan kata penghubung seperti 'selain itu', 'terus', 'dan' di awal kalimat. WAJIB setiap pertanyaan ditulis dalam Bahasa Indonesia huruf Latin saja, DILARANG memakai huruf Mandarin/Hanzi, kana, hangul, atau aksara lain, dan DILARANG memakai bahasa selain Bahasa Indonesia.\n\n${content}\n\nSaran pertanyaan:`
    }
  };

  const Utils = {
    updateModelLimit(model, isLimited) {
      try {
        const statsKey = "gemini_model_stats";
        const raw = localStorage.getItem(statsKey);
        const stats = raw ? JSON.parse(raw) : {};
        if (!stats[model]) stats[model] = {};
        stats[model].limited = isLimited ? true : false;
        localStorage.setItem(statsKey, JSON.stringify(stats));
      } catch (e) {}
    },
    getApiKey() {
      const stored = localStorage.getItem(Config.STORAGE_KEYS.API_KEY);
      if (stored) return atob(stored);
      alert("API Key Gemini tidak ditemukan! Selesaikan di menu Setting.");
      throw new Error("API Key missing");
    },
    extractContent(root) {
      const selectors = [".ck-content", ".MuiBox-root", ".discussion-content", '[class*="content"]', "div:not([class]):not([id])"];
      for (const s of selectors) {
        const elements = root.querySelectorAll(s);
        for (const el of elements) {
          if (el.textContent.trim().length < 10) continue;
          if (el.querySelector("button, a, input, select, textarea")) continue;
          return el.textContent.trim();
        }
      }
      return root.textContent.trim();
    },
    isDosen(root) {
      const elements = [...(root?.querySelectorAll('strong, b, [style*="font-weight:bold"], [class*="name"], [class*="user"], [class*="author"], .MuiTypography-root') || [])];
      return elements.some(el => /\b(?:,|\.)\b/i.test(el.textContent.trim()));
    },
    updateQuota(headers) {
      try {
        const quota = {
          rpm: { remaining: parseInt(headers.get('x-ratelimit-remaining-requests')), limit: parseInt(headers.get('x-ratelimit-limit-requests')) },
          tpm: { remaining: parseInt(headers.get('x-ratelimit-remaining-tokens')), limit: parseInt(headers.get('x-ratelimit-limit-tokens')) },
          updated: Date.now()
        };
        if (!isNaN(quota.rpm.limit)) localStorage.setItem("gemini_quota", JSON.stringify(quota));
      } catch (e) {}
    },
    // Porsi huruf non-Latin pada hasil model (0 = bersih, 1 = seluruhnya non-Latin).
    foreignRatio(text) {
      if (!text) return 0;
      const solid = text.replace(/\s/g, "").length;
      if (!solid) return 0;
      const foreign = text.match(NON_LATIN_RE);
      return foreign ? foreign.length / solid : 0;
    },
    // Buang sisa huruf non-Latin + rapikan sisa spasi/pungtuasi yang menggantung.
    stripForeign(text) {
      if (!text) return "";
      return text
        .replace(NON_LATIN_RE, "")
        .replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, "")
        .replace(/[ \t]{2,}/g, " ")
        .replace(/[ \t]+([.,:;!?])/g, "$1")
        .replace(/([.,:;!?])[ \t]{2,}/g, "$1")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
    },
    // Sisa teks Latin yang masih bermakna setelah dirapikan.
    hasLatinWords(text) {
      return /[A-Za-z]{3,}/.test(text || "");
    },
  };

  const ApiService = {
    useOmp() {
      try {
        return typeof window !== "undefined" && window.mentariAI && window.mentariAI.getProvider() !== "gemini";
      } catch (_) {
        return false;
      }
    },
    async callGemini(prompt) {
      if (this.useOmp()) {
        return window.mentariAI.askOmp(prompt, { system: SYSTEM_PROMPT, temperature: 0.7, maxTokens: 2500 }).catch(() => "Tidak ada jawaban dari AI.");
      }
      const key = Utils.getApiKey();
      let modelRaw = localStorage.getItem("gemini_model") || Config.GEMINI.MODEL;
      let model = modelRaw.replace(/"/g, '');

      const res = await fetch(`${Config.GEMINI.ENDPOINT}/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048, topP: 0.95, topK: 40 }
        })
      });

      if (!res.ok) {
        if (res.status === 429) {
          Utils.updateModelLimit(model, true);
          throw new Error("Rate Limit Tercapai! Kuota API model ini sudah habis. Silakan ganti Model atau API Key lain di menu Pengaturan (Mentari Mod).");
        }
        throw new Error("Gagal mendapatkan jawaban dari Gemini (Cek Koneksi atau API Key)");
      }
      Utils.updateQuota(res.headers);
      Utils.updateModelLimit(model, false);
      const data = await res.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text || "Tidak ada jawaban.";
    },
    // Panggil model lalu pastikan hasilnya Bahasa Indonesia huruf Latin: hasil yang
    // bercampur huruf asing di-generate ulang lewat prompt REPAIR. Hasil rewrite
    // hanya dipakai kalau benar-benar bersih (<= FOREIGN_RETRY_RATIO) dan masih
    // berisi kalimat Latin; kalau tidak, hasil asli dipakai lalu huruf non-Latin-nya
    // dibuang supaya user tidak pernah melihat teks Mandarin/kana/hangul.
    async callLocalized(prompt) {
      let best = await this.callGemini(prompt);
      if (Utils.foreignRatio(best) > FOREIGN_RETRY_RATIO) {
        const repaired = await this.callGemini(Config.PROMPTS.REPAIR(best));
        const enough = repaired.length >= best.length * 0.5; // jangan ganti jawaban panjang dengan hasilringkas
        if (enough && Utils.hasLatinWords(repaired) && Utils.foreignRatio(repaired) <= FOREIGN_RETRY_RATIO) {
          best = repaired;
        }
      }
      return Utils.stripForeign(best);
    }
  };

  const UIRenderer = {
    createButton(type, onClick) {
      const btn = document.createElement("button");
      btn.type = "button";
      if (type === "buat") {
        btn.className = "MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedInfo MuiButton-sizeSmall MuiButton-containedSizeSmall buat-pertanyaan-btn";
        btn.style = "margin-right:2px;min-width:0px;padding:6px 12px;line-height:1.2;font-weight:500;border-radius:11px;background:#1e3a8a;color:#fff;border:0;display:flex;align-items:center;gap:4px;";
        btn.innerHTML = `<span class="MuiButton-startIcon" style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg></span><span class="MuiButton-label">Buat Pertanyaan</span>`;
      } else {
        btn.className = "MuiButtonBase-root MuiButton-root MuiButton-contained MuiButton-containedWarning MuiButton-sizeSmall MuiButton-containedSizeSmall cari-jawaban-btn";
        btn.style = "margin-right:2px;min-width:0px;padding:6px 12px;line-height:1.2;font-weight:500;border-radius:11px;background:#41a3f1;color:rgb(255,255,255);border:0;display:flex;align-items:center;gap:4px;";
        btn.innerHTML = `<span class="MuiButton-startIcon" style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span><span class="MuiButton-label">Cari Jawaban</span>`;
      }
      btn.onclick = onClick;
      return btn;
    },

    showSaranQuestions(saranText, root, replyBtn) {
      let saranDiv = root.querySelector(".saran-pertanyaan-gemini");
      if (!saranDiv) {
        saranDiv = document.createElement("div");
        saranDiv.className = "saran-pertanyaan-gemini";
        saranDiv.style = "margin:10px 0 0 0;padding:10px;;border-radius:18px;border:1px solid rgba(184, 184, 184, 0.3);font-size:13px;display:flex;flex-direction:column;gap:8px;";
        replyBtn.parentElement.parentElement.appendChild(saranDiv);
      }
      const seen = new Set();
      const questions = saranText
        .split(/\n+/)
        .map((line) => Utils.stripForeign(line).trim())
        .filter((line) => {
          if (!Utils.hasLatinWords(line) || seen.has(line)) return false;
          seen.add(line);
          return true;
        })
        .slice(0, 5);
      saranDiv.innerHTML = `<b>Saran Pertanyaan:</b>`;
      if (!questions.length) {
        const note = document.createElement("div");
        note.textContent = "Saran pertanyaan gagal ditampilkan karena hasil AI bukan Bahasa Indonesia. Silakan coba lagi.";
        note.style = "opacity:0.8;";
        saranDiv.appendChild(note);
        return;
      }
      questions.forEach(q => {
        const qWrap = document.createElement("div");
        qWrap.style = "display:flex;align-items:center;gap:6px;margin-top:4px;flex-wrap:wrap;";
        const textBox = document.createElement("div");
        textBox.textContent = q.trim();
        textBox.style = "flex:1 1 200px;padding:14px 80px 14px 12px;position:relative;border-radius:10px;background: rgba(184, 184, 184, 0.3);font-size:13px;word-break:break-word;min-height:36px;text-align:justify;text-justify:inter-word;";
        
        const copyBtn = document.createElement("button");
        copyBtn.style = "position:absolute;right:8px;bottom:8px;min-width:0px;padding:8px;line-height:1.2;font-weight:500;border-radius:9px;background:#79bb7c;color:#fff;border:0;display:flex;align-items:center;gap:4px;z-index:2;box-shadow:0 1px 4px rgba(0,0,0,0.07);";
        copyBtn.innerHTML = `<span class="MuiButton-startIcon"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span><span class="MuiButton-label">Copy</span>`;
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(q.trim());
          copyBtn.querySelector(".MuiButton-label").innerText = "Copied!";
          setTimeout(() => copyBtn.querySelector(".MuiButton-label").innerText = "Copy", 1200);
        };
        textBox.appendChild(copyBtn);
        qWrap.appendChild(textBox);
        saranDiv.appendChild(qWrap);
      });
    },

    showJawabanBox(jawaban, replyBtn, root, content) {
      if (!Utils.hasLatinWords(jawaban)) {
        alert("Jawaban AI tidak ditampilkan karena bukan Bahasa Indonesia (kemungkinan tercampur bahasa asing). Silakan coba lagi.");
        return;
      }
      let resultDiv = root.querySelector(".jawaban-gemini");
      if (!resultDiv) {
        resultDiv = document.createElement("div");
        resultDiv.className = "jawaban-gemini";
        resultDiv.style = "margin:10px 0 0 0;padding:10px;border-radius:18px;border:1px solid rgba(184, 184, 184, 0.3);font-size:13px;display:flex;flex-direction:column;gap:8px;text-align:justify;text-justify:inter-word;";
        replyBtn.parentElement.parentElement.appendChild(resultDiv);
      }
      resultDiv.innerHTML = "";
      const heading = document.createElement("b");
      heading.textContent = "Jawaban:";
      const body = document.createElement("div");
      body.textContent = jawaban;
      body.style = "margin-bottom:6px;white-space:pre-line;";
      resultDiv.append(heading, body);
      
      const btnRow = document.createElement("div");
      btnRow.style = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;";
      
      const copyBtn = document.createElement("button");
      copyBtn.style = "margin-right:0;min-width:0px;padding:6px 10px;line-height:1.2;font-weight:500;border-radius:11px;background:#79bb7c;color:#fff;border:0;display:flex;align-items:center;gap:4px;";
      copyBtn.innerHTML = `<span class="MuiButton-startIcon"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span><span class="MuiButton-label">Copy</span>`;
      copyBtn.onclick = () => {
        copyBtn.querySelector(".MuiButton-label").innerText = "Copied!";
        setTimeout(() => copyBtn.querySelector(".MuiButton-label").innerText = "Copy", 1200);
      };
      btnRow.appendChild(copyBtn);

      const modes = [{m:"shorten", l:"Ringkas"}, {m:"paragraph", l:"1 Paragraf"}, {m:"clarify", l:"Perjelas"}, {m:"lengthen", l:"Perpanjang"}, {m:"numbered", l:"Nomor"}];
      modes.forEach(({m, l}) => {
        const btn = document.createElement("button");
        btn.innerHTML = `<span class="MuiButton-label">${l}</span>`;
        btn.onclick = async () => {
          btn.disabled = true;
          btn.innerText = "Memproses...";
          try {
            const result = await ApiService.callLocalized(Config.PROMPTS.REVISE(m, Utils.stripForeign(jawaban)));
            this.showJawabanBox(result, replyBtn, root, content);
          } catch(e) { alert(e.message); }
          btn.disabled = false;
          btn.innerText = l;
        };
        btnRow.appendChild(btn);
      });
      resultDiv.appendChild(btnRow);
    }
  };

  const App = {
    async handleBuatPertanyaan(btn, root, replyBtn) {
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerText = "Memproses...";
      try {
        const content = Utils.extractContent(root);
        const saran = await ApiService.callLocalized(Config.PROMPTS.QUESTIONS(content));
        UIRenderer.showSaranQuestions(saran, root, replyBtn);
      } catch (e) { alert(e.message); }
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    },

    async handleCariJawaban(btn, root, replyBtn) {
      btn.disabled = true;
      const originalHtml = btn.innerHTML;
      btn.innerText = "Memproses...";
      try {
        const content = Utils.extractContent(root);
        const jawaban = await ApiService.callLocalized(Config.PROMPTS.DEFAULT(content));
        UIRenderer.showJawabanBox(jawaban, replyBtn, root, content);
      } catch (e) { alert(e.message); }
      btn.disabled = false;
      btn.innerHTML = originalHtml;
    },

    injectButtons() {
      document.querySelectorAll(".MuiStack-root .MuiButton-root.MuiButton-containedSuccess").forEach(replyBtn => {
        if (replyBtn.parentElement.querySelector(".cari-jawaban-btn")) return;
        const root = replyBtn.closest(".MuiPaper-root, .discussion-post, [role='article']") || replyBtn.closest("div");
        
        if (Utils.isDosen(root)) {
          const buatBtn = UIRenderer.createButton("buat", () => this.handleBuatPertanyaan(buatBtn, root, replyBtn));
          replyBtn.parentElement.insertBefore(buatBtn, replyBtn);
        }

        const cariBtn = UIRenderer.createButton("cari", () => this.handleCariJawaban(cariBtn, root, replyBtn));
        replyBtn.parentElement.insertBefore(cariBtn, replyBtn);
      });
    },

    init() {
      this.injectButtons();
      new MutationObserver(() => this.injectButtons()).observe(document.body, { childList: true, subtree: true });
    }
  };

  App.init();
})();
