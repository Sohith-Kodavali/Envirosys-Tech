/* Envirosys — 6-step contact form
   1) Create a form at formspree.io
   2) Replace FORMSPREE_ENDPOINT with your form URL
*/

const FORMSPREE_ENDPOINT = "https://formspree.io/f/xzeeqndk";

const COUNTRIES = [
  ["United States", "1"], ["Canada", "1"], ["United Kingdom", "44"], ["Australia", "61"],
  ["India", "91"], ["United Arab Emirates", "971"], ["Saudi Arabia", "966"], ["Qatar", "974"],
  ["Kuwait", "965"], ["Oman", "968"], ["Bahrain", "973"], ["Pakistan", "92"],
  ["Bangladesh", "880"], ["Sri Lanka", "94"], ["Nepal", "977"], ["China", "86"],
  ["Japan", "81"], ["South Korea", "82"], ["Singapore", "65"], ["Malaysia", "60"],
  ["Indonesia", "62"], ["Philippines", "63"], ["Thailand", "66"], ["Vietnam", "84"],
  ["New Zealand", "64"], ["Germany", "49"], ["France", "33"], ["Italy", "39"],
  ["Spain", "34"], ["Netherlands", "31"], ["Belgium", "32"], ["Switzerland", "41"],
  ["Austria", "43"], ["Sweden", "46"], ["Norway", "47"], ["Denmark", "45"],
  ["Finland", "358"], ["Ireland", "353"], ["Poland", "48"], ["Portugal", "351"],
  ["Greece", "30"], ["Turkey", "90"], ["Russia", "7"], ["Ukraine", "380"],
  ["Israel", "972"], ["Egypt", "20"], ["South Africa", "27"], ["Nigeria", "234"],
  ["Kenya", "254"], ["Brazil", "55"], ["Mexico", "52"], ["Argentina", "54"],
  ["Chile", "56"], ["Colombia", "57"]
];

const DISPOSABLE = [
  "mailinator.com", "tempmail.com", "temp-mail.org", "10minutemail.com", "guerrillamail.com",
  "yopmail.com", "throwawaymail.com", "sharklasers.com", "getnada.com", "dispostable.com",
  "trashmail.com", "fakeinbox.com", "maildrop.cc", "mintemail.com", "spamgourmet.com"
];

const PERSONAL = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com", "protonmail.com", "live.com", "msn.com"];

const $ = (id) => document.getElementById(id);
const form = $("inquiry-form");
const nextBtn = $("next-btn");
const backBtn = $("back-btn");
const submitBtn = $("submit-btn");

const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Country dropdown ---------- */
const countrySelect = $("phone_country");
COUNTRIES.forEach(([name, dial]) => {
  const opt = document.createElement("option");
  opt.value = dial;
  opt.textContent = `${name} +${dial}`;
  if (name === "United States") opt.selected = true;
  countrySelect.appendChild(opt);
});

/* ---------- Helpers ---------- */
function setError(key, message) {
  const el = document.getElementById("err-" + key);
  if (el) el.textContent = message || "";
  const input = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
  if (input) {
    if (message) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
  }
}

function clearErrors(keys) {
  keys.forEach((key) => {
    const el = document.getElementById("err-" + key);
    if (el) el.textContent = "";
    const input = document.getElementById(key) || document.querySelector(`[name="${key}"]`);
    if (input) input.removeAttribute("aria-invalid");
  });
}

function digitsOnly(value) { return String(value || "").replace(/\D/g, ""); }
function isAllSameDigits(value) { return /^(\d)\1+$/.test(value); }
function isSequential(value) {
  const asc = "012345678901234567890123456789";
  const desc = "987654321098765432109876543210";
  return asc.includes(value) || desc.includes(value);
}
function isFakeNumber(value) { return isAllSameDigits(value) || isSequential(value) || /^55501\d\d$/.test(value); }

function validName(value) {
  const v = value.trim();
  if (v.length < 2 || v.length > 50) return false;
  return /^[\p{L}][\p{L}\s'\-]{1,49}$/u.test(v);
}

function validEmailStructure(email) {
  const v = email.trim();
  if (!v || v.length > 254) return false;
  const parts = v.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain || local.length > 64) return false;
  if (!/^[A-Za-z0-9._%+-]+$/.test(local)) return false;
  if (local.startsWith(".") || local.endsWith(".") || local.includes("..")) return false;
  if (!/^[A-Za-z0-9.-]+$/.test(domain)) return false;
  if (!domain.includes(".") || domain.startsWith("-") || domain.endsWith("-")) return false;
  if (domain.includes("..") || !/\.[A-Za-z]{2,}$/.test(domain)) return false;
  return true;
}

