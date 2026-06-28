(() => {
  const header = document.querySelector("[data-header]");
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelectorAll(".nav-menu a");
  const reveals = document.querySelectorAll(".reveal");
  const faqItems = document.querySelectorAll(".faq-item");
  const leadForm = document.querySelector("[data-lead-form]");
  const formNote = document.querySelector("[data-form-note]");
  const parallaxTarget = document.querySelector("[data-parallax]");

  function navigationLabel(open) {
    const english = document.documentElement.lang === "en";
    if (open) return english ? "Close navigation" : "Navigation schließen";
    return english ? "Open navigation" : "Navigation öffnen";
  }

  function setHeaderState() {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
  }

  function closeNav() {
    document.body.classList.remove("nav-open");
    if (navToggle) {
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", navigationLabel(false));
    }
  }

  navToggle?.addEventListener("click", () => {
    const isOpen = document.body.classList.toggle("nav-open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
    navToggle.setAttribute("aria-label", navigationLabel(isOpen));
  });

  navLinks.forEach((link) => link.addEventListener("click", closeNav));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNav();
  });

  window.addEventListener("scroll", () => {
    setHeaderState();
    if (parallaxTarget && window.matchMedia("(prefers-reduced-motion: no-preference)").matches) {
      const offset = Math.min(window.scrollY * 0.08, 40);
      parallaxTarget.style.transform = `translate3d(0, ${offset}px, 0)`;
    }
  }, { passive: true });

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.16 });

    reveals.forEach((element, index) => {
      if (element.classList.contains("section-heading") || element.classList.contains("hero-copy")) {
        element.classList.add("reveal-soft-left");
      }
      if (element.classList.contains("hero-dashboard") || element.classList.contains("product-card") || element.classList.contains("faq-list")) {
        element.classList.add("reveal-soft-right");
      }
      element.style.transitionDelay = `${Math.min(index % 5, 4) * 60}ms`;
      revealObserver.observe(element);
    });
  } else {
    reveals.forEach((element) => element.classList.add("is-visible"));
  }

  faqItems.forEach((item) => {
    const button = item.querySelector("button");
    const content = item.querySelector(".faq-content");
    button?.addEventListener("click", () => {
      const isOpen = item.classList.toggle("is-open");
      button.setAttribute("aria-expanded", String(isOpen));
      content.style.maxHeight = isOpen ? `${content.scrollHeight}px` : "0px";
    });
  });

  leadForm?.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(leadForm);
    const name = String(data.get("name") || "").trim();
    if (formNote) {
      formNote.textContent = name
        ? `Danke, ${name}. Deine Vormerkung wurde lokal erfasst.`
        : "Danke. Deine Vormerkung wurde lokal erfasst.";
    }
    leadForm.reset();
  });

  const scoreValueElement = document.querySelector("[data-score-value]");
  if (scoreValueElement) {
    const targetScore = Number(scoreValueElement.dataset.scoreValue) || 82;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      scoreValueElement.textContent = String(targetScore);
    } else {
      scoreValueElement.textContent = "0";
      const scoreStart = performance.now() + 180;
      const scoreDuration = 1200;
      const updateScore = (now) => {
        const progress = Math.max(0, Math.min(1, (now - scoreStart) / scoreDuration));
        const eased = 1 - Math.pow(1 - progress, 3);
        scoreValueElement.textContent = String(Math.round(targetScore * eased));
        if (progress < 1) requestAnimationFrame(updateScore);
      };
      requestAnimationFrame(updateScore);
    }
  }

  window.addEventListener("pointerscore:languagechange", () => {
    if (navToggle) navToggle.setAttribute("aria-label", navigationLabel(document.body.classList.contains("nav-open")));
    faqItems.forEach((item) => {
      if (!item.classList.contains("is-open")) return;
      const content = item.querySelector(".faq-content");
      content.style.maxHeight = `${content.scrollHeight}px`;
    });
  });

  setHeaderState();
})();
