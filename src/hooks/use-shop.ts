
'use client';

import { useState, useEffect } from 'react';
import type { ShopItem } from '@/lib/types';
import { Crown, Sparkles } from 'lucide-react';

// For now, we'll use a hardcoded list.
// In a real app, this would fetch from Firestore.
const staticShopItems: ShopItem[] = [
    // Titles (no icons)
    { id: 'default', name: 'Warga', description: 'Gelar standar untuk semua.', price: 0, type: 'title' },
    { id: 'pioneer', name: 'Pionir', description: 'Diberikan untuk 10 pengguna pertama.', price: 0, type: 'title' },
    { id: 'contributor', name: 'Kontributor', description: 'Sering berbagi cerita dan ide.', price: 100, type: 'title' },
    { id: 'explorer', name: 'Penjelajah', description: 'Dilihat 5+ profil pengguna lain.', price: 120, type: 'title' },
    { id: 'novelist', name: 'Novelis', description: 'Telah menulis lebih dari 20 jurnal.', price: 150, type: 'title' },
    { id: 'collector', name: 'Kolektor', description: 'Membuat 3+ koleksi jurnal.', price: 180, type: 'title' },
    { id: 'philosopher', name: 'Filosof', description: 'Membuat 5+ postingan polling/kuis.', price: 200, type: 'title' },
    { id: 'socialite', name: 'Sosialita', description: 'Memiliki 10+ pengikut.', price: 220, type: 'title' },
    { id: 'mastermind', name: 'Mastermind', description: 'Aktif membuat polling dan kuis.', price: 250, type: 'title' },
    { id: 'enlightener', name: 'Pencerah', description: 'Memberi 25+ komentar bermanfaat.', price: 300, type: 'title' },
    { id: 'visionary', name: 'Visioner', description: 'Meraih 500+ total poin.', price: 500, type: 'title' },
    { id: 'legend', name: 'Legenda', description: 'Meraih 1000+ total poin.', price: 1000, type: 'title' },

    // Badges (with icons)
    { id: 'night_owl', name: 'Burung Hantu', description: 'Aktif di malam hari (setelah jam 10 malam).', price: 100, type: 'badge', icon: '🦉' },
    { id: 'early_bird', name: 'Bangun Pagi', description: 'Aktif di pagi hari (sebelum jam 8 pagi).', price: 100, type: 'badge', icon: '☀️' },
    { id: 'supporter', name: 'Pendukung', description: 'Menunjukkan dukungan untuk MoodLink.', price: 200, type: 'badge', icon: '💖' },
    { id: 'artist', name: 'Seniman', description: 'Membuat 3+ postingan kanvas bersama.', price: 250, type: 'badge', icon: '🎨' },
    { id: 'pen_sword', name: 'Pena & Pedang', description: 'Menulis 10+ jurnal dan memberi 10+ komentar.', price: 350, type: 'badge', icon: '✍️' },
    { id: 'shooting_star', name: 'Bintang Jatuh', description: 'Login 7 hari berturut-turut.', price: 400, type: 'badge', icon: '🌠' },
    { id: 'influencer', name: 'Influencer', description: 'Memiliki lebih dari 20 pengikut.', price: 500, type: 'badge', icon: '🔥' },
    { id: 'gem', name: 'Permata', description: 'Postingan mencapai 50+ suka.', price: 750, type: 'badge', icon: '💎' },
    { id: 'verified', name: 'Terverifikasi', description: 'Tanda centang biru yang keren.', price: 1500, type: 'badge', icon: '✔️' },
    { id: 'crown', name: 'Mahkota Raja', description: 'Meraih #1 di Papan Peringkat.', price: 2000, type: 'badge', icon: '👑' },
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
