
'use client';

import { Store, Gem, LoaderCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { useShopItems } from '@/hooks/use-shop';
import { useJournal } from '@/hooks/use-journal';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

export function ShopPage() {
  const { shopItems, isLoading } = useShopItems();
  const { currentUser, purchaseItem } = useJournal();
  const { toast } = useToast();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const handlePurchase = async (item) => {
    if (!currentUser) {
        toast({ title: 'Harus Masuk', description: 'Anda harus masuk untuk membeli item.', variant: 'destructive'});
        return;
    }
    setPurchasingId(item.id);
    try {
        await purchaseItem(item);
    } catch (error) {
        console.error("Purchase failed", error);
    } finally {
        setPurchasingId(null);
    }
  }

  const titleItems = shopItems.filter(item => item.type === 'title');
  const badgeItems = shopItems.filter(item => item.type === 'badge');

  const renderShopSection = (title: string, description: string, items: any[], ownedCheck: (item: any) => boolean) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {items.map((item) => {
                            const isOwned = ownedCheck(item);
                            const canAfford = currentUser && currentUser.points >= item.price;
                            const isPurchasing = purchasingId === item.id;

                            return (
                                <Card key={item.id} className={cn("flex flex-col", isOwned && "bg-accent/50")}>
                                    <CardHeader className="items-center text-center">
                                        {item.type === 'badge' && item.icon && <span className="text-4xl mb-2">{item.icon}</span>}
                                        <CardTitle className="text-base">{item.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex-1 text-center px-4">
                                        <p className="text-xs text-muted-foreground mb-4 h-10">{item.description}</p>
                                        <div className="flex items-center justify-center gap-2 font-bold text-primary">
                                            <Gem className="h-4 w-4" />
                                            <span>{item.price}</span>
                                        </div>
                                    </CardContent>
                                    <CardFooter className="p-4">
                                        <Button
                                            onClick={() => handlePurchase(item)}
                                            disabled={isOwned || !canAfford || isPurchasing}
                                            className="w-full"
                                        >
                                            {isPurchasing ? <LoaderCircle className="animate-spin" /> : isOwned ? 'Dimiliki' : 'Beli'}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <header className="flex items-center gap-3">
        <Store className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Toko Atribut
        </h1>
      </header>
      
      {renderShopSection(
        "Gelar Profil",
        "Beli gelar untuk ditampilkan di sebelah nama Anda. Pamerkan pencapaian Anda!",
        titleItems,
        (item) => (currentUser?.unlockedTitles || []).includes(item.id)
      )}

      {renderShopSection(
        "Lencana Profil",
        "Beli lencana untuk ditampilkan di sebelah nama Anda.",
        badgeItems,
        (item) => (currentUser?.unlockedBadges || []).includes(item.id)
      )}
    </div>
  );
}
