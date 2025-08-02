'use client';
import { Bell, Heart, MessageCircle, UserPlus, ArrowLeft } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { useJournal } from '@/hooks/use-journal';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Icons } from './icons';

type NotificationListPageProps = {
    onSelectEntry: (id: string | null) => void;
};

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'like':
            return <div className="h-8 w-8 rounded-full flex items-center justify-center bg-red-100 dark:bg-red-900"><Heart className="h-4 w-4 text-red-500" /></div>;
        case 'comment':
            return <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-100 dark:bg-blue-900"><MessageCircle className="h-4 w-4 text-blue-500" /></div>;
        case 'follow':
            return <div className="h-8 w-8 rounded-full flex items-center justify-center bg-green-100 dark:bg-green-900"><UserPlus className="h-4 w-4 text-green-500" /></div>;
        default:
            return <div className="h-8 w-8 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-900"><Bell className="h-4 w-4" /></div>;
    }
};

export function NotificationListPage({ onSelectEntry }: NotificationListPageProps) {
    const { currentUser } = useJournal();
    const { notifications, isLoading, markNotificationsAsRead } = useNotifications(currentUser?.id || null);

    const handleNotificationClick = (journalId: string | undefined) => {
        if (journalId) {
            onSelectEntry(journalId);
        }
        // Mark all as read when opening the page
        markNotificationsAsRead();
    };

    const getNotificationMessage = (notification: any) => {
        const actorName = <span className="font-bold">{notification.actorName}</span>;
        switch (notification.type) {
            case 'like':
                return <p>{actorName} menyukai postingan Anda: "{notification.journalContent?.substring(0, 30)}..."</p>;
            case 'comment':
                return <p>{actorName} mengomentari postingan Anda: "{notification.journalContent?.substring(0, 30)}..."</p>;
            case 'follow':
                return <p>{actorName} mulai mengikuti Anda.</p>;
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
                    <ul className="divide-y">
                        {notifications.length === 0 ? (
                           <li className="p-8 text-center text-muted-foreground">
                                Tidak ada notifikasi.
                           </li>
                        ) : (
                            notifications.map(notif => (
                                <li
                                    key={notif.id}
                                    className={cn(
                                        "p-4 flex items-start gap-4 transition-colors",
                                        !notif.isRead && "bg-accent/50",
                                        notif.journalId ? "cursor-pointer hover:bg-accent" : "cursor-default"
                                    )}
                                    onClick={() => handleNotificationClick(notif.journalId)}
                                >
                                    <NotificationIcon type={notif.type} />
                                    <div className="flex-1">
                                        <div className="text-sm">{getNotificationMessage(notif)}</div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: id })}
                                        </p>
                                    </div>
                                    {!notif.isRead && <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5"></div>}
                                </li>
                            ))
                        )}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
