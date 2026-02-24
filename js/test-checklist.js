/**
 * Job Notification Tracker — Built-In Test Checklist
 * Stores state in localStorage as jobTrackerTestStatus
 */
(function () {
  "use strict";

  var STORAGE_KEY = "jobTrackerTestStatus";
  var TOTAL_TESTS = 10;

  var TEST_ITEMS = [
    { id: "t1", label: "Preferences persist after refresh", tooltip: "Save preferences in Settings, refresh page, confirm form is prefilled." },
    { id: "t2", label: "Match score calculates correctly", tooltip: "Set preferences, check job cards show match % badges." },
    { id: "t3", label: "\"Show only matches\" toggle works", tooltip: "Enable toggle on Dashboard, confirm only jobs above threshold show." },
    { id: "t4", label: "Save job persists after refresh", tooltip: "Save a job, refresh, go to Saved page, confirm it appears." },
    { id: "t5", label: "Apply opens in new tab", tooltip: "Click Apply on a job card, confirm new tab opens." },
    { id: "t6", label: "Status update persists after refresh", tooltip: "Change job status, refresh, confirm status remains." },
    { id: "t7", label: "Status filter works correctly", tooltip: "Filter by Applied/Rejected/Selected, confirm correct jobs show." },
    { id: "t8", label: "Digest generates top 10 by score", tooltip: "Generate digest, confirm 10 jobs sorted by match score." },
    { id: "t9", label: "Digest persists for the day", tooltip: "Generate digest, refresh page, confirm digest still shows." },
    { id: "t10", label: "No console errors on main pages", tooltip: "Navigate Dashboard, Saved, Digest, Settings; check DevTools console." }
  ];

  function getTestStatus() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var obj = raw ? JSON.parse(raw) : {};
      return typeof obj === "object" ? obj : {};
    } catch (e) {
      return {};
    }
  }

  function setTestStatus(id, checked) {
    var status = getTestStatus();
    status[id] = !!checked;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
    } catch (e) {}
  }

  function getPassedCount() {
    var status = getTestStatus();
    return TEST_ITEMS.filter(function (t) { return status[t.id]; }).length;
  }

  function isAllPassed() {
    return getPassedCount() === TOTAL_TESTS;
  }

  function resetTestStatus() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function escapeHtml(s) {
    if (s == null) return "";
    var div = document.createElement("div");
    div.textContent = String(s);
    return div.innerHTML;
  }

  function renderTestChecklist(container) {
    var status = getTestStatus();
    var passed = getPassedCount();

    var itemsHtml = TEST_ITEMS.map(function (t) {
      var checked = status[t.id] ? " checked" : "";
      return (
        '<label class="ds-test-item">' +
        '<input type="checkbox" class="ds-test-item__checkbox" data-test-id="' + escapeHtml(t.id) + '"' + checked + ' />' +
        '<span class="ds-test-item__label">' + escapeHtml(t.label) + '</span>' +
        (t.tooltip ? '<span class="ds-test-item__tooltip" title="' + escapeHtml(t.tooltip) + '">?</span>' : "") +
        "</label>"
      );
    }).join("");

    container.className = "ds-route-placeholder ds-test-page";
    container.innerHTML =
      '<h1 class="ds-test__headline">Test Checklist</h1>' +
      '<p class="ds-test__summary" id="test-summary">Tests Passed: ' + passed + " / " + TOTAL_TESTS + '</p>' +
      '<p class="ds-test__warning" id="test-warning" style="' + (passed < TOTAL_TESTS ? "" : "display:none;") + '">Resolve all issues before shipping.</p>' +
      '<div class="ds-test__list" id="test-list">' + itemsHtml + '</div>' +
      '<button type="button" class="ds-btn ds-btn--secondary ds-test__reset" id="test-reset-btn">Reset Test Status</button>';

    var listEl = container.querySelector("#test-list");
    var summaryEl = container.querySelector("#test-summary");

    function updateSummary() {
      var p = getPassedCount();
      if (summaryEl) summaryEl.textContent = "Tests Passed: " + p + " / " + TOTAL_TESTS;
      var warn = container.querySelector("#test-warning");
      if (warn) warn.style.display = p < TOTAL_TESTS ? "block" : "none";
    }

    listEl.addEventListener("change", function (e) {
      var cb = e.target.closest(".ds-test-item__checkbox");
      if (cb) {
        setTestStatus(cb.getAttribute("data-test-id"), cb.checked);
        updateSummary();
      }
    });

    container.querySelector("#test-reset-btn").onclick = function () {
      resetTestStatus();
      listEl.querySelectorAll(".ds-test-item__checkbox").forEach(function (cb) {
        cb.checked = false;
      });
      updateSummary();
    };
  }

  function renderShipPage(container) {
    container.className = "ds-route-placeholder ds-ship-page";
    if (!isAllPassed()) {
      container.innerHTML =
        '<h1 class="ds-ship-page__headline">Ship</h1>' +
        '<p class="ds-ship-page__locked">Complete all tests before shipping.</p>' +
        '<a href="/jt/07-test" class="ds-btn ds-btn--primary">Go to Test Checklist</a>';
    } else {
      container.innerHTML =
        '<h1 class="ds-ship-page__headline">Ship</h1>' +
        '<p class="ds-ship-page__unlocked">All tests passed. Ready to ship.</p>';
    }
  }

  window.TestChecklistModule = {
    renderTestChecklist: renderTestChecklist,
    renderShipPage: renderShipPage,
    isAllPassed: isAllPassed
  };
})();
