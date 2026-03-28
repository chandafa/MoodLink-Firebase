
'use client';

import { useState, useEffect } from 'react';
import type { ShopItem } from '@/lib/types';
import { Crown, Sparkles } from 'lucide-react';

// For now, we'll use a hardcoded list.
// In a real app, this would fetch from Firestore.
const staticShopItems: ShopItem[] = [
    { id: 'default', name: 'Warga', description: 'Gelar standar untuk semua.', price: 0, type: 'title', icon: '👤' },
    { id: 'pioneer', name: 'Pionir', description: 'Untuk 10 pengguna pertama.', price: 0, type: 'title', icon: '🚀' },
    { id: 'contributor', name: 'Kontributor', description: 'Sering berbagi cerita.', price: 100, type: 'title', icon: '✍️' },
    { id: 'mastermind', name: 'Mastermind', description: 'Sering membuat kuis.', price: 250, type: 'title', icon: '🧠' },
    { id: 'visionary', name: 'Visioner', description: 'Punya 500+ poin.', price: 500, type: 'title', icon: '🌟' },
    { id: 'legend', name: 'Legenda', description: 'Punya 1000+ poin.', price: 1000, type: 'title', icon: '🏆' },
    { id: 'verified', name: 'Terverifikasi', description: 'Tanda centang biru keren.', price: 1000, type: 'badge', icon: '✔️' },
    { id: 'supporter', name: 'Pendukung', description: 'Menunjukkan dukungan untuk MoodLink.', price: 200, type: 'badge', icon: '💖' },
    { id: 'influencer', name: 'Influencer', description: 'Punya banyak pengikut.', price: 500, type: 'badge', icon: '🔥' },
];


export function useShopItems() {
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Create a map for quick lookups
  const titleMap = new Map<string, ShopItem>();
  const badgeMap = new Map<string, ShopItem>();

  shopItems.forEach(item => {
      if (item.type === 'title') {
          titleMap.set(item.id, item);
      }
      if (item.type === 'badge') {
          badgeMap.set(item.id, item);
      }
  });


  useEffect(() => {
    // Simulate fetching data
    setTimeout(() => {
        setShopItems(staticShopItems);
        setIsLoading(false);
    }, 500);
  }, []);

  return { shopItems, isLoading, titleMap, badgeMap };
}
