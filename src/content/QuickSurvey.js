function automateFlow(mode) {
  function clickRadios(mode) {
    if (mode === "Setuju") {
      // Pilih "Sering" (index 2) untuk semua pertanyaan
      document.querySelectorAll('[role="radiogroup"]').forEach((group) => {
        const radios = Array.from(group.querySelectorAll('[role="radio"]'));
        if (radios.length >= 3) {
          radios[2].click(); // Index 2 = "Sering"
        }
      });
    } else if (mode === "Random") {
      // Random tanpa "Tidak Pernah" - pilih dari index 1, 2, 3
      document.querySelectorAll('[role="radiogroup"]').forEach((group) => {
        const radios = Array.from(group.querySelectorAll('[role="radio"]'));
        if (radios.length >= 4) {
          // Buat array dengan weight: index 1 = 1x, index 2 = 2x, index 3 = 2x
          const weightedChoices = [];
          weightedChoices.push(1); // "Kadang-kadang" 1x
          weightedChoices.push(2, 2); // "Sering" 2x
          weightedChoices.push(3, 3); // "Selalu" 2x

          const randomChoice =
            weightedChoices[Math.floor(Math.random() * weightedChoices.length)];
          radios[randomChoice].click();
        }
      });
    } else if (mode.startsWith("star")) {
      const rating = parseInt(mode.slice(4));
      document.querySelectorAll('[role="radiogroup"]').forEach((group) => {
        const radios = Array.from(group.querySelectorAll('[role="radio"]'));

        // Urutan radio: [0="Tidak Pernah", 1="Kadang-kadang", 2="Sering", 3="Selalu"]
        let weights;
        switch (rating) {
          case 1: // ⭐ - Buruk
            weights = [0.7, 0.3, 0, 0]; // Lebih banyak "Tidak Pernah"
            break;
          case 2: // ⭐⭐ - Kurang
            weights = [0.3, 0.7, 0, 0]; // Lebih banyak "Kadang-kadang"
            break;
          case 3: // ⭐⭐⭐ - Cukup
            weights = [0, 0.4, 0.6, 0]; // Campuran "Kadang-kadang" dan "Sering"
            break;
          case 4: // ⭐⭐⭐⭐ - Baik
            weights = [0, 0, 0.7, 0.3]; // Lebih banyak "Sering"
            break;
          case 5: // ⭐⭐⭐⭐⭐ - Sangat Baik
            weights = [0, 0, 0.3, 0.7]; // Lebih banyak "Selalu"
            break;
        }

        const random = Math.random();
        let sum = 0;
        let selectedIndex = 0;
        for (let i = 0; i < weights.length; i++) {
          sum += weights[i];
          if (random < sum) {
            selectedIndex = i;
            break;
          }
        }

        if (radios[selectedIndex]) {
          radios[selectedIndex].click();
        }
      });
    } else {
      // FullRandom - pilih semua opsi termasuk "Tidak Pernah"
      document.querySelectorAll('[role="radiogroup"]').forEach((group) => {
        const radios = Array.from(group.querySelectorAll('[role="radio"]'));
        if (radios.length > 0) {
          const randomIndex = Math.floor(Math.random() * radios.length);
          radios[randomIndex].click();
        }
      });
    }
  }

  function clickNextButton() {
    function findAndClickButtons() {
      // Klik radio button terlebih dahulu
      clickRadios(mode);

      // Tunggu sebentar untuk memastikan radio button terpilih
      setTimeout(() => {
        const buttons = document.querySelectorAll(
          "button.q-btn.bg-blue-6.text-white"
        );
        let foundNextButton = false;

        buttons.forEach((button) => {
          const spanContent = button.querySelector(".block");
          if (spanContent) {
            if (spanContent.textContent === "SELANJUTNYA") {
              foundNextButton = true;
              button.click();
              // Setelah klik next, tunggu sebentar lalu cari tombol lagi
              setTimeout(findAndClickButtons, 500);
              return;
            }
          }
        });

        // Jika tidak ada tombol SELANJUTNYA, cari tombol SIMPAN
        if (!foundNextButton) {
          buttons.forEach((button) => {
            const spanContent = button.querySelector(".block");
            if (spanContent && spanContent.textContent === "SIMPAN") {
              button.click();
              return;
            }
          });
        }
      }, 500);
    }

    // Mulai proses
    findAndClickButtons();
  }
  clickRadios(mode);
  setTimeout(clickNextButton, 500);
}

