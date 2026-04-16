import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotate: number;
  scale: number;
  color: string;
}

interface FeatherBurstProps {
  originX?: number; // pixel X (default: viewport center)
  originY?: number; // pixel Y (default: viewport center)
  count?: number; // particle count (default: 16)
  colors?: string[]; // override palette
  onComplete?: () => void;
}

const DEFAULT_COLORS = ['#f59e0b', '#10b981', '#f43f5e', '#8b5cf6', '#06b6d4'];

export function FeatherBurst({
  originX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  originY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  count = 10,
  colors = DEFAULT_COLORS,
  onComplete,
}: FeatherBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: count }).map(
      (_, i) => {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const distance = 60 + Math.random() * 80;
        return {
          id: i,
          x: originX,
          y: originY,
          targetX: originX + Math.cos(angle) * distance,
          targetY: originY + Math.sin(angle) * distance,
          rotate: Math.random() * 180,
          scale: 0.4 + Math.random() * 0.35,
          color: colors[i % colors.length],
        };
      }
    );
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 1200);

    return () => clearTimeout(timer);
  }, [originX, originY, count, colors, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[500] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: p.x - 4,
              y: p.y - 2,
              opacity: 0.85,
              scale: 0.3,
              rotate: 0,
            }}
            animate={{
              x: p.targetX,
              y: p.targetY,
              opacity: 0,
              scale: p.scale,
              rotate: p.rotate,
            }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
              delay: Math.random() * 0.1,
            }}
            className="absolute h-1.5 w-4 rounded-full"
            style={{
              backgroundColor: p.color,
              opacity: 0.7,
              willChange: 'transform, opacity',
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
