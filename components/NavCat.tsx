// components/NavCat.tsx

'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Ragdoll coloring: cream body, black/grey (seal-lynx-ish) points on ears/mask/tail/paws, blue eyes.
const BODY = '#f4ead9';
const POINT = '#3f3f42';
const BELLY = '#fffaf0';
const EYE = '#6fa8dc';

function CatSVG({ sitting }: { sitting: boolean }) {
  return (
    <motion.svg
      viewBox="0 0 60 44"
      width={38}
      height={29}
      animate={sitting ? { scaleY: 0.85, y: 3 } : { scaleY: [1, 0.96, 1], y: [0, 1, 0] }}
      transition={
        sitting
          ? { duration: 0.3 }
          : { duration: 0.5, repeat: Infinity, ease: 'easeInOut' }
      }
      style={{ transformOrigin: '30px 40px' }}
    >
      {/* tail — point-colored, fluffy — a static curve rotated around its base */}
      <motion.g
        animate={sitting ? { rotate: -24 } : { rotate: [0, -14, 0] }}
        transition={
          sitting
            ? { duration: 0.3 }
            : { duration: 1.1, repeat: Infinity, ease: 'easeInOut' }
        }
        style={{ originX: 1, originY: 0.83 }}
      >
        <path
          d="M 16 30 Q 2 32 4 20"
          stroke={POINT}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
        />
      </motion.g>
      {/* body */}
      <ellipse cx={30} cy={30} rx={17} ry={11} fill={BODY} />
      <ellipse cx={32} cy={34} rx={10} ry={5} fill={BELLY} />
      {/* paws (point color) */}
      <ellipse cx={22} cy={40} rx={4} ry={2.6} fill={POINT} />
      <ellipse cx={38} cy={40} rx={4} ry={2.6} fill={POINT} />
      {/* head */}
      <circle cx={46} cy={17} r={10} fill={BODY} />
      {/* seal mask over the muzzle */}
      <ellipse cx={47} cy={19} rx={6} ry={4.5} fill={POINT} opacity={0.55} />
      <ellipse cx={47} cy={20} rx={5} ry={3.5} fill={BELLY} />
      {/* ears — point color */}
      <motion.path
        d="M 39 10 L 37 2 L 44 8 Z"
        fill={POINT}
        animate={{ rotate: sitting ? -6 : 0 }}
        style={{ originX: 0.43, originY: 0.88 }}
      />
      <motion.path
        d="M 51 9 L 55 1 L 54 9 Z"
        fill={POINT}
        animate={{ rotate: sitting ? 6 : 0 }}
        style={{ originX: 0.25, originY: 0.88 }}
      />
      {/* eyes — Ragdoll blue */}
      <circle cx={43} cy={16} r={1.6} fill={EYE} />
      <circle cx={49} cy={16} r={1.6} fill={EYE} />
      <circle cx={43.3} cy={15.7} r={0.5} fill="#fff" />
      <circle cx={49.3} cy={15.7} r={0.5} fill="#fff" />
      {/* nose */}
      <path d="M 45.3 19.5 L 46.7 19.5 L 46 20.6 Z" fill="#6b5a5d" />
      {/* whiskers */}
      <path d="M 40 19 L 34 18 M 40 20.5 L 34 21.5" stroke={POINT} strokeWidth={0.7} />
      <path d="M 52 19 L 58 18 M 52 20.5 L 58 21.5" stroke={POINT} strokeWidth={0.7} />
    </motion.svg>
  );
}

export default function NavCat({
  hoveredIndex,
  itemCenters,
  trackWidth,
}: {
  hoveredIndex: number | null;
  itemCenters: number[];
  trackWidth: number;
}) {
  const [patrolSide, setPatrolSide] = useState<0 | 1>(0);

  useEffect(() => {
    if (hoveredIndex !== null) return;
    const id = setInterval(() => setPatrolSide((s) => (s === 0 ? 1 : 0)), 3400);
    return () => clearInterval(id);
  }, [hoveredIndex]);

  const sitting = hoveredIndex !== null && itemCenters[hoveredIndex] !== undefined;
  const patrolMargin = 14;
  const targetX = sitting
    ? itemCenters[hoveredIndex!]
    : patrolSide === 0
    ? patrolMargin
    : Math.max(trackWidth - patrolMargin, patrolMargin);
  const facingLeft = sitting ? false : patrolSide === 0;

  return (
    <div className="pointer-events-none absolute left-0 right-0 -bottom-6 h-7 hidden md:block overflow-visible">
      <motion.div
        className="absolute top-0"
        animate={{ left: targetX }}
        transition={{ type: 'spring', stiffness: sitting ? 260 : 45, damping: sitting ? 22 : 12 }}
        style={{ x: '-50%', scaleX: facingLeft ? -1 : 1 }}
      >
        <CatSVG sitting={sitting} />
        <AnimatePresence>
          {sitting && (
            <motion.span
              initial={{ opacity: 0, y: 4, scale: 0.5 }}
              animate={{ opacity: 1, y: -6, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px]"
              style={{ scaleX: facingLeft ? -1 : 1 }}
            >
              🐾
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
