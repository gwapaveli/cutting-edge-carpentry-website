const header = document.querySelector(".site-header");
const toggle = document.querySelector(".menu-toggle");
const panel = document.querySelector("#mobile-menu");
const mobileHeaderQuery = window.matchMedia("(max-width: 1180px)");
const homeHeroVideo = document.querySelector(".home-hero-video");
const homeHeroVideoQuery = window.matchMedia("(max-width: 700px)");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const onMediaQueryChange = (query, listener) => {
  if (typeof query.addEventListener === "function") {
    query.addEventListener("change", listener);
  } else if (typeof query.addListener === "function") {
    query.addListener(listener);
  }
};

if (homeHeroVideo) {
  homeHeroVideo.muted = true;
  homeHeroVideo.playsInline = true;

  const playHomeHeroVideo = () => {
    const playPromise = homeHeroVideo.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {});
    }
  };

  const syncHomeHeroVideo = () => {
    if (!homeHeroVideoQuery.matches || reducedMotionQuery.matches) {
      homeHeroVideo.pause();
      homeHeroVideo.removeAttribute("src");
      homeHeroVideo.load();
      return;
    }

    if (!homeHeroVideo.getAttribute("src") && homeHeroVideo.dataset.mobileSrc) {
      homeHeroVideo.setAttribute("src", homeHeroVideo.dataset.mobileSrc);
      homeHeroVideo.load();
    }

    if (homeHeroVideo.readyState >= 2) {
      playHomeHeroVideo();
    } else {
      homeHeroVideo.addEventListener("canplay", playHomeHeroVideo, { once: true });
    }
  };

  syncHomeHeroVideo();
  onMediaQueryChange(homeHeroVideoQuery, syncHomeHeroVideo);
  onMediaQueryChange(reducedMotionQuery, syncHomeHeroVideo);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && homeHeroVideo.paused) syncHomeHeroVideo();
  });
}

const closeMobileMenu = () => {
  if (!toggle || !panel) return;

  panel.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");

  panel.querySelectorAll(".mobile-services-group.is-open").forEach((group) => {
    group.classList.remove("is-open");
    const servicesToggle = group.querySelector(".mobile-services-toggle");
    if (servicesToggle) servicesToggle.setAttribute("aria-expanded", "false");
  });
};

if (toggle && panel) {
  toggle.addEventListener("click", () => {
    if (header) header.classList.remove("is-hidden");
    const isOpen = panel.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMobileMenu);
  });
}

if (header) {
  let lastScrollY = window.scrollY;
  let ticking = false;

  const updateHeaderVisibility = () => {
    if (!mobileHeaderQuery.matches) {
      header.classList.remove("is-hidden");
      ticking = false;
      lastScrollY = window.scrollY;
      return;
    }

    const currentScrollY = window.scrollY;

    if (currentScrollY <= 16) {
      header.classList.remove("is-hidden");
    } else if (currentScrollY > lastScrollY + 8) {
      closeMobileMenu();
      header.classList.add("is-hidden");
    } else if (currentScrollY < lastScrollY - 8) {
      header.classList.remove("is-hidden");
    }

    lastScrollY = currentScrollY;
    ticking = false;
  };

  window.addEventListener("scroll", () => {
    if (!ticking) {
      window.requestAnimationFrame(updateHeaderVisibility);
      ticking = true;
    }
  }, { passive: true });

  window.addEventListener("resize", () => {
    if (!mobileHeaderQuery.matches) {
      header.classList.remove("is-hidden");
      closeMobileMenu();
    }
    lastScrollY = window.scrollY;
  });
}

