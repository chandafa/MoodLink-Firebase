
'use client';
import { Bell, Heart, MessageCircle, UserPlus, ArrowLeft, CornerUpLeft } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useJournal } from '@/hooks/use-journal';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Icons } from './icons';
import { useEffect } from 'react';

type NotificationListPageProps = {
    onSelectEntry: (id: string | null) => void;
};

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'like':
            return <div className="h-10 w-10 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900/50"><Heart className="h-5 w-5 text-red-500" /></div>;
        case 'comment':
            return <div className="h-10 w-10 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50"><MessageCircle className="h-5 w-5 text-blue-500" /></div>;
        case 'follow':
            return <div className="h-10 w-10 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900/50"><UserPlus className="h-5 w-5 text-green-500" /></div>;
        case 'reply':
            return <div className="h-10 w-10 rounded-full flex items-center justify-center bg-purple-100 dark:bg-purple-900/50"><CornerUpLeft className="h-5 w-5 text-purple-500" /></div>;
        default:
            return <div className="h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-900/50"><Bell className="h-5 w-5" /></div>;
    }
};

export function NotificationListPage({ onSelectEntry }: NotificationListPageProps) {
    const { currentUser } = useJournal();
    const { notifications, isLoading, markNotificationsAsRead } = useNotifications(currentUser?.id || null);
    
    useEffect(() => {
        // Mark notifications as read when the component mounts/becomes visible
        // We add a small delay to avoid marking as read on a quick tab switch
        const timer = setTimeout(() => {
            if (notifications.some(n => !n.isRead)) {
                markNotificationsAsRead();
            }
        }, 2000);

        return () => clearTimeout(timer);
    }, [notifications, markNotificationsAsRead]);

    const handleNotificationClick = (journalId: string | undefined) => {
        if (journalId) {
            onSelectEntry(journalId);
        }
    };

    const getNotificationMessage = (notification: any) => {
        const actorName = <span className="font-bold">{notification.actorName}</span>;
        switch (notification.type) {
            case 'like':
                return <p className="leading-relaxed">{actorName} menyukai postingan Anda: <span className="italic text-muted-foreground">"{notification.journalContent?.substring(0, 40)}..."</span></p>;
            case 'comment':
                return <p className="leading-relaxed">{actorName} mengomentari postingan Anda: <span className="italic text-muted-foreground">"{notification.journalContent?.substring(0, 40)}..."</span></p>;
            case 'follow':
                return <p className="leading-relaxed">{actorName} mulai mengikuti Anda.</p>;
            case 'reply':
                return <p className="leading-relaxed">{actorName} membalas komentar Anda di postingan: <span className="italic text-muted-foreground">"{notification.journalContent?.substring(0, 40)}..."</span></p>;
            default:
                return <p>Notifikasi baru.</p>;
        }
    };
    
    if (isLoading) {
        return (
            <div className="container mx-auto py-8 px-4">
                 <header className="flex items-center gap-3 mb-8">
                    <Bell className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold font-headline text-foreground">
                        Notifikasi
                    </h1>
                 </header>
                 <div className="space-y-4">
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-[250px]" />
                                <Skeleton className="h-4 w-[200px]" />
                            </div>
                        </div>
                    ))}
                 </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <header className="flex items-center gap-3 mb-8">
                <Bell className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold font-headline text-foreground">
                    Notifikasi
                </h1>
            </header>
            <Card>
                <CardContent className="p-0">
                    <ul className="divide-y divide-border">
                        {notifications.length === 0 ? (
                           <li className="p-8 text-center text-muted-foreground">
                                Tidak ada notifikasi.
                           </li>
                        ) : (
                            notifications.map(notif => (
                                <li
                                    key={notif.id}
                                    className={cn(
                                        "p-4 flex items-start gap-4 transition-colors relative",
                                        notif.journalId ? "cursor-pointer hover:bg-accent" : "cursor-default"
                                    )}
                                    onClick={() => handleNotificationClick(notif.journalId)}
                                >
                                    {!notif.isRead && <div className="absolute top-4 left-1 h-2.5 w-2.5 rounded-full bg-primary"></div>}
                                    <div className="pl-5">
                                        <NotificationIcon type={notif.type} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="text-sm">{getNotificationMessage(notif)}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: id })}
                                        </p>
                                    </div>
                                </li>
                            ))
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
