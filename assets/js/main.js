const toggle = document.querySelector(".menu-toggle");
const panel = document.querySelector("#mobile-menu");

if (toggle && panel) {
  toggle.addEventListener("click", () => {
    const isOpen = panel.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      panel.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

document.querySelectorAll(".mobile-services-group").forEach((group) => {
  const servicesToggle = group.querySelector(".mobile-services-toggle");

  if (!servicesToggle) return;

  servicesToggle.addEventListener("click", () => {
    const isOpen = group.classList.toggle("is-open");
    servicesToggle.setAttribute("aria-expanded", String(isOpen));
  });
});

document.querySelectorAll(".nav-dropdown").forEach((dropdown) => {
  const trigger = dropdown.querySelector(".nav-dropdown-link");

  if (!trigger) return;

  trigger.addEventListener("click", (event) => {
    if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (!dropdown.classList.contains("is-open")) {
      event.preventDefault();
      dropdown.classList.add("is-open");
    }
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) dropdown.classList.remove("is-open");
  });
});

document.querySelectorAll("[data-carousel]").forEach((carousel) => {
  const track = carousel.querySelector(".carousel-track");
  const slides = Array.from(carousel.querySelectorAll(".carousel-slide"));
  const prev = carousel.querySelector("[data-carousel-prev]");
  const next = carousel.querySelector("[data-carousel-next]");
  const dotsWrap = carousel.querySelector("[data-carousel-dots]");

  if (!track || slides.length === 0 || !prev || !next || !dotsWrap) return;

  const getStep = () => {
    const slide = slides[0];
    const gap = parseFloat(getComputedStyle(track).columnGap || "0");
    return slide.getBoundingClientRect().width + gap;
  };

  const getVisibleCount = () => {
    const step = getStep();
    return Math.max(1, Math.round((track.clientWidth + 1) / step));
  };

  const getPageCount = () => Math.max(1, slides.length - getVisibleCount() + 1);

  const getActivePage = () => {
    const step = getStep();
    const lastPage = getPageCount() - 1;
    return Math.min(lastPage, Math.max(0, Math.round(track.scrollLeft / step)));
  };

  const scrollToPage = (index, behavior = "smooth") => {
    if (behavior === "instant") {
      const previousScrollBehavior = track.style.scrollBehavior;
      track.style.scrollBehavior = "auto";
      track.scrollLeft = index * getStep();
      track.style.scrollBehavior = previousScrollBehavior;
      window.requestAnimationFrame(updateDots);
      return;
    }

    track.scrollTo({ left: index * getStep(), behavior });
  };

  const buildDots = () => {
    dotsWrap.innerHTML = "";
    for (let index = 0; index < getPageCount(); index += 1) {
      const dot = document.createElement("button");
      dot.className = "carousel-dot";
      dot.type = "button";
      dot.setAttribute("aria-label", `Show gallery item ${index + 1}`);
      dot.addEventListener("click", () => {
        scrollToPage(index);
      });
      dotsWrap.appendChild(dot);
    }
  };

  const updateDots = () => {
    const active = getActivePage();
    dotsWrap.querySelectorAll(".carousel-dot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === active);
    });
  };

  prev.addEventListener("click", () => {
    const lastPage = getPageCount() - 1;
    const current = getActivePage();
    const isWrap = current <= 0;
    const target = isWrap ? lastPage : current - 1;
    scrollToPage(target, isWrap ? "instant" : "smooth");
  });

  next.addEventListener("click", () => {
    const lastPage = getPageCount() - 1;
    const current = getActivePage();
    const isWrap = current >= lastPage;
    const target = isWrap ? 0 : current + 1;
    scrollToPage(target, isWrap ? "instant" : "smooth");
  });

  track.addEventListener("scroll", () => {
    window.requestAnimationFrame(updateDots);
  });

  window.addEventListener("resize", () => {
    buildDots();
    updateDots();
  });

  buildDots();
  updateDots();
});

document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("toggle", () => {
    const summary = item.querySelector(".faq-question");
    if (summary) summary.setAttribute("aria-expanded", String(item.open));
  });
});
