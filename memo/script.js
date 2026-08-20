(function () {
  "use strict";

  var monthsEl = document.getElementById("months");
  var yearsViewEl = document.getElementById("yearsView");
  var monthsOfYearViewEl = document.getElementById("monthsOfYearView");
  var yearBackLabel = document.getElementById("yearBackLabel");
  var monthOfYearListEl = document.getElementById("monthOfYearList");
  var feedEl = document.getElementById("feed");
  var feedInnerEl = document.getElementById("feedInner");
  var menuToggle = document.getElementById("menuToggle");
  var prevBtn = document.getElementById("prevMonth");
  var nextBtn = document.getElementById("nextMonth");
  var monthLabelEl = document.getElementById("monthLabel");
  var monthNavEl = document.querySelector(".month-nav");
  var searchToggle = document.getElementById("searchToggle");
  var searchBar = document.getElementById("searchBar");
  var searchInput = document.getElementById("searchInput");
  var searchClear = document.getElementById("searchClear");
  var searchStatusEl = document.getElementById("searchStatus");

  var AVATAR_SRC = "../assets/memo-profile.png";
  var AVATAR_FALLBACK = "../assets/memo-profile.jpg";
  var POST_NAME = "SOLAR";

  var monthPillEls = {};
  var currentIndex = 0;
  var searchMode = false;
  var searchQuery = "";
  var currentYear = null;

  function formatMonthLabel(key) {
    var parts = key.split("-");
    return parts[0] + "년 " + parseInt(parts[1], 10) + "월";
  }
  function formatMonthPill(key) {
    var parts = key.split("-");
    return parts[0].slice(2) + "." + parts[1];
  }
  function formatDate(d, t) {
    var parts = d.split("-");
    return parts[0] + "." + parts[1] + "." + parts[2] + "  " + t;
  }

  function escapeHtml(s) {
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function decodeEntities(s) {
    return s
      .replace(/&#(\d+);/g, function (_, dec) {
        return String.fromCodePoint(parseInt(dec, 10));
      })
      .replace(/&#x([0-9a-fA-F]+);/g, function (_, hex) {
        return String.fromCodePoint(parseInt(hex, 16));
      })
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, "\"")
      .replace(/&#39;|&apos;/g, "'");
  }

  function emojify(el) {
    if (window.twemoji && el) {
      twemoji.parse(el, { folder: "svg", ext: ".svg" });
    }
  }

  /* ================= build year / month picker ================= */
  function getYears() {
    var seen = {};
    var years = [];
    MEMO_MONTHS.forEach(function (key) {
      var y = key.split("-")[0];
      if (!seen[y]) {
        seen[y] = true;
        years.push(y);
      }
    });
    return years;
  }

  function buildYearsView() {
    yearsViewEl.innerHTML = "";
    var frag = document.createDocumentFragment();
    getYears().forEach(function (y) {
      var pill = document.createElement("button");
      pill.className = "year-pill";
      pill.textContent = y + "년";
      pill.dataset.year = y;
      pill.addEventListener("click", function () {
        showMonthsOfYear(y);
      });
      frag.appendChild(pill);
    });
    yearsViewEl.appendChild(frag);
  }

  function showMonthsOfYear(year) {
    currentYear = year;
    yearBackLabel.textContent = year + "년";

    monthPillEls = {};
    monthOfYearListEl.innerHTML = "";
    var frag = document.createDocumentFragment();
    MEMO_MONTHS.forEach(function (key, idx) {
      if (key.split("-")[0] !== year) return;
      var pill = document.createElement("button");
      pill.className = "month-pill";
      pill.textContent = parseInt(key.split("-")[1], 10) + "월";
      pill.dataset.month = key;
      pill.addEventListener("click", function () {
        goToIndex(idx);
        monthsEl.classList.remove("open");
      });
      monthPillEls[key] = pill;
      frag.appendChild(pill);
    });
    monthOfYearListEl.appendChild(frag);

    monthsOfYearViewEl.hidden = false;
    setActivePill(MEMO_MONTHS[currentIndex]);
  }

  function setActivePill(key) {
    var y = key ? key.split("-")[0] : null;
    var yearPills = yearsViewEl.querySelectorAll(".year-pill");
    yearPills.forEach(function (p) {
      p.classList.toggle("active", p.dataset.year === y);
    });
    Object.keys(monthPillEls).forEach(function (k) {
      var active = k === key;
      monthPillEls[k].classList.toggle("active", active);
      if (active) {
        monthPillEls[k].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
  }

  function highlightText(escaped, query) {
    if (!query) return escaped;
    var escQuery = escaped === "" ? "" : query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    if (!escQuery) return escaped;
    var re = new RegExp("(" + escQuery + ")", "gi");
    return escaped.replace(re, "<mark>$1</mark>");
  }

  /* ================= build a single post ================= */
  function buildPost(p, query, monthKey) {
    var post = document.createElement("article");
    post.className = "post";

    var head = document.createElement("div");
    head.className = "post-head";

    var avatar = document.createElement("div");
    avatar.className = "post-avatar";
    var img = document.createElement("img");
    img.src = AVATAR_SRC;
    img.alt = POST_NAME;
    img.loading = "lazy";
    img.onerror = function () {
      img.onerror = null;
      img.src = AVATAR_FALLBACK;
    };
    avatar.appendChild(img);

    var who = document.createElement("div");
    who.className = "post-who";
    var name = document.createElement("div");
    name.className = "post-name";
    name.textContent = POST_NAME;
    var date = document.createElement("div");
    date.className = "post-date";
    date.textContent = formatDate(p.d, p.t);
    who.appendChild(name);
    who.appendChild(date);

    head.appendChild(avatar);
    head.appendChild(who);
    post.appendChild(head);

    if (p.m && p.m.trim()) {
      var body = document.createElement("div");
      body.className = "post-body";
      body.innerHTML = highlightText(escapeHtml(decodeEntities(p.m)), query);
      post.appendChild(body);
    }

    if (p.type === "photo" && p.url) {
      var photoWrap = document.createElement("div");
      photoWrap.className = "post-photo";
      var photo = document.createElement("img");
      photo.src = p.url;
      photo.alt = "";
      photo.loading = "lazy";
      photo.referrerPolicy = "no-referrer";
      photoWrap.appendChild(photo);
      post.appendChild(photoWrap);
    }

    return post;
  }

  /* ================= render one month ================= */
  function renderMonth(index) {
    if (index < 0 || index >= MEMO_MONTHS.length) return;
    currentIndex = index;
    var key = MEMO_MONTHS[index];

    monthLabelEl.textContent = formatMonthLabel(key);
    setActivePill(key);

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= MEMO_MONTHS.length - 1;

    feedInnerEl.innerHTML = "";
    var frag = document.createDocumentFragment();
    var posts = MEMO_DATA[key] || [];
    if (!posts.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "이 달에는 메모가 없어요.";
      frag.appendChild(empty);
    } else {
      posts.forEach(function (p) {
        frag.appendChild(buildPost(p, null, key));
      });
    }
    feedInnerEl.appendChild(frag);
    emojify(feedInnerEl);

    feedEl.scrollTop = 0;
  }

  function goToIndex(index) {
    renderMonth(index);
  }

  /* ================= search ================= */
  function runSearch(query) {
    var q = query.trim();
    searchQuery = q;

    if (!q) {
      exitSearch();
      return;
    }

    searchMode = true;
    monthNavEl.classList.add("hidden");
    monthsEl.classList.remove("open");

    var qLower = q.toLowerCase();
    var results = [];
    MEMO_MONTHS.forEach(function (key) {
      var posts = MEMO_DATA[key] || [];
      posts.forEach(function (p) {
        if (p.m && p.m.toLowerCase().indexOf(qLower) !== -1) {
          results.push({ p: p, key: key });
        }
      });
    });

    searchStatusEl.textContent = results.length
      ? "\"" + q + "\" 검색결과 " + results.length + "건"
      : "\"" + q + "\"에 대한 검색결과가 없어요";
    searchStatusEl.classList.add("show");

    feedInnerEl.innerHTML = "";
    var frag = document.createDocumentFragment();
    if (!results.length) {
      var empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "검색결과가 없어요.";
      frag.appendChild(empty);
    } else {
      results.forEach(function (r) {
        frag.appendChild(buildPost(r.p, q, r.key));
      });
    }
    feedInnerEl.appendChild(frag);
    emojify(feedInnerEl);
    feedEl.scrollTop = 0;
  }

  function exitSearch() {
    searchMode = false;
    searchQuery = "";
    monthNavEl.classList.remove("hidden");
    searchStatusEl.classList.remove("show");
    searchStatusEl.textContent = "";
    renderMonth(currentIndex);
  }

  function openSearchBar() {
    searchBar.classList.add("open");
    searchInput.focus();
  }

  function closeSearchBar() {
    searchBar.classList.remove("open");
    searchInput.value = "";
    if (searchMode) exitSearch();
  }

  /* ================= init ================= */
  function init() {
    if (typeof MEMO_MONTHS === "undefined" || !MEMO_MONTHS.length) {
      feedInnerEl.innerHTML = '<div class="empty">아직 정리된 메모가 없어요.</div>';
      return;
    }
    buildYearsView();
    renderMonth(MEMO_MONTHS.length - 1);

    menuToggle.addEventListener("click", function () {
      var open = monthsEl.classList.toggle("open");
      if (open) {
        showMonthsOfYear(MEMO_MONTHS[currentIndex].split("-")[0]);
      }
    });

    prevBtn.addEventListener("click", function () {
      goToIndex(currentIndex - 1);
    });
    nextBtn.addEventListener("click", function () {
      goToIndex(currentIndex + 1);
    });

    searchToggle.addEventListener("click", function () {
      if (searchBar.classList.contains("open")) {
        closeSearchBar();
      } else {
        openSearchBar();
      }
    });
    searchInput.addEventListener("input", function () {
      runSearch(searchInput.value);
    });
    searchInput.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeSearchBar();
    });
    searchClear.addEventListener("click", function () {
      searchInput.value = "";
      exitSearch();
      searchInput.focus();
    });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
