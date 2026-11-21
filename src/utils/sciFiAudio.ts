const UI_SOUNDS_STORAGE_KEY = 'awn_tv_ui_sounds_v1';

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    return sharedAudioCtx;
  } catch {
    return null;
  }
}

export function isUiSoundsEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  try {
    const saved = localStorage.getItem(UI_SOUNDS_STORAGE_KEY);
    if (saved === null) return true;
    return saved === '1';
  } catch {
    return true;
  }
}

export function setUiSoundsEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(UI_SOUNDS_STORAGE_KEY, enabled ? '1' : '0');
  } catch {
    // Ignore storage restriction
  }
}

/**
 * Crisp, soft Quantum Energy Click (crystalline transient + subtle sub-harmonic)
 */
export function playCyberClick(): void {
  if (!isUiSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const crystalOsc = ctx.createOscillator();
    const crystalGain = ctx.createGain();
    crystalOsc.type = 'sine';
    crystalOsc.frequency.setValueAtTime(760, now);
    crystalOsc.frequency.exponentialRampToValueAtTime(340, now + 0.055);
    crystalGain.gain.setValueAtTime(0.001, now);
    crystalGain.gain.linearRampToValueAtTime(0.026, now + 0.006);
    crystalGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    crystalOsc.connect(crystalGain);
    crystalGain.connect(ctx.destination);
    crystalOsc.start(now);
    crystalOsc.stop(now + 0.065);

    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(140, now);
    subOsc.frequency.exponentialRampToValueAtTime(82, now + 0.07);
    subGain.gain.setValueAtTime(0.001, now);
    subGain.gain.linearRampToValueAtTime(0.022, now + 0.01);
    subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);
    subOsc.connect(subGain);
    subGain.connect(ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 0.08);
  } catch {
    // Autoplay policy safe fallback
  }
}

/**
 * Deep, ultra-soft Quantum Hum for modal/panel transitions
 */
export function playCyberWhoosh(): void {
  if (!isUiSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    const humOsc = ctx.createOscillator();
    const humGain = ctx.createGain();
    humOsc.type = 'sine';
    humOsc.frequency.setValueAtTime(115, now);
    humOsc.frequency.exponentialRampToValueAtTime(220, now + 0.16);

    humGain.gain.setValueAtTime(0.001, now);
    humGain.gain.linearRampToValueAtTime(0.026, now + 0.045);
    humGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);

    humOsc.connect(humGain);
    humGain.connect(ctx.destination);
    humOsc.start(now);
    humOsc.stop(now + 0.2);

    const shimmerOsc = ctx.createOscillator();
    const shimmerGain = ctx.createGain();
    shimmerOsc.type = 'triangle';
    shimmerOsc.frequency.setValueAtTime(440, now);
    shimmerOsc.frequency.exponentialRampToValueAtTime(680, now + 0.15);
    shimmerGain.gain.setValueAtTime(0.001, now);
    shimmerGain.gain.linearRampToValueAtTime(0.012, now + 0.035);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
    shimmerOsc.connect(shimmerGain);
    shimmerGain.connect(ctx.destination);
    shimmerOsc.start(now);
    shimmerOsc.stop(now + 0.18);
  } catch {
    // Ignore audio context block
  }
}

/**
 * 0.8s Wormhole / Quantum Portal Scan startup resonance
 */
export function playBiometricScanChime(): void {
  if (!isUiSoundsEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Deep singularity warp hum
    const warp = ctx.createOscillator();
    const warpGain = ctx.createGain();
    warp.type = 'triangle';
    warp.frequency.setValueAtTime(88, now + 0.02);
    warp.frequency.exponentialRampToValueAtTime(260, now + 0.44);
    warpGain.gain.setValueAtTime(0.001, now + 0.02);
    warpGain.gain.linearRampToValueAtTime(0.032, now + 0.12);
    warpGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.48);
    warp.connect(warpGain);
    warpGain.connect(ctx.destination);
    warp.start(now + 0.02);
    warp.stop(now + 0.5);

    // Celestial golden harmonic portal lock chord
    const lock = ctx.createOscillator();
    const lockGain = ctx.createGain();
    lock.type = 'sine';
    lock.frequency.setValueAtTime(528, now + 0.44);
    lock.frequency.setValueAtTime(792, now + 0.56);
    lockGain.gain.setValueAtTime(0.001, now + 0.44);
    lockGain.gain.linearRampToValueAtTime(0.034, now + 0.49);
    lockGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.78);
    lock.connect(lockGain);
    lockGain.connect(ctx.destination);
    lock.start(now + 0.44);
    lock.stop(now + 0.8);
  } catch {
    // Autoplay policy safe fallback
  }
}
