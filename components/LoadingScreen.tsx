// components/LoadingScreen.tsx

'use client';

import { motion } from 'framer-motion';

const WORDS = ['Remember', 'you', 'are', 'my', 'world'];

export default function LoadingScreen({ icon = '❤️' }: { icon?: string }) {
  return (
    <div className="w-full h-screen flex flex-col items-center justify-center gap-6 bg-linear-to-br from-pink-50 via-white to-red-50">
      <motion.div
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        className="text-5xl"
      >
        {icon}
      </motion.div>
      <motion.p
        animate={{ scale: [1, 1.03, 1] }}
        transition={{
          duration: 2.4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: WORDS.length * 0.12,
        }}
        className="flex flex-wrap justify-center gap-x-2 px-6 text-xl sm:text-2xl font-semibold"
      >
        {WORDS.map((word, i) => (
          <motion.span
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.12, duration: 0.5, ease: 'easeOut' }}
            className="text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-pink-500"
          >
            {word}
          </motion.span>
        ))}
      </motion.p>
    </div>
  );
}
