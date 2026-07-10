// components/CoupleScene.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type Scene = 'idle' | 'hug' | 'kiss' | 'dance' | 'wave';

const SEQUENCE: Scene[] = ['idle', 'wave', 'idle', 'hug', 'idle', 'dance', 'idle', 'kiss'];
const SCENE_DURATIONS: Record<Scene, number> = {
  idle: 2600,
  hug: 2600,
  kiss: 2600,
  dance: 3400,
  wave: 1800,
};

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
  bodySway,
  mirrored,
}: {
  x: number;
  skin: string;
  hairPath: () => React.ReactNode;
  shirtColor: string;
  innerArmRotate: number;
  outerArmRotate: number;
  leanRotate: number;
  bodySway: number[] | null;
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
        {/* Body + head, leans/sways depending on the scene. originX/Y pin the
            pivot to the local (0,0) feet point — plain CSS transformOrigin
            isn't reliably honored by framer-motion on SVG elements. */}
        <motion.g
          animate={{ rotate: bodySway ?? leanRotate }}
          style={{ originX: 0.5, originY: 1 }}
          transition={
            bodySway
              ? { duration: 0.55, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.5, ease: 'easeInOut' }
          }
        >
          {/* torso */}
          <rect x={-24} y={-95} width={48} height={95} rx={22} fill={shirtColor} />
          {/* neck */}
          <rect x={-8} y={-108} width={16} height={16} fill={skin} />
          {/* hair (behind head, so the head circle trims it to a clean hairline) */}
          {hairPath()}
          {/* head */}
          <circle cx={0} cy={-128} r={24} fill={skin} />
          {/* cheeks */}
          <circle cx={mirrored ? 10 : -10} cy={-122} r={4} fill="#ff9aa8" opacity={0.6} />
          {/* eyes */}
          <circle cx={-7} cy={-129} r={2.2} fill="#2b2b2b" />
          <circle cx={7} cy={-129} r={2.2} fill="#2b2b2b" />
          {/* smile */}
          <path d="M -6 -119 Q 0 -114 6 -119" stroke="#7a4a2b" strokeWidth={2} fill="none" strokeLinecap="round" />
        </motion.g>

        {/* Outer arm (away from partner) — raises to wave hello */}
        <g transform={`translate(${outerShoulder.x}, ${outerShoulder.y})`}>
          <motion.g
            animate={{ rotate: outerArmRotate }}
            style={{ originX: 0.5, originY: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <rect x={-6} y={0} width={12} height={52} rx={6} fill={shirtColor} />
            <circle cx={0} cy={54} r={7} fill={skin} />
          </motion.g>
        </g>

        {/* Inner arm (toward partner) */}
        <g transform={`translate(${innerShoulder.x}, ${innerShoulder.y})`}>
          <motion.g
            animate={{ rotate: innerArmRotate }}
            style={{ originX: 0.5, originY: 0 }}
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

function BoyHair() {
  // A simple rounded "cap" sitting behind the head; the head circle drawn
  // afterward trims away everything but a clean short-hair fringe on top.
  return <ellipse cx={0} cy={-140} rx={25} ry={19} fill={HAIR} />;
}

function GirlHair() {
  // Two soft locks flowing down past the shoulders, plus a rounded cap —
  // all simple convex shapes so nothing renders as a jagged notch.
  return (
    <>
      <path
        d="M -24 -124 C -31 -104 -30 -78 -23 -62 C -18 -66 -16 -74 -16 -84 C -19 -98 -20 -112 -18 -124 Z"
        fill={HAIR}
      />
      <path
        d="M 24 -124 C 31 -104 30 -78 23 -62 C 18 -66 16 -74 16 -84 C 19 -98 20 -112 18 -124 Z"
        fill={HAIR}
      />
      <ellipse cx={0} cy={-134} rx={27} ry={25} fill={HAIR} />
    </>
  );
}

function FloatingEmojis({ active, emojis }: { active: boolean; emojis: string[] }) {
  const [items] = useState(() =>
    emojis.map((emoji, i) => ({
      emoji,
      left: 38 + i * 9 + Math.random() * 6,
      delay: i * 0.35,
    }))
  );

  return (
    <AnimatePresence>
      {active && (
        <div className="pointer-events-none absolute inset-0">
          {items.map((it, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 0], y: -60, scale: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.3, repeat: 0 } }}
              transition={{ duration: 1.8, delay: it.delay, repeat: Infinity, repeatDelay: 0.6 }}
              className="absolute text-xl"
              style={{ left: `${it.left}%`, top: '20%' }}
            >
              {it.emoji}
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

  const close = scene === 'hug' || scene === 'kiss' || scene === 'dance';
  const boyX = close ? 138 : 108;
  const girlX = close ? 202 : 232;

  // Boy's inner arm sits on his right (swings toward +x/right, negative rotate);
  // girl's inner arm sits on her left (swings toward -x/left, positive rotate).
  let boyArmIn = 0;
  let girlArmIn = 0;
  let boyArmOut = 0;
  let girlArmOut = 0;

  if (scene === 'hug' || scene === 'kiss') {
    boyArmIn = -78;
    girlArmIn = 78;
  } else if (scene === 'dance') {
    // Both arms raised for a little twirl.
    boyArmIn = -155;
    girlArmIn = 155;
    boyArmOut = 155;
    girlArmOut = -155;
  } else if (scene === 'wave') {
    // Boy raises a hand in greeting.
    boyArmOut = 140;
  }

  const dancing = scene === 'dance';

  return (
    <div className="relative w-full max-w-xs sm:max-w-sm mx-auto h-56 sm:h-64">
      <FloatingEmojis active={scene === 'hug' || scene === 'kiss'} emojis={['💕', '💕', '💕']} />
      <FloatingEmojis active={dancing} emojis={['🎵', '🎶', '🎵']} />
      <svg viewBox="0 0 340 220" className="w-full h-full overflow-visible">
        <Person
          x={boyX}
          skin={BOY_SKIN}
          hairPath={BoyHair}
          shirtColor={BOY_SHIRT}
          innerArmRotate={boyArmIn}
          outerArmRotate={boyArmOut}
          leanRotate={scene === 'kiss' ? 6 : 0}
          bodySway={dancing ? [8, -8, 8] : null}
          mirrored={false}
        />
        <Person
          x={girlX}
          skin={GIRL_SKIN}
          hairPath={GirlHair}
          shirtColor={GIRL_DRESS}
          innerArmRotate={girlArmIn}
          outerArmRotate={girlArmOut}
          leanRotate={scene === 'kiss' ? -6 : 0}
          bodySway={dancing ? [-8, 8, -8] : null}
          mirrored={true}
        />
      </svg>
    </div>
  );
}