async function domainHasMX(domain) {
  try {
    const res = await fetch(
      "https://dns.google/resolve?name=" + encodeURIComponent(domain) + "&type=MX",
      { headers: { Accept: "application/dns-json" } }
    );
    if (!res.ok) return true;
    const data = await res.json();
    if (!data.Answer || !data.Answer.length) return false;
    return data.Answer.some((a) => a.type === 15);
  } catch (_) { return true; }
}

/* ---------- Phone ---------- */
function formatUSNumber(input) {
  const d = digitsOnly(input.value).slice(0, 10);
  let out = d;
  if (d.length > 6) out = d.slice(0, 3) + "-" + d.slice(3, 6) + "-" + d.slice(6);
  else if (d.length > 3) out = d.slice(0, 3) + "-" + d.slice(3);
  input.value = out;
}

function validatePhone() {
  const dial = countrySelect.value;
  const number = digitsOnly($("phone_number").value);
  const ext = digitsOnly($("phone_ext").value);

  $("phone_e164").value = "";
  if (!dial) return "Please select a country code.";

  if (dial === "1") {
    if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(number)) return "Please enter a valid 10-digit phone number.";
    if (/^55501\d\d$/.test(number.slice(3)) || isFakeNumber(number)) return "Please enter a real phone number.";
  } else {
    if (number.length < 4 || number.length > 14) return "Please enter a valid phone number.";
    if (isFakeNumber(number)) return "Please enter a real phone number.";
  }

  if (ext && !/^\d{1,6}$/.test(ext)) return "Extension must be numbers only (max 6).";

  const e164 = "+" + dial + number;
  if (e164.length > 16) return "Please enter a valid phone number.";

  if (window.libphonenumber && window.libphonenumber.parsePhoneNumberFromString) {
    try {
      const parsed = window.libphonenumber.parsePhoneNumberFromString(e164);
      if (!parsed || !parsed.isValid()) return "Please enter a valid phone number.";
    } catch (_) { /* ignore */ }
  }

  $("phone_e164").value = e164;
  return "";
}

/* ---------- Conditional "Other" ---------- */
const otherWrap = $("other-wrap");
const otherField = $("other_service");
const otherCount = $("other-count");
const otherCheckbox = $("svc-other");

function countWords(value) {
  const v = value.trim();
  return v ? v.split(/\s+/).length : 0;
}
function trimToWords(value, max) {
  const words = value.trim().split(/\s+/);
  return words.length <= max ? value : words.slice(0, max).join(" ");
}
function syncOther() {
  otherWrap.hidden = !otherCheckbox.checked;
  if (!otherCheckbox.checked) {
    otherField.value = "";
    otherCount.textContent = "0";
    setError("other", "");
  }
}
otherCheckbox.addEventListener("change", syncOther);
otherField.addEventListener("input", () => {
  const trimmed = trimToWords(otherField.value, 50);
  if (trimmed !== otherField.value) otherField.value = trimmed;
  const n = countWords(otherField.value);
  otherCount.textContent = String(n);
  otherCount.parentElement.classList.toggle("over", n >= 50);
  if (n) setError("other", "");
});

/* ---------- Steps ---------- */
let currentStep = 1;
const panels = document.querySelectorAll(".step-panel");
const indicators = document.querySelectorAll(".progress-item");

