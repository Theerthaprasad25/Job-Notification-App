/**
 * Job Notification Tracker — Settings page
 * Renders preferences form, saves to localStorage
 */
(function () {
  "use strict";

  var jobs = window.JOBS_DATA || [];
  var Preferences = window.PreferencesModule;

  function escapeHtml(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = String(s);
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

  function renderSettings(container) {
    var prefs = Preferences ? Preferences.getPreferences() : null;
    var locs = getUniqueValues("location");
    var exps = getUniqueValues("experience");

    var roleKeywords = prefs ? prefs.roleKeywords : "";
    var preferredLocations = prefs && prefs.preferredLocations ? prefs.preferredLocations : [];
    var preferredMode = prefs && prefs.preferredMode ? prefs.preferredMode : [];
    var experienceLevel = prefs ? prefs.experienceLevel : "";
    var skills = prefs ? prefs.skills : "";
    var minMatchScore = prefs ? prefs.minMatchScore : 40;

    var locOpts = locs.map(function (l) {
      var sel = preferredLocations.indexOf(l) >= 0 ? ' selected' : '';
      return '<option value="' + escapeHtml(l) + '"' + sel + '>' + escapeHtml(l) + '</option>';
    }).join("");

    var expOpts = '<option value="">Any</option>' + exps.map(function (e) {
      var sel = experienceLevel === e ? ' selected' : '';
      return '<option value="' + escapeHtml(e) + '"' + sel + '>' + escapeHtml(e) + '</option>';
    }).join("");

    var remoteChecked = preferredMode.indexOf("Remote") >= 0 ? ' checked' : '';
    var hybridChecked = preferredMode.indexOf("Hybrid") >= 0 ? ' checked' : '';
    var onsiteChecked = preferredMode.indexOf("Onsite") >= 0 ? ' checked' : '';

    container.className = "ds-route-placeholder ds-settings";
    container.innerHTML =
      '<h1 class="ds-settings__headline">Settings</h1>' +
      '<p class="ds-settings__subtext">Configure your job preferences.</p>' +
      '<form class="ds-settings__form" id="settings-form">' +
      '<div class="ds-field">' +
      '<label class="ds-label" for="role-keywords">Role keywords</label>' +
      '<input type="text" id="role-keywords" name="roleKeywords" class="ds-input" placeholder="e.g. SDE Intern, React Developer (comma-separated)" value="' + escapeHtml(roleKeywords) + '" />' +
      "</div>" +
      '<div class="ds-field">' +
      '<label class="ds-label" for="preferred-locations">Preferred locations</label>' +
      '<select id="preferred-locations" name="preferredLocations" class="ds-input" multiple size="4">' + locOpts + '</select>' +
      '<span class="ds-field__hint">Hold Ctrl/Cmd to select multiple</span>' +
      "</div>" +
      '<div class="ds-field">' +
      '<span class="ds-label">Preferred mode</span>' +
      '<div class="ds-checkbox-group">' +
      '<label class="ds-checkbox"><input type="checkbox" name="preferredMode" value="Remote"' + remoteChecked + ' /> Remote</label>' +
      '<label class="ds-checkbox"><input type="checkbox" name="preferredMode" value="Hybrid"' + hybridChecked + ' /> Hybrid</label>' +
      '<label class="ds-checkbox"><input type="checkbox" name="preferredMode" value="Onsite"' + onsiteChecked + ' /> Onsite</label>' +
      "</div>" +
      "</div>" +
      '<div class="ds-field">' +
      '<label class="ds-label" for="experience-level">Experience level</label>' +
      '<select id="experience-level" name="experienceLevel" class="ds-input">' + expOpts + '</select>' +
      "</div>" +
      '<div class="ds-field">' +
      '<label class="ds-label" for="skills">Skills</label>' +
      '<input type="text" id="skills" name="skills" class="ds-input" placeholder="e.g. React, Python, Java (comma-separated)" value="' + escapeHtml(skills) + '" />' +
      "</div>" +
      '<div class="ds-field">' +
      '<label class="ds-label" for="min-match-score">Minimum match score <span id="min-match-value">' + minMatchScore + '</span></label>' +
      '<input type="range" id="min-match-score" name="minMatchScore" class="ds-range" min="0" max="100" value="' + minMatchScore + '" />' +
      "</div>" +
      '<button type="submit" class="ds-btn ds-btn--primary">Save preferences</button>' +
      "</form>";

    var form = container.querySelector("#settings-form");
    var rangeInput = container.querySelector("#min-match-score");
    var rangeValue = container.querySelector("#min-match-value");

    if (rangeInput && rangeValue) {
      rangeInput.addEventListener("input", function () {
        rangeValue.textContent = rangeInput.value;
      });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var modeCheckboxes = form.querySelectorAll('input[name="preferredMode"]:checked');
      var modes = [];
      for (var i = 0; i < modeCheckboxes.length; i++) {
        modes.push(modeCheckboxes[i].value);
      }
      var locSelect = form.querySelector("#preferred-locations");
      var locsSelected = [];
      if (locSelect) {
        for (var j = 0; j < locSelect.options.length; j++) {
          if (locSelect.options[j].selected) locsSelected.push(locSelect.options[j].value);
        }
      }
      var prefs = {
        roleKeywords: (form.querySelector('[name="roleKeywords"]') || {}).value || "",
        preferredLocations: locsSelected,
        preferredMode: modes,
        experienceLevel: (form.querySelector('[name="experienceLevel"]') || {}).value || "",
        skills: (form.querySelector('[name="skills"]') || {}).value || "",
        minMatchScore: parseInt((form.querySelector('[name="minMatchScore"]') || {}).value, 10) || 40
      };
      if (Preferences) Preferences.savePreferences(prefs);
    });
  }

  window.SettingsModule = { renderSettings: renderSettings };
})();
