let ctx: AudioContext | null = null;

export const soundOn = (): boolean => {
  try {
    return localStorage.getItem("baro-sound") === "on";
  } catch {
    return false;
  }
};

export function setSound(on: boolean) {
  try {
    localStorage.setItem("baro-sound", on ? "on" : "off");
  } catch {
    /* ignore */
  }
}

function tone(freq: number, dur: number, type: OscillatorType, delay = 0, vol = 0.06) {
  try {
    const W = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = W.AudioContext ?? W.webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    const t = ctx.currentTime + delay;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t);
    o.stop(t + dur + 0.02);
  } catch {
    /* audio unavailable */
  }
}

/** Short UI sounds; silent unless the learner turned sound on. */
export function play(kind: "tick" | "pop" | "win" | "thud" | "blip") {
  if (!soundOn()) return;
  if (kind === "tick") tone(1400, 0.02, "square", 0, 0.025);
  if (kind === "blip") tone(880, 0.06, "square", 0, 0.04);
  if (kind === "thud") tone(90, 0.25, "sine", 0, 0.2);
  if (kind === "pop") tone(700 + Math.random() * 500, 0.06, "triangle", 0, 0.12);
  if (kind === "win") [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, "triangle", i * 0.09, 0.08));
}