function showStep(n, moveFocus = true) {
  currentStep = n;
  panels.forEach((panel) => {
    panel.hidden = Number(panel.dataset.step) !== n;
  });

  indicators.forEach((item) => {
    const step = Number(item.dataset.stepIndicator);
    item.classList.toggle("is-active", step === n);
    item.classList.toggle("is-done", step < n);
  });

  backBtn.hidden = n === 1;
  nextBtn.hidden = n === 6;
  submitBtn.hidden = n !== 6;

  if (n === 6) buildReview();

  if (moveFocus) {
    const heading = document.querySelector(`.step-panel[data-step="${n}"] .step-heading`);
    if (heading) heading.focus({ preventScroll: true });
    $("step-announce").textContent = `Step ${n} of 6`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function validateStep1() {
  clearErrors(["follow_up"]);
  if (!form.querySelector('input[name="follow_up"]:checked')) {
    setError("follow_up", "Please select a follow-up option.");
    return false;
  }
  return true;
}

function validateStep2() {
  clearErrors(["services", "other"]);
  let ok = true;

  if (!form.querySelector('input[name="services"]:checked')) {
    setError("services", "Please select at least one service.");
    ok = false;
  }
  if (otherCheckbox.checked && !countWords(otherField.value)) {
    setError("other", "Please describe the service you need (50 words max).");
    ok = false;
  }
  return ok;
}

function validateStep4() {
  clearErrors(["first_name", "last_name", "title", "organization"]);
  let ok = true;

  const firstName = $("first_name").value.trim();
  if (!firstName) {
    setError("first_name", "This field is required.");
    ok = false;
  } else if (!validName(firstName)) {
    setError("first_name", "Use 2–50 letters, spaces, hyphens or apostrophes.");
    ok = false;
  }

  const lastName = $("last_name").value.trim();
  if (!lastName) {
    setError("last_name", "This field is required.");
    ok = false;
  } else if (!validName(lastName)) {
    setError("last_name", "Use 2–50 letters, spaces, hyphens or apostrophes.");
    ok = false;
  }

  if (!$("title").value.trim()) {
    setError("title", "This field is required.");
    ok = false;
  }
  if (!$("organization").value.trim()) {
    setError("organization", "This field is required.");
    ok = false;
  }
  return ok;
}

async function validateStep5() {
  clearErrors(["phone", "work_email", "confirm_email"]);
  let ok = true;

  const phoneError = validatePhone();
  if (phoneError) {
    setError("phone", phoneError);
    ok = false;
  }

  const email = $("work_email").value.trim();
  if (!email) {
    setError("work_email", "Please enter your work email.");
    ok = false;
  } else if (!validEmailStructure(email)) {
    setError("work_email", "Please enter a valid email address (e.g., name@agency.gov).");
    ok = false;
  } else {
    const domain = email.split("@")[1].toLowerCase();
    if (DISPOSABLE.includes(domain)) {
      setError("work_email", "Please use a permanent work email.");
      ok = false;
    } else if (!(await domainHasMX(domain))) {
      setError("work_email", "This email domain cannot receive mail. Please check it.");
      ok = false;
    }
  }

  const confirm = $("confirm_email").value.trim();
  if (!confirm) {
    setError("confirm_email", "This field is required.");
    ok = false;
  } else if (confirm.toLowerCase() !== email.toLowerCase()) {
    setError("confirm_email", "Email addresses do not match.");
    ok = false;
  }
  return ok;
}

function validateStep6() {
  clearErrors(["consent", "company_website"]);
  let ok = true;

  const website = $("company_website").value.trim();
  if (website) {
    const withScheme = /^https?:\/\//i.test(website) ? website : "https://" + website;
    try {
      const url = new URL(withScheme);
      if (!url.hostname.includes(".") || url.hostname.length < 4) throw new Error();
    } catch (_) {
      setError("company_website", "Please enter a valid website, e.g. example.com");
      ok = false;
    }
  }

  if (!$("consent").checked) {
    setError("consent", "Please agree to be contacted about this request.");
    ok = false;
  }
  return ok;
}

/* ---------- Review ---------- */
function buildReview() {
  const review = $("review");
  review.textContent = "";

  const followUp = form.querySelector('input[name="follow_up"]:checked');
  const services = Array.from(form.querySelectorAll('input[name="services"]:checked')).map((s) => s.value);
  const name = `${$("first_name").value.trim()} ${$("last_name").value.trim()}`.trim();

  const rows = [
    ["Follow-up", followUp ? followUp.value : "—", 1],
    ["Services", services.length ? services.join(", ") : "—", 2],
    ["Name", name || "—", 4],
    ["Title", $("title").value.trim() || "—", 4],
    ["Organization", $("organization").value.trim() || "—", 4],
    ["Email", $("work_email").value.trim() || "—", 5]
  ];

  rows.forEach(([label, value, step]) => {
    const row = document.createElement("div");
    row.className = "review-row";
    const dt = document.createElement("dt");
    dt.textContent = label;
    const dd = document.createElement("dd");
    dd.textContent = value;
    const edit = document.createElement("button");
    edit.type = "button";
    edit.className = "review-edit";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => showStep(step));
    dd.appendChild(document.createElement("br"));
    dd.appendChild(edit);
    row.appendChild(dt);
    row.appendChild(dd);
    review.appendChild(row);
  });
}

/* ---------- Live validation ---------- */
$("phone_number").addEventListener("input", (e) => {
  if (countrySelect.value === "1") formatUSNumber(e.target);
});
countrySelect.addEventListener("change", () => {
  if (countrySelect.value === "1") formatUSNumber($("phone_number"));
});

["first_name", "last_name"].forEach((id) => {
  $(id).addEventListener("blur", () => {
    const v = $(id).value.trim();
    if (!v) return setError(id, "This field is required.");
    if (!validName(v)) return setError(id, "Use 2–50 letters, spaces, hyphens or apostrophes.");
    setError(id, "");
  });
});

$("title").addEventListener("blur", () => {
  setError("title", $("title").value.trim() ? "" : "This field is required.");
});
$("organization").addEventListener("blur", () => {
  setError("organization", $("organization").value.trim() ? "" : "This field is required.");
});

$("work_email").addEventListener("blur", async () => {
  const v = $("work_email").value.trim();
  const hint = $("email-hint");
  hint.hidden = true;
  if (!v) return setError("work_email", "Please enter your work email.");
  if (!validEmailStructure(v)) return setError("work_email", "Please enter a valid email address (e.g., name@agency.gov).");

  const domain = v.split("@")[1].toLowerCase();
  if (DISPOSABLE.includes(domain)) return setError("work_email", "Please use a permanent work email.");
  if (PERSONAL.includes(domain)) hint.hidden = false;

  setError("work_email", "");
  const hasMX = await domainHasMX(domain);
  if (!hasMX) setError("work_email", "This email domain cannot receive mail. Please check it.");
});

$("confirm_email").addEventListener("blur", () => {
  const v = $("confirm_email").value.trim();
  if (!v) return setError("confirm_email", "This field is required.");
  if (v.toLowerCase() !== $("work_email").value.trim().toLowerCase()) {
    return setError("confirm_email", "Email addresses do not match.");
  }
  setError("confirm_email", "");
});

/* ---------- Navigation ---------- */
nextBtn.addEventListener("click", async () => {
  if (currentStep === 1) {
    if (validateStep1()) showStep(2);
    return;
  }
  if (currentStep === 2) {
    if (validateStep2()) showStep(3);
    return;
  }
  if (currentStep === 3) {
    showStep(4);
    return;
  }
  if (currentStep === 4) {
    if (validateStep4()) showStep(5);
    return;
  }
  if (currentStep === 5) {
    nextBtn.disabled = true;
    const ok = await validateStep5();
    nextBtn.disabled = false;
    if (ok) showStep(6);
  }
});

backBtn.addEventListener("click", () => {
  if (currentStep > 1) showStep(currentStep - 1);
});

/* ---------- Submit ---------- */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  $("err-form").textContent = "";

  const ok1 = validateStep1();
  const ok2 = validateStep2();
  const ok4 = validateStep4();
  const ok5 = await validateStep5();
  const ok6 = validateStep6();

  if (!ok1) return showStep(1);
  if (!ok2) return showStep(2);
  if (!ok4) return showStep(4);
  if (!ok5) return showStep(5);
  if (!ok6) return showStep(6);

  if (FORMSPREE_ENDPOINT.includes("REPLACE_WITH_FORM_ID")) {
    $("err-form").textContent = "Form endpoint is not configured yet.";
    return;
  }

  const followUp = form.querySelector('input[name="follow_up"]:checked');
  const services = Array.from(form.querySelectorAll('input[name="services"]:checked'));
  const email = $("work_email").value.trim();
  const data = new FormData(form);

  data.set("_subject", `New Website Inquiry – ${followUp.value} – ${$("organization").value.trim()}`);
  data.set("_replyto", email);
  data.set(
    "phone_display",
    `${countrySelect.options[countrySelect.selectedIndex].text} ${$("phone_number").value}${$("phone_ext").value ? " ext. " + $("phone_ext").value : ""}`
  );
  data.set("services", services.map((s) => s.value).join(", "));

  submitBtn.disabled = true;
  submitBtn.classList.add("loading");

  try {
    const res = await fetch(FORMSPREE_ENDPOINT, {
      method: "POST",
      body: data,
      headers: { Accept: "application/json" }
    });
    if (!res.ok) throw new Error("submit failed");

    form.hidden = true;
    $("progress").hidden = true;
    $("success").hidden = false;
    $("success-message").textContent =
      `Thank you${$("first_name").value.trim() ? ", " + $("first_name").value.trim() : ""}. Your request has been received. Our team will respond within one business day.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (_) {
    $("err-form").textContent = "Something went wrong. Please try again, or email info@envirosystech.com.";
  } finally {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
  }
});

/* Initial state */
syncOther();
showStep(1, false);