document.querySelectorAll(".mobile-services-group").forEach((group) => {
  const servicesToggle = group.querySelector(".mobile-services-toggle");

  if (!servicesToggle) return;

  servicesToggle.addEventListener("click", () => {
    if (header) header.classList.remove("is-hidden");
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

const requestForm = document.querySelector("[data-project-request-form]");

if (requestForm) {
  const apiBase = "https://con-build.replit.app";
  const maxPhotos = 10;
  const selectedPhotos = [];
  const status = requestForm.querySelector("[data-form-status]");
  const submitButton = requestForm.querySelector("[data-submit-request]");
  const photoInput = requestForm.querySelector("[data-photo-input]");
  const photoList = requestForm.querySelector("[data-photo-list]");

  const setStatus = (message, type) => {
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-status";
    if (message) status.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
  };

  const renderPhotos = () => {
    if (!photoList) return;
    photoList.innerHTML = "";

    selectedPhotos.forEach((file, index) => {
      const item = document.createElement("div");
      item.className = "photo-item";

      const name = document.createElement("span");
      name.textContent = file.name;

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "Remove";
      remove.setAttribute("aria-label", `Remove ${file.name}`);
      remove.addEventListener("click", () => {
        selectedPhotos.splice(index, 1);
        renderPhotos();
      });

      item.append(name, remove);
      photoList.appendChild(item);
    });
  };

  const uploadPhoto = async (file) => {
    const uploadRequest = await fetch(`${apiBase}/api/storage/uploads/request-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type || "application/octet-stream",
      }),
    });

    if (!uploadRequest.ok) throw new Error("Photo upload could not start.");

    const { uploadURL, objectPath } = await uploadRequest.json();
    const upload = await fetch(uploadURL, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type || "application/octet-stream" },
    });

    if (!upload.ok) throw new Error("Photo upload failed.");

    return `/api/storage${objectPath}`;
  };

  if (photoInput) {
    photoInput.addEventListener("change", () => {
      const files = Array.from(photoInput.files || []);
      const remaining = maxPhotos - selectedPhotos.length;

      if (remaining <= 0) {
        setStatus(`You can upload up to ${maxPhotos} photos.`, "error");
        photoInput.value = "";
        return;
      }

      selectedPhotos.push(...files.slice(0, remaining));
      if (files.length > remaining) setStatus(`Only the first ${remaining} photo(s) were added.`, "error");
      else setStatus("", "");

      photoInput.value = "";
      renderPhotos();
    });
  }

  requestForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!requestForm.checkValidity()) {
      requestForm.reportValidity();
      return;
    }

    const formData = new FormData(requestForm);
    const getValue = (name) => String(formData.get(name) || "").trim();

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = selectedPhotos.length > 0 ? "Uploading Photos..." : "Submitting...";
    }

    setStatus("", "");

    try {
      const photoUrls = [];

      for (const file of selectedPhotos) {
        photoUrls.push(await uploadPhoto(file));
      }

      const response = await fetch(`${apiBase}/api/public/project-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: getValue("firstName"),
          lastName: getValue("lastName"),
          companyName: getValue("companyName") || undefined,
          email: getValue("email"),
          phone: getValue("phone") || undefined,
          marketingEmailConsent: formData.get("marketingEmailConsent") === "on",
          smsMarketingConsent: formData.get("smsMarketingConsent") === "on",
          addressStreet: getValue("addressStreet"),
          addressLine2: getValue("addressLine2") || undefined,
          city: getValue("city"),
          province: getValue("province"),
          postalCode: getValue("postalCode").toUpperCase(),
          projectType: getValue("projectType"),
          description: getValue("description"),
          photoUrls,
          documentUrls: [],
        }),
      });

      if (!response.ok) throw new Error("Submission failed.");

      requestForm.reset();
      selectedPhotos.length = 0;
      renderPhotos();
      setStatus("Request received. Cutting Edge Carpentry will follow up with you shortly.", "success");
    } catch (error) {
      setStatus("Something went wrong while sending the request. Please try again or call (519) 902-5029.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit Request";
      }
    }
  });
}

const simpleContactForm = document.querySelector("[data-simple-contact-form]");

if (simpleContactForm) {
  const status = simpleContactForm.querySelector("[data-form-status]");
  const submitButton = simpleContactForm.querySelector("[data-submit-contact]");
  const submitText = submitButton ? submitButton.textContent : "";
  const endpoint = (simpleContactForm.dataset.contactEndpoint || "").trim();
  const fallbackEmail = simpleContactForm.dataset.fallbackEmail || "cecarpentry22@gmail.com";

  const setStatus = (message, type) => {
    if (!status) return;
    status.textContent = message || "";
    status.className = "form-status";
    if (message) status.classList.add("is-visible", type === "success" ? "is-success" : "is-error");
  };

  const buildMailto = ({ fullName, email, phone, service }) => {
    const subject = encodeURIComponent(`Contact request from ${fullName}`);
    const body = encodeURIComponent([
      `Full Name: ${fullName}`,
      `Email: ${email}`,
      `Phone Number: ${phone}`,
      `Service You Need Help With: ${service}`,
    ].join("\n"));

    return `mailto:${fallbackEmail}?subject=${subject}&body=${body}`;
  };

  simpleContactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!simpleContactForm.checkValidity()) {
      simpleContactForm.reportValidity();
      return;
    }

    const formData = new FormData(simpleContactForm);
    const payload = {
      fullName: String(formData.get("fullName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      service: String(formData.get("service") || "").trim(),
      source: "contact-page",
    };

    setStatus("", "");

    if (!endpoint) {
      window.location.href = buildMailto(payload);
      setStatus("Your email app should open with these details filled in. If it does not, call (519) 902-5029.", "success");
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending...";
    }

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Submission failed.");

      simpleContactForm.reset();
      setStatus("Message received. Cutting Edge Carpentry will follow up with you shortly.", "success");
    } catch (error) {
      setStatus("Something went wrong while sending the message. Please try again or call (519) 902-5029.", "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = submitText;
      }
    }
  });
}

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

  let wrapTimer;
  const wrapToPage = (index) => {
    window.clearTimeout(wrapTimer);
    carousel.classList.add("is-wrapping");
    wrapTimer = window.setTimeout(() => {
      scrollToPage(index, "instant");
      window.requestAnimationFrame(() => {
        carousel.classList.remove("is-wrapping");
      });
    }, 180);
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
    if (current <= 0) {
      wrapToPage(lastPage);
      return;
    }
    scrollToPage(current - 1);
  });

  next.addEventListener("click", () => {
    const lastPage = getPageCount() - 1;
    const current = getActivePage();
    if (current >= lastPage) {
      wrapToPage(0);
      return;
    }
    scrollToPage(current + 1);
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
