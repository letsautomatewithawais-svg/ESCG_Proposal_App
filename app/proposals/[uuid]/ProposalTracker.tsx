"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_SECONDS = 15;
const MIN_REPORTABLE_SECONDS = 1;
// A section must occupy at least this much of its own height within the
// viewport to count as "being read" — below this, no section is credited.
const DOMINANT_VISIBLE_RATIO = 0.5;

const TRACKED_SECTIONS = [
  { id: "section-introduction", name: "Introduction" },
  { id: "section-scope-of-work", name: "Scope of Work" },
  { id: "section-pricing", name: "Pricing" },
  { id: "section-terms", name: "Terms" },
  { id: "section-signature-block", name: "Signature Block" },
];

type TrackedSection = { el: HTMLElement; name: string };

function trackUrl(proposalId: string) {
  return `/api/proposals/${proposalId}/track`;
}

function sendTrackingEvent(proposalId: string, payload: Record<string, unknown>) {
  fetch(trackUrl(proposalId), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function sendTrackingBeacon(proposalId: string, payload: Record<string, unknown>) {
  try {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(trackUrl(proposalId), blob);
  } catch {
    // sendBeacon can be blocked or unavailable; exiting silently is fine here.
  }
}

// Which of `sections` (always reading order, top to bottom) is currently
// dominant: the FIRST one whose name is in `qualifying` — not whichever is
// closest to the vertical center of the viewport (that was wrong on a short
// proposal where several sections are simultaneously ~100% visible with no
// scrolling: a bottom section could win purely by geometry, before the user
// had scrolled anywhere). Reading order guarantees a section only becomes
// dominant once everything above it has scrolled below the threshold.
function computeDominant(
  sections: TrackedSection[],
  qualifying: ReadonlySet<string>,
): TrackedSection | null {
  for (const section of sections) {
    if (qualifying.has(section.name)) return section;
  }
  return null;
}

export default function ProposalTracker({ proposalId }: { proposalId: string }) {
  useEffect(() => {
    // One id per page load ("visit"), sent alongside open/heartbeat events
    // so the admin can see each individual visit's start time + duration
    // (see ProposalVisit in the tracking API), not just the proposal-wide
    // open count/total time.
    const visitId = crypto.randomUUID();

    sendTrackingEvent(proposalId, { event: "open", visitId });

    const sections: TrackedSection[] = [];
    for (const { id, name } of TRACKED_SECTIONS) {
      const el = document.getElementById(id);
      if (el) sections.push({ el, name });
    }

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastHeartbeatAt = Date.now();

    // The single section currently accumulating time.
    let dominant: TrackedSection | null = null;
    let activeSince: number | null = null;
    const confirmedSections = new Set<string>();
    // Names of sections currently at or above DOMINANT_VISIBLE_RATIO —
    // maintained by the IntersectionObserver below, which the browser engine
    // guarantees to notify for every threshold crossing regardless of scroll
    // speed. The previous approach (re-measuring getBoundingClientRect() on
    // scroll events, throttled to once per animation frame) could miss a
    // short section entirely during a fast scroll/flick if the viewport
    // jumped past it between two sampled frames — exactly why sections were
    // vanishing from the timeline despite being scrolled past.
    const qualifyingSections = new Set<string>();

    function isPageVisible() {
      return document.visibilityState === "visible";
    }

    // A section used to only start accumulating time after sitting dominant
    // for a fixed 1.5s "dwell" delay, confirmed via a separate timer — while
    // waiting on that timer, the section switch hadn't happened yet, so
    // whatever was PREVIOUSLY dominant just kept absorbing time. Scroll
    // steadily through two sections without pausing long enough on either to
    // complete its dwell timer, and both effectively vanish: their time gets
    // misattributed to whatever section was dominant before the scroll, and
    // neither ever gets marked "viewed" at all. Switching dominance
    // immediately (no delay) fixes both: every moment is credited to
    // whichever section is actually on screen, and "viewed" is now just
    // "accumulated a reportable stretch of time" — the same
    // MIN_REPORTABLE_SECONDS bar flushDominant already applies below, not a
    // separate concept that can drift out of sync with it.
    function flushDominant(now: number, useBeacon: boolean) {
      if (activeSince === null || dominant === null) return;
      const elapsedSeconds = (now - activeSince) / 1000;
      const section = dominant;
      activeSince = null;
      if (elapsedSeconds < MIN_REPORTABLE_SECONDS) return;

      if (!confirmedSections.has(section.name)) {
        confirmedSections.add(section.name);
        const confirmPayload = { event: "section", sectionName: section.name };
        if (useBeacon) {
          sendTrackingBeacon(proposalId, confirmPayload);
        } else {
          sendTrackingEvent(proposalId, confirmPayload);
        }
      }

      const payload = {
        event: "sectionTime",
        sectionName: section.name,
        intervalSeconds: elapsedSeconds,
      };
      if (useBeacon) {
        sendTrackingBeacon(proposalId, payload);
      } else {
        sendTrackingEvent(proposalId, payload);
      }
    }

    function resumeTiming(now: number) {
      if (dominant !== null && activeSince === null && isPageVisible()) {
        activeSince = now;
      }
    }

    function setDominant(next: TrackedSection | null, now: number) {
      if (next?.el === dominant?.el) return;
      flushDominant(now, false);
      dominant = next;
      resumeTiming(now);
    }

    function recomputeDominant() {
      setDominant(computeDominant(sections, qualifyingSections), Date.now());
    }

    // IntersectionObserver's own intersectionRatio is always (visible area)
    // / (the element's OWN full height) — never relative to the viewport.
    // That's fine for a section shorter than the screen, but a section
    // TALLER than the viewport (or just a short viewport — a laptop screen,
    // a zoomed-in browser) can fill the entire visible screen and still
    // never reach 50% of its own full height, since that height exceeds the
    // viewport. It can structurally never cross a target-relative threshold
    // no matter how long it's looked at — which is exactly why a large
    // section like Pricing could register zero time. Compute visibility
    // relative to whichever is SMALLER, the element or the viewport, so a
    // section counts as dominant once it fills the viewport either way.
    function isViewportFilling(entry: IntersectionObserverEntry): boolean {
      const elementHeight = entry.boundingClientRect.height;
      const viewportHeight = entry.rootBounds?.height ?? window.innerHeight;
      const denominator = Math.min(elementHeight, viewportHeight);
      if (denominator <= 0) return false;
      return entry.intersectionRect.height / denominator >= DOMINANT_VISIBLE_RATIO;
    }

    // A broad, fine-grained threshold list — not just [0.5] — so the
    // observer's callback (gated on ITS OWN target-relative ratio) fires
    // often enough during a scroll to keep re-evaluating isViewportFilling
    // above, even for a tall section whose own-height ratio never reaches
    // 0.5 at all.
    const OBSERVER_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);

    const nameByElement = new Map<Element, string>(sections.map((s) => [s.el, s.name]));
    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const name = nameByElement.get(entry.target);
          if (!name) continue;
          if (isViewportFilling(entry)) {
            qualifyingSections.add(name);
          } else {
            qualifyingSections.delete(name);
          }
        }
        recomputeDominant();
      },
      { threshold: OBSERVER_THRESHOLDS },
    );
    for (const section of sections) intersectionObserver.observe(section.el);

    function sendHeartbeat() {
      sendTrackingEvent(proposalId, {
        event: "heartbeat",
        intervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
        visitId,
      });
      lastHeartbeatAt = Date.now();

      // Rolling flush so a long single dwell doesn't sit unflushed until the
      // section is finally left.
      if (activeSince !== null) {
        const now = Date.now();
        flushDominant(now, false);
        resumeTiming(now);
      }
    }

    function startInterval() {
      if (intervalId !== null) return;
      lastHeartbeatAt = Date.now();
      intervalId = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_SECONDS * 1000);
    }

    function stopInterval() {
      if (intervalId === null) return;
      clearInterval(intervalId);
      intervalId = null;
    }

    function handleVisibilityChange() {
      const now = Date.now();
      if (document.visibilityState === "visible") {
        startInterval();
        resumeTiming(now);
      } else {
        stopInterval();
        // Going hidden mid-interval (switching tabs/apps — the most common
        // way a session ends) used to flush the dominant section's dwell
        // time here without ever crediting that same leftover window to the
        // page-wide total (only handlePageHide did that, and pagehide
        // doesn't fire on every tab switch). That asymmetry is exactly why
        // per-section times could sum to more than "Total Time on Page" —
        // sections got credited for time the total never counted. Mirror
        // handlePageHide's partial-heartbeat flush here too.
        const elapsedSeconds = (now - lastHeartbeatAt) / 1000;
        if (elapsedSeconds >= MIN_REPORTABLE_SECONDS) {
          sendTrackingEvent(proposalId, { event: "heartbeat", intervalSeconds: elapsedSeconds, visitId });
        }
        lastHeartbeatAt = now;
        flushDominant(now, false);
      }
    }

    if (document.visibilityState === "visible") {
      startInterval();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    function handlePageHide() {
      const now = Date.now();

      if (document.visibilityState === "visible") {
        const elapsedSeconds = (now - lastHeartbeatAt) / 1000;
        if (elapsedSeconds >= MIN_REPORTABLE_SECONDS) {
          sendTrackingBeacon(proposalId, { event: "heartbeat", intervalSeconds: elapsedSeconds, visitId });
        }
      }

      flushDominant(now, true);
    }

    window.addEventListener("pagehide", handlePageHide);

    return () => {
      stopInterval();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      flushDominant(Date.now(), false);
    };
  }, [proposalId]);

  return null;
}
