/**
 * Static Football Academy — "Book a Free Trial" form
 * Two-step wizard: Player Details -> Training Preferences -> Success.
 *
 * Submissions POST to the academy's Formspree endpoint (see
 * FORMSPREE_ENDPOINT below and the submitFormData() function). Swap that
 * one function out if you later move to Google Sheets, a custom API, etc —
 * everything else (validation, step navigation, WhatsApp message building)
 * is independent of where the data ends up.
 */

(function () {
  const ACADEMY_WHATSAPP = "919560631330";
  const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwlevzyq";

  const LOCATION_LABELS = {
    surajmal: {
      name: "Maharaja Surajmal Stadium",
      area: "West Delhi, Delhi",
    },
    dav: {
      name: "DAV Centenary Public School",
      area: "Mianwali Nagar, Delhi",
    },
  };

  const PROGRAM_LABELS = {
    U10: "U10 Development",
    U14: "U14 Development",
    U18: "U18 Elite",
  };

  // age bracket -> suggested program (see brief for the mapping rationale)
  const AGE_TO_PROGRAM = {
    under8: "U10",
    "8-9": "U10",
    "10-11": "U10",
    "12-13": "U14",
    "14-15": "U18",
    "16-17": "U18",
    "18plus": null, // handled specially — youth-only notice
  };

  const el = (id) => document.getElementById(id);

  const step1 = el("step1");
  const step2 = el("step2");
  const successState = el("successState");
  const formHeader = el("formHeader");

  const dot1 = el("dot1"), dot2 = el("dot2");
  const label1 = el("label1"), label2 = el("label2");

  const nextBtn = el("nextBtn");
  const backBtn = el("backBtn");
  const submitBtn = el("submitBtn");
  const doneBtn = el("doneBtn");

  const prevYes = el("prevYes");
  const prevNo = el("prevNo");
  const prevAcademyDetailsWrap = el("prevAcademyDetailsWrap");

  const ageSelect = el("age");
  const programSelect = el("program");
  const programHint = el("programHint");

  if (!step1 || !step2) return; // booking form not present on this page

  // ---------- helpers ----------

  function showError(fieldId, message) {
    const errEl = el("err-" + fieldId);
    const inputEl = el(fieldId);
    if (errEl) {
      errEl.textContent = message;
      errEl.classList.add("show");
    }
    if (inputEl) inputEl.classList.add("invalid");
  }

  function clearError(fieldId) {
    const errEl = el("err-" + fieldId);
    const inputEl = el(fieldId);
    if (errEl) {
      errEl.textContent = "";
      errEl.classList.remove("show");
    }
    if (inputEl) inputEl.classList.remove("invalid");
  }

  function clearAllErrors(scopeEl) {
    scopeEl.querySelectorAll(".field-error").forEach((e) => {
      e.textContent = "";
      e.classList.remove("show");
    });
    scopeEl.querySelectorAll(".invalid").forEach((e) => e.classList.remove("invalid"));
  }

  function isValidIndianPhone(value) {
    // Accepts +91XXXXXXXXXX, 91XXXXXXXXXX, 0XXXXXXXXXX, or plain 10-digit
    // starting 6-9, with optional spaces/hyphens.
    const cleaned = value.replace(/[\s-]/g, "");
    return /^(?:\+?91)?[6-9]\d{9}$/.test(cleaned);
  }

  function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((i) => i.value);
  }

  function getRadioValue(name) {
    const checked = document.querySelector(`input[name="${name}"]:checked`);
    return checked ? checked.value : "";
  }

  // ---------- previous academy reveal ----------

  [prevYes, prevNo].forEach((radio) => {
    if (!radio) return;
    radio.addEventListener("change", () => {
      if (prevYes.checked) {
        prevAcademyDetailsWrap.classList.remove("hidden");
      } else {
        prevAcademyDetailsWrap.classList.add("hidden");
      }
    });
  });

  // ---------- age -> program auto-suggestion ----------

  ageSelect.addEventListener("change", () => {
    const age = ageSelect.value;
    const suggested = AGE_TO_PROGRAM[age];

    if (age === "18plus") {
      programHint.textContent =
        "Static Football Academy currently focuses on youth programs (up to U18). We'll still note your interest — feel free to add details in the message field.";
      programSelect.value = "";
      if (window.CustomSelect) window.CustomSelect.sync(programSelect);
      return;
    }

    if (suggested) {
      programSelect.value = suggested;
      if (window.CustomSelect) window.CustomSelect.sync(programSelect);
      programHint.textContent = `Suggested based on age: ${PROGRAM_LABELS[suggested]}. You can change this if you'd prefer a different program.`;
    } else {
      programHint.textContent = "";
    }
  });

  // ---------- step navigation ----------

  function goToStep(stepNum) {
    if (stepNum === 1) {
      step2.classList.add("hidden");
      step1.classList.remove("hidden");
      dot1.classList.add("active"); dot1.classList.remove("done");
      dot2.classList.remove("active", "done");
      label1.classList.add("active");
      label2.classList.remove("active");
    } else {
      step1.classList.add("hidden");
      step2.classList.remove("hidden");
      dot1.classList.remove("active"); dot1.classList.add("done");
      dot2.classList.add("active");
      label1.classList.remove("active");
      label2.classList.add("active");
    }
  }

  function validateStep1() {
    clearAllErrors(step1);
    let valid = true;

    const parentName = el("parentName").value.trim();
    if (!parentName) { showError("parentName", "Please enter the parent / guardian name."); valid = false; }

    const phone = el("phone").value.trim();
    if (!phone) { showError("phone", "Please enter a WhatsApp / phone number."); valid = false; }
    else if (!isValidIndianPhone(phone)) { showError("phone", "Please enter a valid WhatsApp number."); valid = false; }

    const playerName = el("playerName").value.trim();
    if (!playerName) { showError("playerName", "Please enter the player's name."); valid = false; }

    const age = el("age").value;
    if (!age) { showError("age", "Please select the player's age."); valid = false; }

    const experience = el("experience").value;
    if (!experience) { showError("experience", "Please select the player's football experience."); valid = false; }

    return valid;
  }

  function validateStep2() {
    clearAllErrors(step2);
    let valid = true;

    const program = el("program").value;
    if (!program) { showError("program", "Please select a program."); valid = false; }

    const location = el("location").value;
    if (!location) { showError("location", "Please select a preferred training location."); valid = false; }

    const days = getCheckedValues("trainingDays");
    if (days.length === 0) { showError("trainingDays", "Please select at least one preferred training day."); valid = false; }

    const time = getRadioValue("trainingTime");
    if (!time) { showError("trainingTime", "Please select a preferred training time."); valid = false; }

    return valid;
  }

  nextBtn.addEventListener("click", () => {
    if (validateStep1()) goToStep(2);
  });

  backBtn.addEventListener("click", () => goToStep(1));

  // ---------- data collection ----------

  function collectFormData() {
    return {
      parentName: el("parentName").value.trim(),
      phone: el("phone").value.trim(),
      playerName: el("playerName").value.trim(),
      age: el("age").value,
      experience: el("experience").value,
      previousAcademy: getRadioValue("previousAcademy"),
      previousAcademyDetails: el("previousAcademyDetails").value.trim(),
      program: el("program").value,
      location: el("location").value,
      trainingDays: getCheckedValues("trainingDays"),
      trainingTime: getRadioValue("trainingTime"),
      goals: getCheckedValues("goals"),
      source: el("source").value,
      message: el("message").value.trim(),
    };
  }

  function buildWhatsAppMessage(data) {
    const loc = LOCATION_LABELS[data.location];
    const locText = loc ? `${loc.name}, ${loc.area}` : "—";
    const programText = PROGRAM_LABELS[data.program] || "—";

    const lines = [
      "New Free Trial Enquiry — Static Football Academy",
      "",
      `Parent/Guardian: ${data.parentName}`,
      `Player: ${data.playerName}`,
      `Age: ${data.age}`,
      `Program: ${programText}`,
      `Experience: ${data.experience}`,
      `Preferred Location: ${locText}`,
      `Preferred Days: ${data.trainingDays.join(", ")}`,
      `Preferred Time: ${data.trainingTime}`,
      `Goals: ${data.goals.length ? data.goals.join(", ") : "—"}`,
      `Message: ${data.message || "—"}`,
    ];
    return lines.join("\n");
  }

  /**
   * Sends the enquiry to the academy's Formspree endpoint. Fields are
   * flattened into readable strings (rather than raw arrays) so the
   * notification email is easy to scan. This is the one place to swap
   * in a different backend later — everything else in this file is
   * independent of where the data ends up.
   */
  function submitFormData(data) {
    const loc = LOCATION_LABELS[data.location];

    const payload = {
      _subject: `New Free Trial Enquiry — ${data.playerName || "Static Football Academy"}`,
      parentName: data.parentName,
      phone: data.phone,
      playerName: data.playerName,
      age: data.age,
      experience: data.experience,
      previousAcademy: data.previousAcademy,
      previousAcademyDetails: data.previousAcademyDetails,
      program: PROGRAM_LABELS[data.program] || data.program,
      location: loc ? `${loc.name}, ${loc.area}` : data.location,
      trainingDays: data.trainingDays.join(", "),
      trainingTime: data.trainingTime,
      goals: data.goals.join(", "),
      source: data.source,
      message: data.message,
    };

    return fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    }).then((res) => {
      if (!res.ok) throw new Error(`Formspree responded with status ${res.status}`);
      return res.json();
    });
  }

  submitBtn.addEventListener("click", async () => {
    if (!validateStep2()) return;

    const data = collectFormData();

    submitBtn.disabled = true;
    submitBtn.textContent = "BOOKING...";

    try {
      await submitFormData(data);

      // show success state
      formHeader.classList.add("hidden");
      step2.classList.add("hidden");
      successState.classList.remove("hidden");
      if (window.lucide) window.lucide.createIcons();

      const loc = LOCATION_LABELS[data.location];
      el("summaryPlayer").textContent = data.playerName || "—";
      el("summaryProgram").textContent = PROGRAM_LABELS[data.program] || "—";
      el("summaryLocation").textContent = loc ? `📍 ${loc.name} — ${loc.area}` : "—";

      // hand off to WhatsApp with the enquiry pre-filled
      const waMessage = buildWhatsAppMessage(data);
      const waUrl = `https://wa.me/${ACADEMY_WHATSAPP}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, "_blank", "noopener");
    } catch (err) {
      console.error("Booking submission failed:", err);
      submitBtn.disabled = false;
      submitBtn.textContent = "BOOK FREE TRIAL";
    }
  });

  doneBtn.addEventListener("click", () => {
    // reset everything back to a clean step 1
    document.querySelectorAll("#step1 input, #step1 select").forEach((i) => {
      if (i.type === "radio" || i.type === "checkbox") i.checked = false;
      else i.value = "";
    });
    document.querySelectorAll("#step2 input, #step2 select, #step2 textarea").forEach((i) => {
      if (i.type === "radio" || i.type === "checkbox") i.checked = false;
      else i.value = "";
    });
    prevAcademyDetailsWrap.classList.add("hidden");
    programHint.textContent = "";
    clearAllErrors(step1);
    clearAllErrors(step2);

    successState.classList.add("hidden");
    formHeader.classList.remove("hidden");
    goToStep(1);

    submitBtn.disabled = false;
    submitBtn.textContent = "BOOK FREE TRIAL";
  });

  // ---------- preset location from "Book Free Trial" CTAs on location cards ----------
  window.presetLocation = function (index) {
    const location = el("location");
    if (!location) return;
    // index 0 = Maharaja Surajmal Stadium, index 1 = DAV Centenary
    location.value = index === 0 ? "surajmal" : "dav";
    if (window.CustomSelect) window.CustomSelect.sync(location);
  };

  // ---------- preset program from "Explore U10/U14/U18" CTAs on program cards ----------
  window.presetProgram = function (code) {
    const program = el("program");
    if (!program) return;
    program.value = code; // "U10" | "U14" | "U18"
    if (window.CustomSelect) window.CustomSelect.sync(program);
  };
})();
