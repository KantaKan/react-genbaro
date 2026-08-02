import confetti from "canvas-confetti";

const FIRE_PALETTE = ["#f59e0b", "#f97316", "#ef4444", "#fbbf24", "#d97706"];

export function fireConfetti() {
  const defaults = {
    colors: FIRE_PALETTE,
    spread: 60,
    ticks: 80,
    gravity: 1.4,
    scalar: 1.1,
    shapes: ["circle"] as confetti.Shape[],
    drift: 0,
  };

  confetti({
    ...defaults,
    particleCount: 30,
    origin: { x: 0.5, y: 0.6 },
    startVelocity: 35,
  });

  setTimeout(() => {
    confetti({
      ...defaults,
      particleCount: 20,
      origin: { x: 0.5, y: 0.55 },
      startVelocity: 30,
    });
  }, 150);
}

export function fireMilestoneConfetti() {
  const defaults = {
    colors: FIRE_PALETTE,
    ticks: 140,
    gravity: 1,
    scalar: 1.2,
    shapes: ["circle", "square"] as confetti.Shape[],
    drift: 0,
  };

  const end = Date.now() + 1200;
  (function frame() {
    confetti({
      ...defaults,
      particleCount: 8,
      startVelocity: 45,
      spread: 70,
      origin: { x: Math.random(), y: Math.random() * 0.4 + 0.1 },
    });
    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}
