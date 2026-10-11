/* MentariM3 — shared Material Design 3 (Expressive, 2025) foundation.
 * Single source of truth for every Mentari Mod UI surface.
 * Dark-first; light scheme via `.mm-light` on the component root.
 * All classes are `mm-*` prefixed so nothing leaks into the host LMS page.
 * Loaded FIRST in every content_scripts block (see manifest.json).
 */
(function () {
  if (window.MentariM3) return;

  var FONT_ID = "mentari-m3-font";
  var STYLE_ID = "mentari-m3-styles";

  var CSS = [
    ":root{",
    "--mm-seed:#f0872d;",
    "--mm-primary:#ffb871;--mm-on-primary:#502400;",
    "--mm-primary-container:#723a00;--mm-on-primary-container:#ffdcbe;",
    "--mm-secondary:#d8c2ab;--mm-on-secondary:#3e2d1f;",
    "--mm-secondary-container:#55442f;--mm-on-secondary-container:#f5dfcb;",
    "--mm-tertiary:#93ccff;--mm-on-tertiary:#003352;",
    "--mm-tertiary-container:#004a75;--mm-on-tertiary-container:#cde5ff;",
    "--mm-error:#f2b8b5;--mm-on-error:#601410;",
    "--mm-error-container:#8c1d18;--mm-on-error-container:#f9dedc;",
    "--mm-surface:#141218;--mm-on-surface:#e6e0e9;",
    "--mm-surface-variant:#49454f;--mm-on-surface-variant:#cac4d0;",
    "--mm-surface-lowest:#0f0d13;--mm-surface-low:#1d1b20;",
    "--mm-surface-container:#211f26;--mm-surface-high:#2b2930;--mm-surface-highest:#36343b;",
    "--mm-outline:#938f99;--mm-outline-variant:#49454f;",
    "--mm-scrim:rgba(0,0,0,.55);",
    "--mm-font:'Roboto','Inter',system-ui,-apple-system,'Segoe UI',sans-serif;",
    "--mm-shape-xs:4px;--mm-shape-s:8px;--mm-shape-m:12px;",
    "--mm-shape-l:16px;--mm-shape-xl:28px;--mm-shape-full:9999px;",
    "--mm-ease-emphasized:cubic-bezier(.05,.7,.1,1);--mm-ease-standard:cubic-bezier(.2,0,0,1);",
    "--mm-dur-short:150ms;--mm-dur-med:300ms;--mm-dur-long:500ms;",
    "}",
    ".mm-light{",
    "--mm-primary:#964f00;--mm-on-primary:#fff;",
    "--mm-primary-container:#ffdcbe;--mm-on-primary-container:#331900;",
    "--mm-secondary:#6f5b45;--mm-on-secondary:#fff;",
    "--mm-secondary-container:#f5dfcb;--mm-on-secondary-container:#291806;",
    "--mm-tertiary:#2f628c;--mm-on-tertiary:#fff;",
    "--mm-tertiary-container:#cde5ff;--mm-on-tertiary-container:#0a2e4e;",
    "--mm-error:#b3261e;--mm-on-error:#fff;",
    "--mm-error-container:#f9dedc;--mm-on-error-container:#410002;",
    "--mm-surface:#fef7ff;--mm-on-surface:#1d1b20;",
    "--mm-surface-variant:#e7e0ec;--mm-on-surface-variant:#49454f;",
    "--mm-surface-lowest:#fff;--mm-surface-low:#f7f2fa;",
    "--mm-surface-container:#f3edf7;--mm-surface-high:#ece6f0;--mm-surface-highest:#e6e0e9;",
    "--mm-outline:#79747e;--mm-outline-variant:#cac4d0;",
    "--mm-scrim:rgba(20,15,5,.45);",
    "}",
    ".mm{font-family:var(--mm-font);color:var(--mm-on-surface);}",
    ".mm *,.mm *::before,.mm *::after{box-sizing:border-box;}",
    ".mm-scroll::-webkit-scrollbar{width:6px;height:6px;}",
    ".mm-scroll::-webkit-scrollbar-track{background:transparent;}",
    ".mm-scroll::-webkit-scrollbar-thumb{background:var(--mm-outline-variant);border-radius:var(--mm-shape-full);}",
    ".ms{font-family:'Material Symbols Rounded';font-size:20px;font-style:normal;font-weight:400;line-height:1;display:inline-flex;align-items:center;vertical-align:middle;user-select:none;letter-spacing:normal;text-transform:none;white-space:nowrap;}",
    ".mm-topbar{display:flex;align-items:center;gap:12px;padding:12px 16px;background:var(--mm-surface-container);border-bottom:1px solid var(--mm-outline-variant);}",
    ".mm-headline{margin:0;font-size:22px;line-height:28px;font-weight:400;color:var(--mm-on-surface);}",
    ".mm-title{margin:0;font-size:16px;line-height:24px;letter-spacing:.15px;font-weight:500;}",
    ".mm-subtitle{font-size:12px;line-height:16px;letter-spacing:.4px;color:var(--mm-on-surface-variant);}",
    ".mm-eyebrow{font-size:11px;line-height:16px;letter-spacing:.5px;font-weight:500;text-transform:uppercase;color:var(--mm-primary);}",
    ".mm-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 24px;border-radius:var(--mm-shape-full);border:0;cursor:pointer;font:inherit;font-size:14px;font-weight:500;letter-spacing:.1px;background:var(--mm-primary);color:var(--mm-on-primary);transition:transform var(--mm-dur-short) var(--mm-ease-standard),box-shadow var(--mm-dur-short),background var(--mm-dur-short),border-radius var(--mm-dur-med) var(--mm-ease-emphasized);text-decoration:none;}",
    ".mm-btn:hover{box-shadow:0 1px 3px rgba(0,0,0,.35);filter:brightness(1.07);}",
    ".mm-btn:active{transform:scale(.97);border-radius:12px;}",
    ".mm-btn:disabled{opacity:.38;cursor:default;box-shadow:none;}",
    ".mm-btn-sm{min-height:32px;padding:0 16px;font-size:12px;}",
    ".mm-btn-md{min-height:56px;padding:0 28px;font-size:15px;}",
    ".mm-btn-tonal{background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);}",
    ".mm-btn-outline{background:transparent;color:var(--mm-primary);border:1px solid var(--mm-outline);}",
    ".mm-btn-text{background:transparent;color:var(--mm-primary);padding:0 12px;}",
    ".mm-btn-error{background:var(--mm-error);color:var(--mm-on-error);}",
    ".mm-btn-elevated{background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);box-shadow:0 2px 6px rgba(0,0,0,.35);}",
    ".mm-btn .ms{font-size:18px;}",
    ".mm-btn-toggle.mm-btn-on{border-radius:8px;}",
    ".mm-icon-btn{position:relative;display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;min-width:48px;min-height:48px;border-radius:var(--mm-shape-full);border:0;background:transparent;color:var(--mm-on-surface-variant);cursor:pointer;transition:background var(--mm-dur-short),color var(--mm-dur-short);}",
    ".mm-icon-btn:hover{color:var(--mm-on-surface);}",
    ".mm-icon-btn-filled{background:var(--mm-primary);color:var(--mm-on-primary);}",
    ".mm-icon-btn-tonal{background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);}",
    ".mm-icon-btn-outlined{border:1px solid var(--mm-outline-variant);}",
    ".mm-icon-btn-xs{width:32px;height:32px;}",
    ".mm-icon-btn-md{width:56px;height:56px;}",
    ".mm-icon-btn-lg{width:96px;height:96px;}",
    ".mm-icon-btn-xl{width:136px;height:136px;}",
    ".mm-icon-btn-xs::after,.mm-icon-btn-sm::after{content:'';position:absolute;inset:-4px;}",
    ".mm-icon-btn-toggle[aria-pressed='true']{background:var(--mm-primary);color:var(--mm-on-primary);font-weight:700;}",
    ".mm-fab{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-width:56px;height:56px;padding:0 20px;border-radius:var(--mm-shape-l);border:0;cursor:pointer;background:var(--mm-primary-container);color:var(--mm-on-primary-container);box-shadow:0 4px 12px rgba(0,0,0,.35);font:inherit;font-size:14px;font-weight:500;transition:transform var(--mm-dur-med) var(--mm-ease-emphasized),box-shadow var(--mm-dur-short);}",
    ".mm-fab:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,.4);}",
    ".mm-chip{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:var(--mm-shape-s);background:var(--mm-surface-high);color:var(--mm-on-surface-variant);border:1px solid var(--mm-outline-variant);font-size:12px;font-weight:500;}",
    ".mm-chip .ms{font-size:16px;}",
    ".mm-chip-on{background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);border-color:transparent;}",
    ".mm-chip-ok{background:var(--mm-tertiary-container);color:var(--mm-on-tertiary-container);border-color:transparent;}",
    ".mm-chip-warn{background:var(--mm-primary-container);color:var(--mm-on-primary-container);border-color:transparent;}",
    ".mm-chip-err{background:var(--mm-error-container);color:var(--mm-on-error-container);border-color:transparent;}",
    ".mm-badge{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;padding:0 4px;border-radius:var(--mm-shape-full);background:var(--mm-error);color:var(--mm-on-error);font-size:11px;font-weight:500;}",
    ".mm-card{background:var(--mm-surface-container);color:var(--mm-on-surface);border-radius:var(--mm-shape-m);border:1px solid transparent;overflow:hidden;}",
    ".mm-card-elev{background:var(--mm-surface-low);box-shadow:0 1px 3px rgba(0,0,0,.3),0 4px 12px rgba(0,0,0,.25);}",
    ".mm-card-outline{background:var(--mm-surface);border-color:var(--mm-outline-variant);}",
    ".mm-card-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 16px;background:var(--mm-surface-high);border-bottom:1px solid var(--mm-outline-variant);}",
    ".mm-card-body{padding:12px 16px;}",
    ".mm-list{display:flex;flex-direction:column;gap:4px;padding:8px;}",
    ".mm-list-item{display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--mm-shape-s);background:var(--mm-surface-high);border:1px solid var(--mm-outline-variant);transition:background var(--mm-dur-short);}",
    ".mm-list-item:hover{background:var(--mm-surface-highest);}",
    ".mm-list-item .mm-lead{width:36px;height:36px;flex-shrink:0;border-radius:var(--mm-shape-s);display:flex;align-items:center;justify-content:center;background:var(--mm-tertiary-container);color:var(--mm-on-tertiary-container);}",
    ".mm-list-item .mm-lead .ms{font-size:20px;}",
    ".mm-list-main{flex:1;min-width:0;}",
    ".mm-list-title{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}",
    ".mm-list-sub{font-size:11px;color:var(--mm-on-surface-variant);display:flex;gap:8px;align-items:center;flex-wrap:wrap;}",
    ".mm-divider{height:1px;background:var(--mm-outline-variant);margin:8px 0;border:0;}",
    ".mm-tabs,.mm-cbg{display:flex;width:100%;gap:2px;padding:0;background:transparent;border:0;}",
    ".mm-tab,.mm-cbg-btn{flex:1 1 0;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:40px;padding:0 12px;border:0;border-radius:9999px;background:transparent;color:var(--mm-on-surface-variant);cursor:pointer;font:inherit;font-size:13px;font-weight:500;transition:background var(--mm-dur-short),color var(--mm-dur-short),border-radius var(--mm-dur-med) var(--mm-ease-emphasized);}",
    ".mm-tab:hover,.mm-cbg-btn:hover{color:var(--mm-on-surface);}",
    ".mm-tab:active,.mm-cbg-btn:active{border-radius:8px;}",
    ".mm-tab-on,.mm-cbg-on{background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);font-weight:700;border-radius:8px;}",
    ".mm-tab .ms,.mm-cbg-btn .ms{font-size:18px;}",
    ".mm-field{display:flex;flex-direction:column;gap:6px;}",
    ".mm-label{font-size:12px;font-weight:500;letter-spacing:.4px;color:var(--mm-on-surface-variant);}",
    ".mm-input,.mm-select,.mm-textarea{width:100%;font:inherit;font-size:14px;color:var(--mm-on-surface);background:var(--mm-surface-high);border:1px solid var(--mm-outline);border-radius:var(--mm-shape-xs);padding:10px 12px;outline:none;transition:border-color var(--mm-dur-short),box-shadow var(--mm-dur-short);}",
    ".mm-input:focus,.mm-select:focus,.mm-textarea:focus{border-color:var(--mm-primary);box-shadow:0 0 0 1px var(--mm-primary);}",
    ".mm-hint{font-size:11px;color:var(--mm-on-surface-variant);}",
    ".mm-hint-err{color:var(--mm-error);}",
    ".mm-switch{position:relative;display:inline-block;width:52px;height:32px;flex-shrink:0;}",
    ".mm-switch input{opacity:0;width:0;height:0;}",
    ".mm-track{position:absolute;inset:0;cursor:pointer;border-radius:var(--mm-shape-full);background:var(--mm-surface-highest);border:2px solid var(--mm-outline);transition:background var(--mm-dur-short),border-color var(--mm-dur-short);}",
    ".mm-track::before{content:'';position:absolute;width:16px;height:16px;left:4px;top:4px;border-radius:50%;background:var(--mm-outline);transition:transform var(--mm-dur-med) var(--mm-ease-emphasized),background var(--mm-dur-short);}",
    ".mm-switch input:checked+.mm-track{background:var(--mm-primary);border-color:var(--mm-primary);}",
    ".mm-switch input:checked+.mm-track::before{transform:translateX(20px);background:var(--mm-on-primary);}",
    ".mm-linear{position:relative;height:4px;border-radius:var(--mm-shape-full);background:var(--mm-surface-highest);overflow:hidden;}",
    ".mm-linear>i{display:block;height:100%;border-radius:inherit;background:var(--mm-primary);transition:width var(--mm-dur-med) var(--mm-ease-standard);}",
    ".mm-linear-ind>i{position:absolute;top:0;left:0;width:30%;animation:mm-ind 1.4s var(--mm-ease-standard) infinite;}",
    "@keyframes mm-ind{0%{transform:translateX(-100%);}100%{transform:translateX(350%);}}",
    ".mm-spin-ring{width:40px;height:40px;border-radius:50%;border:4px solid var(--mm-surface-highest);border-top-color:var(--mm-primary);animation:mm-spin .9s linear infinite;margin:0 auto;}",
    "@keyframes mm-spin{to{transform:rotate(360deg);}}",
    ".mm-scrim{position:fixed;inset:0;background:var(--mm-scrim);z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px;animation:mm-fade var(--mm-dur-med) var(--mm-ease-standard);}",
    ".mm-dialog{width:100%;max-width:420px;max-height:88vh;overflow:auto;background:var(--mm-surface-container);color:var(--mm-on-surface);border-radius:var(--mm-shape-xl);padding:24px;box-shadow:0 12px 40px rgba(0,0,0,.45);animation:mm-rise var(--mm-dur-med) var(--mm-ease-emphasized);}",
    ".mm-dialog-h{margin:0 0 4px;font-size:22px;line-height:28px;font-weight:400;}",
    ".mm-dialog-sub{font-size:14px;color:var(--mm-on-surface-variant);margin-bottom:16px;}",
    ".mm-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px;}",
    "@keyframes mm-fade{from{opacity:0;}}",
    "@keyframes mm-rise{from{opacity:0;transform:translateY(24px) scale(.96);}}",
    ".mm-snackbar{position:fixed;left:50%;bottom:24px;transform:translate(-50%,16px);z-index:100000;display:flex;align-items:center;gap:12px;max-width:min(92vw,480px);padding:12px 12px 12px 16px;border-radius:var(--mm-shape-xs);background:var(--mm-on-surface);color:var(--mm-surface);font-size:14px;box-shadow:0 6px 20px rgba(0,0,0,.4);opacity:0;pointer-events:none;transition:opacity var(--mm-dur-med),transform var(--mm-dur-med) var(--mm-ease-emphasized);}",
    ".mm-snackbar.mm-show{opacity:1;pointer-events:auto;transform:translate(-50%,0);}",
    ".mm-popup{position:fixed;z-index:99999;background:var(--mm-surface-container);color:var(--mm-on-surface);border-radius:var(--mm-shape-l);box-shadow:0 12px 40px rgba(0,0,0,.45);border:1px solid var(--mm-outline-variant);overflow:hidden;animation:mm-rise var(--mm-dur-med) var(--mm-ease-emphasized);}",
    ".mm-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:48px 20px;}",
    ".mm-empty .mm-empty-ic{width:72px;height:72px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);}",
    ".mm-empty .mm-empty-ic .ms{font-size:32px;}",
    ".mm-empty p{margin:0;font-size:12px;color:var(--mm-on-surface-variant);max-width:260px;}",
    ".mm-seg{display:inline-flex;gap:2px;padding:2px;border-radius:var(--mm-shape-full);border:1px solid var(--mm-outline-variant);background:var(--mm-surface-high);}",
    ".mm-seg button{border:0;background:transparent;color:var(--mm-on-surface-variant);font:inherit;font-size:12px;font-weight:500;min-width:36px;height:30px;padding:0 10px;border-radius:var(--mm-shape-full);cursor:pointer;}",
    ".mm-split{position:relative;display:inline-flex;width:100%;min-height:40px;border-radius:9999px;overflow:visible;background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);}",
    ".mm-split-lead{flex:1;display:inline-flex;align-items:center;gap:8px;min-width:0;padding:0 8px 0 16px;border:0;background:transparent;color:inherit;font:inherit;font-size:13px;font-weight:500;cursor:pointer;border-radius:9999px 0 0 9999px;}",
    ".mm-split-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;text-align:left;}",
    ".mm-split-lead .ms{font-size:18px;flex-shrink:0;}",
    ".mm-split-trail{display:inline-flex;align-items:center;justify-content:center;width:48px;flex-shrink:0;border:0;border-left:1px solid var(--mm-outline-variant);background:transparent;color:inherit;cursor:pointer;border-radius:0 9999px 9999px 0;}",
    ".mm-split-trail .ms{font-size:20px;transition:transform var(--mm-dur-med) var(--mm-ease-standard);}",
    ".mm-split.mm-open{border-radius:16px;}",
    ".mm-split.mm-open .mm-split-lead{border-radius:16px 0 0 16px;}",
    ".mm-split.mm-open .mm-split-trail{border-radius:0 16px 16px 0;}",
    ".mm-split.mm-open .mm-split-trail .ms{transform:rotate(180deg);}",
    ".mm-split-filled{background:var(--mm-primary);color:var(--mm-on-primary);}",
    ".mm-split-outline{background:transparent;color:var(--mm-primary);border:1px solid var(--mm-outline);}",
    ".mm-split-xs{min-height:32px;font-size:12px;}",
    ".mm-split-xs .mm-split-lead{font-size:12px;}",
    ".mm-split-md{min-height:56px;}",
    ".mm-split-md .mm-split-lead{font-size:15px;}",
    ".mm-menu{position:absolute;top:calc(100% + 4px);right:0;min-width:100%;max-height:220px;overflow:auto;z-index:200;background:var(--mm-surface-high);color:var(--mm-on-surface);border:1px solid var(--mm-outline-variant);border-radius:12px;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.4);}",
    ".mm-menu.mm-menu-leading{left:0;right:auto;}",
    ".mm-menu-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border:0;border-radius:8px;background:transparent;color:inherit;font:inherit;font-size:13px;cursor:pointer;text-align:left;}",
    ".mm-menu-item:hover{background:var(--mm-surface-highest);}",
    ".mm-menu-item.mm-menu-on{background:var(--mm-secondary-container);color:var(--mm-on-secondary-container);}",
    ".mm-menu-item .ms{font-size:18px;flex-shrink:0;}",
    ".custom-reply-select-btn.mm-open .ms{transform:rotate(180deg);}",
    ".custom-reply-select-btn .ms{transition:transform var(--mm-dur-med) var(--mm-ease-standard);}",
  ].join("\n");
  /* Shared stage/extension color themes (dark M3 schemes from user presets).
   * Canonical store is chrome.storage.local, so every Mentari surface agrees
   * regardless of origin: LMS content scripts, the extension popup, and the
   * pet stage iframe. localStorage is kept as a per-origin mirror/fallback for
   * pages where chrome.storage is unavailable. "sunset" is the built-in look
   * and clears all overrides. */
  var THEME_KEY = "mentari-m3-theme";
  var SHARED_THEME_KEY = "mentariTheme";
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

  var THEME_LABELS = {
    sunset: "Sunset (Bawaan)",
    rimba: "Rimba · Teal",
    anggrek: "Anggrek · Ungu",
    senja: "Senja · Olive",
    samudra: "Samudra · Biru",
    bata: "Bata · Terakota"
  };
  var currentTheme = "sunset";
  var themeListeners = [];

  function normalizeTheme(name) {
    return THEMES[name] ? name : "sunset";
  }
  function extStore() {
    try {
      var api = globalThis.browser || globalThis.chrome;
      return api && api.storage ? api.storage.local : null;
    } catch (_) {
      return null;
    }
  }
  function readSharedTheme(cb) {
    var store = extStore();
    if (!store) { cb(null); return; }
    try {
      store.get(SHARED_THEME_KEY, function (res) {
        cb(res ? res[SHARED_THEME_KEY] : null);
      });
    } catch (_) {
      cb(null);
    }
  }
  function writeSharedTheme(name) {
    var store = extStore();
    if (!store) return;
    var patch = {};
    patch[SHARED_THEME_KEY] = name;
    try { store.set(patch); } catch (_) {}
  }
  function emitTheme(name) {
    themeListeners.slice().forEach(function (fn) {
      try { fn(name); } catch (_) {}
    });
  }
  function commitTheme(name, fromShared) {
    name = normalizeTheme(name);
    if (!fromShared) writeSharedTheme(name);
    try { localStorage.setItem(THEME_KEY, name); } catch (_) {}
    if (name === currentTheme) return;
    currentTheme = name;
    applyStoredTheme();
    emitTheme(name);
  }
  /* Seed from the shared store, then keep this context live. When nothing
   * shared exists yet (first run after upgrade) the per-origin value seeds
   * it, so older installs migrate instead of snapping back to sunset. */
  function initTheme() {
    var local = "sunset";
    try { local = normalizeTheme(localStorage.getItem(THEME_KEY)); } catch (_) {}
    currentTheme = local;
    readSharedTheme(function (shared) {
      if (shared && THEMES[shared]) {
        if (shared !== currentTheme) commitTheme(shared, true);
      } else {
        writeSharedTheme(currentTheme);
      }
    });
    var store = extStore();
    if (store && store.onChanged) {
      store.onChanged.addListener(function (changes, area) {
        if (area !== "local" || !changes[SHARED_THEME_KEY]) return;
        commitTheme(changes[SHARED_THEME_KEY].newValue, true);
      });
    }
  }
  function getTheme() {
    return currentTheme;
  }
  function applyStoredTheme() {
    var theme = THEMES[currentTheme];
    var root = document.documentElement;
    if (!root || !root.style) return;
    Object.keys(THEME_VAR).forEach(function (key) {
      if (theme) root.style.setProperty(THEME_VAR[key], theme[key]);
      else root.style.removeProperty(THEME_VAR[key]);
    });
  }
  function setTheme(name) {
    commitTheme(name, false);
    return currentTheme;
  }
  function onThemeChange(fn) {
    themeListeners.push(fn);
    return function () {
      var i = themeListeners.indexOf(fn);
      if (i >= 0) themeListeners.splice(i, 1);
    };
  }

  function ensureFont() {
    if (document.getElementById(FONT_ID)) return;
    var l = document.createElement("link");
    l.id = FONT_ID;
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20,400,0,0&family=Roboto:wght@400;500;700&display=swap";
    document.head.appendChild(l);
  }

  function ensure() {
    ensureFont();
    applyStoredTheme();
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement("style");
    s.id = STYLE_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function isLight() {
    try {
      return document.querySelector(".css-1yxmbwk") !== null;
    } catch (_) {
      return false;
    }
  }

  function applyTheme(root) {
    if (!root) return;
    root.classList.toggle("mm-light", isLight());
  }

  var snackTimer = null;
  function snackbar(message, actionText, onAction, ms) {
    ensure();
    var bar = document.getElementById("mentari-m3-snackbar");
    if (!bar) {
      bar = document.createElement("div");
      bar.id = "mentari-m3-snackbar";
      bar.className = "mm-snackbar mm";
      bar.innerHTML = '<span class="mm-snack-msg"></span><button type="button" class="mm-snack-act" style="display:none"></button>';
      document.body.appendChild(bar);
    }
    bar.querySelector(".mm-snack-msg").textContent = message;
    var act = bar.querySelector(".mm-snack-act");
    if (actionText) {
      act.style.display = "";
      act.textContent = actionText;
      act.onclick = function () {
        bar.classList.remove("mm-show");
        if (onAction) onAction();
      };
    } else {
      act.style.display = "none";
      act.onclick = null;
    }
    clearTimeout(snackTimer);
    bar.classList.add("mm-show");
    snackTimer = setTimeout(function () {
      bar.classList.remove("mm-show");
    }, ms || 3200);
  }

  var splitDocBound = false;
  var openSplits = [];
  function bindSplitDocOnce() {
    if (splitDocBound) return;
    splitDocBound = true;
    document.addEventListener("pointerdown", function (e) {
      openSplits.slice().forEach(function (api) {
        if (!api.root.contains(e.target)) api.close(false);
      });
    });
  }

  function themeOptions() {
    var order = ["sunset", "rimba", "anggrek", "senja", "samudra", "bata"];
    var out = [];
    order.forEach(function (name) {
      if (THEME_LABELS[name]) out.push({ value: name, label: THEME_LABELS[name], icon: "palette" });
    });
    return out;
  }

  function createSplitButton(opts) {
    opts = opts || {};
    var color = opts.color || "tonal";
    var size = opts.size || "sm";
    var leadIcon = opts.leadIcon || "hub";
    var options = opts.options || [];
    var onPick = opts.onPick || function () {};
    var value = opts.value != null ? opts.value : (options[0] && options[0].value);

    var root = document.createElement("div");
    root.className = "mm-split mm-split-" + color + " mm-split-" + size;
    if (opts.id) root.id = opts.id;

    var lead = document.createElement("button");
    lead.type = "button";
    lead.className = "mm-split-lead";
    var leadIc = document.createElement("span");
    leadIc.className = "ms";
    leadIc.textContent = leadIcon;
    var leadLabel = document.createElement("span");
    leadLabel.className = "mm-split-label";
    lead.appendChild(leadIc);
    lead.appendChild(leadLabel);

    var trail = document.createElement("button");
    trail.type = "button";
    trail.className = "mm-split-trail";
    trail.setAttribute("aria-haspopup", "menu");
    trail.setAttribute("aria-expanded", "false");
    trail.setAttribute("aria-label", "Buka menu pilihan");
    trail.title = "Buka menu pilihan";
    var trailIc = document.createElement("span");
    trailIc.className = "ms";
    trailIc.textContent = "expand_more";
    trail.appendChild(trailIc);

    var menu = document.createElement("div");
    menu.className = "mm-menu mm-scroll" + (opts.menuAlign === "leading" ? " mm-menu-leading" : "");
    menu.setAttribute("role", "menu");
    menu.hidden = true;

    var items = [];
    function findOpt(v) {
      for (var i = 0; i < options.length; i++) if (options[i].value === v) return options[i];
      return null;
    }
    function setValue(v) {
      var opt = findOpt(v) || options[0];
      if (!opt) return v;
      value = opt.value;
      leadLabel.textContent = opt.label;
      if (opt.icon) leadIc.textContent = opt.icon;
      items.forEach(function (it) {
        var on = it._opt.value === value;
        it.classList.toggle("mm-menu-on", on);
        it.setAttribute("aria-checked", on ? "true" : "false");
      });
      return value;
    }
    function isOpen() { return !menu.hidden; }
    function open() {
      menu.hidden = false;
      root.classList.add("mm-open");
      trail.setAttribute("aria-expanded", "true");
      bindSplitDocOnce();
      if (openSplits.indexOf(api) < 0) openSplits.push(api);
    }
    function close(focusTrail) {
      menu.hidden = true;
      root.classList.remove("mm-open");
      trail.setAttribute("aria-expanded", "false");
      var i = openSplits.indexOf(api);
      if (i >= 0) openSplits.splice(i, 1);
      if (focusTrail) { try { trail.focus(); } catch (_) {} }
    }
    options.forEach(function (opt) {
      var it = document.createElement("button");
      it.type = "button";
      it.className = "mm-menu-item";
      it.setAttribute("role", "menuitemradio");
      it.setAttribute("aria-checked", "false");
      it._opt = opt;
      if (opt.icon) {
        var ic = document.createElement("span");
        ic.className = "ms";
        ic.textContent = opt.icon;
        it.appendChild(ic);
      }
      var lb = document.createElement("span");
      lb.textContent = opt.label;
      it.appendChild(lb);
      it.addEventListener("click", function (e) {
        e.stopPropagation();
        setValue(opt.value);
        close(false);
        onPick(opt.value, opt);
      });
      menu.appendChild(it);
      items.push(it);
    });
    trail.addEventListener("click", function (e) {
      e.stopPropagation();
      if (isOpen()) close(false); else open();
    });
    lead.addEventListener("click", function (e) {
      e.stopPropagation();
      var opt = findOpt(value) || options[0];
      onPick(value, opt);
    });
    root.addEventListener("keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { e.stopPropagation(); close(true); return; }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      var idx = 0;
      items.forEach(function (it, i) { if (it._opt.value === value) idx = i; });
      idx = e.key === "ArrowDown" ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      if (items[idx]) items[idx].focus();
    });
    root.appendChild(lead);
    root.appendChild(trail);
    root.appendChild(menu);
    setValue(value);

    var api = {
      root: root, lead: lead, trail: trail, menu: menu,
      getValue: function () { return value; },
      setValue: setValue, open: open, close: close, isOpen: isOpen
    };
    return api;
  }


  window.MentariM3 = {
    ensure: ensure,
    isLight: isLight,
    applyTheme: applyTheme,
    snackbar: snackbar,
    getTheme: getTheme,
    setTheme: setTheme,
    applyStoredTheme: applyStoredTheme,
    onThemeChange: onThemeChange,
    themeLabels: THEME_LABELS,
    themes: Object.keys(THEMES),
    themeOptions: themeOptions,
    createSplitButton: createSplitButton,
    CSS: CSS
  };

  initTheme();
})();
