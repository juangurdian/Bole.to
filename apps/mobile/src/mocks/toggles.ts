export const mockToggles = {
  delayMs: 500,
  forceError: false,
  offline: false,
  revealAtISO: "2025-10-02T12:00:00.000Z"
};

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));