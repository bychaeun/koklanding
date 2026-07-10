/* Core landing interactions */

(() => {
  const campaign = window.KOKKOK_CAMPAIGN || {};
  const deadline = new Date(campaign.deadlineAt || "2026-07-31T23:59:59").getTime();
  const pad = value => String(value).padStart(2, "0");
  const isMobile = () => window.matchMedia("(max-width: 760px)").matches;
  document.querySelectorAll('a[href*="docs.google.com/forms"]').forEach(link => {
    if (campaign.formUrl) link.href = campaign.formUrl;
  });
  const setCampaignText = (selector, value) => {
    if (value === undefined || value === null || value === "") return;
    document.querySelectorAll(selector).forEach(el => {
      el.textContent = value;
    });
  };
  const setCampaignHref = (selector, value) => {
    if (!value) return;
    document.querySelectorAll(selector).forEach(el => {
      el.href = value;
    });
  };
  const phoneHref = phone => `tel:${String(phone || "").replace(/[^\d+]/g, "")}`;
  function applyCampaignConfig() {
    const cohort = campaign.cohort || "4기";
    const scheduleDays = campaign.scheduleDays || "매주 수·목요일";
    const scheduleDaysShort = scheduleDays.replace(/^매주\s*/, "");
    setCampaignText("[data-campaign-cohort]", cohort);
    setCampaignText("[data-hero-badge]", `천안·아산 개발사업 실전 분석 클래스 · ${cohort} 모집`);
    setCampaignText("[data-apply-short]", `${cohort} 신청`);
    setCampaignText("[data-apply-full]", `${cohort} 수강 신청하기 →`);
    setCampaignText("[data-open-period]", campaign.openPeriod);
    setCampaignText("[data-course-weeks]", campaign.courseWeeks);
    setCampaignText("[data-course-count]", campaign.courseCount);
    setCampaignText("[data-schedule-days]", scheduleDays);
    setCampaignText("[data-schedule-days-short]", scheduleDaysShort);
    setCampaignText("[data-schedule-time]", campaign.scheduleTime);
    setCampaignText("[data-schedule-end-time]", campaign.scheduleEndTime);
    setCampaignText("[data-tuition]", campaign.tuition);
    setCampaignText("[data-tuition-note]", campaign.tuitionNote);
    setCampaignText("[data-tuition-note-suffix]", campaign.tuitionNote ? campaign.tuitionNote.replace(/과정$/, "수강료") : "");
    setCampaignText("[data-venue-city]", campaign.venueCity);
    setCampaignText("[data-venue-name]", campaign.venueName);
    setCampaignText("[data-venue-floor]", campaign.venueFloor);
    setCampaignText("[data-address]", campaign.address);
    setCampaignText("[data-full-address]", campaign.fullAddress);
    setCampaignText("[data-parking-name]", campaign.parkingName);
    setCampaignText("[data-parking-note]", campaign.parkingNote);
    setCampaignText("[data-phone]", campaign.phone);
    setCampaignText("[data-recommend-target]", campaign.recommendTarget);
    setCampaignHref("[data-form-link]", campaign.formUrl);
    setCampaignHref("[data-youtube-link]", campaign.youtubeUrl);
    if (campaign.phone) setCampaignHref("[data-phone-link]", phoneHref(campaign.phone));
  }
  applyCampaignConfig();
  document.querySelectorAll("[data-curriculum-pdf]").forEach(link => {
    const pdfUrl = campaign.curriculumPdfUrl || "timeline.pdf";
    link.href = pdfUrl;
    link.target = "_blank";
    link.rel = "noopener";
    link.addEventListener("click", async event => {
      event.preventDefault();
      try {
        const response = await fetch(pdfUrl, { cache: "no-store" });
        if (!response.ok) throw new Error("PDF download failed");
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const download = document.createElement("a");
        download.href = objectUrl;
        download.download = pdfUrl.split("/").pop() || "timeline.pdf";
        document.body.appendChild(download);
        download.click();
        download.remove();
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } catch (error) {
        const fallback = document.createElement("a");
        fallback.href = pdfUrl;
        fallback.download = pdfUrl.split("/").pop() || "timeline.pdf";
        fallback.target = "_blank";
        fallback.rel = "noopener";
        document.body.appendChild(fallback);
        fallback.click();
        fallback.remove();
      }
    });
  });
  const revealItems = document.querySelectorAll(".reveal, .method-item");
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: .12 });
    revealItems.forEach(el => observer.observe(el));
  } else {
    revealItems.forEach(el => el.classList.add("is-visible"));
  }
  const navLinks = [...document.querySelectorAll(".nav-links a")];
  const sections = navLinks.map(link => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
          link.classList.toggle("is-active", link.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    sections.forEach(sec => navObserver.observe(sec));
  }
  // Curriculum interaction
  const curriculumSection = document.querySelector("#curriculum");
  const map = document.querySelector(".map-visual");
  const mapStage = document.querySelector(".map-stage");
  const cards = [...document.querySelectorAll(".week-roadmap-card")];
  const pins = [...document.querySelectorAll(".map-pin")];
  const routes = [...document.querySelectorAll(".route-line")];
  const highlights = [...document.querySelectorAll(".map-area-highlight")];
  const regionHits = [...document.querySelectorAll(".map-region-hit")];
  const mobileDetail = {
    box: document.querySelector(".mobile-week-detail"),
    code: document.querySelector("[data-mobile-week-code]"),
    region: document.querySelector("[data-mobile-week-region]"),
    title: document.querySelector("[data-mobile-week-title]"),
    desc: document.querySelector("[data-mobile-week-desc]")
  };
  let activeWeek = 1;
  let userHoldUntil = 0;
  function getGroupFromWeek(week) {
    return Number(week) >= 5 ? "asan" : "cheonan";
  }
  function getWeeksByGroup(group) {
    return cards
      .filter(card => card.dataset.group === group)
      .map(card => Number(card.dataset.week))
      .filter(Boolean);
  }
  function getWeekFromGroup(group, currentWeek = activeWeek) {
    const weeks = getWeeksByGroup(group);
    if (!weeks.length) return group === "asan" ? 5 : 1;
    if (weeks.includes(Number(currentWeek))) {
      const index = weeks.indexOf(Number(currentWeek));
      return weeks[(index + 1) % weeks.length];
    }
    return weeks[0];
  }
  function getActiveCard(week) {
    return cards.find(card => Number(card.dataset.week) === Number(week));
  }
  function cleanTitle(card) {
    const clone = card.cloneNode(true);
    clone.querySelector(".week-code")?.remove();
    clone.querySelector("p")?.remove();
    const text = clone.textContent.replace(/\s+/g, " ").trim();
    return text || "커리큘럼";
  }
  function updateMobileDetail(card, group) {
    if (!card || !mobileDetail.box) return;
    const weekText = card.querySelector(".week-code")?.textContent.trim() || `${card.dataset.week}주차`;
    const title = cleanTitle(card);
    const desc = card.querySelector("p")?.textContent.replace(/\s+/g, " ").trim() || "";
    const region = group === "asan" ? "아산" : "천안";
    mobileDetail.code.textContent = weekText;
    mobileDetail.region.textContent = region;
    mobileDetail.title.textContent = title;
    mobileDetail.desc.textContent = desc;
    mobileDetail.box.dataset.group = group;
  }
  function scrollToMapAndDetail() {
    if (!isMobile()) return;
    const target = mapStage || curriculumSection;
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top, behavior: "smooth" });
  }
  function syncCurriculum(week, options = {}) {
    const source = options.source || "auto";
    const shouldScroll = Boolean(options.scroll);
    activeWeek = Number(week) || 1;
    const activeCard = getActiveCard(activeWeek);
    const group = activeCard?.dataset.group || getGroupFromWeek(activeWeek);
    if (source !== "auto") {
      userHoldUntil = Date.now() + 4000;
    }
    if (map) map.dataset.activeGroup = group;
    cards.forEach(card => {
      const active = Number(card.dataset.week) === activeWeek;
      card.classList.toggle("is-active", active);
      card.classList.toggle("is-muted", !active);
      card.setAttribute("aria-selected", active ? "true" : "false");
    });
    pins.forEach(pin => {
      const active = Number(pin.dataset.week) === activeWeek;
      pin.classList.toggle("is-active", active);
      pin.classList.toggle("is-muted", !active);
      pin.setAttribute("aria-pressed", active ? "true" : "false");
    });
    routes.forEach(route => {
      route.classList.toggle("is-active", route.dataset.group === group);
    });
    highlights.forEach(highlight => {
      highlight.classList.toggle("is-active", highlight.dataset.group === group);
    });
    regionHits.forEach(hit => {
      const active = hit.dataset.group === group;
      hit.classList.toggle("is-active", active);
      hit.setAttribute("aria-pressed", active ? "true" : "false");
    });
    updateMobileDetail(activeCard, group);
    if (shouldScroll) {
      scrollToMapAndDetail();
    }
  }
  function bindCurriculum() {
    cards.forEach(card => {
      const week = Number(card.dataset.week);
      card.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") syncCurriculum(week, { source: "card" });
      });
      card.addEventListener("click", () => {
        syncCurriculum(week, { source: "card", scroll: false });
      });
      card.addEventListener("focus", () => {
        syncCurriculum(week, { source: "card" });
      });
      card.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        syncCurriculum(week, { source: "card" });
      });
    });
    pins.forEach(pin => {
      const week = Number(pin.dataset.week);
      pin.addEventListener("pointerenter", event => {
        if (event.pointerType === "mouse") syncCurriculum(week, { source: "pin" });
      });
      pin.addEventListener("click", event => {
        event.preventDefault();
        syncCurriculum(week, { source: "pin", scroll: true });
      });
      pin.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        syncCurriculum(week, { source: "pin", scroll: true });
      });
    });
    regionHits.forEach(hit => {
      const group = hit.dataset.group;
      hit.addEventListener("pointerenter", event => {
        if (event.pointerType !== "mouse") return;
        syncCurriculum(getWeekFromGroup(group, activeWeek - 1), { source: "region" });
      });
      hit.addEventListener("click", event => {
        event.preventDefault();
        const target = Number(hit.dataset.targetWeek) || getWeekFromGroup(group);
        const week = getGroupFromWeek(activeWeek) === group ? getWeekFromGroup(group) : target;
        syncCurriculum(week, { source: "region", scroll: true });
      });
      hit.addEventListener("keydown", event => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        const week = getGroupFromWeek(activeWeek) === group ? getWeekFromGroup(group) : Number(hit.dataset.targetWeek);
        syncCurriculum(week, { source: "region", scroll: true });
      });
    });
  }
  function startCurriculumAuto() {
    if (!cards.length) return;
    syncCurriculum(activeWeek, { source: "init" });
    window.setInterval(() => {
      if (Date.now() < userHoldUntil) return;
      activeWeek = activeWeek >= cards.length ? 1 : activeWeek + 1;
      syncCurriculum(activeWeek, { source: "auto" });
    }, 2700);
  }
  bindCurriculum();
  startCurriculumAuto();
  // Photo slider
  const slider = document.querySelector(".photo-slider");
  const track = slider?.querySelector(".slide-track");
  const slideCount = slider?.querySelectorAll(".slide").length || 0;
  let currentSlide = 0;
  function moveSlide(index) {
    if (!track || !slideCount) return;
    currentSlide = (index + slideCount) % slideCount;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
  }
  slider?.querySelector(".slider-prev")?.addEventListener("click", () => moveSlide(currentSlide - 1));
  slider?.querySelector(".slider-next")?.addEventListener("click", () => moveSlide(currentSlide + 1));
  if (slideCount > 1) window.setInterval(() => moveSlide(currentSlide + 1), 6500);
  // Deadline
  const deadlineSections = Array.from(document.querySelectorAll("[data-deadline-section]"));
  const bottomBar = document.querySelector("[data-deadline-bar]");
  const els = {
    days: Array.from(document.querySelectorAll("[data-dday-days]")),
    hours: Array.from(document.querySelectorAll("[data-dday-hours]")),
    minutes: Array.from(document.querySelectorAll("[data-dday-minutes]")),
    seconds: Array.from(document.querySelectorAll("[data-dday-seconds]")),
    barDays: document.querySelector("[data-bar-days]"),
    barHours: document.querySelector("[data-bar-hours]"),
    barMinutes: document.querySelector("[data-bar-minutes]"),
    barSeconds: document.querySelector("[data-bar-seconds]"),
    joinedCount: Array.from(document.querySelectorAll("[data-joined-count]")),
    totalSeats: Array.from(document.querySelectorAll("[data-total-seats]")),
    progressBar: Array.from(document.querySelectorAll("[data-progress-bar]"))
  };
  const setText = (targets, value) => {
    const list = Array.isArray(targets) ? targets : [targets].filter(Boolean);
    list.forEach(target => {
      target.textContent = value;
    });
  };
  const setProgressWidth = value => {
    els.progressBar.forEach(bar => {
      bar.style.width = value;
    });
  };
  const setProgressTransition = value => {
    els.progressBar.forEach(bar => {
      bar.style.transition = value;
    });
  };
  function updateCountdown() {
    const diff = deadline - Date.now();
    if (Number.isNaN(deadline) || diff <= 0) {
      deadlineSections.forEach(section => section.classList.add("is-ended"));
      bottomBar?.classList.add("is-hidden");
      return;
    }
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    setText(els.days, pad(days));
    setText(els.hours, pad(hours));
    setText(els.minutes, pad(minutes));
    setText(els.seconds, pad(seconds));
    if (els.barDays) els.barDays.textContent = days;
    if (els.barHours) els.barHours.textContent = pad(hours);
    if (els.barMinutes) els.barMinutes.textContent = pad(minutes);
    if (els.barSeconds) els.barSeconds.textContent = pad(seconds);
  }
  function runProgress() {
    if (!els.progressBar.length || !els.joinedCount.length) return;
    const total = Number(campaign.totalSeats || 30);
    const taken = Number(campaign.joinedSeats || 8);
    const speed = 320;
    const pause = 2800;
    function run() {
      setProgressTransition("none");
      setProgressWidth(`${(taken / total) * 100}%`);
      setText(els.joinedCount, taken);
      setText(els.totalSeats, total);
      let current = taken;
      window.setTimeout(() => {
        setProgressTransition("width .4s ease");
        const timer = window.setInterval(() => {
          if (current < total) {
            current += 1;
            setProgressWidth(`${(current / total) * 100}%`);
            setText(els.joinedCount, current);
          } else {
            window.clearInterval(timer);
            window.setTimeout(run, pause);
          }
        }, speed);
      }, 400);
    }
    run();
  }
  updateCountdown();
  window.setInterval(updateCountdown, 1000);
  runProgress();
})();

