const ONBOARDING_KEY = "petpals_onboarded";

export const ONBOARDING_RESTART_EVENT = "petpals:restart-tour";

export function isOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "1";
  } catch {
    return true;
  }
}

export function markOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch {
    // storage unavailable — nothing to persist
  }
}

export function restartOnboarding(): void {
  try {
    localStorage.removeItem(ONBOARDING_KEY);
  } catch {
    // storage unavailable — nothing to persist
  }
  window.dispatchEvent(new Event(ONBOARDING_RESTART_EVENT));
}
