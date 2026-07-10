// components/AmbientBackground.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

function DriftingHearts() {
  const [hearts] = useState(() =>
    Array.from({ length: 6 }, (_, i) => ({
      left: Math.random() * 100,
      size: 14 + Math.random() * 14,
      duration: 16 + Math.random() * 10,
      delay: i * 3.2,
    }))
  );

  return (
    <>
      {hearts.map((h, i) => (
        <motion.span
          key={i}
          initial={{ y: '110vh', opacity: 0 }}
          animate={{ y: '-10vh', opacity: [0, 0.5, 0.5, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'linear' }}
          className="absolute text-rose-300"
          style={{ left: `${h.left}%`, fontSize: h.size }}
        >
          ❤️
        </motion.span>
      ))}
    </>
  );
}

function RedCar() {
  return (
    <motion.div
      className="absolute bottom-6"
      initial={{ x: '-15vw' }}
      animate={{ x: '115vw' }}
      transition={{ duration: 16, repeat: Infinity, repeatDelay: 24, ease: 'linear' }}
    >
      {/* a boxy, Volvo-esque red sedan, side profile */}
      <svg width="72" height="34" viewBox="0 0 72 34">
        <rect x="4" y="12" width="64" height="15" rx="3" fill="#b8271f" />
        <rect x="15" y="3" width="34" height="12" rx="2" fill="#b8271f" />
        <rect x="18" y="5.5" width="12" height="7.5" fill="#bfe0f2" />
        <rect x="32" y="5.5" width="12" height="7.5" fill="#bfe0f2" />
        <rect x="4" y="19" width="64" height="3" fill="#7c1a14" />
        <circle cx="19" cy="28" r="6" fill="#232323" />
        <circle cx="53" cy="28" r="6" fill="#232323" />
        <circle cx="19" cy="28" r="2.4" fill="#8a8a8a" />
        <circle cx="53" cy="28" r="2.4" fill="#8a8a8a" />
        <rect x="63" y="15" width="3" height="3" fill="#ffe08a" />
      </svg>
    </motion.div>
  );
}

function PawTrail() {
  const [walks] = useState(() =>
    Array.from({ length: 2 }, (_, w) => ({
      top: 15 + Math.random() * 65,
      startLeft: w % 2 === 0 ? -5 : 105,
      direction: w % 2 === 0 ? 1 : -1,
      delay: w * 11,
      paws: Array.from({ length: 6 }, (_, i) => i),
    }))
  );

  return (
    <>
      {walks.map((walk, wi) => (
        <div key={wi}>
          {walk.paws.map((i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.55, 0.55, 0] }}
              transition={{
                duration: 20,
                delay: walk.delay + i * 0.9,
                repeat: Infinity,
                repeatDelay: 20,
              }}
              className="absolute text-xs"
              style={{
                left: `${walk.startLeft + walk.direction * i * 7}%`,
                top: `${walk.top + (i % 2 === 0 ? 0 : 2.5)}%`,
                transform: walk.direction < 0 ? 'scaleX(-1)' : undefined,
              }}
            >
              🐾
            </motion.span>
          ))}
        </div>
      ))}
    </>
  );
}

export default function AmbientBackground() {
  // Random values must not be computed during SSR (server/client would roll
  // different numbers and trigger a hydration mismatch) — render nothing
  // until after mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
      <DriftingHearts />
      <RedCar />
      <PawTrail />
    </div>
  );
}
