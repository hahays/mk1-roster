export const INTRO_DURATION = 3.2;
export const IMPACT_TIME = 1.05;

const clamp = (value: number) => Math.min(1, Math.max(0, value));
const easeOut = (value: number) => 1 - Math.pow(1 - clamp(value), 3);

// Both the WebGL portraits and DOM plates sample this same clock.
export function sampleIntro(seconds: number | null, reducedMotion = false) {
  if (seconds === null || reducedMotion || seconds >= INTRO_DURATION) {
    return { entrance: 1, plate: 1, collision: 0, recoil: 0, shake: 0, flash: 0, burst: -1, energy: 0, vs: 1, finished: true };
  }
  const afterImpact = seconds - IMPACT_TIME;
  return {
    entrance: easeOut(seconds / 0.8),
    plate: Math.pow(clamp((seconds - 0.32) / (IMPACT_TIME - 0.32)), 4),
    // The inside edges actually meet, then spring back to leave space for VS.
    collision: afterImpact < 0 ? Math.pow(clamp((seconds - 0.32) / (IMPACT_TIME - 0.32)), 4) : Math.exp(-afterImpact * 10),
    recoil: afterImpact >= 0 ? Math.sin(afterImpact * 23) * Math.exp(-afterImpact * 5.5) : 0,
    shake: afterImpact >= 0 ? Math.sin(afterImpact * 70) * Math.exp(-afterImpact * 7) : 0,
    flash: afterImpact >= 0 ? Math.max(0, 1 - afterImpact / 0.28) : 0,
    burst: afterImpact >= 0 && afterImpact < 2 ? afterImpact : -1,
    energy: afterImpact < 0 ? clamp((seconds - 0.4) / 0.65) : Math.exp(-afterImpact * 2.7),
    vs: afterImpact < 0 ? 0 : easeOut(afterImpact / 0.45),
    finished: false,
  };
}
