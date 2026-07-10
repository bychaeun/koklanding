(() => {
  const campaign = window.KOKKOK_CAMPAIGN || {};
  /*
    기수별 재사용 핵심:
    - baselineCohort는 이 템플릿에 남아 있는 기준 기수입니다.
    - cohort만 "5기", "6기"로 바꿔도 화면에 보이는 모든 "4기" 문구를 자동 치환합니다.
  */
  const baselineCohort = campaign.baselineCohort || "4기";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));
  const text = value => value == null ? "" : String(value);
  const tel = value => "tel:" + text(value).replace(/[^0-9+]/g, "");
  function setText(selector, value) {
    const el = $(selector);
    if (el) el.textContent = text(value);
  }
  function replaceCohortEverywhere(nextCohort) {
    if (!nextCohort || nextCohort === baselineCohort) return;
    const blockedTags = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE", "IFRAME", "SVG"]);
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          const parent = node.parentElement;
          if (!parent || blockedTags.has(parent.tagName)) {
            return NodeFilter.FILTER_REJECT;
          }
          return node.nodeValue.includes(baselineCohort)
            ? NodeFilter.FILTER_ACCEPT
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      node.nodeValue = node.nodeValue.split(baselineCohort).join(nextCohort);
    });
    const attrs = ["aria-label", "title", "alt", "data-label"];
    $$("[aria-label], [title], [alt], [data-label]").forEach(el => {
      attrs.forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.setAttribute(attr, el.getAttribute(attr).split(baselineCohort).join(nextCohort));
        }
      });
    });
  }
  function setInfoRow(label, main, sub = "") {
    const rows = $$(".apply-info .info-row");
    const row = rows.find(item => $(".info-label", item)?.textContent.trim() === label);
    if (!row) return;
    const value = $(".info-value", row);
    if (!value) return;
    value.textContent = "";
    if (label === "수강료") {
      const strong = document.createElement("strong");
      strong.className = "tuition-strong";
      strong.textContent = text(main);
      value.appendChild(strong);
      if (sub) {
        const span = document.createElement("span");
        span.className = "tuition-sub";
        span.textContent = text(sub);
        value.appendChild(span);
      }
      return;
    }
    value.append(document.createTextNode(text(main)));
    if (sub) {
      const span = document.createElement("span");
      span.textContent = text(sub);
      value.appendChild(span);
    }
  }
  function applyCampaign() {
    const cohort = text(campaign.cohort || baselineCohort);
    const openPeriod = text(campaign.openPeriod || "8~9월");
    const totalSeats = Number(campaign.totalSeats || 30);
    const joinedSeats = Number(campaign.joinedSeats || 8);
    const tuition = text(campaign.tuition || "20만원");
    const tuitionNote = text(campaign.tuitionNote || "2개월 과정");
    const scheduleDays = text(campaign.scheduleDays || "매주 수·목요일");
    const scheduleTime = text(campaign.scheduleTime || "19:00");
    const scheduleEndTime = text(campaign.scheduleEndTime || "20:30");
    const courseWeeks = text(campaign.courseWeeks || "8주");
    const courseCount = text(campaign.courseCount || "총 8회");
    const venueCity = text(campaign.venueCity || "천안");
    const venueName = text(campaign.venueName || "금강센트럴빌딩");
    const venueFloor = text(campaign.venueFloor || "3층");
    const address = text(campaign.address || "천안 동남구 봉서10길 19");
    const fullAddress = text(campaign.fullAddress || `${address} ${venueName} ${venueFloor}`);
    const phone = text(campaign.phone || "041-575-1102");
    const phoneHref = tel(phone);
    // 1) 명시적으로 중요한 영역 먼저 세팅
    setText(".hero-badge", `천안·아산 개발사업 실전 분석 클래스 · ${cohort} 모집`);
    const navApply = $(".nav-actions .btn-primary");
    if (navApply) navApply.textContent = `${cohort} 신청`;
    const heroApply = $(".hero-actions .btn-primary");
    if (heroApply) heroApply.textContent = `${cohort} 수강 신청하기 →`;
    const deadlineHeadline = $(".deadline-section-final .headline");
    if (deadlineHeadline) {
      deadlineHeadline.innerHTML = `${cohort} 멤버가 확정되면,<br><span class="acc">이 기회는 사라집니다.</span>`;
    }
    const deadlineEyebrow = $(".deadline-section-final .eyebrow");
    if (deadlineEyebrow) deadlineEyebrow.textContent = `${cohort} 모집 마감까지`;
    const applyTitle = $(".apply h2");
    if (applyTitle) applyTitle.innerHTML = `${cohort} 모집,<br>지금 신청할 수 있습니다.`;
    const applyLead = $(".apply p");
    if (applyLead) applyLead.textContent = "다음 개발은 기다려주지 않습니다. 이번 기수에서 투자 판단의 기준을 만드세요.";
    const applyButtons = $$(".apply-actions .btn-primary, .apply .btn-primary");
    applyButtons.forEach(button => {
      if (button.textContent.includes("수강") || button.textContent.includes("신청")) {
        button.textContent = `${cohort} 수강 신청하기 →`;
      }
    });
    // 2) 히어로 태그/신청안내 정보
    const tags = $$(".hero-tags .tag");
    if (tags[0]) tags[0].innerHTML = `<b>${openPeriod}</b> 개강`;
    if (tags[1]) tags[1].innerHTML = `${scheduleDays} <b>${scheduleTime}</b>`;
    if (tags[2]) tags[2].innerHTML = `${venueCity} <b>${venueName}</b> ${venueFloor}`;
    if (tags[3]) tags[3].innerHTML = `선착순 <b>${totalSeats}명</b>`;
    if (tags[4]) tags[4].innerHTML = `수강료 <b>${tuition}</b>`;
    setInfoRow("교육 일정", `${openPeriod} · ${courseCount}`, scheduleDays);
    setInfoRow("강의 시간", `${scheduleTime} ~ ${scheduleEndTime}`);
    setInfoRow("수강 인원", `선착순 ${totalSeats}명`);
    setInfoRow("수강료", tuition, tuitionNote);
    setInfoRow("교육 장소", `${venueName} ${venueFloor}`, address);
    setInfoRow("주차", text(campaign.parkingName || "봉서초등학교 주차장"), text(campaign.parkingNote || "도보 1분"));
    setInfoRow("문의", phone);
    setInfoRow("추천 대상", text(campaign.recommendTarget || "천안·아산 투자 타이밍을 제대로 배우고 싶은 분"));
    // 3) 숫자/링크/지도/푸터
    const joined = $("[data-joined-count]");
    if (joined) joined.textContent = joinedSeats;
    const total = $("[data-total-seats]");
    if (total) total.textContent = totalSeats;
    $$('a[href*="docs.google.com/forms"], .deadline-bar-btn').forEach(link => {
      if (campaign.formUrl) link.href = campaign.formUrl;
    });
    $$('a[href*="youtube.com"], a[href*="@kokok"]').forEach(link => {
      if (campaign.youtubeUrl) link.href = campaign.youtubeUrl;
    });
    const phoneButton = $('.apply-actions a[href^="tel:"]');
    if (phoneButton) phoneButton.href = phoneHref;
    const footer = $(".footer-inner > div:first-child");
    if (footer) {
      footer.innerHTML = `<b>콕 찝어주는 부동산 학원</b><br>${fullAddress} · ${phone}`;
    }
    const encodedAddress = encodeURIComponent(fullAddress);
    const iframe = $(".apply-map-card iframe");
    if (iframe && encodedAddress) {
      iframe.src = `https://maps.google.com/maps?hl=ko&q=${encodedAddress}&z=17&output=embed`;
    }
    const naverMap = $(".map-fallback-link");
    if (naverMap && encodedAddress) {
      naverMap.href = `https://map.naver.com/p/search/${encodedAddress}`;
    }
    // 4) 마지막 안전장치: 화면에 남은 기준 기수를 전부 현재 기수로 치환
    replaceCohortEverywhere(cohort);
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyCampaign, { once: true });
  } else {
    applyCampaign();
  }
})();
