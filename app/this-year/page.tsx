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

export default function ThisYearPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [openedBoxes, setOpenedBoxes] = useState<OpenedBox[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [message, setMessage] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  const getTodayDayNumber = (): number => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const canOpenBox = (message: Message): boolean => {
    if (message.opened) return false;

    const opened = openedBoxes.find((box) => box.messageId === message.id);
    if (opened) return false;

    const today = getTodayDayNumber();
    return message.dayNumber <= today;
  };

  const getBoxStatus = (message: Message): 'locked' | 'available' | 'opened' => {
    if (message.opened) return 'opened';

    const today = getTodayDayNumber();
    if (message.dayNumber > today) return 'locked';

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
        setMessage('Failed to load boxes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [router]);

  const handleOpenBox = async (msg: Message) => {
    if (!canOpenBox(msg)) return;

    try {
      const response = await fetch('/api/messages/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: msg.id }),
      });

      if (response.ok) {
        setFlippedCards((prev) => new Set([...prev, msg.id]));
        setSelectedMessage(msg);

        setOpenedBoxes((prev) => [
          ...prev,
          {
            messageId: msg.id,
            openedAt: new Date().toISOString(),
          },
        ]);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === msg.id ? { ...m, opened: true } : m
          )
        );
      }
    } catch (error) {
      console.error('Error opening box:', error);
      setMessage('Failed to open box');
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

      <div className="max-w-6xl mx-auto px-4 pt-8 pb-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-pink-500 mb-4">
            I love you for...
          </h1>
          <p className="text-gray-700 text-lg">
            Open one box per day to discover new reasons ✨
          </p>
        </motion.div>

        {/* Grid of Boxes */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-12"
        >
          {messages.map((msg) => {
            const status = getBoxStatus(msg);
            const isFlipped = flippedCards.has(msg.id);

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (msg.dayNumber - 1) * 0.02 }}
              >
                <motion.button
                  onClick={() => handleOpenBox(msg)}
                  disabled={!canOpenBox(msg)}
                  whileHover={canOpenBox(msg) ? { scale: 1.1 } : {}}
                  whileTap={canOpenBox(msg) ? { scale: 0.95 } : {}}
                  animate={isFlipped ? { rotateY: 180 } : { rotateY: 0 }}
                  transition={{ duration: 0.6 }}
                  style={{
                    perspective: '1000px',
                    transformStyle: 'preserve-3d',
                  } as React.CSSProperties}
                  className={`
                    relative w-full aspect-square rounded-xl font-bold text-sm
                    transition-all duration-300 flex items-center justify-center
                    ${
                      status === 'opened'
                        ? 'bg-linear-to-br from-rose-300 to-pink-300 cursor-default shadow-lg'
                        : status === 'available'
                        ? 'bg-linear-to-br from-rose-400 to-pink-400 cursor-pointer shadow-lg hover:shadow-xl'
                        : 'bg-gray-300 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  {status === 'opened' || isFlipped ? (
                    <div className="text-white text-center px-2 text-xs leading-tight">
                      ✓
                    </div>
                  ) : (
                    <div className="text-3xl">
                      {status === 'available' ? '🎁' : '🔒'}
                    </div>
                  )}
                  <div className="absolute bottom-1 right-1 text-white text-xs font-bold">
                    {msg.dayNumber}
                  </div>
                </motion.button>
              </motion.div>
            );
          })}
        </motion.div>

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
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-100 border border-rose-300 text-rose-700 px-4 py-3 rounded-lg text-center"
          >
            {message}
          </motion.div>
        )}

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 backdrop-blur-xl bg-white/40 border border-white/60 rounded-2xl p-6"
        >
          <h3 className="font-bold text-gray-700 mb-4">How it works:</h3>
          <ul className="space-y-2 text-gray-600 text-sm md:text-base">
            <li>🎁 <span className="font-semibold">Available:</span> You can open this box today</li>
            <li>🔒 <span className="font-semibold">Locked:</span> This box will be available in the future</li>
            <li>✓ <span className="font-semibold">Opened:</span> You&apos;ve already opened this box</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
