// components/Navigation.tsx

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import NavCat from '@/components/NavCat';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [itemCenters, setItemCenters] = useState<number[]>([]);
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/', label: 'Start', icon: '❤️' },
    { href: '/this-year', label: 'Listy miłosne', icon: '💝' },
    ...(userRole === 'admin' ? [{ href: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  useEffect(() => {
    const measure = () => {
      const track = trackRef.current;
      if (!track) return;
      const trackRect = track.getBoundingClientRect();
      setTrackWidth(trackRect.width);
      setItemCenters(
        itemRefs.current.map((el) => {
          if (!el) return 0;
          const r = el.getBoundingClientRect();
          return r.left + r.width / 2 - trackRect.left;
        })
      );
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [navItems.length]);

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="backdrop-blur-xl bg-white/40 border-b border-white/50 sticky top-0 z-40 shadow-[0_4px_24px_-8px_rgba(244,63,94,0.25)]"
    >
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-pink-500"
          >
            <motion.span
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="inline-block"
            >
              ❤️
            </motion.span>
            Nasza Miłość
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:block relative">
            <div ref={trackRef} className="flex items-center gap-1 bg-white/30 border border-white/40 rounded-full p-1">
              {navItems.map((item, index) => (
                <a
                  key={item.href}
                  ref={(el) => {
                    itemRefs.current[index] = el;
                  }}
                  href={item.href}
                  className="relative"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  {isActive(item.href) && (
                    <motion.span
                      layoutId="nav-active-pill"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                      className="absolute inset-0 bg-linear-to-r from-rose-500 to-pink-500 rounded-full shadow-md"
                    />
                  )}
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`
                      relative z-10 flex items-center gap-2 px-4 py-2 rounded-full transition-colors
                      ${isActive(item.href) ? 'text-white font-medium' : 'text-gray-700 hover:text-rose-600'}
                    `}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </motion.span>
                </a>
              ))}
            </div>
            <NavCat
              hoveredIndex={hoveredIndex}
              itemCenters={itemCenters}
              trackWidth={trackWidth}
            />
          </div>

          <div className="hidden md:block">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors"
            >
              🚪 Wyloguj się
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setShowMenu((v) => !v)}
            className="md:hidden text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/30 border border-white/40"
          >
            <motion.span
              animate={{ rotate: showMenu ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="inline-block"
            >
              {showMenu ? '✕' : '☰'}
            </motion.span>
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {showMenu && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="md:hidden overflow-hidden"
            >
              <div className="mt-4 space-y-2 pt-4 border-t border-white/40">
                {navItems.map((item) => (
                  <motion.a
                    key={item.href}
                    href={item.href}
                    onClick={() => setShowMenu(false)}
                    whileTap={{ scale: 0.97 }}
                    className={`
                      block w-full px-4 py-3 rounded-xl transition
                      ${
                        isActive(item.href)
                          ? 'bg-linear-to-r from-rose-500 to-pink-500 text-white shadow-md'
                          : 'text-gray-700 bg-white/30 hover:bg-white/50'
                      }
                    `}
                  >
                    <span className="mr-2">{item.icon}</span>
                    {item.label}
                  </motion.a>
                ))}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    handleLogout();
                    setShowMenu(false);
                  }}
                  className="block w-full px-4 py-3 text-left text-gray-700 bg-white/30 hover:bg-red-100 rounded-xl transition"
                >
                  🚪 Wyloguj się
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
