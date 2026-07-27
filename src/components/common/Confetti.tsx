import confetti from 'canvas-confetti';

export function triggerConfetti() {
  try {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6']
    });
  } catch {
    // Ignore canvas error
  }
}
