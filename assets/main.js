document.documentElement.classList.add("js");

// Evergreen urgency countdown. Each visitor gets their own deadline, set on
// their first visit and saved locally, so the timer always shows a live,
// shrinking window that creates urgency and never sits at zero. It needs no
// server and no upkeep, and keeps working on any domain and any date, so it
// carries over unchanged when the site moves to the final domain.
//
// URGENCY_HOURS sets the size of the window. 48 = counts down from just under
// 2 days. Change this one number to widen or tighten the window.
const URGENCY_HOURS = 48;

function armDeadline() {
  const next = Date.now() + URGENCY_HOURS * 3600 * 1000;
  try { localStorage.setItem("bpr_deadline", String(next)); } catch (e) {}
  return next;
}

function getDeadline() {
  let stored = NaN;
  try { stored = parseInt(localStorage.getItem("bpr_deadline"), 10); } catch (e) {}
  // Reuse a saved deadline while it is still in the future; otherwise arm a
  // fresh one. This makes the clock loop instead of ever running out.
  if (stored && stored > Date.now()) return stored;
  return armDeadline();
}

let DEADLINE = getDeadline();

function updateCountdown() {
  const daysEl = document.getElementById("cd-days");
  if (!daysEl) return;
  let diff = DEADLINE - Date.now();
  if (diff <= 0) {
    // Window elapsed: arm a new one so the countdown never shows all zeros.
    DEADLINE = armDeadline();
    diff = DEADLINE - Date.now();
  }
  const pad = (n) => String(n).padStart(2, "0");
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  daysEl.textContent = pad(days);
  document.getElementById("cd-hours").textContent = pad(hours);
  document.getElementById("cd-mins").textContent = pad(mins);
  document.getElementById("cd-secs").textContent = pad(secs);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const revealTargets = document.querySelectorAll(".reveal");

if ("IntersectionObserver" in window && revealTargets.length) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  revealTargets.forEach((el) => observer.observe(el));
} else {
  revealTargets.forEach((el) => el.classList.add("in-view"));
}

// Referral attribution. A promoter link like ...?ref=john tags the Stripe
// checkout with client_reference_id=john, so every sale in Stripe shows who
// drove it. No ref in the URL means a plain, untagged checkout.
(function () {
  function tagRefs() {
    var params = new URLSearchParams(location.search);
    var ref = (params.get("ref") || params.get("via") || "").trim();
    ref = ref.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40); // keep it clean and safe
    if (!ref) return;
    var links = document.querySelectorAll('a[href*="buy.stripe.com"]');
    for (var i = 0; i < links.length; i++) {
      var url = links[i].getAttribute("href");
      if (url.indexOf("client_reference_id=") !== -1) continue;
      links[i].setAttribute("href", url + (url.indexOf("?") === -1 ? "?" : "&") + "client_reference_id=" + encodeURIComponent(ref));
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", tagRefs);
  else tagRefs();
})();