const SurveyConfig = {
  APP_VERSION: "2.0 Sunset",
};

function injectSurveyStyles() {
  if (window.MentariM3) window.MentariM3.ensure();
}

function createQuickSurveyToggle() {
  injectSurveyStyles();
  let container = document.getElementById("floatingButtonContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "floatingButtonContainer";
    container.style.cssText = "position:fixed; bottom:20px; left:20px; display:flex; flex-direction:row; gap:12px; z-index:9999; align-items:flex-end;";
    document.body.appendChild(container);
  }

  if (document.getElementById("quickSurveyToggle")) return;
  const btn = document.createElement("button");
  btn.id = "quickSurveyToggle";
  btn.className = "mm mm-fab quick-survey-trigger";
  btn.setAttribute("data-title", "Quick Survey Otomatis");
  btn.innerHTML = `<span class="ms">auto_awesome</span>`;
  btn.onclick = () => createQuickSurveyPopup();
  container.appendChild(btn);
}

function createQuickSurveyPopup() {
  let root = document.getElementById("quick-survey-popup-root");
  if (root) root.remove();

  root = document.createElement("div");
  root.id = "quick-survey-popup-root";
  root.className = "mm mm-scrim";
  if (window.MentariM3) window.MentariM3.applyTheme(root);

  root.innerHTML = `
    <div class="survey-container mm-card mm-card-elev" style="width:90%;max-width:450px;">
    <div class="popup-header mm-topbar">
      <div class="popup-title mm-title"><span class="ms" style="color:var(--mm-primary);font-size:24px;">bolt</span> Quick Survey</div>
      <button class="popup-close-btn mm-icon-btn" id="s-close-btn"><span class="ms">close</span></button>
    </div>
      
      <div class="survey-body mm-card-body" style="display:flex;flex-direction:column;gap:16px;">
        <div class="survey-guide mm-chip-ok" style="height:auto;align-items:flex-start;border-radius:12px;padding:12px;font-size:11px;line-height:1.5;">
          <span class="ms">info</span>
          <div>
            <strong>Cara Penggunaan:</strong> Klik "Isi Kuesioner" pada mata kuliah yang diinginkan di halaman KHS, lalu gunakan tombol di bawah ini untuk pengisian otomatis.
          </div>
        </div>

        <div class="survey-warning mm-chip-warn" style="height:auto;align-items:flex-start;border-radius:12px;padding:12px;font-size:11px;line-height:1.5;">
          <span class="ms">report</span>
          <div>
            <strong>Peringatan:</strong> Gunakan fitur ini dengan bijak. Quick Survey bekerja dengan mengisi penilaian secara otomatis berdasarkan rata-rata statistik dari rentang yang Anda pilih, bukan berdasarkan penilaian manual per poin.
          </div>
        </div>

        <div class="survey-card mm-card mm-card-outline">
          <div class="mm-card-body">
            <div class="card-label mm-eyebrow" style="margin-bottom:12px;">Penilaian Kinerja Dosen</div>
            <div class="star-grid" style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;">
              <button class="rating-btn btn-r1 mm-chip mm-chip-err" style="height:auto;flex-direction:column;padding:8px 4px;" data-v="star1">1<span>Buruk</span></button>
              <button class="rating-btn btn-r2 mm-chip mm-chip-warn" style="height:auto;flex-direction:column;padding:8px 4px;" data-v="star2">2<span>Kurang</span></button>
              <button class="rating-btn btn-r3 mm-chip" style="height:auto;flex-direction:column;padding:8px 4px;" data-v="star3">3<span>Cukup</span></button>
              <button class="rating-btn btn-r4 mm-chip mm-chip-ok" style="height:auto;flex-direction:column;padding:8px 4px;" data-v="star4">4<span>Baik</span></button>
              <button class="rating-btn btn-r5 mm-chip mm-chip-ok" style="height:auto;flex-direction:column;padding:8px 4px;" data-v="star5">5<span>Sangat Baik</span></button>
            </div>
          </div>
        </div>
        
        <div class="survey-card mm-card mm-card-outline" style="padding:10px;">
          <div class="card-label mm-eyebrow" style="margin-bottom:8px;">Opsi Otomasi</div>
          <button class="option-btn mm-btn mm-btn-tonal mm-btn-sm" style="width:100%;margin-bottom:8px;justify-content:flex-start;" id="opt-all-good"><span class="ms">done_all</span> Pilih Semua "Setuju"</button>
          <button class="option-btn mm-btn mm-btn-tonal mm-btn-sm" style="width:100%;margin-bottom:8px;justify-content:flex-start;" id="opt-random-safe"><span class="ms">shuffle</span> Random (Aman)</button>
          <button class="option-btn mm-btn mm-btn-tonal mm-btn-sm" style="width:100%;justify-content:flex-start;" id="opt-chaos"><span class="ms">warning</span> Acak Total</button>
        </div>
      </div>
      
      <div class="survey-footer mm-subtitle" style="text-align:center;padding:12px 16px;">
        Mod by Lukman754 • v${SurveyConfig.APP_VERSION}
      </div>
    </div>
  `;

  document.body.appendChild(root);
  root.onclick = (e) => { if (e.target === root) root.remove(); };
  document.getElementById("s-close-btn").onclick = () => root.remove();

  // Setup Event Listeners
  document.querySelectorAll(".rating-btn").forEach(btn => {
    btn.onclick = () => { automateFlow(btn.dataset.v); root.remove(); };
  });

  const actions = {
    "opt-all-good": "Setuju",
    "opt-random-safe": "Random",
    "opt-chaos": "FullRandom"
  };

  Object.entries(actions).forEach(([id, mode]) => {
    document.getElementById(id).onclick = () => { automateFlow(mode); root.remove(); };
  });
}


