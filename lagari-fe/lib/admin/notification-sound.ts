const MUTE_KEY = "lagari-admin-notif-muted";

let audioCtx: AudioContext | null = null;
let unlocked = false;

export function isNotificationMuted(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(MUTE_KEY) === "1";
}

export function setNotificationMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MUTE_KEY, muted ? "1" : "0");
}

/** Call after a user gesture (login click) so autoplay policies allow sound. */
export function unlockNotificationSound(): void {
  if (typeof window === "undefined" || unlocked) return;
  try {
    audioCtx = audioCtx ?? new AudioContext();
    if (audioCtx.state === "suspended") {
      void audioCtx.resume();
    }
    unlocked = true;
  } catch {
    /* ignore */
  }
}

export function playNotificationSound(): void {
  if (typeof window === "undefined" || isNotificationMuted()) return;
  unlockNotificationSound();
  if (!audioCtx) return;

  const ctx = audioCtx;
  const now = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(880, now);
  osc.frequency.exponentialRampToValueAtTime(660, now + 0.12);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.22, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + 0.4);

  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = "triangle";
  osc2.frequency.setValueAtTime(1320, now + 0.08);
  gain2.gain.setValueAtTime(0.0001, now + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.12, now + 0.1);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.start(now + 0.08);
  osc2.stop(now + 0.32);
}
