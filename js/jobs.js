/**
 * Job Notification Tracker — Jobs module
 * Handles dashboard, saved page, filtering, modal, save/apply, match scoring
 */
(function () {
  "use strict";

  var STORAGE_KEY = "job-tracker-saved";
  var jobs = window.JOBS_DATA || [];
  var Preferences = window.PreferencesModule;

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

  /**
   * Match score engine — exact rules per specification
   * +25 roleKeyword in title, +15 in description
   * +15 location match, +10 mode match, +10 experience match
   * +15 skills overlap, +5 postedDaysAgo<=2, +5 LinkedIn
   * Cap at 100
   */
  function computeMatchScore(job, prefs) {
    if (!prefs) return 0;
    var score = 0;

    var roleKeywords = (prefs.roleKeywords || "").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    var title = (job.title || "").toLowerCase();
    var desc = (job.description || "").toLowerCase();

    if (roleKeywords.length > 0) {
      var inTitle = roleKeywords.some(function (kw) { return title.indexOf(kw) >= 0; });
      if (inTitle) score += 25;
      var inDesc = roleKeywords.some(function (kw) { return desc.indexOf(kw) >= 0; });
      if (inDesc) score += 15;
    }

    var prefLocs = prefs.preferredLocations || [];
    if (prefLocs.length > 0 && job.location && prefLocs.indexOf(job.location) >= 0) {
      score += 15;
    }

    var prefModes = prefs.preferredMode || [];
    if (prefModes.length > 0 && job.mode && prefModes.indexOf(job.mode) >= 0) {
      score += 10;
    }

    if (prefs.experienceLevel && job.experience === prefs.experienceLevel) {
      score += 10;
    }

    var userSkills = (prefs.skills || "").split(",").map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean);
    var jobSkills = (job.skills || []).map(function (s) { return String(s).toLowerCase(); });
    if (userSkills.length > 0 && jobSkills.length > 0) {
      var overlap = userSkills.some(function (us) {
        return jobSkills.some(function (js) { return js.indexOf(us) >= 0 || us.indexOf(js) >= 0; });
      });
      if (overlap) score += 15;
    }

    if ((job.postedDaysAgo || 99) <= 2) score += 5;
    if ((job.source || "").toLowerCase() === "linkedin") score += 5;

    return Math.min(100, score);
  }

  function getMatchScoreBadgeClass(score) {
    if (score >= 80) return "ds-match-badge--high";
    if (score >= 60) return "ds-match-badge--medium";
    if (score >= 40) return "ds-match-badge--neutral";
    return "ds-match-badge--low";
  }

  function extractSalaryForSort(salaryRange) {
    if (!salaryRange) return 0;
    var s = String(salaryRange);
    var match = s.match(/₹(\d+)/) || s.match(/(\d+)\s*[–\-]\s*(\d+)/) || s.match(/(\d+)\s*LPA/);
    if (match) {
      if (s.indexOf("LPA") >= 0) return parseInt(match[1], 10) || 0;
      if (s.indexOf("₹") >= 0) return parseInt(match[1], 10) || 0;
      return parseInt(match[1], 10) || 0;
    }
    return 0;
  }

  function filterAndSortJobs(filters, prefs) {
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
    var showOnlyMatches = filters.showOnlyMatches === true;
    var minScore = (prefs && prefs.minMatchScore != null) ? prefs.minMatchScore : 40;

    result.forEach(function (j) {
      j._matchScore = computeMatchScore(j, prefs);
    });

    if (showOnlyMatches && prefs) {
      result = result.filter(function (j) { return j._matchScore >= minScore; });
    }

    if (sortBy === "latest") {
      result.sort(function (a, b) { return (a.postedDaysAgo || 99) - (b.postedDaysAgo || 99); });
    } else if (sortBy === "match") {
      result.sort(function (a, b) { return (b._matchScore || 0) - (a._matchScore || 0); });
    } else if (sortBy === "salary") {
      result.sort(function (a, b) {
        var sa = extractSalaryForSort(a.salaryRange);
        var sb = extractSalaryForSort(b.salaryRange);
        return sb - sa;
      });
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

    var prefs = Preferences ? Preferences.getPreferences() : null;
    var matchScore = prefs ? computeMatchScore(job, prefs) : 0;
    var matchBadge = "";
    if (prefs) {
      var badgeClass = getMatchScoreBadgeClass(matchScore);
      matchBadge = '<span class="ds-match-badge ' + badgeClass + '">' + matchScore + '%</span>';
    }

    return (
      '<article class="ds-job-card" data-job-id="' + escapeHtml(job.id) + '">' +
      '<div class="ds-job-card__header">' +
      '<h3 class="ds-job-card__title">' + escapeHtml(job.title) + '</h3>' +
      '<div class="ds-job-card__badges">' +
      matchBadge +
      '<span class="ds-job-card__badge ds-job-card__badge--' + (job.source || "").toLowerCase() + '">' + escapeHtml(job.source || "") + '</span>' +
      "</div>" +
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
    var toggle = form.querySelector("[data-filter=showOnlyMatches]");
    return {
      keyword: (form.querySelector("[data-filter=keyword]") || {}).value || "",
      location: (form.querySelector("[data-filter=location]") || {}).value || "",
      mode: (form.querySelector("[data-filter=mode]") || {}).value || "",
      experience: (form.querySelector("[data-filter=experience]") || {}).value || "",
      source: (form.querySelector("[data-filter=source]") || {}).value || "",
      sort: (form.querySelector("[data-filter=sort]") || {}).value || "latest",
      showOnlyMatches: toggle ? toggle.checked : false
    };
  }

  function renderDashboardCards(container, filteredJobs, noMatches) {
    var grid = container.querySelector(".ds-dashboard__grid");
    if (!grid) return;
    if (filteredJobs.length === 0) {
      grid.innerHTML =
        '<div class="ds-dashboard__no-results">' +
        '<p class="ds-dashboard__no-results-text">' +
        (noMatches ? "No roles match your criteria. Adjust filters or lower threshold." : "No jobs match your search.") +
        '</p>' +
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
    var prefs = Preferences ? Preferences.getPreferences() : null;
    var hasPrefs = Preferences ? Preferences.hasPreferences() : false;

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

    var bannerHtml = "";
    if (!hasPrefs) {
      bannerHtml =
        '<div class="ds-dashboard__banner">' +
        'Set your preferences to activate intelligent matching.' +
        ' <a href="/settings" class="ds-dashboard__banner-link">Go to Settings</a>' +
        "</div>";
    }

    var toggleHtml = hasPrefs
      ? '<label class="ds-dashboard__toggle">' +
        '<input type="checkbox" data-filter="showOnlyMatches" />' +
        ' Show only jobs above my threshold' +
        "</label>"
      : "";

    container.className = "ds-route-placeholder ds-dashboard";
    container.innerHTML =
      '<h1 class="ds-dashboard__headline">Dashboard</h1>' +
      bannerHtml +
      '<form class="ds-filter-bar" id="dashboard-filters">' +
      '<input type="text" class="ds-input ds-filter-bar__input" data-filter="keyword" placeholder="Search title or company" />' +
      '<select class="ds-input ds-filter-bar__select" data-filter="location">' + locOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="mode">' + modeOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="experience">' + expOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="source">' + srcOpts + '</select>' +
      '<select class="ds-input ds-filter-bar__select" data-filter="sort">' +
      '<option value="latest">Latest</option>' +
      '<option value="oldest">Oldest</option>' +
      '<option value="match">Match Score</option>' +
      '<option value="salary">Salary</option>' +
      "</select>" +
      toggleHtml +
      "</form>" +
      '<div class="ds-dashboard__grid"></div>';

    var form = container.querySelector("#dashboard-filters");
    function applyFilters() {
      var f = getFiltersFromForm(form);
      var filtered = filterAndSortJobs(f, prefs);
      var noMatches = f.showOnlyMatches && filtered.length === 0;
      renderDashboardCards(container, filtered, noMatches);
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
      card.innerHTML = renderJobCard(job, true);
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
        var gridEl = container.querySelector(".ds-saved-page__grid");
        if (gridEl && gridEl.children.length === 0) {
          container.innerHTML =
            '<div class="ds-empty">' +
            '<h2 class="ds-empty__title">No saved jobs</h2>' +
            '<p class="ds-empty__text">Jobs you save for later will appear here.</p>' +
            "</div>";
        }
      };
    });
  }

  function getTodayDateString() {
    var d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function getDigestStorageKey(dateStr) {
    return "jobTrackerDigest_" + dateStr;
  }

  function getDigestForToday() {
    var key = getDigestStorageKey(getTodayDateString());
    try {
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function generateDigest() {
    var prefs = Preferences ? Preferences.getPreferences() : null;
    if (!prefs) return null;
    var scored = jobs.slice().map(function (j) {
      var s = computeMatchScore(j, prefs);
      return { job: j, _matchScore: s };
    });
    scored.sort(function (a, b) {
      var diff = (b._matchScore || 0) - (a._matchScore || 0);
      if (diff !== 0) return diff;
      return (a.job.postedDaysAgo || 99) - (b.job.postedDaysAgo || 99);
    });
    var top10 = scored.slice(0, 10).map(function (x) {
      var j = x.job;
      j._matchScore = x._matchScore;
      return j;
    });
    var payload = { date: getTodayDateString(), jobs: top10 };
    localStorage.setItem(getDigestStorageKey(getTodayDateString()), JSON.stringify(payload));
    return payload;
  }

  function getOrGenerateDigest(forceRegenerate) {
    var existing = !forceRegenerate ? getDigestForToday() : null;
    if (existing && existing.jobs && existing.jobs.length > 0) return existing;
    return generateDigest();
  }

  function formatDigestAsPlainText(digestJobs) {
    var lines = ["Top 10 Jobs For You — 9AM Digest", getTodayDateString(), ""];
    digestJobs.forEach(function (j, i) {
      lines.push((i + 1) + ". " + (j.title || "") + " @ " + (j.company || ""));
      lines.push("   " + (j.location || "") + " · " + (j.experience || "") + " · Match: " + (j._matchScore || 0) + "%");
      lines.push("   " + (j.applyUrl || ""));
      lines.push("");
    });
    lines.push("This digest was generated based on your preferences.");
    return lines.join("\n");
  }

  function formatDigestForEmailBody(digestJobs) {
    return formatDigestAsPlainText(digestJobs);
  }

  function renderDigest(container) {
    var hasPrefs = Preferences ? Preferences.hasPreferences() : false;
    var formattedDate = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    container.className = "ds-route-placeholder ds-digest";

    if (!hasPrefs) {
      container.innerHTML =
        '<div class="ds-digest__block">' +
        '<p class="ds-digest__block-text">Set preferences to generate a personalized digest.</p>' +
        '<a href="/settings" class="ds-btn ds-btn--primary">Go to Settings</a>' +
        "</div>";
      return;
    }

    var digestData = null;
    var digestContent = "";
    var actionsHtml = "";

    container.innerHTML =
      '<div class="ds-digest__wrapper">' +
      '<p class="ds-digest__note">Demo Mode: Daily 9AM trigger simulated manually.</p>' +
      '<button type="button" class="ds-btn ds-btn--primary ds-digest__generate" id="digest-generate-btn">Generate Today\'s 9AM Digest (Simulated)</button>' +
      '<div class="ds-digest__card" id="digest-card"></div>' +
      "</div>";

    var cardEl = container.querySelector("#digest-card");
    var btnEl = container.querySelector("#digest-generate-btn");

    function renderDigestContent(data) {
      if (!data) {
        cardEl.innerHTML =
          '<div class="ds-digest__empty">' +
          '<p class="ds-digest__empty-text">Click the button above to generate your digest.</p>' +
          "</div>";
        return;
      }
      if (!data.jobs || data.jobs.length === 0) {
        cardEl.innerHTML =
          '<div class="ds-digest__empty">' +
          '<h2 class="ds-digest__empty-title">No matching roles today</h2>' +
          '<p class="ds-digest__empty-text">Check again tomorrow.</p>' +
          "</div>";
        return;
      }

      var jobsHtml = data.jobs.map(function (j) {
        var badgeClass = getMatchScoreBadgeClass(j._matchScore || 0);
        return (
          '<div class="ds-digest__item">' +
          '<h3 class="ds-digest__item-title">' + escapeHtml(j.title || "") + '</h3>' +
          '<p class="ds-digest__item-company">' + escapeHtml(j.company || "") + '</p>' +
          '<p class="ds-digest__item-meta">' + escapeHtml(j.location || "") + " · " + escapeHtml(j.experience || "") + '</p>' +
          '<p class="ds-digest__item-score"><span class="ds-match-badge ' + badgeClass + '">' + (j._matchScore || 0) + '%</span></p>' +
          '<a href="' + escapeHtml(j.applyUrl || "#") + '" target="_blank" rel="noopener" class="ds-btn ds-btn--primary ds-digest__apply">Apply</a>' +
          "</div>"
        );
      }).join("");

      cardEl.innerHTML =
        '<div class="ds-digest__header">' +
        '<h1 class="ds-digest__headline">Top 10 Jobs For You — 9AM Digest</h1>' +
        '<p class="ds-digest__subtext">' + formattedDate + '</p>' +
        "</div>" +
        '<div class="ds-digest__list">' + jobsHtml + '</div>' +
        '<div class="ds-digest__footer">' +
        '<p class="ds-digest__footer-text">This digest was generated based on your preferences.</p>' +
        '<div class="ds-digest__actions">' +
        '<button type="button" class="ds-btn ds-btn--secondary" id="digest-copy-btn">Copy Digest to Clipboard</button>' +
        '<a href="#" class="ds-btn ds-btn--secondary" id="digest-email-link">Create Email Draft</a>' +
        "</div>" +
        "</div>";
    }

    function loadAndShow() {
      digestData = getDigestForToday();
      if (digestData && digestData.jobs && digestData.jobs.length > 0) {
        renderDigestContent(digestData);
        var copyBtn = cardEl.querySelector("#digest-copy-btn");
        var emailLink = cardEl.querySelector("#digest-email-link");
        if (copyBtn) {
          copyBtn.onclick = function () {
            var text = formatDigestAsPlainText(digestData.jobs);
            navigator.clipboard.writeText(text).then(function () { copyBtn.textContent = "Copied!"; });
          };
        }
        if (emailLink) {
          var body = encodeURIComponent(formatDigestForEmailBody(digestData.jobs));
          emailLink.href = "mailto:?subject=" + encodeURIComponent("My 9AM Job Digest") + "&body=" + body;
          emailLink.setAttribute("target", "_blank");
        }
      } else {
        renderDigestContent(digestData);
      }
    }

    btnEl.onclick = function () {
      digestData = getOrGenerateDigest(false);
      renderDigestContent(digestData);
      if (digestData && digestData.jobs && digestData.jobs.length > 0) {
        var copyBtn = cardEl.querySelector("#digest-copy-btn");
        var emailLink = cardEl.querySelector("#digest-email-link");
        if (copyBtn) {
          copyBtn.onclick = function () {
            var text = formatDigestAsPlainText(digestData.jobs);
            navigator.clipboard.writeText(text).then(function () { copyBtn.textContent = "Copied!"; });
          };
        }
        if (emailLink) {
          var body = encodeURIComponent(formatDigestForEmailBody(digestData.jobs));
          emailLink.href = "mailto:?subject=" + encodeURIComponent("My 9AM Job Digest") + "&body=" + body;
          emailLink.setAttribute("target", "_blank");
        }
      }
    };

    loadAndShow();
  }

  window.JobsModule = {
    renderDashboard: renderDashboard,
    renderSaved: renderSaved,
    renderDigest: renderDigest
  };
})();
