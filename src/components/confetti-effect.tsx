import React, { useCallback, useEffect, useRef } from 'react';

interface ConfettiEffectProps {
  isActive: boolean;
  onComplete?: () => void;
}

export const ConfettiEffect: React.FC<ConfettiEffectProps> = ({ isActive, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawConfetti = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const particleCount = 150;
    const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa'];

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        velocity: {
          x: (Math.random() - 0.5) * 10,
          y: (Math.random() - 0.5) * 10 - 5
        },
        gravity: 0.2,
        friction: 0.99,
        opacity: 1,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }

    let frameCount = 0;
    const maxFrames = 300; // About 5 seconds at 60fps

    const render = () => {
      if (!ctx) return;
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let activeParticles = 0;
      particles.forEach(particle => {
        if (particle.opacity <= 0) return;

        // Apply physics
        particle.velocity.x *= particle.friction;
        particle.velocity.y *= particle.friction;
        particle.velocity.y += particle.gravity;

        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        particle.rotation += particle.rotationSpeed;
        particle.opacity -= 0.005;

        // Draw particle
        ctx.save();
        ctx.globalAlpha = particle.opacity;
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.radius / 2, -particle.radius / 2, particle.radius, particle.radius);
        
        ctx.restore();
        
        if (particle.opacity > 0) activeParticles++;
      });

      frameCount++;
      if (activeParticles > 0 && frameCount < maxFrames) {
        requestAnimationFrame(render);
      } else {
        if (onComplete) onComplete();
      }
    };

    render();
  }, [onComplete]);

  useEffect(() => {
    if (isActive) {
      drawConfetti();
    }
  }, [isActive, drawConfetti]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full pointer-events-none z-50"
      style={{ display: isActive ? 'block' : 'none' }}
    />
  );
};