// src/ui/effects.ts

/**
 * Dispara uma animação de confete na tela.
 * É um efeito sutil para celebrar a conclusão de um treino.
 */
export function triggerConfetti(): void {
  const canvas = document.createElement('canvas');
  const container = document.body;
  container.appendChild(canvas);
  canvas.style.position = 'fixed';
  canvas.style.top = '0';
  canvas.style.left = '0';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '100';

  const ctx = canvas.getContext('2d')!;
  const confettiCount = 100;
  const confetti = [];

  for (let i = 0; i < confettiCount; i++) {
    confetti.push({
      x: Math.random() * canvas.width,
      y: -20, // Começa fora da tela
      r: Math.random() * 6 + 2, // Raio
      d: Math.random() * confettiCount, // Densidade
      color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.7)`,
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngle: 0,
    });
  }

  let frame: number;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < confetti.length; i++) {
      const c = confetti[i];
      ctx.beginPath();
      ctx.lineWidth = c.r / 2;
      ctx.strokeStyle = c.color;
      ctx.moveTo(c.x + c.tilt + c.r, c.y);
      ctx.lineTo(c.x + c.tilt, c.y + c.tilt + c.r);
      ctx.stroke();
    }
    update();
    frame = requestAnimationFrame(draw);
  }

  function update() {
    let remaining = 0;
    for (let i = 0; i < confetti.length; i++) {
      const c = confetti[i];
      c.tiltAngle += 0.07;
      c.y += (Math.cos(c.d) + 3 + c.r / 2) / 2;
      c.tilt = Math.sin(c.tiltAngle) * 15;
      if (c.y < canvas.height) {
        remaining++;
      }
    }
    if (remaining === 0) {
        cancelAnimationFrame(frame);
        canvas.remove();
    }
  }

  frame = requestAnimationFrame(draw);
}