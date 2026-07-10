// app/this-year/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navigation from '@/components/Navigation';

interface Message {
  id: string;
  dayNumber: number;
  content: string;
  opened: boolean;
  openedAt?: string;
}

interface OpenedBox {
  messageId: string;
  openedAt: string;
}

type BoxStatus = 'locked' | 'available' | 'opened';

const isSameLocalDay = (isoDate: string): boolean => {
  const d = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
};

function SparkleBurst() {
  const [particles] = useState(() =>
    Array.from({ length: 10 }, (_, i) => ({
      angle: (i / 10) * Math.PI * 2,
      distance: 34 + Math.random() * 22,
      emoji: i % 2 === 0 ? '✨' : '💗',
    }))
  );

  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
      {particles.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.4 }}
          animate={{
            opacity: 0,
            x: Math.cos(p.angle) * p.distance,
            y: Math.sin(p.angle) * p.distance,
            scale: 1,
          }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute text-base"
        >
          {p.emoji}
        </motion.span>
      ))}
    </div>
  );
}

function BoxTile({
  msg,
  status,
  isOpening,
  onClick,
}: {
  msg: Message;
  status: BoxStatus;
  isOpening: boolean;
  onClick: () => void;
}) {
  const flipped = status === 'opened' || isOpening;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: Math.min(msg.dayNumber, 40) * 0.015 }}
      className="relative w-full aspect-square"
      style={{ perspective: '1000px' }}
    >
      <motion.button
        onClick={onClick}
        disabled={status === 'locked'}
        whileHover={status !== 'locked' ? { scale: 1.06, y: -4 } : {}}
        whileTap={status !== 'locked' ? { scale: 0.95 } : {}}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' } as React.CSSProperties}
        className={`
          relative block w-full h-full rounded-2xl shadow-lg transition-shadow
          ${status === 'locked' ? 'opacity-45 cursor-not-allowed' : 'cursor-pointer hover:shadow-xl'}
        `}
      >
        {/* Front face */}
        <div
          style={{ backfaceVisibility: 'hidden' } as React.CSSProperties}
          className={`
            absolute inset-0 flex items-center justify-center rounded-2xl
            ${status === 'available' ? 'bg-linear-to-br from-rose-400 to-pink-400' : 'bg-linear-to-br from-gray-300 to-gray-400'}
          `}
        >
          <div className="text-2xl sm:text-3xl">{status === 'available' ? '🎁' : '🔒'}</div>
          <div className="absolute bottom-1.5 right-2 text-white/90 text-[10px] sm:text-xs font-bold">
            {msg.dayNumber}
          </div>
        </div>

        {/* Back face */}
        <div
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          } as React.CSSProperties}
          className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-linear-to-br from-rose-200 to-pink-200 p-1.5 sm:p-2 text-center overflow-hidden"
        >
          <div className="text-base sm:text-lg leading-none">💌</div>
          <p className="text-[9px] sm:text-[11px] leading-tight text-rose-800 font-medium line-clamp-3">
            {msg.content}
          </p>
        </div>
      </motion.button>

      <AnimatePresence>{isOpening && <SparkleBurst />}</AnimatePresence>
    </motion.div>
  );
}

export default function ThisYearPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [openedBoxes, setOpenedBoxes] = useState<OpenedBox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const hasOpenedToday = openedBoxes.some((box) => isSameLocalDay(box.openedAt));

  const getBoxStatus = (msg: Message): BoxStatus => {
    if (msg.opened) return 'opened';
    if (hasOpenedToday) return 'locked';
    return 'available';
  };

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Syncing React state from localStorage (an external store), guarded to client-only via this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(true);

    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages?year=' + new Date().getFullYear());
        const data = await response.json();
        setMessages(data.messages || []);
        setOpenedBoxes(data.openedBoxes || []);
      } catch (error) {
        console.error('Error fetching messages:', error);
        setStatusMessage('Failed to load boxes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [router]);

  const handleOpenBox = async (msg: Message) => {
    setStatusMessage('');
    setOpeningId(msg.id);

    try {
      const response = await fetch('/api/messages/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatusMessage(data.error || 'Failed to open box');
        setOpeningId(null);
        return;
      }

      const openedAt = new Date().toISOString();

      setTimeout(() => {
        setOpenedBoxes((prev) => [...prev, { messageId: msg.id, openedAt }]);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, opened: true, openedAt } : m))
        );
        setSelectedMessage({ ...msg, opened: true, openedAt });
        setOpeningId(null);
      }, 500);
    } catch (error) {
      console.error('Error opening box:', error);
      setStatusMessage('Failed to open box');
      setOpeningId(null);
    }
  };

  const handleTileClick = (msg: Message) => {
    const status = getBoxStatus(msg);
    if (status === 'opened') {
      setSelectedMessage(msg);
    } else if (status === 'available') {
      handleOpenBox(msg);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-linear-to-br from-pink-50 to-red-50">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="text-4xl">💝</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-red-50">
      <Navigation />

      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 md:pt-12 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 md:mb-14"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-pink-500 mb-4">
            I love you for...
          </h1>
          <p className="text-gray-700 text-lg">
            {hasOpenedToday
              ? "You've opened today's box — come back tomorrow for another ✨"
              : 'Open one box today to discover a new reason ✨'}
          </p>
        </motion.div>

        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-10 md:p-16 text-center text-gray-600 mb-12"
          >
            <div className="text-5xl mb-4">💌</div>
            <p className="text-lg">No boxes yet — check back soon!</p>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3 sm:gap-4 mb-12"
          >
            {messages.map((msg) => (
              <BoxTile
                key={msg.id}
                msg={msg}
                status={getBoxStatus(msg)}
                isOpening={openingId === msg.id}
                onClick={() => handleTileClick(msg)}
              />
            ))}
          </motion.div>
        )}

        {/* Modal for opened message */}
        <AnimatePresence>
          {selectedMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedMessage(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotateX: 90 }}
                animate={{ scale: 1, opacity: 1, rotateX: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.4 }}
                onClick={(e) => e.stopPropagation()}
                className="backdrop-blur-xl bg-white/95 border border-white/40 rounded-3xl p-8 md:p-12 shadow-2xl max-w-md w-full"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="text-center">
                    <div className="text-6xl mb-6">💝</div>

                    <h2 className="text-3xl font-bold text-rose-600 mb-6">
                      Day {selectedMessage.dayNumber}
                    </h2>

                    <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                      I love you for...
                      <br />
                      <span className="text-2xl font-semibold text-pink-600 block mt-4">
                        {selectedMessage.content}
                      </span>
                    </p>

                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedMessage(null)}
                      className="px-8 py-3 bg-linear-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg transition"
                    >
                      Close
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info message */}
        <AnimatePresence>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg text-center mb-8"
            >
              {statusMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-6 md:p-8"
        >
          <h3 className="font-bold text-gray-700 mb-4">How it works:</h3>
          <ul className="space-y-2 text-gray-600 text-sm md:text-base">
            <li>🎁 <span className="font-semibold">Available:</span> You can open one box today, any box you like</li>
            <li>🔒 <span className="font-semibold">Locked:</span> You&apos;ve already opened a box today — come back tomorrow!</li>
            <li>💌 <span className="font-semibold">Opened:</span> Tap it anytime to read it again</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
