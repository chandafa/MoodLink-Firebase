
'use client';
import { useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { useNotifications } from '@/hooks/use-notifications';
import { useJournal } from '@/hooks/use-journal';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { ScrollArea } from './ui/scroll-area';

type NotificationBellProps = {
    onSelectEntry: (id: string | null) => void;
};

const NotificationIcon = ({ type }: { type: string }) => {
    switch (type) {
        case 'like':
            return <Heart className="h-4 w-4 text-red-500" />;
        case 'comment':
            return <MessageCircle className="h-4 w-4 text-blue-500" />;
        case 'follow':
            return <UserPlus className="h-4 w-4 text-green-500" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

export function NotificationBell({ onSelectEntry }: NotificationBellProps) {
    const { currentUser } = useJournal();
    const { notifications, unreadCount, markNotificationsAsRead } = useNotifications(currentUser?.id || null);

    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && unreadCount > 0) {
            markNotificationsAsRead();
        }
    };

    const handleNotificationClick = (journalId: string | undefined) => {
        if (journalId) {
            onSelectEntry(journalId);
        }
    };

    const getNotificationMessage = (notification: any) => {
        const actorName = <span className="font-bold">{notification.actorName}</span>;
        switch (notification.type) {
            case 'like':
                return <>{actorName} menyukai postingan Anda: "{notification.journalContent?.substring(0, 20)}..."</>;
            case 'comment':
                return <>{actorName} mengomentari postingan Anda: "{notification.journalContent?.substring(0, 20)}..."</>;
            case 'follow':
                return <>{actorName} mulai mengikuti Anda.</>;
            default:
                return "Notifikasi baru.";
        }
    };

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                            {unreadCount}
                        </div>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>Notifikasi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <ScrollArea className="h-96">
                    {notifications.length === 0 ? (
                        <DropdownMenuItem disabled>Tidak ada notifikasi baru.</DropdownMenuItem>
                    ) : (
                        notifications.map(notif => (
                            <DropdownMenuItem
                                key={notif.id}
                                className={cn(
                                    "flex items-start gap-3 whitespace-normal h-auto py-2",
                                    !notif.isRead && "bg-accent"
                                )}
                                onClick={() => handleNotificationClick(notif.journalId)}
                                disabled={!notif.journalId}
                            >
                                <NotificationIcon type={notif.type} />
                                <div className="flex-1">
                                    <p className="text-sm">{getNotificationMessage(notif)}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: id })}
                                    </p>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