/* Mobile apply detail toggle */

(() => {
  const applyDetailToggle = document.querySelector(".apply-detail-toggle");
  if (!applyDetailToggle) return;
  const mq = window.matchMedia("(max-width: 760px)");
  const setInitialState = () => {
    if (mq.matches) {
      applyDetailToggle.removeAttribute("open");
    } else {
      applyDetailToggle.setAttribute("open", "");
    }
  };
  setInitialState();
  if (mq.addEventListener) {
    mq.addEventListener("change", setInitialState);
  } else if (mq.addListener) {
    mq.addListener(setInitialState);
  }
})();

/* Review carousel motion */

(() => {
  const section = document.querySelector("#reviews");
  if (!section) return;
  const carousel = section.querySelector(".review-carousel");
  const track = section.querySelector(".review-track");
  const pages = Array.from(section.querySelectorAll(".review-page"));
  const dots = Array.from(section.querySelectorAll(".review-dots span"));
  if (!carousel || !track || !pages.length) return;
  let index = 0;
  let timer = null;
  function show(next) {
    index = (next + pages.length) % pages.length;
    carousel.dataset.index = String(index);
    track.style.transform = `translate3d(-${index * 100}%, 0, 0)`;
    pages.forEach((page, i) => page.classList.toggle("is-active", i === index));
    dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
  }
  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => show(i));
  });
  function startAuto() {
    stopAuto();
    timer = window.setInterval(() => show(index + 1), 5000);
  }
  function stopAuto() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);
  carousel.addEventListener("focusin", stopAuto);
  carousel.addEventListener("focusout", startAuto);
  show(0);
  startAuto();
})();

/* FAQ accordion */

(() => {
  const faqItems = Array.from(document.querySelectorAll(".faq-item"));
  if (!faqItems.length) return;

  faqItems.forEach(item => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach(other => {
        if (other !== item) other.open = false;
      });
    });
  });
})();
