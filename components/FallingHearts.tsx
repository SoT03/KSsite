// components/FallingHearts.tsx

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface HeartConfig {
  left: number;
  fontSize: number;
  delay: number;
  duration: number;
}

const Heart = ({ left, fontSize, delay, duration }: HeartConfig) => {
  return (
    <motion.div
      initial={{ y: -100, opacity: 1, x: 0 }}
      animate={{ y: '100vh', opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: 'easeIn',
        repeat: Infinity,
      }}
      className="absolute text-rose-400"
      style={{
        left: `${left}%`,
        fontSize: `${fontSize}px`,
      }}
    >
      ❤️
    </motion.div>
  );
};

export default function FallingHearts() {
  const [hearts] = useState<HeartConfig[]>(() =>
    Array.from({ length: 15 }, (_, i) => ({
      left: Math.random() * 100,
      fontSize: 20 + Math.random() * 30,
      delay: i * 0.3,
      duration: 3 + Math.random() * 2,
    }))
  );

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {hearts.map((heart, i) => (
        <Heart key={i} {...heart} />
      ))}
    </div>
  );
}
