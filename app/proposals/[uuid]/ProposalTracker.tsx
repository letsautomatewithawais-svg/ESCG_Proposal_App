"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_SECONDS = 15;
const SECTION_DWELL_MS = 1500;
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

function measure(el: HTMLElement, viewportHeight: number) {
  const rect = el.getBoundingClientRect();
  const visibleTop = Math.max(rect.top, 0);
  const visibleBottom = Math.min(rect.bottom, viewportHeight);
  const visibleHeight = Math.max(0, visibleBottom - visibleTop);
  const ratio = rect.height > 0 ? visibleHeight / rect.height : 0;
  return { ratio };
}

// Only one section can ever be "dominant" at a time — this is what prevents
// two overlapping-in-viewport sections from both accumulating time at once.
// `sections` is always in reading order (top to bottom), and this returns
// the FIRST one that's substantially visible — not whichever is closest to
// the vertical center of the viewport. Center-proximity used to win instead,
// which is wrong on any proposal short enough that several sections are
// simultaneously ~100% visible with no scrolling at all: whichever section
// happened to sit nearest center could register as "viewed" immediately on
// page load, even a bottom section like the signature block, before the
// user had scrolled anywhere. Reading order guarantees a section only
// becomes dominant once every section above it has already scrolled below
// the visibility threshold — the section the user is actually reading.
function computeDominant(sections: TrackedSection[]): TrackedSection | null {
  for (const section of sections) {
    const { ratio } = measure(section.el, window.innerHeight);
    if (ratio >= DOMINANT_VISIBLE_RATIO) return section;
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

    // The single section currently being timed (confirmed, i.e. past its
    // initial dwell), and the candidate awaiting dwell confirmation.
    let dominant: TrackedSection | null = null;
    let pendingCandidate: TrackedSection | null = null;
    let dwellTimer: ReturnType<typeof setTimeout> | null = null;
    let activeSince: number | null = null;
    const confirmedSections = new Set<string>();

    function isPageVisible() {
      return document.visibilityState === "visible";
    }

    function flushDominant(now: number, useBeacon: boolean) {
      if (activeSince === null || dominant === null) return;
      const elapsedSeconds = (now - activeSince) / 1000;
      activeSince = null;
      if (elapsedSeconds < MIN_REPORTABLE_SECONDS) return;
      const payload = {
        event: "sectionTime",
        sectionName: dominant.name,
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

    function handleCandidateChange(candidate: TrackedSection | null) {
      if (candidate?.el === pendingCandidate?.el) return;

      if (dwellTimer !== null) {
        clearTimeout(dwellTimer);
        dwellTimer = null;
      }
      pendingCandidate = candidate;

      if (candidate === null) {
        setDominant(null, Date.now());
        return;
      }

      if (confirmedSections.has(candidate.name)) {
        // Already confirmed on an earlier pass (user scrolled back) — resume
        // timing immediately, no need to re-dwell.
        setDominant(candidate, Date.now());
        return;
      }

      dwellTimer = setTimeout(() => {
        dwellTimer = null;
        confirmedSections.add(candidate.name);
        sendTrackingEvent(proposalId, { event: "section", sectionName: candidate.name });
        setDominant(candidate, Date.now());
      }, SECTION_DWELL_MS);
    }

    function recomputeDominant() {
      handleCandidateChange(computeDominant(sections));
    }

    let scrollScheduled = false;
    function onScrollOrResize() {
      if (scrollScheduled) return;
      scrollScheduled = true;
      requestAnimationFrame(() => {
        scrollScheduled = false;
        recomputeDominant();
      });
    }

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
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);

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

    recomputeDominant();

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("pagehide", handlePageHide);
      if (dwellTimer !== null) clearTimeout(dwellTimer);
      flushDominant(Date.now(), false);
    };
  }, [proposalId]);

  return null;
}
