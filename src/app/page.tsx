'use client';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { JournalApp } from '@/components/journal-app';
import { HelpChatbot } from '@/components/help-chatbot';
import { BottomNav } from '@/components/bottom-nav';
import { Icons } from '@/components/icons';
import ChatPage from '@/components/chat-page';
import ProfilePage from '@/components/profile-page';
import SettingsPage from '@/components/settings-page';
import { JournalListPage } from '@/components/journal-list-page';

function SplashScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
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
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectEntry = (id: string | null) => {
    setSelectedEntryId(id);
    setIsEditing(true);
  };
  
  const handleBackToList = () => {
    setIsEditing(false);
    setSelectedEntryId(null);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Home':
        if(isEditing){
          return <JournalApp selectedEntryId={selectedEntryId} onBack={handleBackToList} setSelectedEntryId={setSelectedEntryId} />;
        }
        return <JournalListPage onSelectEntry={handleSelectEntry} />;
      case 'Chat':
        return <ChatPage />;
      case 'Profile':
        return <ProfilePage />;
      case 'Settings':
        return <SettingsPage />;
      default:
        return <JournalListPage onSelectEntry={handleSelectEntry} />;
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
          {activeTab !== 'Chat' && !isEditing && <HelpChatbot />}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
