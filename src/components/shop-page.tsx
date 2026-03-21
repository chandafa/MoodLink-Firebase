
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

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Store className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Toko Atribut
        </h1>
      </header>
      
      <Card>
        <CardHeader>
            <CardTitle>Gelar Profil</CardTitle>
            <CardDescription>Beli gelar untuk ditampilkan di sebelah nama Anda. Pamerkan pencapaian Anda!</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {titleItems.map((item) => {
                        const isOwned = currentUser?.unlockedTitles?.includes(item.id);
                        const canAfford = currentUser && currentUser.points >= item.price;
                        const isPurchasing = purchasingId === item.id;

                        return (
                            <Card key={item.id} className={cn("flex flex-col text-center items-center justify-center p-4", isOwned && "bg-accent/50")}>
                                <h3 className="text-lg font-bold">{item.icon} {item.name}</h3>
                                <p className="text-sm text-muted-foreground my-2">{item.description}</p>
                                <div className="flex items-center gap-2 font-bold text-primary my-2">
                                    <Gem className="h-4 w-4" />
                                    <span>{item.price}</span>
                                </div>
                                <Button 
                                    onClick={() => handlePurchase(item)}
                                    disabled={isOwned || !canAfford || isPurchasing} 
                                    className="w-full mt-auto"
                                >
                                    {isPurchasing ? <LoaderCircle className="animate-spin" /> : isOwned ? 'Dimiliki' : 'Beli'}
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
