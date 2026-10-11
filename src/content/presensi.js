const Config = {
  APP_VERSION: "2.0 Sunset",
};

const Utils = {
  formatDate(d) { if (!d) return "-"; try { return new Date(d).toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch(e) { return d; } },
  formatDateSimple(d) { if (!d) return "-"; try { return new Date(d).toLocaleString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' }); } catch(e) { return d; } },
  injectMaterialIcons() {
    if (window.MentariM3) window.MentariM3.ensure();
  },
};

const UIRenderer = {
  injectStyles() {
    if (window.MentariM3) window.MentariM3.ensure();
  },
  
  showMainPopup(data) {
    const m = data.mahasiswa;

    let popup = document.getElementById("mentari-presensi-popup");
    if (popup) popup.remove();

    popup = document.createElement("div");
    popup.id = "mentari-presensi-popup";
    popup.className = "mm mm-scrim";
    if (window.MentariM3) window.MentariM3.applyTheme(popup);
    
    let totalPertemuan = 0, totalHadir = 0;
    data.forEach(d => {
      totalPertemuan += (d.pertemuan || []).length;
      totalHadir += (d.pertemuan || []).filter(p => p.presensi_status === "hadir").length;
    });
    const avgPercent = totalPertemuan > 0 ? ((totalHadir / totalPertemuan) * 100).toFixed(1) : 0;
    
    popup.innerHTML = `
      <div class="mm-card mm-card-elev presensi-content-container" style="width:min(92vw,900px); max-height:90vh; display:flex; flex-direction:column; animation:mm-rise var(--mm-dur-med) var(--mm-ease-emphasized);">
        <div class="mm-topbar">
          <div class="mm-title"><span class="ms" style="color:var(--mm-primary); font-size:24px;">fact_check</span> Ringkasan Presensi</div>
          <button class="mm-icon-btn" id="p-close-btn" style="margin-left:auto;"><span class="ms">close</span></button>
        </div>

        <div class="mm-scroll" style="flex:1; overflow-y:auto; padding:20px;">
          <div class="mm-chip mm-chip-warn" style="height:auto; align-items:flex-start; padding:12px 16px; margin-bottom:20px; line-height:1.5;">
            <span class="ms">campaign</span>
            <div style="font-size:11px;">
              <strong>Info Transparansi:</strong> Jika ada mata kuliah yang tidak muncul, ini berarti data presensi mata kuliah tersebut belum diterbitkan atau memang tidak dibuka oleh dosen yang bersangkutan melalui sistem My Unpam.
            </div>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin-bottom:20px;">
            <div class="mm-card mm-card-outline" style="padding:12px;"><div class="mm-eyebrow">Mahasiswa</div><div class="mm-title" style="font-size:13px;">${m.nama_mahasiswa}</div></div>
            <div class="mm-card mm-card-outline" style="padding:12px;"><div class="mm-eyebrow">NIM</div><div class="mm-title" style="font-size:13px;">${m.nim}</div></div>
            <div class="mm-card mm-card-outline" style="padding:12px;"><div class="mm-eyebrow">Semester</div><div class="mm-title" style="font-size:13px;">${m.nama_semester_registrasi}</div></div>
            <div class="mm-card mm-card-outline" style="padding:12px;"><div class="mm-eyebrow">Total Kehadiran</div><div class="mm-title" style="font-size:16px;">${avgPercent}%</div></div>
          </div>

          <div id="p-course-list" class="mm-list" style="padding:0; gap:8px;">
            ${data.map((c, i) => this.renderCourseCard(c, i)).join("")}
          </div>
        </div>

        <div style="padding:16px 24px; border-top:1px solid var(--mm-outline-variant); display:flex; justify-content:space-between; align-items:center; font-size:12px;">
          <div class="mm-subtitle">v${Config.APP_VERSION} • Data real-time My Unpam</div>
          <div class="mm-chip">${data.length} Mata Kuliah</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    document.getElementById("p-close-btn").onclick = () => popup.remove();
    popup.onclick = (e) => { if (e.target === popup) popup.remove(); };
    
    // Add detail click events
    data.forEach((c, i) => {
      document.getElementById(`p-course-${i}`).onclick = () => this.showDetailPopup(c);
    });
  },
  
  renderCourseCard(c, idx) {
    const total = (c.pertemuan || []).length;
    const hadir = (c.pertemuan || []).filter(p => p.presensi_status === "hadir").length;
    const percent = total > 0 ? ((hadir / total) * 100).toFixed(0) : 0;
    const chipCls = percent >= 75 ? "mm-chip-ok" : (percent >= 50 ? "mm-chip-warn" : "mm-chip-err");
    return `
      <div class="mm-card mm-card-outline" id="p-course-${idx}" style="cursor:pointer;">
        <div class="mm-card-head">
          <h2 class="mm-title" style="font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:70%;">${c.nama_mata_kuliah}</h2>
          <div class="mm-chip ${chipCls}">${percent}%</div>
        </div>
        <div class="mm-card-body" style="display:flex; gap:20px; font-size:11px; color:var(--mm-on-surface-variant);">
          <div>SKS: <b>${c.sks || 3}</b></div>
          <div>Hadir: <b>${hadir}</b></div>
          <div>Mangkir: <b>${total - hadir}</b></div>
          <div style="margin-left:auto; display:flex; align-items:center; color:var(--mm-primary); font-weight:500;">Lihat Detail <span class="ms" style="font-size:14px;">chevron_right</span></div>
        </div>
      </div>
    `;
  },
  
  showDetailPopup(c) {
    const container = document.createElement("div");
    container.id = "p-detail-subpopup";
    container.className = "mm";
    container.style.cssText = "position:absolute; inset:0; z-index:10; display:flex; flex-direction:column; background:var(--mm-surface-container); animation:mm-rise var(--mm-dur-med) var(--mm-ease-emphasized);";
    if (window.MentariM3) window.MentariM3.applyTheme(container);

    container.innerHTML = `
      <div class="mm-topbar">
        <button class="mm-btn mm-btn-text" id="pd-back-btn" style="padding:0 12px 0 4px;">
          <span class="ms">arrow_back</span> Kembali
        </button>
        <div class="mm-title mm-subtitle" style="font-size:14px;">${c.nama_mata_kuliah}</div>
      </div>

      <div class="mm-scroll mm-list" style="flex:1; overflow-y:auto; gap:8px;">
        ${(c.pertemuan || []).reverse().map((p, i) => `
          <div class="mm-list-item">
            <div class="mm-lead">
              <span class="ms">${p.presensi_status === 'hadir' ? 'check_circle' : 'cancel'}</span>
            </div>
            <div class="mm-list-main">
              <span class="mm-list-title">Pertemuan ${c.pertemuan.length - i} - ${p.jenis_perkuliahan || 'Perkuliahan'}</span>
              <div class="mm-list-sub">
                <span><span class="ms" style="font-size:12px;">event</span> ${Utils.formatDateSimple(p.tanggal_mulai)}</span>
                ${p.presensi_date ? `<span><span class="ms" style="font-size:12px;">history</span> ${Utils.formatDate(p.presensi_date)}</span>` : ""}
              </div>
            </div>
            <div class="mm-chip ${p.presensi_status === 'hadir' ? 'mm-chip-ok' : 'mm-chip-err'}">
              ${p.presensi_status || 'Tidak Hadir'}
            </div>
          </div>
        `).join("")}
      </div>
    `;

    const root = document.querySelector(".presensi-content-container");
    root.appendChild(container);
    document.getElementById("pd-back-btn").onclick = () => container.remove();
  },
  
  showLoading() {
    const l = document.createElement("div"); l.id = "presensi-loading";
    l.className = "mm mm-scrim";
    if (window.MentariM3) window.MentariM3.applyTheme(l);
    l.innerHTML = `
      <div class="mm-dialog" style="text-align:center; max-width:320px;">
        <div class="mm-spin-ring" style="margin-bottom:15px;"></div>
        <div class="mm-title" style="margin-bottom:4px;">Sinkronisasi Presensi</div>
        <div class="mm-subtitle">Menghubungkan ke portal akademik...</div>
      </div>
    `;
    document.body.appendChild(l);
    return l;
  },
  
  hideLoading() { document.getElementById("presensi-loading")?.remove(); },
  
  addTrigger() {
    if (document.getElementById("p-trigger-btn")) return;
    const b = document.createElement("button");
    b.id = "p-trigger-btn";
    b.className = "mm mm-fab";
    b.title = "Lihat Presensi Keseluruhan";
    b.setAttribute("aria-label", "Lihat Presensi Keseluruhan");
    b.style.cssText = "position:fixed; bottom:20px; left:20px; z-index:9999;";
    if (window.MentariM3) window.MentariM3.applyTheme(b);
    b.innerHTML = `<span class="ms">fact_check</span>`;
    b.onclick = async () => {
      b.disabled = true;
      b.innerHTML = `<div class="mm-spin-ring" style="width:14px; height:14px; border-width:2px; margin:0;"></div> Memuat...`;
      this.showLoading();
      try {
        await fetchAllPresensiData();
      } catch (e) {
        console.error(e);
        alert("Gagal memuat data presensi.");
      } finally {
        this.hideLoading();
        b.disabled = false;
        b.innerHTML = `<span class="ms">fact_check</span>`;
      }
    };
    document.body.appendChild(b);
  }
};

// Update existing functions to use new UIRenderer
function showPresensiTable(data) { UIRenderer.showMainPopup(data); }
function showLoadingSpinner() { return UIRenderer.showLoading(); }
function hideLoadingSpinner() { UIRenderer.hideLoading(); }
function addFloatingButton() { UIRenderer.addTrigger(); }

// Initialize styles
Utils.injectMaterialIcons();
UIRenderer.injectStyles();

// Original core logic follows...
async function fetchAllPresensiData() {
  const token = await getAuthToken();
  if (!token) {
    console.error("Token tidak ditemukan.");
    showPopupMessage("Error: Token tidak ditemukan", "error");
    return null;
  }

  try {
    const jadwalKuliah = await fetchJadwalKuliah(token);
    if (!jadwalKuliah || !jadwalKuliah.length) {
      showPopupMessage("Tidak ada jadwal kuliah yang ditemukan", "error");
      return null;
    }

    const mahasiswaInfo = {
      nim: jadwalKuliah[0].nim,
      nama_mahasiswa: jadwalKuliah[0].nama_mahasiswa,
      id_semester_registrasi: jadwalKuliah[0].id_semester_registrasi,
      nama_semester_registrasi: jadwalKuliah[0].nama_semester_registrasi,
    };

    const allPresensiData = [];
    for (const jadwal of jadwalKuliah) {
      const { id_kelas, id_mata_kuliah, nama_mata_kuliah, sks } = jadwal;
      try {
        const presensiData = await fetchPresensiPertemuan(token, id_kelas, id_mata_kuliah);
        allPresensiData.push({
          nama_mata_kuliah,
          id_mata_kuliah,
          id_kelas,
          sks,
          pertemuan: presensiData,
        });
      } catch (error) {
        console.error(`Gagal mengambil data untuk ${nama_mata_kuliah}`);
      }
    }

    allPresensiData.mahasiswa = mahasiswaInfo;
    showPresensiTable(allPresensiData);
    return allPresensiData;
  } catch (error) {
    console.error("Kesalahan fetch:", error);
    showPopupMessage("Terjadi kesalahan saat mengambil data", "error");
    return null;
  }
}


// Fungsi untuk menampilkan pesan popup
function showPopupMessage(message, type = "info") {
  if (window.MentariM3) window.MentariM3.snackbar(message);
}

// Fungsi untuk membersihkan token dari prefix yang tidak diperlukan
function cleanToken(token) {
  // Hapus prefix "__q_strn|" jika ada
  if (token && token.includes("__q_strn|")) {
    return token.split("__q_strn|")[1];
  }
  return token;
}

// Fungsi untuk mendapatkan token autentikasi
async function getAuthToken() {
  // Cek token di localStorage dan sessionStorage
  const localStorageKeys = Object.keys(localStorage);
  const sessionStorageKeys = Object.keys(sessionStorage);

  // Array untuk menyimpan kemungkinan token
  let possibleTokens = [];

  // Periksa localStorage
  for (const key of localStorageKeys) {
    let value = localStorage.getItem(key);
    if (
      value &&
      (value.includes("eyJ") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("auth"))
    ) {
      value = cleanToken(value);
      possibleTokens.push({ source: "localStorage", key: key, value: value });
    }
  }

  // Periksa sessionStorage
  for (const key of sessionStorageKeys) {
    let value = sessionStorage.getItem(key);
    if (
      value &&
      (value.includes("eyJ") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("auth"))
    ) {
      value = cleanToken(value);
      possibleTokens.push({ source: "sessionStorage", key: key, value: value });
    }
  }

  // Periksa cookies
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (
      value &&
      (value.includes("eyJ") ||
        key.toLowerCase().includes("token") ||
        key.toLowerCase().includes("auth"))
    ) {
      const cleanedValue = cleanToken(decodeURIComponent(value));
      possibleTokens.push({
        source: "cookie",
        key: key,
        value: cleanedValue,
      });
    }
  }

  // Cek jika ada global token dari monitor network requests
  if (window.lastAuthToken) {
    const cleanedToken = cleanToken(window.lastAuthToken);
    possibleTokens.push({
      source: "networkMonitor",
      key: "lastAuthToken",
      value: cleanedToken,
    });
  }

  if (possibleTokens.length > 0) {
    console.log("Token ditemukan");
    return possibleTokens[0].value;
  } else {
    console.log("Tidak ada token ditemukan. Mengaktifkan monitoring...");
    monitorNetworkRequests();
    return null;
  }
}

// Fungsi untuk memonitor network requests
function monitorNetworkRequests() {
  console.log("Mengaktifkan monitoring network requests...");

  // Monitor fetch requests
  const originalFetch = window.fetch;
  window.fetch = function (...args) {
    const request = args[0];
    if (args[1] && args[1].headers) {
      const headers = args[1].headers;
      // Periksa jika headers adalah Headers object atau plain object
      if (headers instanceof Headers) {
        if (headers.has("authorization") || headers.has("Authorization")) {
          const authHeader =
            headers.get("authorization") || headers.get("Authorization");
          if (authHeader.startsWith("Bearer ")) {
            const token = authHeader.substring(7);
            window.lastAuthToken = cleanToken(token);
          }
        }
      } else {
        // Plain object
        if (headers.authorization || headers.Authorization) {
          const authHeader = headers.authorization || headers.Authorization;
          if (
            typeof authHeader === "string" &&
            authHeader.startsWith("Bearer ")
          ) {
            const token = authHeader.substring(7);
            window.lastAuthToken = cleanToken(token);
          }
        }
      }
    }
    return originalFetch.apply(this, args);
  };
}

// Fungsi untuk fetch data jadwal kuliah
async function fetchJadwalKuliah(token) {
  try {
    // Dapatkan XSRF token jika ada
    let xsrfToken = "";
    const xsrfCookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("XSRF-TOKEN="));
    if (xsrfCookie) {
      xsrfToken = decodeURIComponent(xsrfCookie.split("=")[1]);
    }

    // Fetch data jadwal kuliah
    const response = await fetch(
      "https://my.unpam.ac.id/api/presensi/mahasiswa/jadwal-kuliah",
      {
        method: "GET",
        headers: {
          accept: "application/json, text/plain, */*",
          authorization: `Bearer ${token}`,
          "x-xsrf-token": xsrfToken,
        },
        credentials: "include",
      }
    );

    // Periksa apakah response berhasil
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse response menjadi JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching jadwal kuliah:", error);
    throw error;
  }
}

// Fungsi untuk fetch data presensi pertemuan
async function fetchPresensiPertemuan(token, idKelas, idMataKuliah) {
  try {
    // Dapatkan XSRF token jika ada
    let xsrfToken = "";
    const xsrfCookie = document.cookie
      .split(";")
      .find((c) => c.trim().startsWith("XSRF-TOKEN="));
    if (xsrfCookie) {
      xsrfToken = decodeURIComponent(xsrfCookie.split("=")[1]);
    }

    // URL untuk mengambil data presensi
    const url = `https://my.unpam.ac.id/api/presensi/mahasiswa/jadwal-pertemuan/${idKelas}/${idMataKuliah}`;

    // Fetch data presensi
    const response = await fetch(url, {
      method: "GET",
      headers: {
        accept: "application/json, text/plain, */*",
        authorization: `Bearer ${token}`,
        "x-xsrf-token": xsrfToken,
      },
      credentials: "include",
    });

    // Periksa apakah response berhasil
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    // Parse response menjadi JSON
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(
      `Error fetching data presensi untuk kelas ${idKelas}, mata kuliah ${idMataKuliah}:`,
      error
    );
    throw error;
  }
}

// Jalankan fungsi utama
console.log("=== SCRIPT UNTUK MENDAPATKAN DATA PRESENSI UNPAM ===");
console.log("Memulai proses pengambilan data...");

// Tambahkan tombol floating untuk menjalankan script
addFloatingButton();
monitorNetworkRequests();

// Tambahkan event listener untuk auto-restart script saat token ditemukan
window.addEventListener("storage", function (e) {
  if (
    e.key.toLowerCase().includes("token") ||
    e.key.toLowerCase().includes("auth")
  ) {
    console.log("Token storage berubah, mencoba menjalankan script kembali");
    fetchAllPresensiData();
  }
});
