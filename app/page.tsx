// app/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Navigation from '@/components/Navigation';

const calculateDaysTogether = (anniversaryDate: Date): number => {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - anniversaryDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function DashboardPage() {
  const [daysTogether, setDaysTogether] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Syncing React state from localStorage (an external store), guarded to client-only via this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(true);

    // Fetch anniversary date
    const fetchAnniversaryDate = async () => {
      try {
        const response = await fetch('/api/anniversary');
        const data = await response.json();
        if (data.date) {
          const daysCount = calculateDaysTogether(new Date(data.date));
          setDaysTogether(daysCount);
        }
      } catch (error) {
        console.error('Error fetching anniversary date:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnniversaryDate();
  }, [router]);

  if (!isAuthenticated || isLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-linear-to-br from-pink-50 to-red-50">
        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="text-4xl">❤️</div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-red-50">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 pt-8 pb-20">
        {/* Main Counter */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="mt-8"
        >
          <div className="relative">
            {/* Background glow */}
            <div className="absolute inset-0 bg-linear-to-r from-rose-400 to-pink-400 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>

            {/* Card */}
            <div className="relative backdrop-blur-xl bg-white/40 border border-white/60 rounded-3xl p-8 md:p-12 shadow-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-center"
              >
                <p className="text-gray-600 text-lg md:text-xl mb-4">
                  We have been together for
                </p>

                <motion.h1
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 100 }}
                  className="text-7xl md:text-8xl font-bold text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-pink-500 mb-4"
                >
                  {daysTogether}
                </motion.h1>

                <p className="text-gray-700 text-xl md:text-2xl font-semibold">
                  {daysTogether === 1 ? 'day' : 'days'}
                </p>

                {/* Decorative hearts */}
                <div className="flex justify-center gap-4 mt-8">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      animate={{ y: [0, -10, 0] }}
                      transition={{
                        duration: 2,
                        delay: i * 0.2,
                        repeat: Infinity,
                      }}
                      className="text-4xl"
                    >
                      ❤️
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12"
        >
          {/* This Year's Feature */}
          <motion.a
            href="/this-year"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group relative backdrop-blur-xl bg-linear-to-br from-rose-200/40 to-pink-200/40 border border-white/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition cursor-pointer"
          >
            <div className="text-4xl mb-4">💝</div>
            <h3 className="text-xl font-bold text-rose-600 mb-2">
              I love you for...
            </h3>
            <p className="text-gray-700 text-sm">
              Open one box per day and discover reasons why I love you
            </p>
            <div className="mt-4 text-rose-500 group-hover:translate-x-2 transition transform">
              →
            </div>
          </motion.a>

          {/* More Features Coming */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="group relative backdrop-blur-xl bg-linear-to-br from-purple-200/40 to-pink-200/40 border border-white/40 rounded-2xl p-6 shadow-lg cursor-not-allowed opacity-60"
          >
            <div className="text-4xl mb-4">✨</div>
            <h3 className="text-xl font-bold text-gray-600 mb-2">
              Coming Soon...
            </h3>
            <p className="text-gray-600 text-sm">
              More magical features coming in future years
            </p>
          </motion.div>
        </motion.div>

        {/* Footer message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="text-center mt-12 text-gray-600"
        >
          <p className="text-sm md:text-base">
            Built with ❤️ for someone special
          </p>
        </motion.div>
      </div>
    </div>
  );
}
