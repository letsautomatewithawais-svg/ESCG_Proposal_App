"use client";

import { useEffect } from "react";

const HEARTBEAT_INTERVAL_SECONDS = 15;
const SECTION_DWELL_MS = 1500;

const TRACKED_SECTIONS = [
  { id: "section-introduction", name: "Introduction" },
  { id: "section-scope-of-work", name: "Scope of Work" },
  { id: "section-pricing", name: "Pricing" },
  { id: "section-terms", name: "Terms" },
  { id: "section-signature-block", name: "Signature Block" },
];

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

export default function ProposalTracker({ proposalId }: { proposalId: string }) {
  useEffect(() => {
    sendTrackingEvent(proposalId, { event: "open" });

    let intervalId: ReturnType<typeof setInterval> | null = null;
    let lastHeartbeatAt = Date.now();

    function sendHeartbeat() {
      sendTrackingEvent(proposalId, {
        event: "heartbeat",
        intervalSeconds: HEARTBEAT_INTERVAL_SECONDS,
      });
      lastHeartbeatAt = Date.now();
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
      if (document.visibilityState === "visible") {
        startInterval();
      } else {
        stopInterval();
      }
    }

    if (document.visibilityState === "visible") {
      startInterval();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    function handlePageHide() {
      if (document.visibilityState !== "visible") return;

      const elapsedSeconds = (Date.now() - lastHeartbeatAt) / 1000;
      if (elapsedSeconds < 1) return;

      try {
        const blob = new Blob(
          [JSON.stringify({ event: "heartbeat", intervalSeconds: elapsedSeconds })],
          { type: "application/json" },
        );
        navigator.sendBeacon(trackUrl(proposalId), blob);
      } catch {
        // sendBeacon can be blocked or unavailable; exiting silently is fine here.
      }
    }

    window.addEventListener("pagehide", handlePageHide);

    const dwellTimers = new Map<Element, ReturnType<typeof setTimeout>>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target;

          if (!entry.isIntersecting) {
            const pendingTimer = dwellTimers.get(el);
            if (pendingTimer) {
              clearTimeout(pendingTimer);
              dwellTimers.delete(el);
            }
            continue;
          }

          if (dwellTimers.has(el)) continue;

          const timer = setTimeout(() => {
            dwellTimers.delete(el);
            const sectionName = el.getAttribute("data-section-name");
            if (sectionName) {
              sendTrackingEvent(proposalId, { event: "section", sectionName });
            }
            observer.unobserve(el);
          }, SECTION_DWELL_MS);
          dwellTimers.set(el, timer);
        }
      },
      { threshold: 0.5 },
    );

    for (const { id, name } of TRACKED_SECTIONS) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.setAttribute("data-section-name", name);
      observer.observe(el);
    }

    return () => {
      stopInterval();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      for (const timer of dwellTimers.values()) clearTimeout(timer);
      observer.disconnect();
    };
  }, [proposalId]);

  return null;
}
