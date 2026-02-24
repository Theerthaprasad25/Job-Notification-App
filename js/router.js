(function () {
  "use strict";

  var APP_TITLE = "Job Notification Tracker";

  var ROUTES = {
    "/": { title: "Home" },
    "/dashboard": { title: "Dashboard" },
    "/saved": { title: "Saved" },
    "/digest": { title: "Digest" },
    "/settings": { title: "Settings" },
    "/proof": { title: "Proof" }
  };

  function getPath() {
    var path = window.location.pathname.replace(/\/$/, "") || "/";
    return path;
  }

  function getRoute(path) {
    return ROUTES[path] || null;
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function renderLanding(container) {
    container.className = "ds-route-placeholder ds-landing";
    container.innerHTML =
      '<div class="ds-landing__content">' +
      '<h1 class="ds-landing__headline">Stop Missing The Right Jobs.</h1>' +
      '<p class="ds-landing__subtext">Precision-matched job discovery delivered daily at 9AM.</p>' +
      '<a href="/settings" class="ds-btn ds-btn--primary ds-landing__cta">Start Tracking</a>' +
      "</div>";
  }

  function renderSettings(container) {
    if (window.SettingsModule && window.SettingsModule.renderSettings) {
      window.SettingsModule.renderSettings(container);
    } else {
      container.className = "ds-route-placeholder ds-settings";
      container.innerHTML =
        '<h1 class="ds-settings__headline">Settings</h1>' +
        '<p class="ds-settings__subtext">Configure your job preferences.</p>';
    }
  }

  function renderDashboard(container) {
    if (window.JobsModule && window.JobsModule.renderDashboard) {
      window.JobsModule.renderDashboard(container);
    } else {
      container.className = "ds-route-placeholder ds-empty-wrapper";
      container.innerHTML =
        '<div class="ds-empty">' +
        '<h2 class="ds-empty__title">No jobs yet</h2>' +
        '<p class="ds-empty__text">In the next step, you will load a realistic dataset.</p>' +
        "</div>";
    }
  }

  function renderSaved(container) {
    if (window.JobsModule && window.JobsModule.renderSaved) {
      window.JobsModule.renderSaved(container);
    } else {
      container.className = "ds-route-placeholder ds-empty-wrapper";
      container.innerHTML =
        '<div class="ds-empty">' +
        '<h2 class="ds-empty__title">No saved jobs</h2>' +
        '<p class="ds-empty__text">Jobs you save for later will appear here.</p>' +
        "</div>";
    }
  }

  function renderDigest(container) {
    container.className = "ds-route-placeholder ds-empty-wrapper";
    container.innerHTML =
      '<div class="ds-empty">' +
      '<h2 class="ds-empty__title">Daily digest</h2>' +
      '<p class="ds-empty__text">Your personalized job summary will be delivered here each morning at 9AM.</p>' +
      "</div>";
  }

  function renderProof(container) {
    container.className = "ds-route-placeholder ds-proof-page";
    container.innerHTML =
      '<h1 class="ds-proof-page__headline">Proof</h1>' +
      '<p class="ds-proof-page__subtext">Placeholder for artifact collection.</p>';
  }

  function render404(container) {
    container.className = "ds-route-404";
    container.innerHTML =
      '<h1 class="ds-route-404__headline">Page Not Found</h1>' +
      '<p class="ds-route-404__subtext">The page you are looking for does not exist.</p>';
  }

  function render(container, path) {
    switch (path) {
      case "/":
        renderLanding(container);
        break;
      case "/settings":
        renderSettings(container);
        break;
      case "/dashboard":
        renderDashboard(container);
        break;
      case "/saved":
        renderSaved(container);
        break;
      case "/digest":
        renderDigest(container);
        break;
      case "/proof":
        renderProof(container);
        break;
      default:
        render404(container);
    }
  }

  function setActiveLink(path) {
    var links = document.querySelectorAll(".ds-topbar__link[data-route]");
    links.forEach(function (link) {
      var linkPath = link.getAttribute("data-route");
      link.classList.toggle("is-active", linkPath === path);
    });
    var brandLink = document.querySelector(".ds-topbar__brand");
    if (brandLink) {
      brandLink.classList.toggle("is-active", path === "/");
    }
  }

  function closeMobileMenu() {
    var btn = document.querySelector(".ds-topbar__menu-btn");
    var dropdown = document.getElementById("nav-dropdown");
    if (btn) btn.setAttribute("aria-expanded", "false");
    if (dropdown) {
      dropdown.classList.remove("is-open");
      dropdown.setAttribute("hidden", "");
    }
  }

  function handleRoute() {
    var path = getPath();
    var route = getRoute(path);
    var container = document.getElementById("route-content");
    if (!container) return;

    document.title = route ? route.title + " — " + APP_TITLE : "Page Not Found — " + APP_TITLE;
    if (route) {
      render(container, path);
    } else {
      render404(container);
    }

    setActiveLink(path);
    closeMobileMenu();
  }

  function handleClick(e) {
    var link = e.target.closest('a[href^="/"]');
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    var href = link.getAttribute("href");
    var path = (href.replace(/\/$/, "") || "/");
    if (path === getPath()) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    history.pushState({}, "", href);
    handleRoute();
  }

  function init() {
    var container = document.getElementById("route-content");
    if (!container) return;

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", handleRoute);

    handleRoute();
  }

  function initMenu() {
    var btn = document.querySelector(".ds-topbar__menu-btn");
    var dropdown = document.getElementById("nav-dropdown");
    if (!btn || !dropdown) return;
    btn.addEventListener("click", function () {
      var open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", !open);
      dropdown.classList.toggle("is-open", !open);
      dropdown.toggleAttribute("hidden", open);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      init();
      initMenu();
    });
  } else {
    init();
    initMenu();
  }
})();
