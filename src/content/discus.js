/**
 * MENTARI MOD - Discus Helper Module
 * Refactored for modularity and code efficiency.
 */

(function () {
  if (window.MentariM3) window.MentariM3.ensure();
  // Aturan bahasa global, dikirim sebagai system instruction ke semua provider
  // (omp + gemini) sehingga model kecil pun tidak keluar dari Bahasa Indonesia.
  const SYSTEM_PROMPT =
    "Kamu adalah asisten akademik untuk mahasiswa Universitas Pamungkas (UNPAM). " +
    "WAJIB menulis seluruh output dalam Bahasa Indonesia yang natural dan lugas. " +
    "Jangan mencampur bahasa lain: jawaban wajib satu bahasa saja, tanpa ada kalimat "
    + "bahasa Inggris atau bahasa lain di tengah jalan. Jangan pernah memuat penanda teknis, "
    + "komentar, atau potongan teks yang bukan bagian dari jawaban (misalnya kalimat yang "
    + "berisi 'included_in_the_paragraphs' atau sejenisnya).";

  // Cacat yang sudah teramati pada hasil model:
  // 1 huruf non-Latin (Mandarin/kana/hangul/Cyrillic) yang bocor di antara kalimat Latin,
  // 2 penanda kontaminasi dataset/eval ("..._included_in_the_paragraphs_for-easy-evaluation"),
  // 3 kata yang hurufnya bercampur ("PengЕNCIAan"), 4 kalimat utuh yang beralih ke bahasa Inggris.
  const NON_LATIN_CLASS =
    "\\p{Script=Han}\\p{Script=Hiragana}\\p{Script=Katakana}\\p{Script=Hangul}\\p{Script=Bopomofo}"
    + "\\p{Script=Cyrillic}\\p{Script=Greek}\\p{Script=Arabic}\\p{Script=Hebrew}\\p{Script=Thai}"
    + "\\p{Script=Devanagari}\\u3000-\\u303F\\uFF01-\\uFF65";
  const NON_LATIN_RE = new RegExp("[" + NON_LATIN_CLASS + "]", "gu"); // global, untuk match/replace
  const NON_LATIN_ONE = new RegExp("[" + NON_LATIN_CLASS + "]", "u"); // non-global, aman untuk .test
  // Penanda kontaminasi + sisa pemenggal di sekitarnya ("menyampaikan-<marker>./").
  const MARKER_RE =
    /[-_/]?[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*[_ -]included[_ -]in[_ -]the[_ -](?:paragraphs?|texts?)(?:[_ -]for[_ -]easy[_ -]evaluation)?[-_/.]*/gi;
  // Sisa pemenggal dari token yang terpotong pengaman ("not_gl", "melaporkan-n").
  const FRAGMENT_RE = /\b([A-Za-z]{3,})_[A-Za-z]{1,2}\b/g;
  // Penanda khas bahasa Inggris; partikel Indonesia ("di", "dan", "yang") sengaja tidak masuk.
  const EN_MARKERS = new Set([
    "the", "of", "to", "in", "on", "at", "is", "are", "was", "were", "be", "been", "that",
    "this", "these", "those", "with", "for", "not", "they", "them", "their", "there", "which",
    "from", "has", "have", "had", "would", "could", "should", "about", "into", "over", "such",
    "than", "then", "when", "while", "its", "our", "your", "but", "also", "more", "most",
    "some", "any", "all", "must", "shall", "can", "will", "may", "does", "did", "who", "why",
    "how", "we", "us", "an", "as", "if", "no", "very", "just", "like", "keep", "use", "used",
    "same", "each", "every", "other", "another", "based",
  ]);
  const FOREIGN_RETRY_RATIO = 0.01; // >=1% karakter tercemar -> generate ulang.
  const EN_SENTENCE_RATIO = 0.2;    // >=20% kata penanda Inggris di satu kalimat.
  const FOREIGN_TOKEN_RATIO = 0.02; // >=2% kata asing sisipan -> generate ulang.
  const Config = {
    GEMINI: {
      MODEL: "gemini-2.5-flash-lite",
      ENDPOINT: "https://generativelanguage.googleapis.com/v1beta/models",
    },
    STORAGE_KEYS: {
      API_KEY: "geminiApiKey",
    },
    PROMPTS: {
      DEFAULT: (content) => `Bacalah diskusi berikut, lalu tuliskan jawaban atau rangkuman yang natural, JANGAN GUNAKAN HURUF TEBAL JANGAN GUNAKAN HURUF TEBAL JANGAN BOLD JANGAN PAKE TANDA BINTANG PLAIN TEXT YG BERSIH. dan mudah dipahami seperti jawaban manusia. jangan gunakan tanda seperti (*/#) atau yg lainnya, hanya plain text yg bersih jangan gunakan bold huruf tebal, italic, underline. dan langsung jawab tanpa mengucapkan (berikut jawabannya) atau sejenisnya. Gunakan bahasa yang natural seperti manusia. Berikan penjelasan yang lengkap dan memadai sesuai konteks diskusi, jangan dibatasi jika membutuhkan penjelasan panjang. Jangan ucapkan "Tentu, ini rangkumannya:" atau semacamnya, langsung jawab saja. Jika terdapat soal atau pertanyaan yang berhubungan dengan bahasa pemrograman atau coding, berikan contoh singkat code nya.
ATURAN MENJAWAB PERTANYAAN BERNOMOR: bila isian diskusi memuat pertanyaan bernomor, wajib jawab setiap nomor satu per satu secara berurutan memakai nomor yang sama persis seperti di soal (1, 2, 3, 4, 5), dan tidak ada nomor yang boleh dilewati. Setiap nomor ditulis sebagai satu paragraf jawaban yang berdiri sendiri di baris baru, diawali "nomor. ". Jangan menggabungkan dua pertanyaan dalam satu nomor, jangan menggabung beberapa nomor jadi satu paragraf, jangan mengulang nomor, jangan menambah nomor baru, dan jangan berhenti sebelum nomor terakhir selesai. Jangan memakai penomoran lain di dalam jawaban, jangan menulis kurung kurawal, kurung siku, JSON, atau blok kode apa pun.
Jawaban atau pertanyaan tanpa nomor, tulis dalam bentuk paragraf mengalir.
\n${content}\n\nJawaban yang natural dan mengalir:`,
      // Dipakai saat hasil pertama tercemar: huruf non-Latin, kalimat/kata yang bergeser
      // ke bahasa Inggris, penanda kontaminasi, kata terangkai, atau jawaban terpotong.
      REPAIR: (badText, hints) => `Jawaban di bawah ini rusak dan tidak bisa dipakai. Kerusakan yang harus diperbaiki:
1. Ada huruf non-Latin (Mandarin/Hanzi, kana, hangul, Cyrillic) di tengah kalimat Latin.
2. Sebagian kalimat tiba-tiba berubah menjadi bahasa Inggris di tengah jawaban Bahasa Indonesia.
3. Ada kata atau potongan kata asing yang disisipkan di tengah kalimat Bahasa Indonesia sehingga kalimat jadi tidak masuk akal, misalnya "sehingga tidak Tanel to contribute" atau "denganStrategi such as". Kata-kata itu bukan bagian dari jawaban, hapus atau ganti dengan padanan Bahasa Indonesia yang benar.
4. Ada potongan teks teknis atau penanda yang bukan bagian dari jawaban, misalnya potongan yang mengandung kata "included_in_the_paragraphs" atau "for_easy_evaluation".
5. Jawaban berhenti di tengah kalimat dan belum selesai.
Tulis ulang dari awal seluruh isi di bawah ini menjadi jawaban dengan isi yang sama persis, dalam satu bahasa saja: Bahasa Indonesia huruf Latin saja. Periksa tiap kalimat satu per satu: hanya boleh berisi kata-kata Bahasa Indonesia (istilah teknis boleh ditulis dalam huruf Latin), tidak boleh ada kata Inggris atau kata asing yang disisipkan, dan jarak antar kata harus benar. Terjemahkan setiap kalimat bahasa Inggris ke Bahasa Indonesia, buang seluruh huruf non-Latin, kata asing, dan penanda teknis tersebut, serta selesaikan kalimat yang terpotong sampai kalimatnya utuh. Jangan mengutip sumber, jangan menambah bagian baru, jangan memakai penomoran lain atau bullet, dan jangan membuka dengan pembuka. Jawab langsung dan berhenti setelah kalimat terakhir selesai.${hints && hints.length ? `\n\nPotongan yang terdeteksi rusak, jangan dipakai ulang persis: ${hints.join(" | ")}` : ""}\n\nTeks yang perlu ditulis ulang:\n${badText}\n\nJawaban dalam Bahasa Indonesia:`,
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
      QUESTIONS: (content) => `Bacalah diskusi berikut, lalu buatkan beberapa saran pertanyaan yang natural, relevan, dan menarik untuk diajukan pada diskusi ini. Hindari bullet, penomoran, huruf tebal, italic, underline dan buat seolah-olah pertanyaan dari manusia. Pisahkan setiap pertanyaan dengan baris baru. Pastikan setiap saran pertanyaan berdiri sendiri, tidak saling terhubung, dan tidak menggunakan kata penghubung seperti 'selain itu', 'terus', 'dan' di awal kalimat. WAJIB setiap pertanyaan ditulis dalam Bahasa Indonesia huruf Latin saja, DILARANG memakai huruf Mandarin/Hanzi, kana, hangul, atau aksara lain, dan DILARANG memakai bahasa selain Bahasa Indonesia.\n\n${content}\n\nSaran pertanyaan:`,
      // Dipakai saat jawaban tidak memuat semua pertanyaan bernomor (nomor dilewati/digabung).
      COMPLETE: (partial, numbers, questions) => `Jawaban di bawah ini belum lengkap karena tidak menjawab semua pertanyaan bernomor. Pertanyaan yang wajib dijawab bernomor: ${numbers.join(", ")}.
Tulis ulang jawaban lengkap dari awal: satu paragraf bernomor untuk setiap nomor, berurutan dari ${numbers[0]} sampai ${numbers[numbers.length - 1]}, memakai nomor yang sama persis, satu nomor satu baris, tidak ada nomor yang dilewati, digabung, atau diulang, dan jangan berhenti sebelum nomor terakhir selesai. Isi jawaban harus menjawab pertanyaan dengan nomor tersebut, bukan merangkum. Jawab dalam Bahasa Indonesia huruf Latin saja, tanpa kurung kurawal, JSON, penanda teknis, atau bullet.

${questions ? `Daftar pertanyaan:\n${questions}\n\n` : ""}Jawaban parsial yang sudah ada (jangan ditulis ulang terpisah, gunakan sebagai bahan):
${partial}

Jawaban lengkap:`,
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
    // Porsi karakter tercemar pada hasil model (huruf non-Latin, penanda kontaminasi,
    // kata campuran huruf), diukur per karakter agar penanda panjang ikut terhitung.
    foreignRatio(text) {
      if (!text) return 0;
      const solid = text.replace(/\s/g, "").length;
      if (!solid) return 0;
      const nonLatin = (text.match(NON_LATIN_RE) || []).length;
      const markers = (text.match(MARKER_RE) || []).reduce((n, m) => n + m.length, 0);
      const mixed = this.mixedScriptWords(text).reduce((n, w) => n + w.length, 0);
      return (nonLatin + markers + mixed) / solid;
    },
    // Kata yang huruf Latin dan non-Latin-nya bercampur, mis. "PengЕNCIAan".
    mixedScriptWords(text) {
      return (text.match(/[^\s]+/g) || []).filter(
        (w) => NON_LATIN_ONE.test(w) && /[A-Za-z]/.test(w)
      );
    },
    // Kalimat yang bergeser ke bahasa Inggris di tengah jawaban Bahasa Indonesia.
    isEnglishSentence(sentence) {
      const words = sentence.toLowerCase().match(/[a-z']+/g);
      if (!words || words.length < 6) return false;
      const markers = words.filter((w) => EN_MARKERS.has(w)).length;
      return markers >= 3 && markers / words.length >= EN_SENTENCE_RATIO;
    },
    // Porsi kalimat yang tergeser ke bahasa Inggris.
    englishRatio(text) {
      const sentences = (text || "").split(/(?<=[.!?])\s+|\n+/).filter((s) => s.trim());
      if (!sentences.length) return 0;
      return sentences.filter((s) => this.isEnglishSentence(s)).length / sentences.length;
    },
    // Pecahan kata asing yang disisipkan ke dalam kalimat Bahasa Indonesia, mis.
    // "sehingga tidak Tanel to contribute constructively" atau "Komunikasi asertif recognizes that".
    // Berbeda dengan englishRatio, ini menangkap kata asing yang dikemas di dalam
    // kalimat Indonesia, bukan subkalimat Inggris utuh. Dihitung per nomor jawaban
    // (bukan per seluruh teks) supaya jawaban panjang yang bersih tidak meredupkan
    // kecacatan pada satu nomor saja.
    answerSegments(text) {
      const lines = (text || "").split("\n");
      const starts = lines
        .map((line, i) => (/^[ \t]*\d{1,2}[.)][ \t]+\S/.test(line) ? i : -1))
        .filter((i) => i >= 0);
      if (starts.length < 2) return [(text || "").trim()];
      return starts.map((from, k) =>
        lines.slice(from, k + 1 < starts.length ? starts[k + 1] : lines.length).join(" ").trim()
      );
    },
    // Segmen yang isinya kode program: kata Inggris di dalamnya (import, return, in)
    // memang wajar, jadi tidak dipakai sebagai sinyal kecacatan bahasa.
    looksLikeCode(segment) {
      const lines = (segment || "").split("\n").filter((l) => l.trim());
      if (!lines.length) return false;
      const code = lines.filter((l) =>
        /^[ \t]*(?:import|from|def|class|return|for|while|if|elif|else|try|catch|except|finally|print|const|let|var|function|public|private|package|SELECT|INSERT|UPDATE|DELETE)\b|=>|\(\)|\{\s*\}|\}\s*;?\s*$/i.test(l)
      ).length;
      return code / lines.length >= 0.3;
    },
    englishTokenRatio(text) {
      const segments = this.answerSegments(text)
        .filter((seg) => !this.looksLikeCode(seg))
        .map((seg) => seg.toLowerCase().match(/[a-z][a-z'-]*/g) || [])
        .filter((words) => words.length >= 20);
      if (!segments.length) return 0;
      return Math.max(
        ...segments.map((words) => words.filter((w) => EN_MARKERS.has(w)).length / words.length)
      );
    },
    // Potongan kata asing yang terangkai ke kata Indonesia, mis. "denganStrategi",
    // "yangValues", "needsfodohedral". Penyisipan spasi lebih aman daripada menebaknya.
    splitGluedWords(text) {
      return (text || "").replace(
        /(^|[^A-Za-z])(yang|dan|untuk|dari|dengan|adalah|tidak|akan|pada|dalam|karena|oleh)([A-Z][a-z]{2,})/g,
        "$1$2 $3"
      );
    },
    // Jawaban yang berhenti di tengah kalimat, baik di akhir teks maupun di salah
    // satu nomor bernomor, mis. "...terhadap anggota kelompok yang".
    looksTruncated(text) {
      const segments = this.answerSegments(text).filter((s) => s.trim() && !this.looksLikeCode(s));
      if (!segments.length) return false;
      return segments.some((seg) => !/[.!?:;"'”)\]]$/u.test(seg.trim()));
    },
    // Hasil perlu ditulis ulang oleh model?
    needsRepair(text) {
      return (
        this.foreignRatio(text) > FOREIGN_RETRY_RATIO ||
        this.englishRatio(text) > 0 ||
        this.englishTokenRatio(text) > FOREIGN_TOKEN_RATIO ||
        this.looksTruncated(text)
      );
    },
    // Potongan kalimat sekitar kata asing sisipan, dikirim ke prompt REPAIR
    // supaya model tahu bagian mana yang tidak boleh dipakai ulang.
    corruptedFragments(text) {
      const words = (text || "").split(/\s+/).filter(Boolean);
      const hits = [];
      for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase().replace(/[^a-z'-]/g, "");
        if (word.length < 2 || !EN_MARKERS.has(word)) continue;
        hits.push(words.slice(Math.max(0, i - 3), i + 4).join(" ").replace(/[.,;:!?]+$/, ""));
      }
      return [...new Set(hits)].slice(0, 6);
    },
    // Nomor pertanyaan bernomor pada diskusi, mis. "1. Bagaimana ...?" -> [1, 2, 3, 4, 5].
    questionNumbers(text) {
      const found = [];
      for (const line of (text || "").split("\n")) {
        const m = line.match(/^[ \t]*(\d{1,2})[.)][ \t]+(.+?)[ \t]*$/);
        if (!m) continue;
        const body = m[2];
        const isQuestion =
          body.endsWith("?") || /\b(apa|apakah|bagaimana|mengapa|kenapa|kapan|siapa|mana|dimana|bolehkah|toleransi)\b/i.test(body);
        if (isQuestion) found.push(parseInt(m[1], 10));
      }
      // Hanya urutan naik yang dianggap daftar pertanyaan, bukan daftar acak.
      const ascending = found.every((n, i) => i === 0 || n > found[i - 1]);
      return ascending ? found : [];
    },
    // Nomor jawaban yang ada di awal baris, mis. "3. Contoh argumen..." -> [3].
    numberedItems(text) {
      return ((text || "").match(/^[ \t]*\d{1,2}[.)][ \t]+\S/gm) || []).map((m) =>
        parseInt(m.match(/\d+/)[0], 10)
      );
    },
    // Apakah semua pertanyaan wajib sudah punya jawaban bernomor dan berurutan?
    coversAllNumbers(text, required) {
      if (!required || required.length < 2) return true;
      const found = this.numberedItems(text);
      const ascending = found.every((n, i) => i === 0 || n > found[i - 1]);
      return ascending && required.every((n) => found.includes(n));
    },
    // Hasil layak ditampilkan apa adanya?
    isCleanAnswer(text) {
      return (
        this.hasLatinWords(text) &&
        this.foreignRatio(text) <= FOREIGN_RETRY_RATIO &&
        this.englishRatio(text) === 0 &&
        this.englishTokenRatio(text) <= FOREIGN_TOKEN_RATIO &&
        !this.looksTruncated(text)
      );
    },
    // Buang penanda kontaminasi, huruf non-Latin, kata campuran huruf, kalimat Inggris,
    // lalu rapikan sisa spasi/pungtuasi. Indentasi di awal baris (contoh kode) tidak
    // boleh diratakan, hanya spasi ganda setelah karakter non-spasi yang dirapikan.
    stripForeign(text) {
      if (!text) return "";
      // FRAGMENT_RE hanya aman pada teks yang memang tercemar penanda; kode
      // yang sah tetap bisa memakai nama seperti user_id atau max_value.
      const contaminated = text.match(MARKER_RE);
      // Sisipkan spasi pada kata terangkai ("denganStrategi") sebelum penghapusan lain.
      const spaced = this.splitGluedWords(text);
      const noMarkers = contaminated
        ? spaced.replace(MARKER_RE, "").replace(FRAGMENT_RE, "$1")
        : spaced;
      const noMixed = noMarkers
        .replace(/[^\s]+/g, (w) =>
          NON_LATIN_ONE.test(w) && /[A-Za-z]/.test(w) ? "" : w
        )
        .replace(/[-_/]{2,}/g, " ");
      const noForeign = noMixed
        .replace(NON_LATIN_RE, "")
        // Sisa kurung dari objek/JSON yang bocor ke jawaban, mis. "...tertentu.})".
        .replace(/([.!?])[ \t]*[)\]}]+[ \t]*/g, "$1 ")
        .replace(/^[ \t]*[{\[](?=\s*$)/gm, "")
        .replace(/\(\s*\)|\[\s*\]|\{\s*\}/g, "")
        .replace(/(\S)[ \t]{2,}/g, "$1 ")
        .replace(/[ \t]+([.,:;!?])/g, "$1")
        .replace(/([.,:;!?])[ \t]{2,}/g, "$1")
        .replace(/[ \t]+\n/g, "\n");
      // Buang kalimat yang sudah berganti ke bahasa Inggris; baris kosong dari
      // kalimat yang dibuang dihapus, pemisah paragraf yang asli tetap disimpan.
      const lines = noForeign.split("\n").map((line) => {
        if (!line.trim()) return "";
        return line
          .split(/(?<=[.!?])\s+/)
          .filter((s) => s.trim() && !this.isEnglishSentence(s))
          .join(" ");
      });
      const compacted = [];
      for (const line of lines) {
        if (!line.trim() && !compacted[compacted.length - 1]?.trim()) continue;
        compacted.push(line);
      }
      while (compacted.length && !compacted[compacted.length - 1].trim()) compacted.pop();
      return compacted.join("\n");
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
        return window.mentariAI.askOmp(prompt, { system: SYSTEM_PROMPT, temperature: 0.4, maxTokens: 4096 }).catch(() => "Tidak ada jawaban dari AI.");
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
          generationConfig: { temperature: 0.4, maxOutputTokens: 4096, topP: 0.9, topK: 20 }
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
    // Panggil model lalu pastikan hasilnya layak: satu bahasa (huruf Latin), bersih dari
    // penanda kontaminasi, dan menjawab seluruh pertanyaan bernomor.
    // Tahap 1 bahasa: hasil tercemar di-generate ulang lewat prompt REPAIR. Rewrite hanya
    // dipakai kalau benar-benar bersih dan tidak memotong isi secara drastis.
    // Tahap 2 kelengkapan: nomor pertanyaan yang dilewati/digabung di-generate ulang lewat
    // prompt COMPLETE, dan hanya dipakai kalau seluruh nomor kini terjawab berurutan.
    async callLocalized(prompt, options) {
      const numbers = (options && options.numbers) || [];
      let best = await this.callGemini(prompt);
      if (Utils.needsRepair(best)) {
        const repaired = await this.callGemini(
          Config.PROMPTS.REPAIR(best, Utils.corruptedFragments(best))
        );
        // Panjang hasil tercemar justru lebih panjang karena junk-nya, jadi angka
        // panjang hanya dipakai sebagai penjaga pembuka singkat/pesan error. Kalau
        // diskusinya bernomor, kelengkapan nomor lebih menentukan daripada panjang.
        const enough = repaired.length >= best.length * 0.5;
        const sameCoverage =
          numbers.length > 1 &&
          Utils.coversAllNumbers(repaired, numbers) &&
          Utils.coversAllNumbers(best, numbers);
        if (Utils.isCleanAnswer(repaired) && (enough || sameCoverage)) {
          best = repaired;
        }
      }
      if (!Utils.coversAllNumbers(best, numbers)) {
        const filled = await this.callGemini(
          Config.PROMPTS.COMPLETE(best, numbers, options && options.questions)
        );
        if (Utils.coversAllNumbers(filled, numbers)) best = filled;
      }
      return Utils.stripForeign(best);
    }
  };

  const UIRenderer = {
    createButton(type, onClick) {
      const btn = document.createElement("button");
      btn.type = "button";
      if (type === "buat") {
        btn.className = "mm-btn mm-btn-sm buat-pertanyaan-btn";
        btn.innerHTML = `<span style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4"></path><path d="M12 16h.01"></path></svg></span><span>Buat Pertanyaan</span>`;
      } else {
        btn.className = "mm-btn mm-btn-sm mm-btn-tonal cari-jawaban-btn";
        btn.innerHTML = `<span style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></span><span>Cari Jawaban</span>`;
      }
      btn.onclick = onClick;
      return btn;
    },

    showSaranQuestions(saranText, root, replyBtn) {
      let saranDiv = root.querySelector(".saran-pertanyaan-gemini");
      if (!saranDiv) {
        saranDiv = document.createElement("div");
        saranDiv.className = "mm-card mm-card-outline saran-pertanyaan-gemini";
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
        textBox.className = "mm-list-item";
        textBox.style = "flex:1 1 200px;position:relative;";

        const copyBtn = document.createElement("button");
        copyBtn.className = "mm-btn mm-btn-sm mm-btn-tonal";
        copyBtn.style = "position:absolute;right:8px;bottom:8px;z-index:2;";
        copyBtn.innerHTML = `<span style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span><span>Copy</span>`;
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(q.trim());
          copyBtn.querySelector("span:last-child").innerText = "Copied!";
          setTimeout(() => copyBtn.querySelector("span:last-child").innerText = "Copy", 1200);
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
        resultDiv.className = "mm-card mm-card-outline jawaban-gemini";
        replyBtn.parentElement.parentElement.appendChild(resultDiv);
      }
      resultDiv.innerHTML = "";
      const heading = document.createElement("b");
      heading.textContent = "Jawaban:";
      const body = document.createElement("div");
      body.textContent = jawaban;
      body.style = "margin-bottom:6px;white-space:pre-wrap;";
      resultDiv.append(heading, body);
      // Kalau rewrite juga gagal, jangan diam-diam menampilkan teks rusak.
      if (Utils.englishTokenRatio(jawaban) > FOREIGN_TOKEN_RATIO) {
        const warn = document.createElement("div");
        warn.className = "mm-chip mm-chip-warn";
        warn.textContent = "Hasil AI masih tercampur kata asing sehingga kalimatnya kurang tepat. Silakan ulangi, atau ganti model di Pengaturan (Mentari Mod).";
        resultDiv.appendChild(warn);
      }
      
      const btnRow = document.createElement("div");
      btnRow.style = "display:flex;gap:8px;align-items:center;flex-wrap:wrap;justify-content:flex-end;";
      
      const copyBtn = document.createElement("button");
      copyBtn.className = "mm-btn mm-btn-text";
      copyBtn.innerHTML = `<span style="display:inline-flex;align-items:center;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg></span><span>Copy</span>`;
      copyBtn.onclick = () => {
        copyBtn.querySelector("span:last-child").innerText = "Copied!";
        setTimeout(() => copyBtn.querySelector("span:last-child").innerText = "Copy", 1200);
      };
      btnRow.appendChild(copyBtn);

      const modes = [{m:"shorten", l:"Ringkas"}, {m:"paragraph", l:"1 Paragraf"}, {m:"clarify", l:"Perjelas"}, {m:"lengthen", l:"Perpanjang"}, {m:"numbered", l:"Nomor"}];
      modes.forEach(({m, l}) => {
        const btn = document.createElement("button");
        btn.className = "mm-btn mm-btn-sm mm-btn-tonal";
        btn.innerHTML = `<span>${l}</span>`;
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
        // Nomor pertanyaan bernomor pada diskusi, supaya jawaban yang melewati
        // atau menggabung nomor bisa di-generate ulang.
        const numbers = Utils.questionNumbers(content);
        const questions = numbers.length
          ? content
              .split("\n")
              .filter((line) => /^[ \t]*\d{1,2}[.)][ \t]+/.test(line))
              .join("\n")
          : "";
        const jawaban = await ApiService.callLocalized(Config.PROMPTS.DEFAULT(content), { numbers, questions });
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
