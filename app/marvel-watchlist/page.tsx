// app/marvel-watchlist/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navigation from '@/components/Navigation';
import LoadingScreen from '@/components/LoadingScreen';
import MarvelMultiverseWatchlist from '@/components/MarvelMultiverseWatchlist';

export default function MarvelWatchlistPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      router.push('/login');
      return;
    }
    // Syncing React state from localStorage (an external store), guarded to client-only via this effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsAuthenticated(true);
  }, [router]);

  if (!isAuthenticated) {
    return <LoadingScreen icon="🦸" />;
  }

  return (
    <div className="min-h-screen bg-[#0b0c10]">
      <Navigation />
      <main className="px-4 py-10 sm:px-8">
        <MarvelMultiverseWatchlist />
      </main>
    </div>
  );
}
