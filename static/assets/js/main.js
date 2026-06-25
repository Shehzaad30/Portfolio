/* ============================================================
   Shehzaad Tinwala — Editorial Studio · interactions
   ============================================================ */
(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── Page-load entrance ───────────────────────────────────
  requestAnimationFrame(() => document.body.classList.add("loaded"));

  // ── Nav: solid-on-scroll + active section ────────────────
  const nav = document.getElementById("nav");
  const navLinks = Array.from(document.querySelectorAll(".nav-link"));
  const sections = Array.from(document.querySelectorAll("main section[id], header[id]"));

  const onScroll = () => {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if ("IntersectionObserver" in window && navLinks.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.getAttribute("id");
          navLinks.forEach((l) =>
            l.classList.toggle("active", l.getAttribute("href") === "#" + id)
          );
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => spy.observe(s));
  }

  // ── Mobile menu ──────────────────────────────────────────
  const menuBtn = document.getElementById("menu-btn");
  const mobileMenu = document.getElementById("mobile-menu");
  const setMenu = (open) => {
    if (!mobileMenu || !menuBtn) return;
    mobileMenu.classList.toggle("open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
  };
  if (menuBtn) menuBtn.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
  if (mobileMenu) mobileMenu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setMenu(false); });

  // ── Scroll reveals ───────────────────────────────────────
  const reveals = Array.from(document.querySelectorAll(".reveal"));
  if (reduceMotion || !("IntersectionObserver" in window)) {
    reveals.forEach((el) => el.classList.add("visible"));
  } else {
    const ro = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry, i) => {
          if (!entry.isIntersecting) return;
          entry.target.style.transitionDelay = Math.min(i * 60, 240) + "ms";
          entry.target.classList.add("visible");
          obs.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => ro.observe(el));
  }

  // Skills are shown as grouped tags now — no animated meters.

  // ── Project modal (opens from a project card's case-study trigger) ──
  const modal = document.getElementById("project-modal");
  if (modal) {
    const mImg = document.getElementById("pm-img");
    const mThumbs = document.getElementById("pm-thumbs");
    const mCat = document.getElementById("pm-cat");
    const mTitle = document.getElementById("pm-title");
    const mStudy = document.getElementById("pm-study");
    const mTags = document.getElementById("pm-tags");
    const closeBtn = modal.querySelector(".pm-close");
    let lastFocus = null, images = [], currentFallback = "", activeIdx = 0;

    const showImage = (i) => {
      activeIdx = i;
      mImg.onerror = () => { mImg.onerror = null; if (currentFallback) mImg.src = currentFallback; };
      mImg.src = images[i];
      mThumbs.querySelectorAll(".pm-thumb").forEach((t, j) => t.classList.toggle("active", j === i));
    };

    const openProject = (card, trigger) => {
      const eyebrow = card.querySelector(".eyebrow");
      const studySrc = card.querySelector(".pm-study-src");
      mCat.textContent = eyebrow ? eyebrow.textContent.trim() : "";
      mTitle.textContent = card.querySelector(".pc-title").textContent;
      // The modal shows a fuller case study authored separately from the card teaser.
      mStudy.innerHTML = studySrc
        ? studySrc.innerHTML
        : (card.querySelector(".pc-problem") ? card.querySelector(".pc-problem").outerHTML : "");
      mStudy.scrollTop = 0;
      currentFallback = card.dataset.fallback || "";
      mImg.alt = mTitle.textContent + " — project image";

      mTags.innerHTML = "";
      card.querySelectorAll(".pc-tags .tag").forEach((src) => {
        const span = document.createElement("span");
        span.className = "tag";
        span.textContent = src.textContent;
        mTags.appendChild(span);
      });

      images = (card.dataset.images || "").split(",").map((s) => s.trim()).filter(Boolean);
      mThumbs.innerHTML = "";
      if (images.length > 1) {
        images.forEach((src, i) => {
          const t = document.createElement("img");
          t.className = "pm-thumb" + (i === 0 ? " active" : "");
          t.src = src;
          t.alt = "";
          t.addEventListener("click", () => showImage(i));
          mThumbs.appendChild(t);
        });
      }
      showImage(0);

      lastFocus = trigger || card;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      if (closeBtn) closeBtn.focus();
    };

    const closeModal = () => {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocus) lastFocus.focus();
    };

    document.querySelectorAll("[data-case-study]").forEach((trigger) => {
      trigger.addEventListener("click", (e) => {
        const card = e.currentTarget.closest(".project-card");
        if (card) openProject(card, e.currentTarget);
      });
    });
    modal.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", closeModal));
    document.addEventListener("keydown", (e) => {
      if (!modal.classList.contains("open")) return;
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowRight" && images.length > 1) showImage((activeIdx + 1) % images.length);
      else if (e.key === "ArrowLeft" && images.length > 1) showImage((activeIdx - 1 + images.length) % images.length);
    });
  }

  // ── Contact form → POST /api/contact (single handler) ────
  const form = document.getElementById("contact-form");
  if (form) {
    const btn = document.getElementById("cf-submit");
    const status = document.getElementById("cf-status");
    const setStatus = (msg, color) => {
      if (!status) return;
      status.textContent = msg;
      status.style.color = color || "";
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());

      if (!data.name || !data.email || !data.message) {
        setStatus("Please fill in your name, email and message.", "#FF7A7A");
        return;
      }

      const label = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = "Sending…";
      setStatus("", "");

      try {
        const res = await fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (res.ok) {
          form.reset();
          btn.innerHTML = "Sent ✓";
          setStatus("Thanks — I'll get back to you within 24 hours.", "#5772FF");
        } else {
          throw new Error("bad status");
        }
      } catch (err) {
        btn.innerHTML = "Try again";
        setStatus("Something went wrong. Email me directly at tinwalashehzaad@gmail.com.", "#FF7A7A");
      } finally {
        setTimeout(() => {
          btn.disabled = false;
          btn.innerHTML = label;
        }, 2600);
      }
    });
  }
})();
