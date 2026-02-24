/**
 * Job Notification Tracker — Preferences module
 * Saves/loads preferences from localStorage as jobTrackerPreferences
 */
(function () {
  "use strict";

  var STORAGE_KEY = "jobTrackerPreferences";

  var DEFAULT_PREFS = {
    roleKeywords: "",
    preferredLocations: [],
    preferredMode: [],
    experienceLevel: "",
    skills: "",
    minMatchScore: 40
  };

  function getPreferences() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var p = JSON.parse(raw);
      return {
        roleKeywords: p.roleKeywords || "",
        preferredLocations: Array.isArray(p.preferredLocations) ? p.preferredLocations : [],
        preferredMode: Array.isArray(p.preferredMode) ? p.preferredMode : [],
        experienceLevel: p.experienceLevel || "",
        skills: p.skills || "",
        minMatchScore: typeof p.minMatchScore === "number" ? Math.max(0, Math.min(100, p.minMatchScore)) : 40
      };
    } catch (e) {
      return null;
    }
  }

  function savePreferences(prefs) {
    var p = {
      roleKeywords: String(prefs.roleKeywords || "").trim(),
      preferredLocations: Array.isArray(prefs.preferredLocations) ? prefs.preferredLocations : [],
      preferredMode: Array.isArray(prefs.preferredMode) ? prefs.preferredMode : [],
      experienceLevel: String(prefs.experienceLevel || "").trim(),
      skills: String(prefs.skills || "").trim(),
      minMatchScore: Math.max(0, Math.min(100, Number(prefs.minMatchScore) || 40))
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
    return p;
  }

  function hasPreferences() {
    var p = getPreferences();
    return p !== null;
  }

  window.PreferencesModule = {
    getPreferences: getPreferences,
    savePreferences: savePreferences,
    hasPreferences: hasPreferences,
    DEFAULT_PREFS: DEFAULT_PREFS
  };
})();
