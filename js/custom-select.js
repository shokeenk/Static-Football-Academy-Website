/**
 * Custom dark-themed dropdown for the Book Free Trial form.
 *
 * The browser's native <select> can't be styled consistently across
 * platforms (the open menu ignores our dark theme and shows as a plain
 * white system list on most browsers). This replaces the *visible*
 * control with an accessible custom listbox, while keeping the original
 * <select> in the DOM (invisible, but still fully functional) so that
 * booking-form.js — and anything else that reads `select.value` or
 * listens for its `change` event — keeps working with zero changes.
 *
 * Any script that sets a select's `.value` programmatically (e.g. the
 * "preset program/location from a CTA" helpers in booking-form.js)
 * should dispatch a `change` event afterwards so this component (and
 * any other listener) picks up the update — see CustomSelect.sync()
 * below for a one-line way to do that.
 */
(function () {
  const OPEN_CLASS = "open";
  let openWrap = null;

  function closeWrap(wrap) {
    if (!wrap) return;
    wrap.classList.remove(OPEN_CLASS, "drop-up");
    const trigger = wrap.querySelector(".cs-trigger");
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (openWrap === wrap) openWrap = null;
  }

  function closeAll() {
    closeWrap(openWrap);
  }

  function labelFor(select) {
    const opt = select.options[select.selectedIndex];
    return opt ? opt.textContent : "";
  }

  function isPlaceholder(select) {
    const opt = select.options[select.selectedIndex];
    return !opt || opt.value === "";
  }

  function build(select) {
    // Skip if this select has already been enhanced (e.g. a second init call).
    if (select.closest(".cs-wrap")) return;

    const wrap = document.createElement("div");
    wrap.className = "cs-wrap";

    // Move the select inside the wrapper, keep it fully functional but visually hidden.
    select.parentNode.insertBefore(wrap, select);
    wrap.appendChild(select);
    select.classList.add("cs-native");
    select.tabIndex = -1; // keyboard interaction happens on the trigger button
    select.setAttribute("aria-hidden", "true"); // the trigger below is the real control

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "cs-trigger";
    trigger.setAttribute("aria-haspopup", "listbox");
    trigger.setAttribute("aria-expanded", "false");

    // Retarget the field's existing <label for="..."> to the trigger, so
    // clicking the label focuses/opens the visible control (and screen
    // readers announce the trigger, not the now-hidden native select).
    if (select.id) {
      trigger.id = `${select.id}-trigger`;
      const boundLabel = document.querySelector(`label[for="${select.id}"]`);
      if (boundLabel) boundLabel.setAttribute("for", trigger.id);
    }

    const labelSpan = document.createElement("span");
    labelSpan.className = "cs-trigger-label";
    trigger.appendChild(labelSpan);

    const chevron = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    chevron.setAttribute("class", "cs-chevron");
    chevron.setAttribute("viewBox", "0 0 24 24");
    chevron.setAttribute("fill", "none");
    chevron.setAttribute("stroke", "currentColor");
    chevron.setAttribute("stroke-width", "2.5");
    chevron.setAttribute("stroke-linecap", "round");
    chevron.setAttribute("stroke-linejoin", "round");
    chevron.innerHTML = '<polyline points="6 9 12 15 18 9"></polyline>';
    trigger.appendChild(chevron);

    const menu = document.createElement("div");
    menu.className = "cs-menu";
    menu.setAttribute("role", "listbox");
    if (select.id) menu.id = `${select.id}-cs-menu`;
    trigger.setAttribute("aria-controls", menu.id);

    const optionEls = [];
    Array.from(select.options).forEach((opt, i) => {
      const optEl = document.createElement("div");
      optEl.className = "cs-option";
      optEl.setAttribute("role", "option");
      optEl.dataset.index = String(i);
      optEl.textContent = opt.textContent;
      if (opt.disabled) optEl.classList.add("cs-disabled");
      menu.appendChild(optEl);
      optionEls.push(optEl);
    });

    wrap.appendChild(trigger);
    wrap.appendChild(menu);

    function render() {
      labelSpan.textContent = labelFor(select);
      labelSpan.classList.toggle("placeholder", isPlaceholder(select));
      optionEls.forEach((optEl, i) => {
        optEl.classList.toggle("cs-selected", i === select.selectedIndex);
        optEl.setAttribute("aria-selected", i === select.selectedIndex ? "true" : "false");
      });
    }

    function highlight(index) {
      optionEls.forEach((optEl, i) => optEl.classList.toggle("cs-highlighted", i === index));
      const el = optionEls[index];
      if (el) el.scrollIntoView({ block: "nearest" });
    }

    function firstEnabledFrom(start, dir) {
      let i = start;
      for (let n = 0; n < optionEls.length; n++) {
        if (i >= 0 && i < optionEls.length && !select.options[i].disabled) return i;
        i += dir;
      }
      return select.selectedIndex;
    }

    function open() {
      if (openWrap && openWrap !== wrap) closeWrap(openWrap);
      wrap.classList.add(OPEN_CLASS);
      openWrap = wrap;
      trigger.setAttribute("aria-expanded", "true");

      // Flip upward if there isn't room below (form sections can sit
      // near the bottom of a short mobile viewport).
      const rect = trigger.getBoundingClientRect();
      const menuEstHeight = Math.min(264, optionEls.length * 40 + 12);
      const spaceBelow = window.innerHeight - rect.bottom;
      wrap.classList.toggle("drop-up", spaceBelow < menuEstHeight && rect.top > menuEstHeight);

      highlight(select.selectedIndex >= 0 ? select.selectedIndex : firstEnabledFrom(0, 1));
    }

    function close(refocus) {
      closeWrap(wrap);
      if (refocus) trigger.focus();
    }

    function selectIndex(index) {
      if (index < 0 || index >= select.options.length || select.options[index].disabled) return;
      select.selectedIndex = index;
      render();
      // Real 'change' event so existing listeners (age -> program
      // auto-suggest, form validation, etc.) keep working untouched.
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }

    trigger.addEventListener("click", () => {
      wrap.classList.contains(OPEN_CLASS) ? close(false) : open();
    });

    trigger.addEventListener("keydown", (e) => {
      const isOpen = wrap.classList.contains(OPEN_CLASS);
      const highlighted = optionEls.findIndex((o) => o.classList.contains("cs-highlighted"));

      if (!isOpen && ["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        open();
        return;
      }
      if (!isOpen) return;

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close(true);
          break;
        case "ArrowDown":
          e.preventDefault();
          highlight(firstEnabledFrom(Math.min(highlighted + 1, optionEls.length - 1), 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          highlight(firstEnabledFrom(Math.max(highlighted - 1, 0), -1));
          break;
        case "Home":
          e.preventDefault();
          highlight(firstEnabledFrom(0, 1));
          break;
        case "End":
          e.preventDefault();
          highlight(firstEnabledFrom(optionEls.length - 1, -1));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          if (highlighted >= 0) selectIndex(highlighted);
          close(true);
          break;
        case "Tab":
          close(false);
          break;
      }
    });

    optionEls.forEach((optEl, i) => {
      optEl.addEventListener("mouseenter", () => highlight(i));
      optEl.addEventListener("click", () => {
        selectIndex(i);
        close(true);
      });
    });

    // Keep the custom UI in sync whenever the native select's value
    // changes — whether from our own trigger or from other scripts that
    // set `.value` and dispatch `change` (see file header).
    select.addEventListener("change", render);

    render();
  }

  document.addEventListener("click", (e) => {
    if (openWrap && !openWrap.contains(e.target)) closeAll();
  });
  window.addEventListener("resize", closeAll);
  window.addEventListener("scroll", closeAll, true);

  function init() {
    document.querySelectorAll("select.js-custom-select").forEach(build);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Small helper other scripts can use after setting `select.value`
  // programmatically, so the custom dropdown re-renders immediately.
  window.CustomSelect = {
    sync(select) {
      if (select) select.dispatchEvent(new Event("change", { bubbles: true }));
    },
  };
})();
