/**
 * Job Notification Tracker — Jobs module
 * Handles dashboard, saved page, filtering, modal, save/apply
 */
(function () {
  "use strict";

  var STORAGE_KEY = "job-tracker-saved";
  var jobs = window.JOBS_DATA || [];

  function getSavedIds() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveJob(id) {
    var ids = getSavedIds();
    if (ids.indexOf(id) === -1) {
      ids.push(id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    }
  }

  function removeSavedJob(id) {
    var ids = getSavedIds().filter(function (x) { return x !== id; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }

  function escapeHtml(s) {
    var div = document.createElement("div");
    div.textContent = s;
    return div.innerHTML;
  }

  function getUniqueValues(key) {
    var seen = {};
    jobs.forEach(function (j) {
      var v = j[key] || "";
      if (v) seen[v] = true;
    });
    return Object.keys(seen).sort();
  }

  function filterAndSortJobs(filters) {
    var result = jobs.slice();
    var kw = (filters.keyword || "").toLowerCase().trim();
    if (kw) {
      result = result.filter(function (j) {
        return (
          (j.title || "").toLowerCase().indexOf(kw) >= 0 ||
          (j.company || "").toLowerCase().indexOf(kw) >= 0
        );
      });
    }
    if (filters.location) {
      result = result.filter(function (j) { return j.location === filters.location; });
    }
    if (filters.mode) {
      result = result.filter(function (j) { return j.mode === filters.mode; });
    }
    if (filters.experience) {
      result = result.filter(function (j) { return j.experience === filters.experience; });
    }
    if (filters.source) {
      result = result.filter(function (j) { return j.source === filters.source; });
    }
    var sortBy = filters.sort || "latest";
    if (sortBy === "latest") {
      result.sort(function (a, b) { return (a.postedDaysAgo || 99) - (b.postedDaysAgo || 99); });
    } else if (sortBy === "oldest") {
      result.sort(function (a, b) { return (b.postedDaysAgo || 0) - (a.postedDaysAgo || 0); });
    }
    return result;
  }

  function formatPosted(days) {
    if (days === 0) return "Today";
    if (days === 1) return "1 day ago";
    return days + " days ago";
  }

  function renderJobCard(job, isSavedPage) {
    var savedIds = getSavedIds();
    var saved = savedIds.indexOf(job.id) >= 0;
    var saveLabel = isSavedPage ? "Remove" : (saved ? "Saved" : "Save");
    var saveClass = saved ? "ds-btn--secondary ds-job-card__save--saved" : "ds-btn--secondary";
    return (
      '<article class="ds-job-card" data-job-id="' + escapeHtml(job.id) + '">' +
      '<div class="ds-job-card__header">' +
      '<h3 class="ds-job-card__title">' + escapeHtml(job.title) + '</h3>' +
      '<span class="ds-job-card__badge ds-job-card__badge--' + (job.source || "").toLowerCase() + '">' + escapeHtml(job.source || "") + '</span>' +
      "</div>" +
      '<p class="ds-job-card__company">' + escapeHtml(job.company) + '</p>' +
      '<p class="ds-job-card__meta">' +
      escapeHtml(job.location || "") + " · " + escapeHtml(job.mode || "") +
      "</p>" +
      '<p class="ds-job-card__meta">Experience: ' + escapeHtml(job.experience || "") + '</p>' +
      '<p class="ds-job-card__salary">' + escapeHtml(job.salaryRange || "") + '</p>' +
      '<p class="ds-job-card__posted">' + formatPosted(job.postedDaysAgo) + '</p>' +
      '<div class="ds-job-card__actions">' +
      '<button type="button" class="ds-btn ds-btn--secondary ds-job-card__view">View</button>' +
      '<button type="button" class="ds-btn ' + saveClass + ' ds-job-card__save">' + saveLabel + '</button>' +
      '<a href="' + escapeHtml(job.applyUrl || "#") + '" target="_blank" rel="noopener" class="ds-btn ds-btn--primary ds-job-card__apply">Apply</a>' +
      "</div>" +
      "</article>"
    );
  }

  function showModal(job) {
    var overlay = document.getElementById("job-modal-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "job-modal-overlay";
      overlay.className = "ds-modal-overlay";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-labelledby", "job-modal-title");
      document.body.appendChild(overlay);
    }
    var skillsHtml = (job.skills || []).map(function (s) {
      return '<span class="ds-modal__skill">' + escapeHtml(s) + "</span>";
    }).join("");
    overlay.innerHTML =
      '<div class="ds-modal">' +
      '<div class="ds-modal__header">' +
      '<h2 id="job-modal-title" class="ds-modal__title">' + escapeHtml(job.title) + '</h2>' +
      '<button type="button" class="ds-modal__close" aria-label="Close">&times;</button>' +
      "</div>" +
      '<p class="ds-modal__company">' + escapeHtml(job.company) + '</p>' +
      '<p class="ds-modal__meta">' + escapeHtml(job.location) + " · " + escapeHtml(job.mode) + " · " + escapeHtml(job.experience) + '</p>' +
      '<div class="ds-modal__skills">' + skillsHtml + '</div>' +
      '<div class="ds-modal__body">' +
      '<p class="ds-modal__description">' + escapeHtml(job.description || "") + '</p>' +
      "</div>" +
      '<div class="ds-modal__footer">' +
      '<a href="' + escapeHtml(job.applyUrl || "#") + '" target="_blank" rel="noopener" class="ds-btn ds-btn--primary">Apply</a>' +
      "</div>" +
      "</div>";
    overlay.classList.add("ds-modal-overlay--open");
    overlay.hidden = false;

    function closeModal() {
      overlay.classList.remove("ds-modal-overlay--open");
      overlay.hidden = true;
    }

    overlay.querySelector(".ds-modal__close").onclick = closeModal;
    overlay.onclick = function (e) {
      if (e.target === overlay) closeModal();
    };
    document.addEventListener("keydown", function onEsc(e) {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", onEsc);
      }
    });
  }

  function getFiltersFromForm(form) {
    if (!form) return {};
    return {
      keyword: (form.querySelector("[data-filter=keyword]") || {}).value || "",
      location: (form.querySelector("[data-filter=location]") || {}).value || "",
      mode: (form.querySelector("[data-filter=mode]") || {}).value || "",
      experience: (form.querySelector("[data-filter=experience]") || {}).value || "",
      source: (form.querySelector("[data-filter=source]") || {}).value || "",
      sort: (form.querySelector("[data-filter=sort]") || {}).value || "latest"
    };
  }

  function renderDashboardCards(container, filteredJobs) {
    var grid = container.querySelector(".ds-dashboard__grid");
    if (!grid) return;
    if (filteredJobs.length === 0) {
      grid.innerHTML =
        '<div class="ds-dashboard__no-results">' +
        '<p class="ds-dashboard__no-results-text">No jobs match your search.</p>' +
        "</div>";
      return;
    }
    grid.innerHTML = filteredJobs.map(function (j) { return renderJobCard(j, false); }).join("");
    attachJobCardHandlers(container);
  }

  function attachJobCardHandlers(container) {
    if (!container) return;
    container.querySelectorAll(".ds-job-card__view").forEach(function (btn) {
      btn.onclick = function () {
        var card = btn.closest(".ds-job-card");
        var id = card && card.getAttribute("data-job-id");
        var job = jobs.find(function (j) { return j.id === id; });
        if (job) showModal(job);
      };
    });
    container.querySelectorAll(".ds-job-card__save").forEach(function (btn) {
      btn.onclick = function () {
        var card = btn.closest(".ds-job-card");
        var id = card && card.getAttribute("data-job-id");
        if (!id) return;
        saveJob(id);
        btn.textContent = "Saved";
        btn.classList.add("ds-job-card__save--saved");
      };
    });
  }

  function renderDashboard(container) {
    var locs = getUniqueValues("location");
    var modes = getUniqueValues("mode");
    var exps = getUniqueValues("experience");
    var srcs = getUniqueValues("source");

    var locOpts = '<option value="">All locations</option>' + locs.map(function (l) {
      return '<option value="' + escapeHtml(l) + '">' + escapeHtml(l) + "</option>";
    }).join("");
    var modeOpts = '<option value="">All modes</option>' + modes.map(function (m) {
      return '<option value="' + escapeHtml(m) + '">' + escapeHtml(m) + "</option>";
    }).join("");
    var expOpts = '<option value="">All experience</option>' + exps.map(function (e) {
      return '<option value="' + escapeHtml(e) + '">' + escapeHtml(e) + "</option>";
    }).join("");
    var srcOpts = '<option value="">All sources</option>' + srcs.map(function (s) {
      return '<option value="' + escapeHtml(s) + '">' + escapeHtml(s) + "</option>";
    }).join("");

    container.className = "ds-route-placeholder ds-dashboard";
    container.innerHTML =
      '<h1 class="ds-dashboard__headline">Dashboard</h1>' +
      '<form class="ds-filter-bar" id="dashboard-filters">' +
      '<input type="text" class="ds-input ds-filter-bar__input" data-filter="keyword" placeholder="Search title or company" />' +
      '<select class="ds-input ds-filter-bar__select" data-filter="location">' + locOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="mode">' + modeOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="experience">' + expOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="source">' + srcOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="sort">' +
      '<option value="latest">Latest</option>' +
      '<option value="oldest">Oldest</option>' +
      "</select>" +
      "</form>" +
      '<div class="ds-dashboard__grid"></div>';

    var form = container.querySelector("#dashboard-filters");
    function applyFilters() {
      var f = getFiltersFromForm(form);
      var filtered = filterAndSortJobs(f);
      renderDashboardCards(container, filtered);
    }
    form.addEventListener("input", applyFilters);
    form.addEventListener("change", applyFilters);
    applyFilters();
  }

  function renderSaved(container) {
    var savedIds = getSavedIds();
    var savedJobs = savedIds.map(function (id) {
      return jobs.find(function (j) { return j.id === id; });
    }).filter(Boolean);

    container.className = "ds-route-placeholder ds-saved-page";
    if (savedJobs.length === 0) {
      container.innerHTML =
        '<div class="ds-empty">' +
        '<h2 class="ds-empty__title">No saved jobs</h2>' +
        '<p class="ds-empty__text">Jobs you save for later will appear here.</p>' +
        "</div>";
      return;
    }

    container.innerHTML =
      '<h1 class="ds-saved-page__headline">Saved Jobs</h1>' +
      '<div class="ds-saved-page__grid"></div>';
    var grid = container.querySelector(".ds-saved-page__grid");
    savedJobs.forEach(function (job) {
      var card = document.createElement("div");
      card.innerHTML = renderJobCard(job, true); /* isSavedPage: show Remove */
      grid.appendChild(card.firstElementChild);
    });

    container.querySelectorAll(".ds-job-card__view").forEach(function (btn) {
      btn.onclick = function () {
        var card = btn.closest(".ds-job-card");
        var id = card && card.getAttribute("data-job-id");
        var job = jobs.find(function (j) { return j.id === id; });
        if (job) showModal(job);
      };
    });
    container.querySelectorAll(".ds-job-card__save").forEach(function (btn) {
      btn.onclick = function () {
        var card = btn.closest(".ds-job-card");
        var id = card && card.getAttribute("data-job-id");
        if (!id) return;
        removeSavedJob(id);
        card.remove();
        var grid = container.querySelector(".ds-saved-page__grid");
        if (grid && grid.children.length === 0) {
          container.innerHTML =
            '<div class="ds-empty">' +
            '<h2 class="ds-empty__title">No saved jobs</h2>' +
            '<p class="ds-empty__text">Jobs you save for later will appear here.</p>' +
            "</div>";
        }
      };
    });
  }

  window.JobsModule = {
    renderDashboard: renderDashboard,
    renderSaved: renderSaved
  };
})();
