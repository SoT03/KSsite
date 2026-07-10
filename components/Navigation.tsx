// components/Navigation.tsx

'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Navigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [showMenu, setShowMenu] = useState(false);
  const userRole = typeof window !== 'undefined' ? localStorage.getItem('user_role') : null;

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;

  const navItems = [
    { href: '/', label: 'Home', icon: '❤️' },
    { href: '/this-year', label: 'Love Letters', icon: '💝' },
    ...(userRole === 'admin' ? [{ href: '/admin', label: 'Admin', icon: '⚙️' }] : []),
  ];

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="backdrop-blur-xl bg-white/30 border-b border-white/40 sticky top-0 z-40 shadow-lg"
    >
      <div className="max-w-6xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <motion.a
            href="/"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-500"
          >
            Our Love 💕
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg transition
                  ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-white/20'
                  }
                `}
              >
                <span>{item.icon}</span>
                {item.label}
              </motion.a>
            ))}

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="px-4 py-2 text-gray-700 hover:bg-red-100 rounded-lg transition"
            >
              🚪 Logout
            </motion.button>
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowMenu(!showMenu)}
            className="md:hidden text-2xl"
          >
            {showMenu ? '✕' : '☰'}
          </motion.button>
        </div>

        {/* Mobile Navigation */}
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden mt-4 space-y-2 pt-4 border-t border-white/40"
          >
            {navItems.map((item) => (
              <motion.a
                key={item.href}
                href={item.href}
                onClick={() => setShowMenu(false)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  block w-full px-4 py-3 rounded-lg transition
                  ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                      : 'text-gray-700 hover:bg-white/20'
                  }
                `}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </motion.a>
            ))}

            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                handleLogout();
                setShowMenu(false);
              }}
              className="block w-full px-4 py-3 text-left text-gray-700 hover:bg-red-100 rounded-lg transition"
            >
              🚪 Logout
            </motion.button>
          </motion.div>
        )}
      </div>
    </motion.nav>
  );
}
