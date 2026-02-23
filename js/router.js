(function () {
  "use strict";

  var ROUTES = {
    "/": { title: "Home", heading: "Home" },
    "/dashboard": { title: "Dashboard", heading: "Dashboard" },
    "/saved": { title: "Saved", heading: "Saved" },
    "/digest": { title: "Digest", heading: "Digest" },
    "/settings": { title: "Settings", heading: "Settings" },
    "/proof": { title: "Proof", heading: "Proof" }
  };

  var SUBTEXT = "This section will be built in the next step.";
  var SUBTEXT_404 = "The page you are looking for does not exist.";

  function getPath() {
    var path = window.location.pathname.replace(/\/$/, "") || "/";
    return path;
  }

  function getRoute(path) {
    return ROUTES[path] || null;
  }

  function renderPlaceholder(container, route) {
    container.className = "ds-route-placeholder";
    container.innerHTML =
      '<h1 class="ds-route-placeholder__headline">' +
      escapeHtml(route.heading) +
      "</h1>" +
      '<p class="ds-route-placeholder__subtext">' +
      escapeHtml(SUBTEXT) +
      "</p>";
  }

  function render404(container) {
    container.className = "ds-route-404";
    container.innerHTML =
      '<h1 class="ds-route-404__headline">Page Not Found</h1>' +
      '<p class="ds-route-404__subtext">' +
      escapeHtml(SUBTEXT_404) +
      "</p>";
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function setActiveLink(path) {
    var links = document.querySelectorAll(".ds-topbar__link[data-route]");
    links.forEach(function (link) {
      var linkPath = link.getAttribute("data-route");
      if (linkPath === path) {
        link.classList.add("is-active");
      } else {
        link.classList.remove("is-active");
      }
    });
    var homeLink = document.querySelector('.ds-topbar__brand');
    if (homeLink) {
      if (path === "/") {
        homeLink.classList.add("is-active");
      } else {
        homeLink.classList.remove("is-active");
      }
    }
  }

  function closeMobileMenu() {
    var btn = document.querySelector(".ds-topbar__menu-btn");
    var dropdown = document.getElementById("nav-dropdown");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
    }
    if (dropdown) {
      dropdown.classList.remove("is-open");
      dropdown.setAttribute("hidden", "");
    }
  }

  function render() {
    var path = getPath();
    var route = getRoute(path);
    var container = document.getElementById("route-content");
    if (!container) return;

    if (route) {
      document.title = route.title + " — Job Notification App";
      renderPlaceholder(container, route);
    } else {
      document.title = "Page Not Found — Job Notification App";
      render404(container);
    }

    setActiveLink(path);
    closeMobileMenu();
  }

  function handleClick(e) {
    var link = e.target.closest('a[href^="/"]');
    if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
    var href = link.getAttribute("href");
    var path = href.replace(/\/$/, "") || "/";
    var currentPath = getPath();
    if (path === currentPath) {
      e.preventDefault();
      return;
    }
    e.preventDefault();
    history.pushState({}, "", href);
    render();
  }

  function init() {
    var container = document.getElementById("route-content");
    if (!container) return;

    document.addEventListener("click", handleClick);
    window.addEventListener("popstate", render);

    render();
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
