// components/CoupleScene.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Scene = 'idle' | 'hug' | 'kiss';

const SEQUENCE: Scene[] = ['idle', 'hug', 'idle', 'kiss', 'idle', 'hug'];
const SCENE_DURATIONS: Record<Scene, number> = { idle: 3200, hug: 2600, kiss: 2600 };

const BOY_SKIN = '#f0b990';
const GIRL_SKIN = '#f4c6a0';
const HAIR = '#5c3a21';
const BOY_SHIRT = '#5b8def';
const GIRL_DRESS = '#ef6690';

function Person({
  x,
  skin,
  hairPath,
  shirtColor,
  innerArmRotate,
  outerArmRotate,
  leanRotate,
  mirrored,
}: {
  x: number;
  skin: string;
  hairPath: (mirror: boolean) => React.ReactNode;
  shirtColor: string;
  innerArmRotate: number;
  outerArmRotate: number;
  leanRotate: number;
  mirrored: boolean;
}) {
  // Local origin = feet/base point. Everything is drawn upward (negative y).
  // "Inner" = the arm on the side facing the partner; "outer" = the far side.
  const innerShoulder = mirrored ? { x: -18, y: -88 } : { x: 18, y: -88 };
  const outerShoulder = mirrored ? { x: 18, y: -88 } : { x: -18, y: -88 };

  return (
    <motion.g
      animate={{ x, y: 200 }}
      transition={{ type: 'spring', stiffness: 110, damping: 16 }}
    >
      <motion.g
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Body + head, leans toward partner during a kiss */}
        <motion.g
          animate={{ rotate: leanRotate }}
          style={{ transformOrigin: '0px 0px' }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* torso */}
          <rect x={-24} y={-95} width={48} height={95} rx={22} fill={shirtColor} />
          {/* neck */}
          <rect x={-8} y={-108} width={16} height={16} fill={skin} />
          {/* head */}
          <circle cx={0} cy={-128} r={24} fill={skin} />
          {/* cheeks */}
          <circle cx={mirrored ? 10 : -10} cy={-122} r={4} fill="#ff9aa8" opacity={0.6} />
          {/* hair */}
          {hairPath(mirrored)}
          {/* eyes */}
          <circle cx={-7} cy={-129} r={2.2} fill="#2b2b2b" />
          <circle cx={7} cy={-129} r={2.2} fill="#2b2b2b" />
          {/* smile */}
          <path d="M -6 -119 Q 0 -114 6 -119" stroke="#7a4a2b" strokeWidth={2} fill="none" strokeLinecap="round" />
        </motion.g>

        {/* Outer arm (away from partner) — hangs down, resting */}
        <g transform={`translate(${outerShoulder.x}, ${outerShoulder.y})`}>
          <motion.g
            animate={{ rotate: outerArmRotate }}
            style={{ transformOrigin: '0px 0px' }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <rect x={-6} y={0} width={12} height={52} rx={6} fill={shirtColor} />
            <circle cx={0} cy={54} r={7} fill={skin} />
          </motion.g>
        </g>

        {/* Inner arm (toward partner) — swings in for the hug */}
        <g transform={`translate(${innerShoulder.x}, ${innerShoulder.y})`}>
          <motion.g
            animate={{ rotate: innerArmRotate }}
            style={{ transformOrigin: '0px 0px' }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <rect x={-6} y={0} width={12} height={52} rx={6} fill={shirtColor} />
            <circle cx={0} cy={54} r={7} fill={skin} />
          </motion.g>
        </g>
      </motion.g>
    </motion.g>
  );
}

function BoyHair(mirrored: boolean) {
  return (
    <path
      d="M -24 -132 Q -26 -158 0 -158 Q 26 -158 24 -132 Q 24 -142 0 -144 Q -24 -142 -24 -132 Z"
      fill={HAIR}
      transform={mirrored ? 'scale(-1,1)' : undefined}
    />
  );
}

function GirlHair(mirrored: boolean) {
  return (
    <>
      <path
        d="M -25 -130 Q -28 -160 0 -161 Q 28 -160 25 -130 Q 27 -110 20 -90 Q 22 -128 12 -136 Q 22 -150 0 -152 Q -22 -150 -12 -136 Q -22 -128 -20 -90 Q -27 -110 -25 -130 Z"
        fill={HAIR}
        transform={mirrored ? 'scale(-1,1)' : undefined}
      />
    </>
  );
}

function FloatingHearts({ active }: { active: boolean }) {
  const [hearts] = useState(() =>
    Array.from({ length: 3 }, (_, i) => ({
      left: 42 + i * 8 + Math.random() * 6,
      delay: i * 0.35,
    }))
  );

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none absolute inset-0">
          {hearts.map((h, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -60, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.8, delay: h.delay, repeat: Infinity, repeatDelay: 0.6 }}
              className="absolute text-xl"
              style={{ left: `${h.left}%`, top: '20%' }}
            >
              💕
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  );
}

export default function CoupleScene() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const scene = SEQUENCE[sceneIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
      setSceneIndex((i) => (i + 1) % SEQUENCE.length);
    }, SCENE_DURATIONS[scene]);
    return () => clearTimeout(timer);
  }, [scene]);

  const close = scene === 'hug' || scene === 'kiss';
  const boyX = close ? 138 : 108;
  const girlX = close ? 202 : 232;
  // Boy's inner arm sits on his right (swings toward +x/right, negative rotate);
  // girl's inner arm sits on her left (swings toward -x/left, positive rotate).
  const boyArmIn = close ? -78 : 0;
  const girlArmIn = close ? 78 : 0;

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm mx-auto h-56 sm:h-64">
      <FloatingHearts active={close} />
      <svg viewBox="0 0 340 220" className="w-full h-full overflow-visible">
        <Person
          x={boyX}
          skin={BOY_SKIN}
          hairPath={BoyHair}
          shirtColor={BOY_SHIRT}
          innerArmRotate={boyArmIn}
          outerArmRotate={0}
          leanRotate={scene === 'kiss' ? 15 : 0}
          mirrored={false}
        />
        <Person
          x={girlX}
          skin={GIRL_SKIN}
          hairPath={GirlHair}
          shirtColor={GIRL_DRESS}
          innerArmRotate={girlArmIn}
          outerArmRotate={0}
          leanRotate={scene === 'kiss' ? -15 : 0}
          mirrored={true}
        />
      </svg>
    </div>
  );
}
