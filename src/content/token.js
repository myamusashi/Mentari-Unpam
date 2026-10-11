(function () {
  const APP_VERSION = "2.0 Sunset";
  console.log("Mentari Mod Token script loaded.");

  const Config = {
    STORAGE_KEYS: {
      AUTH_TOKEN: "mentari_auth_token",
      USER_INFO: "mentari_user_info",
      COURSE_DATA: "mentari_course_data",
      LAST_UPDATE: "mentari_last_update",
      GEMINI_ENABLED: "gemini_enabled",
      QUIZ_DELAY: "mentari_quiz_delay",
      GEMINI_MODEL: "gemini_model",
      GEMINI_QUOTA: "gemini_quota",
      GEMINI_API_KEY: "geminiApiKey",
      GEMINI_MODEL_STATS: "gemini_model_stats",
    },
    API: {
      BASE_URL: "https://mentari.unpam.ac.id/api",
      GITHUB_API:
        "https://api.github.com/repos/lukman754/Mentari-Unpam/releases/latest",
    },
  };

  const State = {
    authToken: null,
    userInfo: null,
    courseDataList: [],
    isFetching: false,
    currentTab: "forum-tab",
  };

  const Utils = {
    save(key, data) {
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {}
    },
    get(key) {
      try {
        const d = localStorage.getItem(key);
        return d ? JSON.parse(d) : null;
      } catch (e) {
        return null;
      }
    },
    remove(key) {
      try {
        localStorage.removeItem(key);
      } catch (e) {}
    },
    extractJwt(raw) {
      if (!raw) return null;
      try {
        const parsed = JSON.parse(raw);
        // Format: [{role, token}, ...] — format Mentari
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item && item.token && this.decodeToken(item.token))
              return item.token;
          }
        }
        // Format: {token: "eyJ..."} atau {access: "eyJ..."}
        if (typeof parsed === "object" && parsed !== null) {
          const val = parsed.token || parsed.access || parsed.jwt;
          if (val && this.decodeToken(val)) return val;
        }
        // Format: plain string yang di-stringify
        if (typeof parsed === "string") {
          const cleaned = parsed.replace(/^Bearer\s+/i, "");
          if (this.decodeToken(cleaned)) return cleaned;
        }
      } catch (_) {
        // Bukan JSON, coba langsung sebagai plain JWT
        const cleaned = raw.replace(/^"|"$/g, "").replace(/^Bearer\s+/i, "");
        if (this.decodeToken(cleaned)) return cleaned;
      }
      return null;
    },
    findTokenFromStorage() {
      try {
        // Coba key utama Mentari lebih dulu
        for (const key of ["access", "token"]) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const jwt = this.extractJwt(raw);
            if (jwt) return jwt;
          }
        }
        // Scan semua key, skip key milik Mentari mod agar tidak pakai cache lama
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (!k || k.startsWith("mentari_")) continue;
          const v = localStorage.getItem(k);
          if (
            v &&
            (k.toLowerCase().includes("token") ||
              k.toLowerCase().includes("access") ||
              v.includes("eyJ"))
          ) {
            const jwt = this.extractJwt(v);
            if (jwt) return jwt;
          }
        }
      } catch (e) {}
      return null;
    },
    decodeToken(token) {
      try {
        if (!token) return null;
        const parts = token.split(".");
        if (parts.length < 2) return null;
        const payload = JSON.parse(
          atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")),
        );
        return {
          token,
          payload,
          userId: payload.id || payload.username,
          username: payload.username || payload.name,
          fullname: payload.fullname || payload.name,
          role: payload.role || "Student",
        };
      } catch (e) {
        return null;
      }
    },
    copy(text, msg) {
      navigator.clipboard.writeText(text).then(() => this.toast(msg));
    },
    toast(msg) {
      if (window.MentariM3) window.MentariM3.snackbar(msg);
    },
    progressToast(msg) {
      if (window.MentariM3) window.MentariM3.snackbar(msg);
    },
    closeProgressToast() {},
    successToast(msg) {
      if (window.MentariM3) window.MentariM3.snackbar(msg);
    },
    updateQuota(headers) {
      try {
        const quota = {
          rpm: {
            remaining: parseInt(headers.get("x-ratelimit-remaining-requests")),
            limit: parseInt(headers.get("x-ratelimit-limit-requests")),
          },
          tpm: {
            remaining: parseInt(headers.get("x-ratelimit-remaining-tokens")),
            limit: parseInt(headers.get("x-ratelimit-limit-tokens")),
          },
          updated: Date.now(),
        };
        if (!isNaN(quota.rpm.limit)) {
          this.save(Config.STORAGE_KEYS.GEMINI_QUOTA, quota);
          window.dispatchEvent(
            new CustomEvent("gemini-quota-updated", { detail: quota }),
          );
        }
      } catch (e) {}
    },
    formatNumber(num) {
      if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
      if (num >= 1000) return (num / 1000).toFixed(1) + "K";
      return num;
    },
    injectMaterialIcons() {
      if (window.MentariM3) window.MentariM3.ensure();
    },
    parseMinutesToMs(val) {
      if (!val) return 0;
      const numStr = String(val).trim();
      const num = parseFloat(numStr);
      if (isNaN(num) || num <= 0) return 0;

      if (numStr.includes(".")) {
        const parts = numStr.split(".");
        const mins = parseInt(parts[0], 10) || 0;
        const secsStr = parts[1].padEnd(2, "0").slice(0, 2);
        const secs = parseInt(secsStr, 10) || 0;
        return (mins * 60 + secs) * 1000;
      } else {
        return Math.round(num * 60 * 1000);
      }
    },
    async countdownDelay(ms, onTick) {
      let remaining = Math.ceil(ms / 1000);
      while (remaining > 0) {
        const m = Math.floor(remaining / 60);
        const s = remaining % 60;
        const formatted = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        if (onTick) onTick(formatted, remaining);
        await new Promise((r) => setTimeout(r, 1000));
        remaining--;
      }
    },
    applyTheme() {
      const container = document.getElementById("token-runner-popup");
      if (!container) return;
      if (window.MentariM3) window.MentariM3.applyTheme(container);
    },
  };

  const ApiService = {
    async fetch(url, options = {}) {
      if (!State.authToken) throw new Error("No token");
      const headers = {
        ...options.headers,
        Authorization: `Bearer ${State.authToken}`,
        "Content-Type": "application/json",
      };
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        let message = `HTTP ${res.status}`;
        try {
          const errorBody = await res.json();
          message = errorBody.message || errorBody.error || message;
        } catch (error) {}
        throw new Error(`${res.status}: ${message}`);
      }
      return res.json();
    },
    async fetchCourses() {
      return this.fetch(`${Config.API.BASE_URL}/user-course?page=1&limit=50`);
    },
    async fetchCourseDetails(code) {
      return this.fetch(`${Config.API.BASE_URL}/user-course/${code}`);
    },
    getGeminiApiKey() {
      const rawKey = localStorage.getItem("geminiApiKey");
      if (!rawKey) throw new Error("API Key Gemini belum diset");
      try {
        return atob(rawKey);
      } catch (error) {
        return rawKey;
      }
    },
    async startQuiz(quizId) {
      return this.fetch(`${Config.API.BASE_URL}/quiz/start/${quizId}`, {
        method: "PUT",
        body: JSON.stringify({
          id_trx_course_sub_section: quizId,
          reset: true,
        }),
      });
    },
    async fetchQuizQuestions(quizId) {
      return this.fetch(`${Config.API.BASE_URL}/quiz/soal/${quizId}`, {
        method: "GET",
        cache: "no-store",
      });
    },
    async fetchQuizParticipant(quizId) {
      return this.fetch(`${Config.API.BASE_URL}/quiz/peserta/${quizId}`, {
        method: "GET",
        cache: "no-store",
      });
    },
    async submitQuizAnswer(answer) {
      return this.fetch(`${Config.API.BASE_URL}/quiz/jawab`, {
        method: "PUT",
        body: JSON.stringify(answer),
      });
    },
    async endQuiz(quizId) {
      return this.fetch(`${Config.API.BASE_URL}/quiz/end`, {
        method: "PUT",
        body: JSON.stringify({
          id_trx_course_sub_section: quizId,
        }),
      });
    },
    async askGeminiQuiz(apiKey, questions) {
      const model = (
        localStorage.getItem("gemini_model") || "gemini-2.5-flash-lite"
      ).replace(/"/g, "");
      const questionText = questions
        .map((question, index) => {
          const isEssay = question.jenis_soal?.toUpperCase() === "ESSAY";
          const options = (question.list_jawaban || [])
            .map(
              (option, optionIndex) => `${optionIndex + 1}. ${option.jawaban}`,
            )
            .join("\n");
          return isEssay
            ? `SOAL ${index + 1} (ESSAY)\nID: ${question.id}\n${question.deskripsi}\nJawab dengan uraian akademik yang langsung menjawab pertanyaan.`
            : `SOAL ${index + 1} (PILIHAN GANDA)\nID: ${question.id}\n${question.deskripsi}\n${options}`;
        })
        .join("\n\n");
      const prompt = `Kamu adalah AI akademik yang menjawab soal secara langsung dan efisien.
    Aturan wajib:
    - Jawab hanya isi soal yang ditanyakan.
    - Jangan menulis salam, sapaan, pembuka, penutup, basa-basi, atau kalimat tambahan yang tidak diperlukan.
    - Jangan menyapa user dan jangan saling bercakap-cakap.
    - Jangan menulis penjelasan di luar jawaban yang diminta.
    - Balas HANYA JSON array valid tanpa markdown dengan format:
[{"question_id":"ID_SOAL","answer_index":1,"answer_text":"Jawaban essay"}]
Untuk PILIHAN GANDA, isi answer_index sesuai urutan pilihan dan jangan isi answer_text.
Untuk ESSAY, isi answer_text dengan jawaban teks lengkap dan jangan isi answer_index.

${questionText}`;
      let text = "";
      if (typeof window !== "undefined" && window.mentariAI && window.mentariAI.getProvider() !== "gemini") {
        const sys = "Kamu adalah AI akademik. Balas HANYA JSON array valid tanpa markdown.";
        text = await window.mentariAI.askOmp(prompt, { system: sys, temperature: 0.1, maxTokens: 8000 });
      } else {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.1,
                maxOutputTokens: 4096,
                responseMimeType: "application/json",
              },
            }),
          },
        );
        if (!response.ok) throw new Error(`Gemini API ${response.status}`);
        const result = await response.json();
        text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
      }
      const cleaned = text
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```$/i, "")
        .trim();
      const candidates = [cleaned];
      const arrayStart = cleaned.indexOf("[");
      const arrayEnd = cleaned.lastIndexOf("]");
      if (arrayStart >= 0 && arrayEnd > arrayStart)
        candidates.push(cleaned.slice(arrayStart, arrayEnd + 1));
      const objectStart = cleaned.indexOf("{");
      const objectEnd = cleaned.lastIndexOf("}");
      if (objectStart >= 0 && objectEnd > objectStart)
        candidates.push(cleaned.slice(objectStart, objectEnd + 1));

      for (const candidate of candidates) {
        try {
          const parsed = JSON.parse(candidate);
          if (Array.isArray(parsed)) return parsed;
          if (Array.isArray(parsed.answers)) return parsed.answers;
          if (Array.isArray(parsed.results)) return parsed.results;
        } catch (error) {}
      }

      console.error("[Mentari] Respons mentah AI quiz bukan JSON", text);
      throw new Error("Respons AI bukan JSON");
    },
    async fetchForumTopics(id) {
      return this.fetch(`${Config.API.BASE_URL}/forum/topic/${id}`);
    },
    async fetchForumReplies(id) {
      return this.fetch(`${Config.API.BASE_URL}/forum/reply/${id}`);
    },
    async submitForumReply(payload) {
      return this.fetch(`${Config.API.BASE_URL}/forum/reply`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    async fetchKuesioner(courseCode, sectionCode) {
      return this.fetch(
        `${Config.API.BASE_URL}/kuesioner/${courseCode}/${sectionCode}`,
      );
    },
    async submitKuesioner(courseCode, sectionCode, questions) {
      return this.fetch(`${Config.API.BASE_URL}/kuesioner/submit`, {
        method: "POST",
        body: JSON.stringify({
          kode_section: sectionCode,
          kode_course: courseCode,
          kuesioner: questions.map((question) => ({
            id_kuesioner: question.id,
            jawaban: 1,
          })),
        }),
      });
    },
    async checkUpdate() {
      try {
        const r = await fetch(Config.API.GITHUB_API);
        return r.ok ? await r.json() : null;
      } catch (e) {
        return null;
      }
    },
    async fetchGeminiModels(apiKey) {
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        );
        if (!r.ok) return null;
        return r.json();
      } catch (e) {
        return null;
      }
    },
  };

  const UIRenderer = {
    injectStyles() {
      if (window.MentariM3) window.MentariM3.ensure();
    },
    createPopup() {
      if (document.getElementById("token-runner-popup")) return;
      const p = document.createElement("div");
      p.id = "token-runner-popup";
      p.className = "mm mm-popup";
      p.style.cssText =
        "top:70px; right:20px; width:500px; max-height:90vh; display:flex; flex-direction:column; visibility:hidden; opacity:0; transform:translateY(-15px) scale(0.95); pointer-events:none; transition:opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1), transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.3s;";
      p.innerHTML = `
        <div class="token-loading-bar mm-linear mm-linear-ind" style="position:absolute; top:0; left:0; right:0; display:none;"><i></i></div>
        <div class="popup-content mm-scroll" style="display:flex; flex-direction:column; height:100%; max-height:90vh;">
          <div class="popup-header mm-topbar" style="flex-wrap:wrap;">
            <div class="header-top" style="display:flex; justify-content:space-between; align-items:center; width:100%; margin-bottom:10px;">
              <div style="display:flex; flex-direction:column;">
                <span class="popup-title mm-eyebrow">MENTARI MOD</span>
                <span class="popup-subtitle mm-subtitle">mod by <a style="color:inherit; text-decoration:none;" href="https://github.com/Lukman754">Lukman754</a></span>
              </div>
              <button id="token-refresh-btn" class="mm-btn mm-btn-sm mm-btn-tonal" title="Refresh status"><span class="ms">refresh</span></button>
            </div>
            <div class="token-tabs mm-tabs mm-cbg" role="tablist" style="width:100%;">
              <button class="token-tab mm-tab mm-cbg-btn mm-tab-on mm-cbg-on active" data-tab="forum-tab" role="tab" aria-selected="true" tabindex="0" title="Forum"><span class="ms">forum</span><span id="forum-tab-badge" class="token-tab-badge mm-badge" style="display:none;"></span></button>
              <button class="token-tab mm-tab mm-cbg-btn" data-tab="mhs-tab" role="tab" aria-selected="false" tabindex="-1" title="Mahasiswa"><span class="ms">groups</span></button>
              <button class="token-tab mm-tab mm-cbg-btn" data-tab="set-tab" role="tab" aria-selected="false" tabindex="-1" title="Pengaturan"><span class="ms">settings</span></button>
            </div>
          </div>
          <div class="token-tab-content mm-scroll active" id="forum-tab-tab" style="display:block; padding:16px; flex:1; overflow-y:auto; overflow-x:hidden; box-sizing:border-box;"></div>
          <div class="token-tab-content mm-scroll" id="mhs-tab-tab" style="display:none; padding:16px; flex:1; overflow-y:auto; overflow-x:hidden; box-sizing:border-box;"></div>
          <div class="token-tab-content mm-scroll" id="set-tab-tab" style="display:none; padding:16px; flex:1; overflow-y:auto; overflow-x:hidden; box-sizing:border-box;"></div>
        </div>
      `;
      document.body.appendChild(p);
      if (window.MentariM3) window.MentariM3.applyTheme(p);
      this.initTabs();
      document.getElementById("token-refresh-btn").onclick = (e) => {
        e.stopPropagation();
        App.refreshData(true);
      };
    },
    initTabs() {
      const tabs = Array.from(document.querySelectorAll(".token-tab"));
      const activate = (t) => {
        document
          .querySelectorAll(".token-tab, .token-tab-content")
          .forEach((el) => {
            el.classList.remove("active");
            el.classList.remove("mm-tab-on");
            el.classList.remove("mm-cbg-on");
            if (el.classList.contains("token-tab")) {
              el.setAttribute("aria-selected", "false");
              el.setAttribute("tabindex", "-1");
            }
            if (el.classList.contains("token-tab-content"))
              el.style.display = "none";
          });
        t.classList.add("active");
        t.classList.add("mm-tab-on");
        t.classList.add("mm-cbg-on");
        t.setAttribute("aria-selected", "true");
        t.setAttribute("tabindex", "0");
        const panel = document.getElementById(t.dataset.tab + "-tab");
        if (panel) {
          panel.classList.add("active");
          panel.style.display = "block";
        }
      };
      tabs.forEach((t, i) => {
        t.onclick = (e) => {
          e.stopPropagation();
          activate(t);
        };
        t.onkeydown = (e) => {
          let idx = -1;
          if (e.key === "ArrowRight") idx = (i + 1) % tabs.length;
          else if (e.key === "ArrowLeft") idx = (i - 1 + tabs.length) % tabs.length;
          else if (e.key === "Home") idx = 0;
          else if (e.key === "End") idx = tabs.length - 1;
          else return;
          e.preventDefault();
          e.stopPropagation();
          tabs[idx].focus();
          activate(tabs[idx]);
        };
      });
    },
    setLoading(active) {
      const bar = document.querySelector(".token-loading-bar");
      if (bar) bar.style.display = active ? "block" : "none";
    },
    updatePosition() {
      // Disabled for fixed position consistency across mod windows
    },
  };

  const ForumRenderer = {
    render(data) {
      const el = document.getElementById("forum-tab-tab");
      if (!el) return;

      let html = `
        <div style="margin-bottom:14px;">
          <a href="https://my.unpam.ac.id/presensi/" target="_blank" class="mm-list-item" style="text-decoration:none;">
            <div class="mm-lead"><span class="ms">fact_check</span></div>
            <div class="mm-list-main">
              <div class="mm-list-title">Halaman Presensi Mahasiswa</div>
              <div class="mm-list-sub"><span class="ms" style="font-size:11px;">link</span> my.unpam.ac.id/presensi</div>
            </div>
            <span class="ms" style="font-size:16px; opacity:0.5; flex-shrink:0;">open_in_new</span>
          </a>
        </div>
      `;

      if (!data.length) {
        html += `
          <div class="empty-state mm-empty">
            <div class="empty-icon mm-empty-ic"><span class="ms">cloud_sync</span></div>
            <div class="empty-title mm-title">Data Kosong</div>
            <p class="empty-desc">Pilih mata kuliah di Mentari agar data forum muncul di sini.</p>
          </div>
        `;
      } else {
        const sortedData = [...data].sort((a, b) => {
          const days = [
            "Minggu",
            "Senin",
            "Selasa",
            "Rabu",
            "Kamis",
            "Jumat",
            "Sabtu",
          ];
          const getDay = (name) => {
            const m = name.match(/\(([^)]+)\)/);
            return m ? days.indexOf(m[1]) : 7;
          };
          return getDay(a.coursename) - getDay(b.coursename);
        });

        const coursesHtml = sortedData
          .map((course) => this.renderCourse(course))
          .join("");

        if (!coursesHtml.trim()) {
          html += `
            <div class="empty-state mm-empty">
              <div class="empty-icon mm-empty-ic"><span class="ms">task_alt</span></div>
              <div class="empty-title mm-title">Semua Beres!</div>
              <p class="empty-desc">Hore! Tidak ada forum diskusi yang perlu dikerjakan saat ini. Istirahatlah sejenak.</p>
            </div>
          `;
        } else {
          html += coursesHtml;
        }
      }

      el.innerHTML = html;
      this.initInteractions(data);
      this.updateForumBadge();
    },

    updateForumBadge() {
      const badge = document.getElementById("forum-tab-badge");
      const forum = document.getElementById("forum-tab-tab");
      if (!badge || !forum) return;

      const incompleteMeetings = Array.from(
        forum.querySelectorAll(".section-card"),
      ).filter((section) => section.querySelector(".status-todo"));

      const count = incompleteMeetings.length;
      badge.textContent = count ? String(count) : "";
      badge.style.display = count ? "inline-flex" : "none";
    },

    renderCourse(c) {
      const allSections = c.data || [];
      let lastCompletedSort = 0;
      let maxSort = 0;

      allSections.forEach((s, idx) => {
        const sortVal = typeof s.sort === "number" ? s.sort : idx + 1;
        if (sortVal > maxSort) maxSort = sortVal;

        const hasCompletedKuisioner = (s.sub_section || []).some(
          (i) =>
            (i.kode_template === "KUESIONER" || i.tipe === "QUESIONER") &&
            i.completion === true,
        );
        if (hasCompletedKuisioner && sortVal > lastCompletedSort) {
          lastCompletedSort = sortVal;
        }
      });

      const totalSorts = maxSort || allSections.length || 0;
      const progressPercent =
        totalSorts > 0 ? Math.round((lastCompletedSort / totalSorts) * 100) : 0;

      const sections = allSections.filter((s) => {
        if (!s.sub_section) return false;
        const forum = s.sub_section.find(
          (i) => i.kode_template === "FORUM_DISKUSI" && i.id,
        );
        const kuesioner = s.sub_section.find(
          (i) => i.kode_template === "KUESIONER" || i.tipe === "QUESIONER",
        );
        if (!forum && !kuesioner) return false;
        if (kuesioner?.completion === true) return false;
        if (forum?.warningAlert?.includes("Soal forum diskusi belum tersedia"))
          return false;
        const postTest = s.sub_section.find(
          (i) => i.kode_template === "POST_TEST",
        );
        if (
          forum &&
          forum.completion === true &&
          !kuesioner &&
          (!postTest || postTest.completion === true || !postTest.id)
        )
          return false;
        return true;
      });

      // Parse coursename details (e.g. "[2] STATISTIK NON PARAMETRIK # 05MATP002 (Senin) [P-1]")
      const rawName = c.coursename || "";
      const sksMatch = rawName.match(/^\[(\d+)\]/);
      const sks = sksMatch ? sksMatch[1] : null;

      const hariMatch = rawName.match(/\(([^)]+)\)/);
      const hari = hariMatch ? hariMatch[1] : null;

      const kelasMatch = rawName.match(/#\s*([^\s(]+)/);
      const kelas = kelasMatch ? kelasMatch[1] : null;

      let courseTitle = rawName
        .split("#")[0]
        .replace(/^\[\d+\]\s*/, "")
        .replace(/\([^)]+\)/g, "")
        .replace(/\[[^\]]+\]/g, "")
        .trim();

      if (!courseTitle) courseTitle = rawName;

      const validSectionsHtml = sections
        .map((s, idx) => this.renderSection(s, c, idx))
        .filter((html) => html && html.trim() !== "")
        .join("");

      if (!validSectionsHtml.trim()) return "";

      return `
        <div class="course-card mm-card mm-card-outline" style="margin-bottom:14px;">
          <div class="course-card-header mm-card-head" style="flex-direction:column; align-items:stretch; gap:8px;">
            <div style="display:flex; flex-direction:row; justify-content:space-between; align-items:flex-start; gap:10px; width:100%;">
              <div style="flex:1; display:flex; flex-direction:column; gap:4px; min-width:0;">
                <p class="course-title mm-title" style="margin:0;">${courseTitle}</p>
                <div style="display:flex; flex-direction:row; align-items:center; gap:6px; flex-wrap:wrap;">
                  ${sks ? `<span class="course-chip course-chip-sks mm-chip mm-chip-ok"><span class="ms" style="font-size:11px;">auto_stories</span> ${sks} SKS</span>` : ""}
                  ${hari ? `<span class="course-chip course-chip-day mm-chip mm-chip-ok"><span class="ms" style="font-size:11px;">calendar_month</span> ${hari}</span>` : ""}
                  ${kelas ? `<span class="course-chip course-chip-class mm-chip mm-chip-warn"><span class="ms" style="font-size:11px;">school</span> Kelas ${kelas}</span>` : ""}
                </div>
                <span class="course-code mm-hint">Kode Course: ${c.kode_course}</span>
              </div>
              <div style="display:flex; flex-direction:column; align-items:flex-end; gap:2px; flex-shrink:0;">
                <span class="course-progress-value" style="font-size:0.9rem; font-weight:800; font-family:monospace;">${progressPercent}%</span>
                <span class="course-progress-label mm-hint">Pertemuan ${lastCompletedSort} / ${totalSorts}</span>
              </div>
            </div>
            <div class="course-progress-track mm-linear" style="width:100%;"><i class="course-progress-bar" style="display:block; width:${progressPercent}%;"></i></div>
          </div>
          <div class="course-card-body mm-card-body mm-list" style="padding-bottom:8px;">
            ${validSectionsHtml}
          </div>
        </div>
      `;
    },

    renderSection(s, c, idx) {
      const itemsHtml = (s.sub_section || [])
        .map((item) => this.renderItem(item, s, c))
        .filter((html) => html && html.trim() !== "")
        .join("");

      if (!itemsHtml.trim()) return "";

      const sectionId = `sect-${c.kode_course}-${idx}`;
      const sectionUrl = `https://mentari.unpam.ac.id/u-courses/${c.kode_course}?accord_pertemuan=${s.kode_section}`;
      return `
        <div class="section-card mm-card mm-card-outline">
          <div class="section-header mm-card-head" data-target="${sectionId}" style="cursor:pointer;">
            <div class="section-header-left" style="display:flex; align-items:center; gap:8px; min-width:0;">
              <div class="section-header-icon mm-lead" style="width:24px; height:24px;"><span class="ms">import_contacts</span></div>
              <h3 class="mm-title" style="font-size:12px; margin:0;">${s.nama_section}</h3>
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="section-toggle"><span class="ms">expand_more</span></span>
            </div>
          </div>
          <div class="section-content mm-list" id="${sectionId}" style="display:none;">
            <a href="${sectionUrl}" class="item-row mm-list-item" onclick="event.stopPropagation()">
              <div class="item-icon mm-lead">
                <span class="ms">folder_open</span>
              </div>
              <div class="item-info mm-list-main">
                <span class="item-title mm-list-title">Buka Pertemuan</span>
                <div class="item-meta mm-list-sub"><span>Buka langsung di Mentari UNPAM</span></div>
              </div>
              <span class="ms" style="opacity:0.6; font-size:14px; flex-shrink:0;">chevron_right</span>
            </a>
            ${itemsHtml}
          </div>
        </div>
      `;
    },

    renderItem(i, s, c) {
      const isQuiz = ["PRE_TEST", "POST_TEST"].includes(i.kode_template);
      const isForum = i.kode_template === "FORUM_DISKUSI";
      const isMaterial = [
        "BUKU_ISBN",
        "VIDEO_AJAR",
        "POWER_POINT",
        "ARTIKEL_RISET",
        "MATERI_LAINNYA",
      ].includes(i.kode_template);
      const isKuesioner =
        i.kode_template === "KUESIONER" || i.tipe === "QUESIONER";
      const isTugas = i.kode_template === "PENUGASAN_TERSTRUKTUR";

      if (isMaterial && !i.link && !i.file) return "";
      if (isTugas && !i.link && !i.file) return ""; // Sembunyikan tugas kosong
      if (!isQuiz && !isForum && !isMaterial && !isKuesioner && !isTugas)
        return "";

      // cardUrl: klik seluruh card -> halaman "overview" item
      // actionUrl: klik tombol aksi -> halaman spesifik / langsung action
      let cardUrl = "#";
      let actionUrl = "#";
      let iconClass = "icon-material";
      let icon = "fa-file";
      let actionLabel = "Buka";
      let actionIcon = "fa-up-right-from-square";

      if (isQuiz) {
        cardUrl = i.id
          ? `https://mentari.unpam.ac.id/u-courses/${c.kode_course}/quiz/${i.id}`
          : "#";
        actionUrl = i.id
          ? `https://mentari.unpam.ac.id/u-courses/${c.kode_course}/exam/${i.id}`
          : "#";
        iconClass = "icon-quiz";
        icon = "checklist";
        actionLabel = "Mulai Quiz";
        actionIcon = "play_arrow";
      } else if (isForum) {
        cardUrl = i.id
          ? `https://mentari.unpam.ac.id/u-courses/${c.kode_course}/forum/${i.id}`
          : "#";
        actionUrl = cardUrl;
        iconClass = "icon-forum";
        icon = "forum";
        actionLabel = "Buka Forum";
        actionIcon = "open_in_new";
      } else if (isMaterial) {
        // Card -> halaman kursus, Action -> link/download langsung
        cardUrl = `https://mentari.unpam.ac.id/u-courses/${c.kode_course}`;
        if (i.link) {
          actionUrl = i.link;
          actionLabel = "Buka Link";
          actionIcon = "open_in_new";
        } else if (i.file) {
          actionUrl = `https://mentari.unpam.ac.id/api/file/${i.file}`;
          actionLabel = "Download";
          actionIcon = "download";
        }
        icon = this.getMaterialIcon(i.kode_template);
      } else if (isKuesioner) {
        actionUrl = "#";
        iconClass = "icon-quiz";
        icon = "bar_chart";
        actionLabel = "Isi Kuesioner";
        actionIcon = "play_arrow";
      } else if (isTugas) {
        iconClass = "icon-material";
        icon = "assignment";
        actionLabel = "Lihat Tugas";
      }

      const statusClass = i.completion ? "status-done" : "status-todo";
      const statusText = i.completion ? "Selesai" : "Belum";
      const isFinished = i.completion === true;

      const btnIcon = isFinished ? "lock" : actionIcon;
      const btnTitle = isFinished ? "Sudah Selesai" : actionLabel;
      const btnStyle = isFinished
        ? "width:28px; height:28px; padding:0; background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.3); border-radius:6px; cursor:not-allowed;"
        : `width:28px; height:28px; padding:0; background: ${actionLabel === "Download" ? "#79bb7c" : actionLabel === "Mulai Quiz" || isQuiz || isKuesioner ? "#e05c2a" : "#f0872d"}; border-radius:6px;`;

      // Konten forum (HTML) untuk accordion
      const forumKonten = isForum && i.konten ? i.konten.trim() : "";
      const forumKontenId = `fk-${i.id}`;

      return `
           <div class="item-row mm-list-item ${i.completion ? "completed-item" : ""}"
             onclick="if(event.target.closest('a,button,input,select,textarea,form')) return; window.location.href='${cardUrl}';"
             style="flex-wrap:wrap; ${i.completion ? "opacity:0.8;" : ""}" data-name="${i.judul}">
          <div style="display:flex; align-items:center; gap:10px; padding:2px; flex:1; min-width:0;">
            <div class="item-icon ${iconClass} mm-lead"><span class="ms">${icon}</span></div>
            <div class="item-info mm-list-main">
              <span class="item-title mm-list-title" style="${i.completion ? "text-decoration: line-through; opacity: 0.6;" : ""}">${i.judul}</span>
              <div class="item-meta mm-list-sub">
                <span class="item-status ${statusClass} mm-chip ${i.completion ? "mm-chip-ok" : "mm-chip-warn"}"><span class="ms" style="font-size:10px;">${i.completion ? "check_circle" : "schedule"}</span> ${statusText}</span>
                ${i.setting_quiz?.duration ? `<span style="opacity:0.7;"><span class="ms">hourglass_top</span> ${i.setting_quiz.duration} min</span>` : ""}
                ${isQuiz ? `<span class="quiz-participant-status" data-quiz-id="${i.id}" style="opacity:0.7;">Memuat hasil...</span>` : ""}
              </div>
            </div>
            <div style="display:flex; gap:6px; flex-shrink:0;">
              ${
                forumKonten
                  ? `
                <button class="mm-btn mm-btn-sm mm-btn-tonal" title="Lihat Konten Forum" onclick="event.stopPropagation(); const el=document.getElementById('${forumKontenId}'); el.style.display=el.style.display==='none'?'block':'none';">
                  <span class="ms" style="font-size:14px;">menu_book</span> Konten
                </button>`
                  : ""
              }
              ${
                isForum && i.id
                  ? `<button type="button" class="mm-btn mm-btn-sm forum-reply-btn" title="Balas Forum" data-forum-id="${i.id}" onclick="event.stopPropagation();"><span class="ms" style="font-size:13px;">reply</span> Balas</button>`
                  : ""
              }
              ${
                isQuiz || isKuesioner
                  ? `<button type="button" class="mm-btn mm-btn-sm ${isQuiz ? "quiz-ai-submit-btn" : "kuesioner-submit-btn"}" title="${btnTitle}" ${isFinished ? 'disabled="disabled"' : ""} data-course-code="${c.kode_course}" data-section-code="${s.kode_section}" data-quiz-id="${isQuiz ? i.id : ""}" data-quiz-title="${isQuiz ? i.judul : ""}" onclick="event.stopPropagation();" style="min-width:32px; padding:0 8px;"><span class="ms" style="font-size:15px;">${btnIcon}</span></button>`
                  : actionUrl !== "#"
                    ? `<a href="${isFinished ? "#" : actionUrl}" class="mm-btn mm-btn-sm" title="${btnTitle}" ${isFinished ? 'onclick="event.preventDefault(); event.stopPropagation();"' : 'onclick="event.stopPropagation();"'} style="min-width:32px; padding:0 8px;"><span class="ms" style="font-size:15px;">${btnIcon}</span></a>`
                    : ""
              }
            </div>
          </div>
          ${
            forumKonten
              ? `
            <div id="${forumKontenId}" class="forum-html-preview" style="display:none; flex-basis:100%; padding:10px; font-size:11px; line-height:1.5;">
              ${forumKonten}
            </div>`
              : ""
          }
          ${
            isForum && i.id
              ? `
            <div style="display:flex; justify-content:flex-end; flex-basis:100%; padding:4px 10px 0 10px;">
              <span class="forum-reply-count mm-hint" data-forum-id="${i.id}" style="display:inline-flex; align-items:center; gap:3px;"><span class="ms" style="font-size:12px;">reply</span> Reply Kamu: -</span>
            </div>
            <div class="topics-container mm-list" data-forum-id="${i.id}" data-course-code="${c.kode_course}" style="flex-basis:100%; padding:0 2px 8px;"></div>`
              : ""
          }
        </div>
      `;
    },

    getMaterialIcon(type) {
      const map = {
        BUKU_ISBN: "book",
        VIDEO_AJAR: "play_circle",
        POWER_POINT: "slideshow",
        ARTIKEL_RISET: "article",
        MATERI_LAINNYA: "folder_open",
      };
      return map[type] || "description";
    },

    initInteractions(data) {
      document.querySelectorAll(".section-header").forEach((header) => {
        header.onclick = (e) => {
          e.stopPropagation();
          const target = document.getElementById(header.dataset.target);
          const toggle = header.querySelector(".section-toggle");
          if (target) {
            const isVisible =
              target.classList.contains("active") ||
              target.style.display === "flex";
            if (isVisible) {
              target.classList.remove("active");
              target.style.display = "none";
              toggle.classList.remove("active");
            } else {
              document
                .querySelectorAll(".section-content.active")
                .forEach((openSection) => {
                  openSection.classList.remove("active");
                  openSection.style.display = "none";
                  openSection
                    .closest(".section-card")
                    ?.querySelector(".section-toggle")
                    ?.classList.remove("active");
                });
              target.classList.add("active");
              target.style.display = "flex";
              target.style.flexDirection = "column";
              toggle.classList.add("active");
            }
          }
        };
      });

      document.querySelectorAll(".forum-reply-btn").forEach((button) => {
        button.onclick = (e) => {
          e.stopPropagation();
          const container = document.querySelector(
            `.topics-container[data-forum-id="${button.dataset.forumId}"]`,
          );
          if (container) this.toggleForumReplyForm(container);
        };
      });

      document.querySelectorAll(".kuesioner-submit-btn").forEach((button) => {
        button.onclick = async (e) => {
          e.stopPropagation();
          if (button.disabled) return;

          const courseCode = button.dataset.courseCode;
          const sectionCode = button.dataset.sectionCode;
          const originalContent = button.innerHTML;
          button.disabled = true;
          button.innerHTML = `<span class="ms" style="font-size:16px; display:inline-block; animation:mm-spin .9s linear infinite;">sync</span>`;

          try {
            Utils.progressToast("Sedang mengambil pertanyaan kuisioner...");
            const detail = await ApiService.fetchKuesioner(
              courseCode,
              sectionCode,
            );
            const questions = detail?.kuesioner || [];
            if (!questions.length)
              throw new Error("Pertanyaan kuisioner kosong");

            Utils.progressToast("Sedang mengirim jawaban kuisioner...");
            await ApiService.submitKuesioner(
              courseCode,
              sectionCode,
              questions,
            );
            Utils.closeProgressToast();
            Utils.successToast("Kuisioner berhasil dikirim");
            setTimeout(() => App.refreshData(true), 700);
          } catch (error) {
            console.error("[Mentari] Gagal submit kuisioner", {
              kode_course: courseCode,
              kode_section: sectionCode,
              error,
            });
            Utils.closeProgressToast();
            Utils.toast("Kuisioner gagal dikirim");
            button.disabled = false;
            button.innerHTML = originalContent;
          }
        };
      });

      document.querySelectorAll(".quiz-ai-submit-btn").forEach((button) => {
        button.onclick = async (e) => {
          e.stopPropagation();
          if (button.disabled) return;

          const quizId = button.dataset.quizId;
          const quizTitle = button.dataset.quizTitle;
          const originalContent = button.innerHTML;
          button.disabled = true;
          button.innerHTML = `<span class="ms" style="font-size:16px; display:inline-block; animation:mm-spin .9s linear infinite;">sync</span>`;

          try {
            Utils.progressToast("Sedang memulai quiz...");
            await ApiService.startQuiz(quizId);
            Utils.progressToast("Sedang mencari soal quiz...");
            const questions =
              (await ApiService.fetchQuizQuestions(quizId))?.data || [];
            if (!questions.length) throw new Error("Soal quiz kosong");

            Utils.progressToast("AI sedang menjawab quiz...");
            const answers = await ApiService.askGeminiQuiz(
              ApiService.getGeminiApiKey(),
              questions,
            );
            const answersByQuestion = new Map(
              answers.map((answer) => [answer.question_id, answer]),
            );

            for (const question of questions) {
              const aiAnswer = answersByQuestion.get(question.id);
              const isEssay = question.jenis_soal?.toUpperCase() === "ESSAY";
              let payload;

              if (isEssay) {
                const answerText = String(aiAnswer?.answer_text || "").trim();
                if (!answerText)
                  throw new Error(
                    `Jawaban essay AI kosong untuk ${question.id}`,
                  );
                payload = {
                  id_trx_quiz_user_soal: question.id,
                  id_jawaban: null,
                  jawaban: answerText,
                };
              } else {
                const answerIndex = aiAnswer?.answer_index;
                const selectedAnswer =
                  question.list_jawaban?.[Number(answerIndex) - 1];
                if (!selectedAnswer?.id)
                  throw new Error(
                    `Jawaban AI tidak valid untuk ${question.id}`,
                  );
                payload = {
                  id_trx_quiz_user_soal: question.id,
                  id_jawaban: selectedAnswer.id,
                  jawaban: null,
                };
              }

              Utils.progressToast("Sedang mengirim jawaban quiz...");
              await ApiService.submitQuizAnswer(payload);
            }

            const quizDelaySetting =
              Utils.get(Config.STORAGE_KEYS.QUIZ_DELAY) || "0";
            const delayMs = Utils.parseMinutesToMs(quizDelaySetting);
            if (delayMs > 0) {
              await Utils.countdownDelay(delayMs, (formattedTime) => {
                Utils.progressToast(
                  `Menunggu ${formattedTime} sebelum menyelesaikan quiz...`,
                );
              });
            }

            Utils.progressToast("Sedang menyelesaikan quiz...");
            await ApiService.endQuiz(quizId);
            Utils.closeProgressToast();
            Utils.successToast("Jawaban quiz berhasil diisi AI & diselesaikan");
            setTimeout(() => App.refreshData(true), 700);
          } catch (error) {
            console.error("[Mentari] Gagal mengisi quiz dengan AI", {
              quizId,
              quizTitle,
              error,
            });
            Utils.closeProgressToast();
            Utils.toast(`AI quiz gagal: ${error.message}`);
          } finally {
            button.disabled = false;
            button.innerHTML = originalContent;
          }
        };
      });

      this.loadKuesioner(data);
      this.loadQuizParticipants();
      this.loadTopics();
    },

    loadQuizParticipants() {
      document
        .querySelectorAll(".quiz-participant-status[data-quiz-id]")
        .forEach(async (statusEl) => {
          try {
            const result = await ApiService.fetchQuizParticipant(
              statusEl.dataset.quizId,
            );
            const quiz = result?.quiz;
            if (!quiz) {
              statusEl.textContent = "Belum dikerjakan";
              return;
            }

            const endInSecond = quiz.end_in_second ?? null;
            const grade = quiz.grade ?? "-";
            const timeDisplay =
              endInSecond !== null
                ? (() => {
                    const totalSec = Number(endInSecond);
                    const m = Math.floor(totalSec / 60);
                    const s = totalSec % 60;
                    return s > 0 ? `${m}m ${s}s` : `${m} menit`;
                  })()
                : "-";
            statusEl.innerHTML = `<span class="ms" style="font-size:12px;">timer</span> ${timeDisplay} <span style="margin-left:4px;">Nilai: ${grade}</span>`;
          } catch (error) {
            statusEl.textContent = "Status tidak tersedia";
          }
        });
    },

    loadKuesioner(data) {
      data.forEach((course) => {
        (course.data || []).forEach((section) => {
          const hasKuesioner = (section.sub_section || []).some(
            (item) =>
              item.kode_template === "KUESIONER" || item.tipe === "QUESIONER",
          );
          if (!hasKuesioner || !course.kode_course || !section.kode_section)
            return;

          ApiService.fetchKuesioner(course.kode_course, section.kode_section)
            .then((result) => {
              console.log("[Mentari] Isi kuisioner", {
                kode_course: course.kode_course,
                kode_section: section.kode_section,
                kuesioner: result?.kuesioner || [],
                response: result,
              });
            })
            .catch((error) => {
              console.error("[Mentari] Gagal mengambil kuisioner", {
                kode_course: course.kode_course,
                kode_section: section.kode_section,
                error,
              });
            });
        });
      });
    },

    loadTopics() {
      document
        .querySelectorAll(".topics-container")
        .forEach(async (container) => {
          const id = container.dataset.forumId;
          const courseCode = container.dataset.courseCode;
          // Guard: skip if id is missing or null
          if (!id || id === "null" || id === "undefined") return;
          container.onclick = (event) => event.stopPropagation();
          try {
            const res = await ApiService.fetchForumTopics(id);
            const topics =
              res.topics?.filter((t) => t.id_trx_course_sub_section === id) ||
              [];
            if (topics.length) {
              container.innerHTML = "";
              await this.loadForumReplies(container, topics);
            }
          } catch (e) {}
        });
    },

    async loadForumReplies(container, topics) {
      const currentNim = String(
        State.userInfo?.username || State.userInfo?.userId || "",
      ).trim();
      if (!currentNim) return;
      const courseCode = container.dataset.courseCode;
      const sectionId = container.dataset.forumId;

      const replyGroups = await Promise.all(
        topics.map(async (topic) => {
          try {
            const result = await ApiService.fetchForumReplies(topic.id);
            const root = result?.id === topic.id ? result : null;
            const replies = root?.data || result?.data || [];
            const studentReplies = replies.filter((reply) => {
              const nim = String(
                reply.nim || reply.mahasiswa?.nim || "",
              ).trim();
              return (
                Number(reply.reply_level) > 0 &&
                reply.id_dosen == null &&
                Boolean(nim)
              );
            });
            const ownLevelOne = replies.filter(
              (reply) =>
                Number(reply.reply_level) === 1 &&
                String(reply.nim || reply.mahasiswa?.nim || "").trim() ===
                  currentNim,
            );
            const ownLevelOneIds = new Set(
              ownLevelOne.map((reply) => reply.id),
            );
            const ownLevelTwo = replies.filter(
              (reply) =>
                Number(reply.reply_level) === 2 &&
                ownLevelOneIds.has(reply.id_parent),
            );

            return {
              topic,
              root,
              studentReplyCount: studentReplies.length,
              ownReplies: [...ownLevelOne, ...ownLevelTwo],
            };
          } catch (error) {
            return null;
          }
        }),
      );

      const visibleGroups = replyGroups.filter(Boolean);
      container._forumReplyTargets = visibleGroups.map(
        ({ topic, root, ownReplies }) => ({
          id: topic.id,
          topicId: topic.id,
          judul: `RE ${root?.judul || topic.judul || "Forum Diskusi"}`,
          label: `Topik: ${root?.judul || topic.judul || "Forum Diskusi"}`,
          own: false,
          replies: ownReplies.map((reply) => ({
            ...reply,
            topicId: topic.id,
          })),
        }),
      );
      const totalReplies = visibleGroups.reduce(
        (total, group) => total + group.ownReplies.length,
        0,
      );

      const countEl = container
        .closest(".item-row")
        ?.querySelector(`.forum-reply-count[data-forum-id="${sectionId}"]`);
      if (countEl)
        countEl.innerHTML = `<span class="ms" style="font-size:12px;">reply</span> Reply Kamu: ${totalReplies}`;

      visibleGroups.forEach(
        ({ topic, root, ownReplies, studentReplyCount }) => {
          const topicEl = document.createElement("div");
          topicEl.className = "mm-card mm-card-outline";
          topicEl.style.cssText =
            "margin-top:8px; padding:10px 12px; font-size:11px; line-height:1.5;";

          const title = document.createElement("a");
          title.href = `https://mentari.unpam.ac.id/u-courses/${courseCode}/forum/${sectionId}/topics/${topic.id}`;
          title.className = "topic-badge mm-chip mm-chip-ok";
          title.style.cssText =
            "font-weight:700; display:flex; align-items:center; gap:6px; width:100%; box-sizing:border-box; text-decoration:none;";
          title.innerHTML = `<span class="ms" style="font-size:14px; flex-shrink:0;">chat</span><span style="flex:1; min-width:0;">${topic.judul || "Forum Diskusi"}</span><span class="item-status status-done mm-chip mm-chip-ok" style="flex-shrink:0;"><span class="ms" style="font-size:10px;">reply</span> ${studentReplyCount}</span>`;
          title.onclick = (event) => event.stopPropagation();
          topicEl.appendChild(title);

          const rootContent = document.createElement("div");
          rootContent.className = "forum-html-preview";
          rootContent.style.cssText =
            "margin-top:6px; opacity:0.85; padding:4px 0;";
          rootContent.innerHTML = this.sanitizeForumHtml(
            root?.konten || topic.konten || "",
          );
          topicEl.appendChild(rootContent);
          this.appendForumFiles(topicEl, root?.files || topic.files);

          ownReplies.forEach((reply) => {
            const replyEl = document.createElement("div");
            replyEl.className = "mm-card";
            replyEl.style.cssText =
              "margin-top:6px; padding:8px 10px; font-size:11px; border-left:3px solid var(--mm-primary);";
            replyEl.innerHTML = `${Number(reply.reply_level) === 2 ? "<span style='opacity:0.6; margin-right:4px;'>↳ Balasan:</span>" : ""}${this.sanitizeForumHtml(reply.konten || "")}`;
            this.appendForumFiles(replyEl, reply.files);
            topicEl.appendChild(replyEl);
          });

          container.appendChild(topicEl);
        },
      );
    },

    appendForumFiles(parent, files) {
      if (!Array.isArray(files) || !files.length) return;

      const filesEl = document.createElement("div");
      filesEl.style.cssText =
        "display:flex; flex-wrap:wrap; gap:6px; margin-top:8px;";
      files.forEach((fileId) => {
        if (!fileId) return;
        const link = document.createElement("a");
        link.href = `https://mentari.unpam.ac.id/api/file/${encodeURIComponent(fileId)}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.className = "mm-btn mm-btn-sm mm-btn-tonal";
        link.title = "Download lampiran";
        link.innerHTML = `<span class="ms" style="font-size:14px;">download</span> Lampiran`;
        link.onclick = (event) => event.stopPropagation();
        filesEl.appendChild(link);
      });
      parent.appendChild(filesEl);
    },

    toggleForumReplyForm(container) {
      const existing = container.querySelector(".forum-reply-form");
      if (existing) {
        existing.remove();
        return;
      }

      const targets = container._forumReplyTargets || [];
      const form = document.createElement("div");
      form.className = "forum-reply-form mm-card mm-card-outline";
      form.style.cssText =
        "margin-top:8px; margin-bottom:8px; padding:10px 12px; display:flex; flex-direction:column; gap:8px;";
      form.onclick = (event) => event.stopPropagation();
      form.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between;">
          <div class="mm-label" style="display:flex; align-items:center; gap:5px;">
            <span class="ms" style="font-size:14px;">edit_note</span> Tulis Balasan Forum
          </div>
          <button type="button" class="mm-icon-btn forum-reply-cancel" style="width:28px; height:28px;" title="Tutup">
            <span class="ms" style="font-size:14px;">close</span>
          </button>
        </div>
        <div class="mm-field" style="max-width:100%; position:relative;">
          <label class="mm-label">Sasaran Balasan:</label>
          <input type="hidden" class="forum-reply-parent-val" value="" />
          <button type="button" class="custom-reply-select-btn mm-select" style="text-align:left; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:11px;">
            <span class="custom-reply-select-label" style="flex:1; min-width:0; white-space:normal; word-break:break-word; overflow-wrap:anywhere;">Pilih sasaran balasan...</span>
            <span class="ms" style="font-size:14px; opacity:0.6; flex-shrink:0;">expand_more</span>
          </button>
          <div class="custom-reply-options-list mm-card mm-card-elev mm-scroll" style="display:none; position:absolute; top:100%; left:0; right:0; margin-top:4px; max-height:180px; overflow-y:auto; z-index:100; box-sizing:border-box;">
          </div>
        </div>
        <div class="mm-field">
          <label class="mm-label">Isi Pesan Balasan:</label>
          <textarea class="forum-reply-input mm-textarea" rows="3" placeholder="Tuliskan argumen / jawaban forum kamu secara lengkap..." style="font-size:11px; min-height:65px;"></textarea>
        </div>
        <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:2px;">
          <button type="button" class="mm-btn mm-btn-sm mm-btn-text forum-reply-cancel-btn">Batal</button>
          <button type="button" class="mm-btn mm-btn-sm forum-reply-send">
            <span class="ms" style="font-size:13px;">send</span> Kirim Balasan
          </button>
        </div>
      `;

      const hiddenInput = form.querySelector(".forum-reply-parent-val");
      const selectBtn = form.querySelector(".custom-reply-select-btn");
      const selectLabel = form.querySelector(".custom-reply-select-label");
      const optionsList = form.querySelector(".custom-reply-options-list");

      selectBtn.onclick = (e) => {
        e.stopPropagation();
        const willOpen = optionsList.style.display === "none";
        optionsList.style.display = willOpen ? "block" : "none";
        selectBtn.classList.toggle("mm-open", willOpen);
      };

      const selectOption = (id, text) => {
        hiddenInput.value = id;
        selectLabel.textContent = text;
        optionsList.style.display = "none";
        selectBtn.classList.remove("mm-open");
      };
      form.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && optionsList.style.display !== "none") {
          e.stopPropagation();
          optionsList.style.display = "none";
          selectBtn.classList.remove("mm-open");
          selectBtn.focus();
        }
      });

      let isFirst = true;

      targets.forEach((target) => {
        const item = document.createElement("div");
        item.className = "mm-list-item";
        item.style.cssText =
          "font-size:11px; line-height:1.4; white-space:normal; word-break:break-word; overflow-wrap:anywhere; cursor:pointer; box-sizing:border-box;";
        item.textContent = target.label;
        item.onclick = (e) => {
          e.stopPropagation();
          selectOption(target.id, target.label);
        };
        optionsList.appendChild(item);

        if (isFirst) {
          selectOption(target.id, target.label);
          isFirst = false;
        }

        target.replies
          .filter((reply) => Number(reply.reply_level) === 1)
          .forEach((reply) => {
            const replyItem = document.createElement("div");
            replyItem.className = "mm-list-item";
            replyItem.style.cssText =
              "padding-left:20px; font-size:11px; line-height:1.4; white-space:normal; word-break:break-word; overflow-wrap:anywhere; cursor:pointer; box-sizing:border-box;";
            const cleanedText = this.cleanForumText(reply.konten);
            const fullText = `↳ Reply kamu: ${cleanedText}`;
            replyItem.textContent = fullText;
            replyItem.onclick = (e) => {
              e.stopPropagation();
              selectOption(reply.id, fullText);
            };
            optionsList.appendChild(replyItem);
          });
      });

      const closeForm = () => form.remove();
      form.querySelector(".forum-reply-cancel").onclick = closeForm;
      const cancelBtn = form.querySelector(".forum-reply-cancel-btn");
      if (cancelBtn) cancelBtn.onclick = closeForm;

      form.querySelector(".forum-reply-send").onclick = async () => {
        const sendButton = form.querySelector(".forum-reply-send");
        const content = form.querySelector(".forum-reply-input").value.trim();
        const parentId = hiddenInput.value;
        const parentTarget = targets
          .flatMap((target) => [
            { id: target.id, topicId: target.topicId, judul: target.judul },
            ...target.replies.map((reply) => ({
              id: reply.id,
              topicId: reply.topicId,
              judul: target.judul,
            })),
          ])
          .find((target) => target.id === parentId);
        if (!content || !parentId || !parentTarget) {
          Utils.toast("Pilih parent dan isi jawaban terlebih dahulu");
          return;
        }

        sendButton.disabled = true;
        sendButton.innerHTML = `<span class="ms" style="display:inline-block; animation:mm-spin .9s linear infinite;">sync</span>`;
        try {
          await ApiService.submitForumReply({
            id_topic: parentTarget.topicId,
            id_post: parentId,
            konten: content,
            judul: parentTarget.judul,
          });
          Utils.successToast("Reply forum berhasil dikirim");
          form.remove();
          await this.loadTopics();
        } catch (error) {
          Utils.toast(`Reply forum gagal: ${error.message}`);
          sendButton.disabled = false;
          sendButton.innerHTML = `<span class="ms">send</span> Kirim Balasan`;
        }
      };

      container.prepend(form);
    },

    cleanForumText(value) {
      const div = document.createElement("div");
      div.innerHTML = value || "";
      return (div.textContent || "").replace(/\s+/g, " ").trim();
    },
    sanitizeForumHtml(value) {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = value || "";
      wrapper
        .querySelectorAll("script, style, iframe, object, embed")
        .forEach((element) => element.remove());
      wrapper.querySelectorAll("*").forEach((element) => {
        Array.from(element.attributes).forEach((attribute) => {
          if (attribute.name.toLowerCase().startsWith("on"))
            element.removeAttribute(attribute.name);
        });

        if (element.hasAttribute("style")) {
          const styles = document.createElement("span").style;
          styles.cssText = element.getAttribute("style");
          const keptStyles = [];
          for (let index = 0; index < styles.length; index += 1) {
            const property = styles[index];
            if (/^(color|background(?:-color|-image)?)$/i.test(property))
              continue;
            keptStyles.push(`${property}:${styles.getPropertyValue(property)}`);
          }
          if (keptStyles.length)
            element.setAttribute("style", keptStyles.join(";"));
          else element.removeAttribute("style");
        }

        element.removeAttribute("color");
        element.removeAttribute("bgcolor");

        if (element.tagName === "IMG") {
          element.removeAttribute("width");
          element.removeAttribute("height");
          element.style.width = "100%";
          element.style.height = "auto";
          element.style.maxWidth = "100%";
          element.style.boxSizing = "border-box";
        }

        if (element.tagName === "FIGURE") {
          element.style.maxWidth = "100%";
          element.style.boxSizing = "border-box";
        }
      });
      return wrapper.innerHTML;
    },
  };

  const Renderers = {
    forum(data) {
      ForumRenderer.render(data);
    },
    mhs(data) {
      const el = document.getElementById("mhs-tab-tab");
      if (!el) return;
      const all = [];
      const map = new Map();
      data.forEach((c) => {
        if (
          String(c.kode_course || "")
            .toUpperCase()
            .includes("PKKMB")
        )
          return;
        c.peserta?.forEach((p) => {
          if (p.nim && !map.has(p.nim)) {
            map.set(p.nim, p);
            all.push(p);
          }
        });
      });
      if (!all.length) {
        el.innerHTML = `
          <div class="empty-state mm-empty">
            <div class="empty-icon mm-empty-ic"><span class="ms">groups</span></div>
            <p class="empty-desc">Tidak ada data mahasiswa</p>
          </div>`;
        return;
      }
      all.sort((a, b) => a.nama_mahasiswa.localeCompare(b.nama_mahasiswa));

      const rows = all
        .map((p, i) => {
          const initial = (p.nama_mahasiswa || "?").charAt(0).toUpperCase();
          const email =
            p.alamat_email && p.alamat_email !== "-" ? p.alamat_email : null;
          const hp =
            p.no_hp_mahasiswa && p.no_hp_mahasiswa !== "-"
              ? p.no_hp_mahasiswa
              : null;
          return `
          <div class="student-row mm-list-item">
            <div class="student-avatar mm-lead">${initial}</div>
            <div class="student-info mm-list-main">
              <div class="student-name mm-list-title">${p.nama_mahasiswa}</div>
              <div class="student-meta mm-list-sub">
                <span class="student-nim">${p.nim}</span>
                ${email ? `<span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px;" title="${email}">${email}</span>` : ""}
                ${hp ? `<span>${hp}</span>` : ""}
              </div>
            </div>
            <span class="student-rank mm-chip">${i + 1}</span>
          </div>`;
        })
        .join("");

      el.innerHTML = `
        <div class="student-list-card mm-card mm-card-outline">
          <div class="student-list-header mm-card-head">
            <div class="student-list-title mm-title" style="font-size:13px;"><span class="ms">groups</span> Daftar Mahasiswa <span class="student-count mm-chip mm-chip-ok">${all.length}</span></div>
          <button id="copy-mhs" class="mm-btn mm-btn-sm mm-btn-tonal">
            <span class="ms" style="font-size:14px;">content_copy</span> Salin
          </button>
          </div>
          <div class="student-model-list mm-list mm-scroll" style="max-height:580px; overflow-y:auto;">${rows}</div>
        </div>`;

      document.getElementById("copy-mhs").onclick = (e) => {
        e.stopPropagation();
        const txt = all
          .map((p, i) => `${i + 1}. ${p.nama_mahasiswa} (${p.nim})`)
          .join("\n");
        Utils.copy(txt, "Daftar mahasiswa disalin");
      };
    },

    settings(info) {
      const el = document.getElementById("set-tab-tab");
      if (!el || !info) return;
      const currentModel =
        Utils.get(Config.STORAGE_KEYS.GEMINI_MODEL) || "gemini-2.5-flash-lite";

      el.innerHTML = `
        <div class="settings-profile mm-card mm-card-outline" style="display:flex; align-items:center; gap:12px; padding:11px 12px; margin-bottom:12px;">
          <div class="settings-avatar mm-lead" style="width:38px; height:38px;">${info.fullname.charAt(0)}</div>
          <div class="settings-profile-info mm-list-main">
            <div class="settings-label mm-title" style="font-size:13px;">${info.fullname}</div>
            <div class="settings-desc mm-list-sub">${info.username} &bull; ${info.role}</div>
          </div>
        </div>

        <div class="settings-quick-links" style="display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:12px;">
          <a href="https://aistudio.google.com/app/api-keys" target="_blank" class="mm-btn mm-btn-sm mm-btn-outline" style="text-decoration:none;">
            <span class="ms" style="font-size:16px;">vpn_key</span> Ambil API Key
          </a>
          <a href="https://aistudio.google.com/app/rate-limit" target="_blank" class="mm-btn mm-btn-sm mm-btn-outline" style="text-decoration:none;">
            <span class="ms" style="font-size:16px;">speed</span> Rate Limit
          </a>
        </div>

        <div class="settings-section mm-card mm-card-outline" style="margin-bottom:12px;">
          <div class="settings-section-header mm-card-head"><span class="settings-section-title mm-title" style="font-size:13px; display:flex; align-items:center; gap:7px;"><span class="ms">timer</span> Auto Finish Quiz</span></div>
          <div class="settings-row mm-card-body" style="display:flex; flex-direction:column; align-items:stretch; gap:8px;">
            <div class="settings-row-main" style="width:100%;">
              <div class="settings-row-title mm-label"><span class="ms">hourglass_top</span> Waktu Penyelesaian Quiz (Menit)</div>
              <div class="settings-row-desc mm-hint" style="margin-top:4px; line-height:1.4;">
                Durasi Pengerjaan Quiz, Contoh: <strong>3.21</strong> (3 mnt 21 dtk), atau <strong>0</strong> untuk langsung selesai.
              </div>
            </div>
            <div style="display:flex; align-items:center; gap:8px; width:100%; margin-top:4px;">
              <input type="text" id="set-quiz-delay" class="mm-input" placeholder="0 (Default)" value="${Utils.get(Config.STORAGE_KEYS.QUIZ_DELAY) || "0"}"
                style="flex:1; font-family:monospace;" />
              <button id="save-quiz-delay" class="mm-btn mm-btn-sm" style="flex-shrink:0;">Simpan</button>
            </div>
          </div>
        </div>

        <div class="settings-section mm-card mm-card-outline" style="margin-bottom:12px;">
          <div class="settings-section-header mm-card-head"><span class="settings-section-title mm-title" style="font-size:13px; display:flex; align-items:center; gap:7px;"><span class="ms">hub</span> AI Provider (OMP / Gemini)</span></div>
          <div class="mm-card-body mm-field">
            <label class="settings-section-label mm-label" for="ai-provider-split">Provider</label>
            <div id="ai-provider-split"></div>
            <input id="omp-endpoint" class="mm-input" placeholder="http://127.0.0.1:4000/v1" style="font-family:monospace;" />
            <input id="omp-token" class="mm-input" type="password" placeholder="Gateway token (~/.omp/auth-gateway.token, kosong bila --no-auth)" style="font-family:monospace;" />
            <input id="omp-model" class="mm-input" placeholder="opencode-zen/muse-spark-1.3-contributor-free" style="font-family:monospace;" />
            <div style="display:flex; gap:8px; align-items:center;">
              <button id="check-omp-btn" class="mm-btn mm-btn-sm mm-btn-tonal" style="flex-shrink:0;">Cek Gateway</button>
              <span id="omp-status" class="mm-hint">-</span>
            </div>
            <p class="settings-desc mm-hint" style="margin:0;">Jalankan <code>omp auth-gateway serve</code> agar provider OMP aktif.</p>
          </div>
        </div>

        <div class="settings-section mm-card mm-card-outline" style="margin-bottom:12px;">
          <div class="settings-section-header mm-card-head">
            <span class="settings-section-title mm-title" style="font-size:13px; display:flex; align-items:center; gap:7px;"><span class="ms">palette</span> Tema Warna</span>
          </div>
          <div class="mm-card-body mm-field">
            <label class="settings-section-label mm-label" for="mm-theme-split">Preset warna popup + pet stage</label>
            <div id="mm-theme-split"></div>
            <p class="settings-desc mm-hint" style="margin:0;">Mewarnai ulang popup ini, quiz helper, presensi, survei, dan dialog API key.</p>
          </div>
        </div>

        <div class="settings-section mm-card mm-card-outline" style="margin-bottom:12px;">
          <div class="settings-section-header mm-card-head">
            <span class="settings-section-title mm-title" style="font-size:13px; display:flex; align-items:center; gap:7px;"><span class="ms">auto_awesome</span> Model Gemini</span>
            <span id="set-model-status" class="mm-hint">Memuat model...</span>
          </div>
          <div id="set-model-list" class="settings-model-list mm-list mm-scroll" style="max-height:200px; overflow-y:auto;">
              <div style="text-align:center; padding:18px; opacity:0.4; font-size:11px;">Memuat daftar model...</div>
          </div>
        </div>

        <button id="set-api-btn" class="mm-btn" style="width:100%; margin-bottom:10px;">
          <span class="ms" style="font-size:16px;">vpn_key</span> Update API Key
        </button>
        <div class="settings-disclaimer mm-card" style="padding:8px 10px; margin-bottom:12px; border-left:3px solid var(--mm-primary);">
          <div style="display:flex; align-items:center; gap:5px; margin-bottom:3px;">
            <span class="ms" style="font-size:13px;">warning</span>
            <span class="mm-eyebrow" style="font-size:10px;">Peringatan</span>
          </div>
          <p class="settings-desc mm-hint" style="line-height:1.5; margin:0;">Jawaban AI tidak selalu 100% akurat. Ganti model jika terjadi error. Selalu verifikasi jawaban secara mandiri.</p>
        </div>

        <!-- Footer -->
        <div class="settings-footer mm-hint" style="display:flex; justify-content:space-between; align-items:center; font-size:10px;">
          <span>v${APP_VERSION} &bull; by <a href="https://github.com/Lukman754" style="color:inherit;" target="_blank">Lukman754</a></span>
          <button id="set-update-btn" class="mm-btn mm-btn-sm mm-btn-text" style="font-size:inherit;">Cek Update</button>
        </div>
      `;

      document.getElementById("save-quiz-delay").onclick = () => {
        const val = document.getElementById("set-quiz-delay").value.trim();
        Utils.save(Config.STORAGE_KEYS.QUIZ_DELAY, val);
        Utils.toast(
          "Waktu penundaan quiz disimpan: " + (val || "0") + " menit",
        );
      };

      // M3 color theme preset (split button: leading = current, trailing = menu)
      const themeHost = document.getElementById("mm-theme-split");
      if (themeHost && window.MentariM3 && window.MentariM3.createSplitButton) {
        themeHost.innerHTML = "";
        const themeSplit = window.MentariM3.createSplitButton({
          id: "mm-theme-split-btn",
          color: "tonal",
          size: "sm",
          leadIcon: "palette",
          options: window.MentariM3.themeOptions(),
          value: window.MentariM3.getTheme(),
          onPick: function (v, opt) {
            window.MentariM3.setTheme(v);
            Utils.toast("Tema warna: " + (opt ? opt.label : v));
          },
        });
        themeHost.appendChild(themeSplit.root);
      }
      document.getElementById("set-api-btn").onclick = (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("mentari-update-api-key"));
      };
      document.getElementById("set-update-btn").onclick = (e) => {
        e.stopPropagation();
        Utils.toast("Adminnya dah lulus, ga bakal update lagi!");
      };

      // OMP provider controls
      if (window.mentariAI) {
        const endpointInput = document.getElementById("omp-endpoint");
        const tokenInput = document.getElementById("omp-token");
        const modelInput = document.getElementById("omp-model");
        const statusEl = document.getElementById("omp-status");
        const checkBtn = document.getElementById("check-omp-btn");
        const providerHost = document.getElementById("ai-provider-split");
        if (providerHost && window.MentariM3 && window.MentariM3.createSplitButton) {
          providerHost.innerHTML = "";
          const providerSplit = window.MentariM3.createSplitButton({
            id: "ai-provider-split-btn",
            color: "tonal",
            size: "sm",
            leadIcon: "hub",
            value: window.mentariAI.getProvider(),
            options: [
              { value: "omp", label: "OMP (muse-spark via gateway)", icon: "hub" },
              { value: "gemini", label: "Gemini (API key)", icon: "auto_awesome" },
            ],
            onPick: function (v) { window.mentariAI.setProvider(v); },
          });
          providerHost.appendChild(providerSplit.root);
        }
        if (endpointInput) {
          endpointInput.value = window.mentariAI.getOmpEndpoint();
          endpointInput.onchange = function () { window.mentariAI.setOmpEndpoint(this.value); };
        }
        if (tokenInput) {
          tokenInput.value = window.mentariAI.getOmpToken();
          tokenInput.onchange = function () { window.mentariAI.setOmpToken(this.value.trim()); };
        }
        if (modelInput) {
          modelInput.value = window.mentariAI.getOmpModel();
          modelInput.onchange = function () { window.mentariAI.setOmpModel(this.value); };
        }
        if (checkBtn) {
          checkBtn.onclick = async function () {
            if (statusEl) statusEl.textContent = "mengecek...";
            const res = await window.mentariAI.checkOmpGateway(endpointInput && endpointInput.value);
            if (statusEl) {
              statusEl.textContent = res.ok ? "terhubung (" + res.models.length + " model)" : "gagal: " + res.message;
            }
          };
        }
      }

      // Load model list from Gemini API
      this._loadModelList(currentModel);
    },

    async _loadModelList(currentModel) {
      const listEl = document.getElementById("set-model-list");
      const statusEl = document.getElementById("set-model-status");
      if (!listEl) return;

      // Get API key
      let rawKey = localStorage.getItem("geminiApiKey");
      let apiKey = rawKey
        ? (() => {
            try {
              return atob(rawKey);
            } catch (e) {
              return rawKey;
            }
          })()
        : null;

      if (!apiKey) {
        listEl.innerHTML = `<div style="text-align:center; padding:16px; opacity:0.4; font-size:11px;">API Key belum diset. Klik "Update API Key" dulu.</div>`;
        if (statusEl) statusEl.textContent = "";
        return;
      }

      // Excluded non-text model keywords
      const excluded = [
        "image",
        "tts",
        "transcribe",
        "embedding",
        "audio",
        "veo",
        "lyria",
        "robotics",
        "computer-use",
        "gemini-2",
        "gemini-flash",
      ];

      // Fetch from API
      const data = await ApiService.fetchGeminiModels(apiKey);
      if (!data || !data.models) {
        listEl.innerHTML = `<div style="text-align:center; padding:16px; color:#f87171; font-size:11px;">Gagal memuat model. Cek API Key.</div>`;
        if (statusEl) statusEl.textContent = "Error";
        return;
      }

      // Filter: only generateContent capable, exclude non-text
      const models = data.models.filter((m) => {
        const name = m.name.toLowerCase();
        if (!name.includes("-flash")) return false;
        if (excluded.some((kw) => name.includes(kw))) return false;
        if (!m.supportedGenerationMethods?.includes("generateContent"))
          return false;
        return true;
      });

      if (statusEl) statusEl.textContent = `${models.length} model tersedia`;

      if (!models.length) {
        listEl.innerHTML = `<div style="text-align:center; padding:16px; opacity:0.4; font-size:11px;">Tidak ada model yang tersedia.</div>`;
        return;
      }

      // Load limit stats
      const stats = Utils.get(Config.STORAGE_KEYS.GEMINI_MODEL_STATS) || {};

      listEl.innerHTML = models
        .map((m) => {
          const modelId = m.name.replace("models/", "");
          const isActive = currentModel === modelId;
          const modelStats = stats[modelId] || {};
          const isLimited = modelStats.limited === true;

          return `
          <div class="mentari-model-item mm-list-item ${isActive ? "is-active mm-chip-ok" : ""} ${isLimited ? "is-limited" : ""}" data-model="${modelId}">
            <div class="model-state-dot" style="width:8px; height:8px; border-radius:50%; flex-shrink:0; background:${isActive ? "var(--mm-primary)" : isLimited ? "var(--mm-error)" : "var(--mm-outline)"};"></div>
            <div class="mm-list-main">
              <div class="model-title mm-list-title">
                ${m.displayName}
                ${isLimited ? "<span class='model-limit-badge mm-chip mm-chip-err' style='margin-left:6px;'>LIMIT</span>" : ""}
              </div>
              <div class="model-id-sub mm-list-sub">models/${modelId}</div>
            </div>
            ${isActive ? `<span class="ms" style="font-size:16px; flex-shrink:0;">check_circle</span>` : ""}
          </div>
        `;
        })
        .join("");

      // Click to select model
      listEl.querySelectorAll(".mentari-model-item").forEach((item) => {
        item.onclick = () => {
          const val = item.dataset.model;
          Utils.save(Config.STORAGE_KEYS.GEMINI_MODEL, val);
          Utils.toast("Model diperbarui: " + val);
          setTimeout(() => location.reload(), 600);
        };
      });

      // Scroll active model into view
      const activeEl = listEl.querySelector(`[data-model="${currentModel}"]`);
      if (activeEl) activeEl.scrollIntoView({ block: "nearest" });
    },
  };

  const App = {
    async init() {
      Utils.injectMaterialIcons();
      UIRenderer.injectStyles();
      UIRenderer.createPopup();
      this.intercept();

      // Cek apakah token tersimpan masih sesuai dengan sesi aktif Mentari
      const savedToken = Utils.get(Config.STORAGE_KEYS.AUTH_TOKEN);
      const liveToken = Utils.findTokenFromStorage(); // baca dari localStorage["access"] dll

      // Jika ada token aktif dari Mentari, decode untuk perbandingan
      const savedInfo = savedToken ? Utils.decodeToken(savedToken) : null;
      const liveInfo = liveToken ? Utils.decodeToken(liveToken) : null;

      // Jika user yang aktif berbeda → hapus cache akun lama
      if (
        savedInfo &&
        liveInfo &&
        (savedInfo.userId !== liveInfo.userId ||
          savedInfo.username !== liveInfo.username)
      ) {
        Utils.remove(Config.STORAGE_KEYS.AUTH_TOKEN);
        Utils.remove(Config.STORAGE_KEYS.USER_INFO);
        Utils.remove(Config.STORAGE_KEYS.COURSE_DATA);
      }

      const t = liveToken || savedToken;
      if (t) this.handleToken(t);
      else this.render();
      window.addEventListener("mentari-toggle-popup", () =>
        window.toggleTokenPopup(),
      );
      window.addEventListener("resize", () => UIRenderer.updatePosition());

      setInterval(() => Utils.applyTheme(), 1000);
    },
    intercept() {
      const self = this;
      const origSetHeader = XMLHttpRequest.prototype.setRequestHeader;
      XMLHttpRequest.prototype.setRequestHeader = function (header, value) {
        if (!this._requestHeaders) this._requestHeaders = {};
        this._requestHeaders[header] = value;
        if (
          header.toLowerCase() === "authorization" &&
          value.includes("Bearer ")
        )
          self.handleToken(value);
        return origSetHeader.apply(this, arguments);
      };
      const origXHR = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function () {
        this.addEventListener("load", function () {
          const auth =
            this.getResponseHeader?.("Authorization") ||
            this._requestHeaders?.["Authorization"];
          if (auth) self.handleToken(auth);
        });
        return origXHR.apply(this, arguments);
      };
      const origFetch = window.fetch;
      window.fetch = async function (resource, init) {
        if (init?.headers) {
          const headers = new Headers(init.headers);
          if (headers.get("Authorization"))
            self.handleToken(headers.get("Authorization"));
        }
        const res = await origFetch.apply(this, arguments);
        if (res.headers.get("Authorization"))
          self.handleToken(res.headers.get("Authorization"));
        return res;
      };
    },
    handleToken(token) {
      if (token.startsWith("Bearer ")) token = token.substring(7);
      const info = Utils.decodeToken(token);
      if (!info || State.authToken === token) return;
      const isNewUser =
        !State.userInfo ||
        State.userInfo.username !== info.username ||
        State.userInfo.userId !== info.userId;
      State.authToken = token;
      State.userInfo = info;
      Utils.save(Config.STORAGE_KEYS.AUTH_TOKEN, token);
      Utils.save(Config.STORAGE_KEYS.USER_INFO, info);
      if (isNewUser) {
        Utils.remove(Config.STORAGE_KEYS.COURSE_DATA);
        State.courseDataList = [];
      }
      Renderers.settings(info);
      this.refreshData(isNewUser);
    },
    async refreshData(force = false) {
      if (State.isFetching || !State.authToken) return;
      const forumUiState = force ? this.captureForumUiState() : null;
      if (!force) {
        const cached = Utils.get(Config.STORAGE_KEYS.COURSE_DATA);
        if (cached) {
          State.courseDataList = cached;
          this.render();
          return;
        }
      }
      try {
        State.isFetching = true;
        UIRenderer.setLoading(true);
        const list = await ApiService.fetchCourses();
        State.courseDataList = [];
        // Fetch all course details in parallel
        const courseDetails = await Promise.all(
          (list.data || []).map(async (c) => {
            const det = await ApiService.fetchCourseDetails(c.kode_course);
            return det ? { course: c, det } : null;
          }),
        );

        for (const item of courseDetails) {
          if (!item) continue;
          State.courseDataList.push(item.det);
        }

        Utils.save(Config.STORAGE_KEYS.COURSE_DATA, State.courseDataList);
        this.render();
        this.restoreForumUiState(forumUiState);
      } catch (e) {
      } finally {
        State.isFetching = false;
        UIRenderer.setLoading(false);
      }
    },
    captureForumUiState() {
      const forum = document.getElementById("forum-tab-tab");
      if (!forum) return null;

      const forumRect = forum.getBoundingClientRect();
      const anchor = Array.from(forum.querySelectorAll(".section-header"))
        .map((header) => ({
          header,
          rect: header.getBoundingClientRect(),
        }))
        .find(
          ({ rect }) =>
            rect.bottom > forumRect.top && rect.top < forumRect.bottom,
        );

      return {
        scrollTop: forum.scrollTop,
        anchor: anchor
          ? {
              id: anchor.header.dataset.target,
              offset: anchor.rect.top - forumRect.top,
            }
          : null,
        openSections: Array.from(
          forum.querySelectorAll(".section-content.active"),
        ).map((section) => ({
          id: section.id,
          scrollTop: section.scrollTop,
        })),
      };
    },
    restoreForumUiState(uiState) {
      if (!uiState) return;
      const forum = document.getElementById("forum-tab-tab");
      if (!forum) return;

      uiState.openSections.forEach(({ id, scrollTop }) => {
        const section = document.getElementById(id);
        if (!section) return;
        section.classList.add("active");
        section.style.display = "flex";
        section.style.flexDirection = "column";
        section
          .closest(".section-card")
          ?.querySelector(".section-toggle")
          ?.classList.add("active");
        section.scrollTop = scrollTop;
      });

      const restoreScroll = () => {
        if (uiState.anchor?.id) {
          const section = document.getElementById(uiState.anchor.id);
          const header = section
            ?.closest(".section-card")
            ?.querySelector(
              `.section-header[data-target="${uiState.anchor.id}"]`,
            );
          if (header) {
            const forumRect = forum.getBoundingClientRect();
            const headerRect = header.getBoundingClientRect();
            forum.scrollTop +=
              headerRect.top - forumRect.top - uiState.anchor.offset;
            return;
          }
        }
        forum.scrollTop = uiState.scrollTop;
      };

      requestAnimationFrame(() => requestAnimationFrame(restoreScroll));
    },
    render() {
      Renderers.forum(State.courseDataList);
      Renderers.mhs(State.courseDataList);
      if (State.userInfo) Renderers.settings(State.userInfo);
    },
  };

  window.toggleTokenPopup = () => {
    let p = document.getElementById("token-runner-popup");
    if (!p) {
      UIRenderer.injectStyles();
      UIRenderer.createPopup();
      p = document.getElementById("token-runner-popup");
    }
    if (!p) return;
    if (window.MentariM3) window.MentariM3.applyTheme(p);
    if (!p.classList.contains("active")) {
      UIRenderer.updatePosition();
      p.classList.add("active");
      p.style.visibility = "visible";
      p.style.opacity = "1";
      p.style.transform = "translateY(0) scale(1)";
      p.style.pointerEvents = "auto";
      const close = (e) => {
        if (
          !p.contains(e.target) &&
          !document
            .getElementById("mentari-header-toggle")
            ?.contains(e.target) &&
          !e.target.closest(".mm-snackbar")
        ) {
          p.classList.remove("active");
          p.style.visibility = "hidden";
          p.style.opacity = "0";
          p.style.transform = "translateY(-15px) scale(0.95)";
          p.style.pointerEvents = "none";
          document.removeEventListener("mousedown", close);
        }
      };
      setTimeout(() => {
        document.addEventListener("mousedown", close);
      }, 50);
    } else {
      p.classList.remove("active");
      p.style.visibility = "hidden";
      p.style.opacity = "0";
      p.style.transform = "translateY(-15px) scale(0.95)";
      p.style.pointerEvents = "none";
    }
  };

  window.addEventListener("mentari-toggle-popup", () => {
    if (typeof window.toggleTokenPopup === "function") {
      window.toggleTokenPopup();
    }
  });
  document.addEventListener("mentari-toggle-popup", () => {
    if (typeof window.toggleTokenPopup === "function") {
      window.toggleTokenPopup();
    }
  });

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", () => App.init());
  else App.init();
})();
