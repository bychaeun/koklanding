(() => {
  const root = document.documentElement;
  const storageKey = "kokkok-theme";
  const media = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;
  let lastPointerAt = 0;

  const normalize = value => value === "dark" || value === "light" ? value : null;
  const systemTheme = () => media && media.matches ? "dark" : "light";

  function readCookie() {
    const match = document.cookie.match(new RegExp("(?:^|; )" + storageKey + "=([^;]*)"));
    return match ? normalize(decodeURIComponent(match[1])) : null;
  }

  function readStored() {
    try {
      return normalize(localStorage.getItem(storageKey)) ||
             normalize(sessionStorage.getItem(storageKey)) ||
             readCookie();
    } catch (error) {
      return readCookie();
    }
  }

  function readQuery() {
    try {
      return normalize(new URLSearchParams(location.search).get("theme"));
    } catch (error) {
      return null;
    }
  }

  function saveTheme(theme) {
    try { localStorage.setItem(storageKey, theme); } catch (error) {}
    try { sessionStorage.setItem(storageKey, theme); } catch (error) {}
    try {
      document.cookie = storageKey + "=" + encodeURIComponent(theme) + "; path=/; max-age=31536000; SameSite=Lax";
    } catch (error) {}
  }

  function syncColorScheme(theme) {
    let meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "color-scheme";
      document.head && document.head.appendChild(meta);
    }

    meta.content = theme;
    root.style.colorScheme = theme;
    if (document.body) document.body.style.colorScheme = theme;
  }

  function syncButton(theme) {
    const button = document.getElementById("themeToggle");
    if (!button) return;

    const isDark = theme === "dark";
    button.dataset.mode = theme;
    button.dataset.theme = theme;
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
    button.setAttribute("title", isDark ? "라이트 모드로 전환" : "다크 모드로 전환");
  }

  function applyTheme(theme, options = {}) {
    const next = normalize(theme) || systemTheme();
    const prev = next === "dark" ? "light" : "dark";

    root.classList.remove("theme-" + prev);
    root.classList.add("theme-" + next);
    root.dataset.theme = next;
    root.setAttribute("data-forced-theme", options.forced ? "true" : "false");

    if (document.body) {
      document.body.classList.remove("theme-" + prev);
      document.body.classList.add("theme-" + next);
      document.body.dataset.theme = next;
      document.body.setAttribute("data-forced-theme", options.forced ? "true" : "false");
    }

    syncColorScheme(next);
    syncButton(next);

    if (options.persist) saveTheme(next);

    // 모바일/카톡 인앱브라우저에서 스타일 반영이 한 프레임 늦는 경우가 있어 2회 재적용
    requestAnimationFrame(() => {
      root.classList.remove("theme-" + prev);
      root.classList.add("theme-" + next);
      root.dataset.theme = next;
      root.style.colorScheme = next;

      if (document.body) {
        document.body.classList.remove("theme-" + prev);
        document.body.classList.add("theme-" + next);
        document.body.dataset.theme = next;
        document.body.style.colorScheme = next;
      }

      syncButton(next);
    });

    window.setTimeout(() => {
      root.classList.remove("theme-" + prev);
      root.classList.add("theme-" + next);
      root.dataset.theme = next;
      syncButton(next);
    }, 80);
  }

  function currentTheme() {
    return normalize(root.dataset.theme) ||
           (root.classList.contains("theme-dark") ? "dark" : null) ||
           (root.classList.contains("theme-light") ? "light" : null) ||
           readStored() ||
           systemTheme();
  }

  function forceToggle(event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
    }

    const now = Date.now();
    if (now - lastPointerAt < 280) return;
    lastPointerAt = now;

    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next, { persist: true, forced: true });
  }

  function bindToggle() {
    const button = document.getElementById("themeToggle");
    if (!button || button.dataset.themeForceBound === "true") return;

    button.dataset.themeForceBound = "true";

    // capture 단계에서 먼저 잡아 모바일 인앱 브라우저/기존 이벤트 충돌 방지
    button.addEventListener("pointerup", forceToggle, { capture: true });
    button.addEventListener("touchend", forceToggle, { passive: false, capture: true });
    button.addEventListener("click", forceToggle, { capture: true });

    syncButton(currentTheme());
  }

  function init() {
    const manual = readQuery() || readStored();
    applyTheme(manual || systemTheme(), { persist: false, forced: Boolean(manual) });
    bindToggle();
  }

  init();

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }

  window.addEventListener("pageshow", init);
  window.addEventListener("load", init, { once: true });

  // 저장된 수동 선택이 있으면 시스템 테마 변경보다 수동 테마가 우선
  const onSystemChange = () => {
    if (!readStored() && !readQuery()) {
      applyTheme(systemTheme(), { persist: false, forced: false });
    }
  };

  if (media?.addEventListener) {
    media.addEventListener("change", onSystemChange);
  } else if (media?.addListener) {
    media.addListener(onSystemChange);
  }
})();