// Fungsi untuk mengecek URL dan menampilkan popup jika sesuai
function checkUrlAndInitialize() {
  const currentUrl = window.location.href;
  // Toleran: abaikan query string/hash
  const targetPrefix = "https://my.unpam.ac.id/data-akademik/khs";
  if (currentUrl.startsWith(targetPrefix)) {
    console.log(
      "URL matches target (with tolerance), initializing QuickSurvey..."
    );
    initializeQuickSurvey();
  } else {
    console.log("URL does not match target, removing QuickSurvey if exists...");
    // Remove existing elements if they exist
    const existingToggle = document.getElementById("quickSurveyToggle");
    if (existingToggle) existingToggle.remove();
    const existingPopup = document.getElementById("quickSurveyPopup");
    if (existingPopup) existingPopup.remove();
    const existingOverlay = document.getElementById("quickSurveyPopupOverlay");
    if (existingOverlay) existingOverlay.remove();
  }
}

// Fungsi untuk memantau perubahan URL
function observeUrlChanges() {
  let lastUrl = window.location.href;

  // Fungsi untuk mengecek perubahan URL
  function checkUrlChange() {
    const currentUrl = window.location.href;
    if (currentUrl !== lastUrl) {
      console.log("URL changed from", lastUrl, "to", currentUrl);
      lastUrl = currentUrl;
      checkUrlAndInitialize();
    }
  }

  // Menggunakan MutationObserver untuk memantau perubahan pada history
  const observer = new MutationObserver(() => {
    checkUrlChange();
  });

  // Mulai observasi
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  // Tambahkan event listener untuk popstate (untuk navigasi browser)
  window.addEventListener("popstate", checkUrlChange);

  // Tambahkan event listener untuk pushState dan replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function () {
    originalPushState.apply(this, arguments);
    checkUrlChange();
  };

  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    checkUrlChange();
  };

  // Cek URL saat script pertama kali dijalankan
  checkUrlAndInitialize();
}

// Modifikasi fungsi initializeQuickSurvey
function initializeQuickSurvey() {
  console.log("Initializing QuickSurvey..."); // Debug log

  // Hapus elemen yang ada terlebih dahulu
  const existingToggle = document.getElementById("quickSurveyToggle");
  if (existingToggle) {
    existingToggle.remove();
  }
  const existingPopup = document.getElementById("quickSurveyPopup");
  if (existingPopup) {
    existingPopup.remove();
  }
  const existingOverlay = document.getElementById("quickSurveyPopupOverlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }

  // Buat elemen baru (Hanya toggle, popup dibuat saat diklik)
  createQuickSurveyToggle();
}

// Jalankan observasi URL saat script dimuat
console.log("=== SCRIPT UNTUK QUICK SURVEY UNPAM ===");
console.log("Memulai observasi perubahan URL...");
observeUrlChanges();

// Pastikan tombol langsung muncul jika URL cocok saat script pertama kali dijalankan
checkUrlAndInitialize();
