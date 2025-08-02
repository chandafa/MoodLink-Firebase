'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { JournalApp } from '@/components/journal-app';
import { HelpChatbot } from '@/components/help-chatbot';
import { BottomNav } from '@/components/bottom-nav';
import { Icons } from '@/components/icons';
import { MessagesPage } from '@/components/messages-page';
import ProfilePage from '@/components/profile-page';
import SettingsPage from '@/components/settings-page';
import { JournalListPage } from '@/components/journal-list-page';
import { PostType, User } from '@/hooks/use-journal';
import PublicProfilePage from '@/components/public-profile-page';
import PrivateChatPage from '@/components/private-chat-page';
import { NotificationListPage } from '@/components/notification-list-page';
import { BookmarkPage } from '@/components/bookmark-page';

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
      >
        <Icons.logo className="h-24 w-24 text-primary" />
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="text-3xl font-bold mt-4"
      >
        Welcome to MoodLink 👋
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="text-muted-foreground mt-2"
      >
        Find your peace, share your thoughts.
      </motion.p>
    </motion.div>
  );
}

export default function Home() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newPostType, setNewPostType] = useState<PostType>('journal');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [chattingWith, setChattingWith] = useState<User | null>(null);
  const [settingsView, setSettingsView] = useState<'main' | 'bookmarks'>('main');

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Reset settings view when changing tabs
    if (activeTab !== 'Settings') {
        setSettingsView('main');
    }
  }, [activeTab]);

  const handleSelectEntry = (id: string | null) => {
    setSelectedEntryId(id);
    setIsEditing(true);
    setViewingProfileId(null);
    setChattingWith(null);
    if (id === null) {
      setNewPostType('journal'); // Default for new post
    }
  };

  const handleNewPost = (type: PostType) => {
    setNewPostType(type);
    setSelectedEntryId(null);
    setIsEditing(true);
    setViewingProfileId(null);
    setChattingWith(null);
  }
  
  const handleBackToList = () => {
    setIsEditing(false);
    setSelectedEntryId(null);
    setViewingProfileId(null);
    setChattingWith(null);
  };
  
  const handleViewProfile = (userId: string) => {
    setViewingProfileId(userId);
    setIsEditing(false);
    setSelectedEntryId(null);
    setChattingWith(null);
  };

  const handleStartChat = (user: User) => {
    setChattingWith(user);
    setViewingProfileId(null);
    setIsEditing(false);
    setSelectedEntryId(null);
  }

  const renderContent = () => {
    if (chattingWith) {
      return <PrivateChatPage targetUser={chattingWith} onBack={handleBackToList} />
    }
    if (viewingProfileId) {
      return <PublicProfilePage userId={viewingProfileId} onBack={handleBackToList} onSelectEntry={handleSelectEntry} onStartChat={handleStartChat} />;
    }
    if (isEditing) {
      return <JournalApp selectedEntryId={selectedEntryId} onBack={handleBackToList} setSelectedEntryId={setSelectedEntryId} newPostType={newPostType} onViewProfile={handleViewProfile} />;
    }

    switch (activeTab) {
      case 'Home':
        return <JournalListPage onSelectEntry={handleSelectEntry} onNewPost={handleNewPost} />;
      case 'Pesan':
        return <MessagesPage onStartChat={handleStartChat} />;
      case 'Profile':
        return <ProfilePage onSelectEntry={handleSelectEntry} />;
      case 'Notifikasi':
        return <NotificationListPage onSelectEntry={handleSelectEntry} />;
      case 'Settings':
        if (settingsView === 'bookmarks') {
            return <BookmarkPage onSelectEntry={handleSelectEntry} onBack={() => setSettingsView('main')} />;
        }
        return <SettingsPage onNavigate={setSettingsView} />;
      default:
        return <JournalListPage onSelectEntry={handleSelectEntry} onNewPost={handleNewPost} />;
    }
  };


  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen />}
      </AnimatePresence>
      <AnimatePresence>
      {!showSplash && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-screen"
        >
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {renderContent()}
          </div>
          {activeTab !== 'Pesan' && !isEditing && !viewingProfileId && !chattingWith && <HelpChatbot />}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
