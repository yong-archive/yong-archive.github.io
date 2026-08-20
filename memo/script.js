(function () {
  "use strict";

  var monthsEl = document.getElementById("months");
  var feedEl = document.getElementById("feed");
  var feedInnerEl = document.getElementById("feedInner");
  var menuToggle = document.getElementById("menuToggle");
  var jumpBtn = document.getElementById("jumpBtn");

  var AVATAR_SRC = "../assets/profile.jpg";
  var POST_NAME = "SOLAR";

  var monthDividerEls = {};
  var monthPillEls = {};

  function pad2(n) { return n < 10 ? "0" + n : "" + n; }

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

  function emojify(el) {
    if (window.twemoji && el) {
      twemoji.parse(el, { folder: "svg", ext: ".svg" });
    }
  }

  /* ================= build month pills ================= */
  function buildMonthPills() {
    var frag = document.createDocumentFragment();
    MEMO_MONTHS.forEach(function (key) {
      var pill = document.createElement("button");
      pill.className = "month-pill";
      pill.textContent = formatMonthPill(key);
      pill.dataset.month = key;
      pill.addEventListener("click", function () {
        var target = monthDividerEls[key];
        if (target) {
          var top = target.getBoundingClientRect().top + window.scrollY - 56;
          window.scrollTo({ top: top, behavior: "smooth" });
        }
        monthsEl.classList.remove("open");
      });
      monthPillEls[key] = pill;
      frag.appendChild(pill);
    });
    monthsEl.appendChild(frag);
  }

  function setActivePill(key) {
    Object.keys(monthPillEls).forEach(function (k) {
      var active = k === key;
      monthPillEls[k].classList.toggle("active", active);
      if (active) {
        monthPillEls[k].scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    });
  }

  /* ================= build feed ================= */
  function buildFeed() {
    var frag = document.createDocumentFragment();

    MEMO_MONTHS.forEach(function (key) {
      var divider = document.createElement("div");
      divider.className = "month-divider";
      divider.dataset.month = key;
      var span = document.createElement("span");
      span.textContent = formatMonthLabel(key);
      divider.appendChild(span);
      monthDividerEls[key] = divider;
      frag.appendChild(divider);

      var posts = MEMO_DATA[key] || [];
      posts.forEach(function (p) {
        frag.appendChild(buildPost(p));
      });
    });

    feedInnerEl.appendChild(frag);
    emojify(feedInnerEl);
  }

  function buildPost(p) {
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
      body.innerHTML = escapeHtml(p.m);
      post.appendChild(body);
    }

    if (p.type === "photo" && p.url) {
      var photoWrap = document.createElement("div");
      photoWrap.className = "post-photo";
      var photo = document.createElement("img");
      photo.src = p.url;
      photo.alt = "";
      photo.loading = "lazy";
      photoWrap.appendChild(photo);
      post.appendChild(photoWrap);
    }

    return post;
  }

  /* ================= scroll tracking ================= */
  var tickingScroll = false;
  function onScroll() {
    if (tickingScroll) return;
    tickingScroll = true;
    requestAnimationFrame(function () {
      updateActiveMonth();
      jumpBtn.classList.toggle("show", window.scrollY > 700);
      tickingScroll = false;
    });
  }

  function updateActiveMonth() {
    var refLine = 120;
    var current = MEMO_MONTHS[0];
    for (var i = 0; i < MEMO_MONTHS.length; i++) {
      var el = monthDividerEls[MEMO_MONTHS[i]];
      if (!el) continue;
      var top = el.getBoundingClientRect().top;
      if (top - refLine <= 0) {
        current = MEMO_MONTHS[i];
      } else {
        break;
      }
    }
    setActivePill(current);
  }

  /* ================= init ================= */
  function init() {
    if (typeof MEMO_MONTHS === "undefined" || !MEMO_MONTHS.length) {
      feedInnerEl.innerHTML = '<div class="empty">아직 정리된 메모가 없어요.</div>';
      return;
    }
    buildMonthPills();
    buildFeed();
    updateActiveMonth();

    menuToggle.addEventListener("click", function () {
      monthsEl.classList.toggle("open");
    });

    jumpBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", onScroll, { passive: true });
  }

  document.addEventListener("DOMContentLoaded", init);
})();
