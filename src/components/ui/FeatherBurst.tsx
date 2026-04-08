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

const DEFAULT_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#f43f5e', '#8b5cf6'];

export function FeatherBurst({
  originX = typeof window !== 'undefined' ? window.innerWidth / 2 : 0,
  originY = typeof window !== 'undefined' ? window.innerHeight / 2 : 0,
  count = 16,
  colors = DEFAULT_COLORS,
  onComplete,
}: FeatherBurstProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const newParticles: Particle[] = Array.from({ length: count }).map(
      (_, i) => {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
        const distance = 100 + Math.random() * 150;
        return {
          id: i,
          x: originX,
          y: originY,
          targetX: originX + Math.cos(angle) * distance,
          targetY: originY + Math.sin(angle) * distance,
          rotate: Math.random() * 360,
          scale: 0.5 + Math.random() * 0.5,
          color: colors[i % colors.length],
        };
      }
    );
    setParticles(newParticles);

    const timer = setTimeout(() => {
      onComplete?.();
    }, 1500);

    return () => clearTimeout(timer);
  }, [originX, originY, count, colors, onComplete]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[500] overflow-hidden">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: p.x - 6,
              y: p.y - 6,
              opacity: 1,
              scale: 0.5,
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
              duration: 1.2,
              ease: [0.22, 1, 0.36, 1],
              delay: Math.random() * 0.2,
            }}
            className="absolute h-3 w-6 rounded-full"
            style={{
              backgroundColor: p.color,
              willChange: 'transform, opacity',
            }}
          >
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  'linear-gradient(90deg, transparent 50%, rgba(255,255,255,0.4) 50%)',
                backgroundSize: '2px 100%',
              }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
