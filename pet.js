/* Mentari Pet Playground — configurable M3 stage.
 * Each pet: { id, name, kind:'gif'|'image', width, speed, emoji, states:{idle,walk,walkFast,run,lie,swipe,ball} }
 * - kind 'gif': per-state URLs, missing states fall back to `idle`.
 * - kind 'image': single URL reused for every state (still roams/flips/reacts).
 * - empty URL: emoji fallback (no network needed).
 * Persisted in localStorage `mentari-pet-config-v1`. postMessage API for host control.
 */
(function () {
  "use strict";

  var STORE_KEY = "mentari-pet-config-v1";
  var STATES = ["idle", "walk", "walkFast", "run", "lie", "swipe", "ball"];

  var FOX = "https://raw.githubusercontent.com/tonybaloney/vscode-pets/main/media/fox/";
  var CHICKEN = "https://raw.githubusercontent.com/tonybaloney/vscode-pets/main/media/chicken/";

  function uid() {
    return "pet-" + Math.random().toString(36).slice(2, 9);
  }
  /* Stage color themes live in src/content/m3.js (window.MentariM3).
   * pet.html is a standalone page without the content-script world, so the
   * tables are duplicated here as fallback when MentariM3 is absent.
   * "sunset" = built-in orange look (clears overrides). */
  var THEME_VAR = {
    primary: "--mm-primary", onPrimary: "--mm-on-primary",
    primaryContainer: "--mm-primary-container", onPrimaryContainer: "--mm-on-primary-container",
    secondary: "--mm-secondary", onSecondary: "--mm-on-secondary",
    secondaryContainer: "--mm-secondary-container", onSecondaryContainer: "--mm-on-secondary-container",
    tertiary: "--mm-tertiary", onTertiary: "--mm-on-tertiary",
    tertiaryContainer: "--mm-tertiary-container", onTertiaryContainer: "--mm-on-tertiary-container",
    error: "--mm-error", onError: "--mm-on-error",
    errorContainer: "--mm-error-container", onErrorContainer: "--mm-on-error-container",
    surface: "--mm-surface", onSurface: "--mm-on-surface", onSurfaceVariant: "--mm-on-surface-variant",
    surfaceLow: "--mm-surface-low", surfaceContainer: "--mm-surface-container",
    surfaceHigh: "--mm-surface-high", surfaceHighest: "--mm-surface-highest",
    outlineVariant: "--mm-outline-variant"
  };
  var THEMES = {
    rimba: {
      primary: "#9CD1C6", onPrimary: "#114840",
      primaryContainer: "#275B52", onPrimaryContainer: "#B9EEE3",
      secondary: "#B1CCC6", onSecondary: "#2C4540",
      secondaryContainer: "#27403B", onSecondaryContainer: "#AAC5BE",
      tertiary: "#C7EEFF", onTertiary: "#275B6D",
      tertiaryContainer: "#AFE2F6", onTertiaryContainer: "#1D5364",
      error: "#FA746F", onError: "#490006",
      errorContainer: "#871F21", onErrorContainer: "#FF9993",
      surface: "#0A0F0E", onSurface: "#DDE8E4", onSurfaceVariant: "#A2ADAA",
      surfaceLow: "#0E1513", surfaceContainer: "#131B19",
      surfaceHigh: "#19211F", surfaceHighest: "#1E2826",
      outlineVariant: "#3F4A47"
    },
    anggrek: {
      primary: "#CEBFEC", onPrimary: "#453A5E",
      primaryContainer: "#584C72", onPrimaryContainer: "#EADEFF",
      secondary: "#CCC2DB", onSecondary: "#433D51",
      secondaryContainer: "#3F384C", onSecondaryContainer: "#C5BBD4",
      tertiary: "#FFDBF0", onTertiary: "#6F4663",
      tertiaryContainer: "#FEC7EA", onTertiaryContainer: "#663E5A",
      error: "#F97386", onError: "#490013",
      errorContainer: "#871C34", onErrorContainer: "#FF97A3",
      surface: "#0F0D12", onSurface: "#EAE3EF", onSurfaceVariant: "#AFA9B4",
      surfaceLow: "#141218", surfaceContainer: "#1B181F",
      surfaceHigh: "#211E26", surfaceHighest: "#27242D",
      outlineVariant: "#4A4650"
    },
    senja: {
      primary: "#C7CB90", onPrimary: "#404316",
      primaryContainer: "#525527", onPrimaryContainer: "#E4E7AB",
      secondary: "#C8C9A6", onSecondary: "#404228",
      secondaryContainer: "#3B3D23", onSecondaryContainer: "#C1C29F",
      tertiary: "#FFE5B9", onTertiary: "#6A511C",
      tertiaryContainer: "#F9D593", onTertiaryContainer: "#614914",
      error: "#F97758", onError: "#450900",
      errorContainer: "#85230A", onErrorContainer: "#FF9B82",
      surface: "#0E0F09", onSurface: "#E8E6D4", onSurfaceVariant: "#ADAC9B",
      surfaceLow: "#13140C", surfaceContainer: "#1A1A11",
      surfaceHigh: "#202016", surfaceHighest: "#26271B",
      outlineVariant: "#48493B"
    },
    samudra: {
      primary: "#B2C8EC", onPrimary: "#2C415F",
      primaryContainer: "#3E5373", onPrimaryContainer: "#D6E4FF",
      secondary: "#BCC7DC", onSecondary: "#364151",
      secondaryContainer: "#323C4C", onSecondaryContainer: "#B5C0D4",
      tertiary: "#E6DAFF", onTertiary: "#554A73",
      tertiaryContainer: "#D9CAFB", onTertiaryContainer: "#4C4169",
      error: "#FA746F", onError: "#490006",
      errorContainer: "#871F21", onErrorContainer: "#FF9993",
      surface: "#0C0E12", onSurface: "#E2E5EF", onSurfaceVariant: "#A7ABB4",
      surfaceLow: "#111318", surfaceContainer: "#171A1F",
      surfaceHigh: "#1C2026", surfaceHighest: "#22262D",
      outlineVariant: "#444850"
    },
    bata: {
      primary: "#F9B7A8", onPrimary: "#613429",
      primaryContainer: "#76463A", onPrimaryContainer: "#FFDBD4",
      secondary: "#E7BDB4", onSecondary: "#563932",
      secondaryContainer: "#51342E", onSecondaryContainer: "#DFB6AD",
      tertiary: "#FFE4BE", onTertiary: "#6D501D",
      tertiaryContainer: "#FDD494", onTertiaryContainer: "#634815",
      error: "#F97386", onError: "#490013",
      errorContainer: "#871C34", onErrorContainer: "#FF97A3",
      surface: "#130D0B", onSurface: "#F9E0DB", onSurfaceVariant: "#BCA6A1",
      surfaceLow: "#1A110F", surfaceContainer: "#221715",
      surfaceHigh: "#291D1A", surfaceHighest: "#30231F",
      outlineVariant: "#554440"
    }
  };

  function defaults() {
    return {
      version: 1,
      world: { night: true, theme: "sunset" },
      pets: [
        {
          id: uid(), name: "Oren", kind: "gif", width: 110, speed: 1, emoji: "🦊",
          states: {
            idle: FOX + "red_idle_8fps.gif", walk: FOX + "red_walk_8fps.gif",
            walkFast: FOX + "red_walk_fast_8fps.gif", run: FOX + "red_run_8fps.gif",
            lie: FOX + "red_lie_8fps.gif", swipe: FOX + "red_swipe_8fps.gif",
            ball: FOX + "red_with_ball_8fps.gif"
          }
        },
        {
          id: uid(), name: "Putih", kind: "gif", width: 110, speed: 1, emoji: "🦊",
          states: {
            idle: FOX + "white_idle_8fps.gif", walk: FOX + "white_walk_8fps.gif",
            walkFast: FOX + "white_walk_fast_8fps.gif", run: FOX + "white_run_8fps.gif",
            lie: FOX + "white_lie_8fps.gif", swipe: FOX + "white_swipe_8fps.gif",
            ball: FOX + "white_with_ball_8fps.gif"
          }
        },
        {
          id: uid(), name: "Ayam", kind: "gif", width: 60, speed: 0.7, emoji: "🐔",
          states: {
            idle: CHICKEN + "brown_idle_8fps.gif", walk: CHICKEN + "brown_walk_8fps.gif",
            walkFast: CHICKEN + "brown_walk_fast_8fps.gif", run: CHICKEN + "brown_run_8fps.gif",
            lie: CHICKEN + "brown_idle_8fps.gif", swipe: CHICKEN + "brown_swipe_8fps.gif",
            ball: CHICKEN + "brown_with_ball_8fps.gif"
          }
        }
      ]
    };
  }

  var PetStore = {
    load: function () {
      try {
        var raw = localStorage.getItem(STORE_KEY);
        if (!raw) return defaults();
        var cfg = JSON.parse(raw);
        if (!cfg || !Array.isArray(cfg.pets)) return defaults();
        cfg.world = cfg.world || { night: true, theme: "sunset" };
        if (!cfg.world.theme || !THEMES[cfg.world.theme]) cfg.world.theme = "sunset";
        return cfg;
      } catch (_) {
        return defaults();
      }
    },
    save: function (cfg) {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(cfg));
      } catch (_) {}
    },
    reset: function () {
      var cfg = defaults();
      this.save(cfg);
      return cfg;
    }
  };

  function randomItem(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  var world = document.getElementById("world");
  var petLayer = document.getElementById("petLayer");
  var petCount = document.getElementById("petCount");
  var nightButton = document.getElementById("nightButton");
  var configButton = document.getElementById("configButton");
  var configScrim = document.getElementById("configScrim");
  var petList = document.getElementById("petList");

  var config = PetStore.load();
  var pets = [];
  var isNight = !!(config.world && config.world.night);

  function createStars() {
    var container = document.getElementById("stars");
    if (!container) return;
    for (var i = 0; i < 65; i++) {
      var star = document.createElement("div");
      star.className = "star " + (Math.random() > 0.8 ? "big" : Math.random() > 0.5 ? "small" : "");
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 55 + "%";
      star.style.animationDelay = Math.random() * 3 + "s";
      star.style.animationDuration = 1.5 + Math.random() * 2.5 + "s";
      container.appendChild(star);
    }
  }

  function createGrassBlades() {
    var container = document.getElementById("grassBlades");
    if (!container) return;
    var sizes = ["short", "mid", "tall"];
    for (var i = 0; i < 90; i++) {
      var blade = document.createElement("div");
      blade.className = "blade " + randomItem(sizes);
      blade.style.left = ((i / 90) * 100 + (Math.random() - 0.5) * 3).toFixed(2) + "%";
      blade.style.animationDelay = (Math.random() * 2).toFixed(2) + "s";
      container.appendChild(blade);
    }
  }

  function resolveSrc(entry, state) {
    var s = entry.states || {};
    if (entry.kind === "image") return s.idle || "";
    return s[state] || s.idle || "";
  }

  function Pet(entry) {
    this.entry = entry;
    this.x = Math.random() * Math.max(40, window.innerWidth - entry.width - 20) + 10;
    this.direction = Math.random() > 0.5 ? 1 : -1;
    this.state = "idle";
    this.speed = 0;
    this.targetX = this.x;
    this.nextAction = performance.now() + 1000 + Math.random() * 2500;
    this.lockedUntil = 0;
    this.reactionTimer = null;

    this.el = document.createElement("div");
    this.el.className = "pet";
    this.el.style.width = entry.width + "px";
    this.el.style.height = entry.width + "px";
    this.img = document.createElement("img");
    this.img.alt = entry.name;
    this.fallback = document.createElement("div");
    this.fallback.className = "emoji-fallback";
    this.fallback.textContent = entry.emoji || "🦊";
    this.fallback.style.display = "none";
    this.el.appendChild(this.img);
    this.el.appendChild(this.fallback);

    this.shadow = document.createElement("div");
    this.shadow.className = "shadow";
    this.shadow.style.width = Math.max(24, entry.width * 0.55) + "px";

    this.reactionEl = document.createElement("div");
    this.reactionEl.className = "reaction";

    petLayer.appendChild(this.shadow);
    petLayer.appendChild(this.el);
    world.appendChild(this.reactionEl);

    var self = this;
    this.img.onerror = function () {
      self.img.style.display = "none";
      self.fallback.style.display = "";
    };
    this.el.addEventListener("click", function () {
      handleClick(self);
    });
    this.setImage("idle");
    this.render();
  }

  Pet.prototype.setImage = function (state) {
    var src = resolveSrc(this.entry, state);
    if (!src) {
      this.img.style.display = "none";
      this.fallback.style.display = "";
      return;
    }
    this.fallback.style.display = "none";
    this.img.style.display = "";
    if (this.img.dataset.src !== src) {
      this.img.dataset.src = src;
      this.img.src = src;
    }
  };

  Pet.prototype.setState = function (state) {
    this.state = state;
    var mul = this.entry.speed || 1;
    if (this.entry.kind === "image") {
      // Static image: keep locomotion speeds, single visual.
      if (state === "idle" || state === "sleep" || state === "play" || state === "swipe") this.speed = 0;
      else if (state === "walk") this.speed = (0.3 + Math.random() * 0.3) * mul;
      else if (state === "fast") this.speed = (0.7 + Math.random() * 0.3) * mul;
      else if (state === "run") this.speed = (1.5 + Math.random() * 0.7) * mul;
      this.setImage("idle");
      return;
    }
    switch (state) {
      case "idle": this.speed = 0; this.setImage("idle"); break;
      case "walk": this.speed = (0.3 + Math.random() * 0.3) * mul; this.setImage("walk"); break;
      case "fast": this.speed = (0.7 + Math.random() * 0.3) * mul; this.setImage("walkFast"); break;
      case "run": this.speed = (1.5 + Math.random() * 0.7) * mul; this.setImage("run"); break;
      case "sleep": this.speed = 0; this.setImage("lie"); break;
      case "play": this.speed = 0; this.setImage("ball"); break;
      case "swipe": this.speed = 0; this.setImage("swipe"); break;
      default: this.speed = 0; this.setImage("idle");
    }
  };

  Pet.prototype.chooseTarget = function () {
    var margin = 10;
    var minX = margin;
    var maxX = Math.max(minX, window.innerWidth - this.entry.width - margin);
    this.targetX = minX + Math.random() * (maxX - minX);
    this.direction = this.targetX > this.x ? 1 : -1;
  };

  Pet.prototype.think = function (time) {
    if (time < this.nextAction || time < this.lockedUntil) return;
    var r = Math.random();
    if (r < 0.13) {
      this.setState("sleep");
      this.nextAction = time + 5000 + Math.random() * 9000;
    } else if (r < 0.34) {
      this.setState("idle");
      this.nextAction = time + 1200 + Math.random() * 3000;
    } else if (r < 0.62) {
      this.chooseTarget();
      this.setState("walk");
      this.nextAction = time + 3500 + Math.random() * 4500;
    } else if (r < 0.82) {
      this.chooseTarget();
      this.setState("fast");
      this.nextAction = time + 2500 + Math.random() * 3000;
    } else {
      this.chooseTarget();
      this.setState("run");
      this.nextAction = time + 1500 + Math.random() * 2500;
    }
  };

  Pet.prototype.move = function () {
    if (this.state !== "walk" && this.state !== "fast" && this.state !== "run") return;
    var distance = this.targetX - this.x;
    if (Math.abs(distance) < 2) {
      this.x = this.targetX;
      this.setState("idle");
      this.nextAction = performance.now() + 800 + Math.random() * 2500;
      return;
    }
    this.direction = distance > 0 ? 1 : -1;
    this.x += this.direction * this.speed;
    var min = 10;
    var max = Math.max(min, window.innerWidth - this.entry.width - 10);
    if (this.x < min) { this.x = min; this.direction = 1; }
    if (this.x > max) { this.x = max; this.direction = -1; }
  };

  Pet.prototype.render = function () {
    this.el.style.left = this.x + "px";
    var flip = this.direction === 1 ? 1 : -1;
    this.el.style.setProperty("--flip", String(flip));
    this.el.style.transform = "scaleX(" + flip + ")";
    this.shadow.style.left = this.x + this.entry.width / 2 + "px";
  };

  Pet.prototype.update = function (time) {
    this.think(time);
    this.move();
    this.render();
  };

  Pet.prototype.destroy = function () {
    clearTimeout(this.reactionTimer);
    this.el.remove();
    this.shadow.remove();
    this.reactionEl.remove();
  };

  var FOX_LINES = [
    "Hai! 👋", "Halo kamu!", "Ada apa?", "Hehe 😄", "Kenapa tuh?", "👀",
    "Yap?", "Hmm?", "Apa nih?", "Jangan ganggu 😤", "Mau main?", "🐾",
    "Aku lihat kamu.", "Hah?", "Iya?", "Psst...", "Santai dulu.", "✨", "🦊",
    "Apa kabar?", "Jangan dipencet terus 😭", "Hehehe.", "Mau ikut?"
  ];
  var FOX_SCARED = ["AAAA! 😳", "EH?!", "JANGAN! 🦊", "Waduh!", "Kaget gue!", "WOI 😭", "Kaburrr!", "ASTAGA!"];
  var CHICKEN_QUOTES = ["HIDUP JOKOWII!!!", "SAYA AKAN LAWAN!!!", "MBG BERMANFAAT ATAU TIDAKK??", "Saya dapat laporan"];

  function showReaction(pet, text, duration) {
    duration = duration || 1400;
    clearTimeout(pet.reactionTimer);
    pet.reactionEl.textContent = text;
    var position = function () {
      var rect = pet.el.getBoundingClientRect();
      pet.reactionEl.style.left = rect.left + rect.width / 2 + "px";
      pet.reactionEl.style.top = rect.top - 12 + "px";
    };
    position();
    pet.reactionEl.classList.add("show");
    var start = performance.now();
    (function follow() {
      if (performance.now() - start > duration) return;
      position();
      requestAnimationFrame(follow);
    })();
    pet.reactionTimer = setTimeout(function () {
      pet.reactionEl.classList.remove("show");
    }, duration);
  }

  function handleClick(pet) {
    var isChicken = /ayam|chicken|🐔/i.test(pet.entry.name + " " + pet.entry.emoji);
    if (pet.state === "sleep") {
      pet.setState("idle");
      pet.nextAction = performance.now() + 1500 + Math.random() * 2500;
      showReaction(pet, randomItem(["Hah...? 😴", "Udah pagi?", "Lima menit lagi...", "Zzz... eh?", "Oh... kamu."]));
      return;
    }
    if (isChicken) {
      pet.el.classList.remove("clicked");
      void pet.el.offsetWidth;
      pet.el.classList.add("clicked");
      var quote = randomItem(CHICKEN_QUOTES);
      showReaction(pet, quote, 2200);
      pet.setState("swipe");
      pet.lockedUntil = performance.now() + 1000;
      setTimeout(function () {
        if (pet.state === "swipe") pet.setState("idle");
      }, 1100);
      if (quote === "MBG BERMANFAAT ATAU TIDAKK??") {
        pets.forEach(function (other, i) {
          if (other === pet || other.state === "sleep") return;
          setTimeout(function () {
            other.setState("swipe");
            showReaction(other, i % 2 ? "TIDAKK!" : "TIDAKK", 1800);
            other.lockedUntil = performance.now() + 1800;
          }, 550 + i * 200);
        });
      }
      return;
    }
    if (Math.random() < 0.3) {
      pet.setState("run");
      pet.targetX = Math.random() > 0.5 ? Math.max(10, window.innerWidth - pet.entry.width - 10) : 10;
      pet.direction = pet.targetX > pet.x ? 1 : -1;
      pet.lockedUntil = performance.now() + 1800;
      showReaction(pet, randomItem(FOX_SCARED));
      return;
    }
    pet.el.classList.remove("clicked");
    void pet.el.offsetWidth;
    pet.el.classList.add("clicked");
    showReaction(pet, randomItem(FOX_LINES));
    pet.setState("swipe");
    pet.lockedUntil = performance.now() + 1000;
    setTimeout(function () {
      if (pet.state === "swipe") {
        pet.setState("idle");
        pet.nextAction = performance.now() + 1000 + Math.random() * 3000;
      }
    }, 1100);
  }

  var interactionCooldown = 0;
  function interaction(time) {
    if (time < interactionCooldown || pets.length < 2) return;
    var a = pets[0];
    var b = pets[1];
    if (a.state === "sleep" || b.state === "sleep") return;
    if (Math.abs(a.x - b.x) < 180 && Math.random() < 0.003) {
      a.setState("play");
      b.setState("play");
      a.lockedUntil = time + 3500;
      b.lockedUntil = time + 3500;
      interactionCooldown = time + 7000;
      setTimeout(function () {
        a.chooseTarget();
        b.chooseTarget();
        a.setState("run");
        setTimeout(function () { b.setState("walk"); }, 250);
      }, 3500);
    }
  }

  function applyNight() {
    world.classList.toggle("night", isNight);
    world.classList.toggle("day", !isNight);
    if (nightButton) {
      nightButton.innerHTML = isNight
        ? '<span class="ms">light_mode</span>'
        : '<span class="ms">dark_mode</span>';
      nightButton.title = isNight ? "Siang (N)" : "Malam (N)";
    }
    config.world.night = isNight;
    PetStore.save(config);
  }

  function toggleNight() {
    isNight = !isNight;
    applyNight();
  }

  function applyTheme() {
    // Shared store wins when reachable (course-page iframe shares the LMS
    // origin, so localStorage matches the popup). Standalone file:// keeps
    // the pet's own config.world.theme via local THEMES fallback.
    var name = config.world.theme || "sunset";
    if (window.MentariM3 && window.MentariM3.getTheme) {
      try {
        var shared = window.MentariM3.getTheme();
        if (shared) name = shared;
      } catch (_) {}
    }
    var theme = THEMES[name];
    Object.keys(THEME_VAR).forEach(function (key) {
      if (theme) document.documentElement.style.setProperty(THEME_VAR[key], theme[key]);
      else document.documentElement.style.removeProperty(THEME_VAR[key]);
    });
    var sel = document.getElementById("themeSelect");
    if (sel) sel.value = theme ? name : "sunset";
  }

  function setTheme(name) {
    if (!THEMES[name]) name = "sunset";
    config.world.theme = name;
    PetStore.save(config);
    if (window.MentariM3 && window.MentariM3.setTheme) {
      try { window.MentariM3.setTheme(name); } catch (_) {}
    }
    applyTheme();
  }

  function rebuild() {
    pets.forEach(function (p) { p.destroy(); });
    pets = config.pets.map(function (entry) { return new Pet(entry); });
    if (petCount) petCount.textContent = config.pets.length + " hewan";
    renderConfigList();
  }

  // ── configurator ──────────────────────────────────────────────
  function stateField(entry, key, label) {
    var wrap = document.createElement("div");
    wrap.className = "field";
    var lab = document.createElement("label");
    lab.textContent = label;
    var inp = document.createElement("input");
    inp.type = "url";
    inp.placeholder = key === "idle" ? "https://...gif / .png / .webp" : "kosong = ikut idle";
    inp.value = (entry.states && entry.states[key]) || "";
    inp.addEventListener("change", function () {
      entry.states = entry.states || {};
      entry.states[key] = inp.value.trim();
      PetStore.save(config);
      refreshPet(entry);
    });
    wrap.appendChild(lab);
    wrap.appendChild(inp);
    return wrap;
  }

  function refreshPet(entry) {
    var pet = null;
    pets.forEach(function (p) {
      if (p.entry.id === entry.id) pet = p;
    });
    if (!pet) return;
    pet.entry = entry;
    pet.el.style.width = entry.width + "px";
    pet.el.style.height = entry.width + "px";
    pet.fallback.textContent = entry.emoji || "🦊";
    pet.setImage(pet.state);
    pet.render();
  }

  function renderConfigList() {
    if (!petList) return;
    petList.innerHTML = "";
    if (!config.pets.length) {
      var empty = document.createElement("div");
      empty.className = "sub";
      empty.textContent = "Belum ada hewan. Tambah GIF atau gambar di bawah.";
      petList.appendChild(empty);
    }
    config.pets.forEach(function (entry) {
      var card = document.createElement("div");
      card.className = "pet-card";

      var head = document.createElement("div");
      head.className = "pet-card-head";
      var title = document.createElement("strong");
      title.textContent = (entry.emoji || "") + " " + entry.name;
      var del = document.createElement("button");
      del.className = "btn btn-danger btn-sm";
      del.textContent = "Hapus";
      del.addEventListener("click", function () {
        config.pets = config.pets.filter(function (e) { return e.id !== entry.id; });
        PetStore.save(config);
        rebuild();
      });
      head.appendChild(title);
      head.appendChild(del);
      card.appendChild(head);

      var row = document.createElement("div");
      row.className = "row";
      var nameF = document.createElement("div");
      nameF.className = "field";
      var nameL = document.createElement("label");
      nameL.textContent = "Nama";
      var nameI = document.createElement("input");
      nameI.value = entry.name;
      nameI.addEventListener("change", function () {
        entry.name = nameI.value.trim() || "Pet";
        PetStore.save(config);
        refreshPet(entry);
        renderConfigList();
      });
      nameF.appendChild(nameL);
      nameF.appendChild(nameI);
      var kindF = document.createElement("div");
      kindF.className = "field";
      var kindL = document.createElement("label");
      kindL.textContent = "Jenis";
      var kindS = document.createElement("select");
      ["gif", "image"].forEach(function (k) {
        var o = document.createElement("option");
        o.value = k;
        o.textContent = k === "gif" ? "GIF per gerakan" : "1 gambar statis";
        if (entry.kind === k) o.selected = true;
        kindS.appendChild(o);
      });
      kindS.addEventListener("change", function () {
        entry.kind = kindS.value;
        PetStore.save(config);
        refreshPet(entry);
        renderConfigList();
      });
      kindF.appendChild(kindL);
      kindF.appendChild(kindS);
      row.appendChild(nameF);
      row.appendChild(kindF);
      card.appendChild(row);

      var row2 = document.createElement("div");
      row2.className = "row";
      var wF = document.createElement("div");
      wF.className = "field";
      var wL = document.createElement("label");
      wL.textContent = "Ukuran (px)";
      var wI = document.createElement("input");
      wI.type = "number";
      wI.min = "24";
      wI.max = "320";
      wI.value = String(entry.width || 110);
      wI.addEventListener("change", function () {
        entry.width = Math.min(320, Math.max(24, parseInt(wI.value, 10) || 110));
        PetStore.save(config);
        refreshPet(entry);
      });
      wF.appendChild(wL);
      wF.appendChild(wI);
      var sF = document.createElement("div");
      sF.className = "field";
      var sL = document.createElement("label");
      sL.textContent = "Kecepatan";
      var sI = document.createElement("input");
      sI.type = "number";
      sI.min = "0.2";
      sI.max = "4";
      sI.step = "0.1";
      sI.value = String(entry.speed || 1);
      sI.addEventListener("change", function () {
        entry.speed = Math.min(4, Math.max(0.2, parseFloat(sI.value) || 1));
        PetStore.save(config);
      });
      sF.appendChild(sL);
      sF.appendChild(sI);
      var eF = document.createElement("div");
      eF.className = "field";
      var eL = document.createElement("label");
      eL.textContent = "Emoji cadangan";
      var eI = document.createElement("input");
      eI.value = entry.emoji || "";
      eI.addEventListener("change", function () {
        entry.emoji = eI.value.trim() || "🦊";
        PetStore.save(config);
        refreshPet(entry);
      });
      eF.appendChild(eL);
      eF.appendChild(eI);
      row2.appendChild(wF);
      row2.appendChild(sF);
      row2.appendChild(eF);
      card.appendChild(row2);

      var grid = document.createElement("div");
      grid.className = "state-grid";
      var labels = { idle: "Diam (idle) *", walk: "Jalan", walkFast: "Jalan cepat", run: "Lari", lie: "Tidur", swipe: "Disentuh", ball: "Main bola" };
      STATES.forEach(function (key) {
        if (entry.kind === "image" && key !== "idle") return;
        grid.appendChild(stateField(entry, key, labels[key]));
      });
      card.appendChild(grid);
      if (entry.kind === "image") {
        var note = document.createElement("div");
        note.className = "sub";
        note.style.margin = "4px 0 0";
        note.textContent = "Mode gambar: satu URL dipakai untuk semua gerakan.";
        card.appendChild(note);
      }
      petList.appendChild(card);
    });
  }

  function addPet(kind) {
    var entry = {
      id: uid(),
      name: kind === "image" ? "Gambar " + (config.pets.length + 1) : "GIF " + (config.pets.length + 1),
      kind: kind,
      width: kind === "image" ? 90 : 110,
      speed: 1,
      emoji: kind === "image" ? "🖼️" : "🦊",
      states: { idle: "", walk: "", walkFast: "", run: "", lie: "", swipe: "", ball: "" }
    };
    config.pets.push(entry);
    PetStore.save(config);
    rebuild();
  }

  function openConfig() {
    renderConfigList();
    configScrim.classList.add("open");
  }
  function closeConfig() {
    configScrim.classList.remove("open");
  }

  if (configButton) configButton.addEventListener("click", openConfig);
  if (configScrim) {
    configScrim.addEventListener("click", function (e) {
      if (e.target === configScrim) closeConfig();
    });
  }
  var closeBtn = document.getElementById("closeConfig");
  if (closeBtn) closeBtn.addEventListener("click", closeConfig);
  var themeSel = document.getElementById("themeSelect");
  if (themeSel) {
    themeSel.addEventListener("change", function () {
      setTheme(themeSel.value);
    });
  }
  var addGif = document.getElementById("addGifPet");
  if (addGif) addGif.addEventListener("click", function () { addPet("gif"); });
  var addImg = document.getElementById("addImgPet");
  if (addImg) addImg.addEventListener("click", function () { addPet("image"); });
  var resetBtn = document.getElementById("resetPets");
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      config = PetStore.reset();
      isNight = !!config.world.night;
      applyNight();
      applyTheme();
      rebuild();
    });
  }

  if (nightButton) nightButton.addEventListener("click", toggleNight);
  document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() === "n") toggleNight();
    if (e.key === "Escape") closeConfig();
  });

  window.addEventListener("resize", function () {
    pets.forEach(function (p) {
      p.x = Math.min(p.x, window.innerWidth - p.entry.width - 10);
    });
  });

  // Host/iframe bridge: { type:'mentari-pet', action:'set'|'add'|'reset'|'theme', config?, pet?, theme? }
  window.addEventListener("message", function (e) {
    var msg = e.data;
    if (!msg || msg.type !== "mentari-pet") return;
    if (msg.action === "reset") {
      config = PetStore.reset();
      isNight = !!config.world.night;
      applyNight();
      applyTheme();
      rebuild();
    } else if (msg.action === "theme" && msg.theme) {
      setTheme(msg.theme);
    } else if (msg.action === "set" && msg.config && Array.isArray(msg.config.pets)) {
      if (!msg.config.world || !msg.config.world.theme) {
        msg.config.world = msg.config.world || {};
        msg.config.world.theme = "sunset";
      }
      config = msg.config;
      PetStore.save(config);
      applyTheme();
      rebuild();
    } else if (msg.action === "add" && msg.pet) {
      msg.pet.id = msg.pet.id || uid();
      config.pets.push(msg.pet);
      PetStore.save(config);
      rebuild();
    }
  });

  window.MentariPet = {
    getConfig: function () { return config; },
    saveConfig: function (cfg) {
      config = cfg;
      PetStore.save(config);
      applyTheme();
      rebuild();
    },
    addPet: addPet,
    setTheme: setTheme,
    themes: Object.keys(THEMES),
    reset: function () {
      config = PetStore.reset();
      applyTheme();
      rebuild();
    }
  };

  createStars();
  createGrassBlades();
  applyNight();
  applyTheme();
  rebuild();

  function loop(time) {
    for (var i = 0; i < pets.length; i++) pets[i].update(time);
    interaction(time);
    requestAnimationFrame(loop);
  }
  pets.forEach(function (p) { p.setState("idle"); });
  requestAnimationFrame(loop);
})();
