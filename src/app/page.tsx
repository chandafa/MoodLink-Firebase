

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
import { PostType, User, useJournal } from '@/hooks/use-journal';
import PublicProfilePage from '@/components/public-profile-page';
import PrivateChatPage from '@/components/private-chat-page';
import { NotificationListPage } from '@/components/notification-list-page';
import { BookmarkPage } from '@/components/bookmark-page';
import { ExplorePage } from '@/components/explore-page';
import HashtagPage from '@/components/hashtag-page';
import { ImageViewer } from '@/components/image-viewer';
import { Button } from '@/components/ui/button';
import { ShieldCheck, FilePlus, BookText, Vote, Hourglass, LoaderCircle } from 'lucide-react';


function OnboardingScreen({ onLogin, onGuest }: { onLogin: () => void; onGuest: () => void; }) {
  return (
    <motion.div
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50 p-8 text-center"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.8 }}
      >
        <Icons.logo className="h-24 w-24 text-primary mx-auto" />
      </motion.div>
      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="text-4xl font-bold mt-6"
      >
        Selamat Datang di MoodLink
      </motion.h1>
      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.8 }}
        className="text-muted-foreground mt-4 max-w-md mx-auto"
      >
        Jaga datamu tetap aman dengan masuk. Kami menjamin privasi dan semua postingan publikmu akan tetap anonim.
      </motion.p>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 mt-8 w-full max-w-sm"
      >
        <Button onClick={onLogin} size="lg" className="w-full">Masuk dengan Google</Button>
        <Button onClick={onGuest} size="lg" variant="outline" className="w-full">Lanjutkan sebagai Tamu</Button>
      </motion.div>
       <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.1, duration: 0.8 }}
        className="flex items-center gap-2 mt-8 text-sm text-muted-foreground"
      >
        <ShieldCheck className="h-4 w-4 text-green-500" />
        <span>Privasi Anda adalah prioritas kami.</span>
      </motion.div>
    </motion.div>
  );
}

function LoadingScreen() {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
            <LoaderCircle className="h-12 w-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">Memuat data...</p>
        </div>
    );
}

export default function Home() {
  const { isLoaded, isAnonymous, linkWithGoogle } = useJournal();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newPostType, setNewPostType] = useState<PostType>('journal');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [chattingWith, setChattingWith] = useState<User | null>(null);
  const [settingsView, setSettingsView] = useState<'main' | 'bookmarks'>('main');
  const [viewingHashtag, setViewingHashtag] = useState<string | null>(null);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isLoaded) {
      setIsLoading(false); // Hide main loading screen
      if (isAnonymous) {
        const lastShown = localStorage.getItem('onboardingLastShown');
        const today = new Date().toDateString();
        if (lastShown !== today) {
          setShowOnboarding(true);
        } else {
          setShowOnboarding(false);
        }
      } else {
        // User is logged in, never show onboarding
        setShowOnboarding(false);
      }
    }
  }, [isLoaded, isAnonymous]);
  
  useEffect(() => {
    if (activeTab !== 'Settings') {
        setSettingsView('main');
    }
  }, [activeTab]);

  const handleLogin = async () => {
    const success = await linkWithGoogle();
    if (success) {
      setShowOnboarding(false);
    }
  };

  const handleGuest = () => {
    const today = new Date().toDateString();
    localStorage.setItem('onboardingLastShown', today);
    setShowOnboarding(false);
  };

  const resetViews = () => {
    setIsEditing(false);
    setSelectedEntryId(null);
    setViewingProfileId(null);
    setChattingWith(null);
    setViewingHashtag(null);
  }

  const handleSelectEntry = (id: string | null) => {
    resetViews();
    setSelectedEntryId(id);
    setIsEditing(true);
    if (id === null) {
      setNewPostType('journal');
    }
  };

  const handleNewPost = (type: PostType) => {
    resetViews();
    setNewPostType(type);
    setSelectedEntryId(null);
    setIsEditing(true);
  }
  
  const handleBackToList = () => {
    resetViews();
  };
  
  const handleViewProfile = (userId: string) => {
    resetViews();
    setViewingProfileId(userId);
  };

  const handleStartChat = (user: User) => {
    resetViews();
    setChattingWith(user);
  }

  const handleViewHashtag = (tag: string) => {
    resetViews();
    setViewingHashtag(tag);
  }
  
  const handleViewImage = (url: string) => {
    setViewingImageUrl(url);
  }

  const renderContent = () => {
    if (chattingWith) {
      return <PrivateChatPage targetUser={chattingWith} onBack={handleBackToList} />
    }
    if (viewingProfileId) {
      return <PublicProfilePage userId={viewingProfileId} onBack={handleBackToList} onSelectEntry={handleSelectEntry} onStartChat={handleStartChat} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage} />;
    }
    if (isEditing) {
      return <JournalApp selectedEntryId={selectedEntryId} onBack={handleBackToList} setSelectedEntryId={setSelectedEntryId} newPostType={newPostType} onViewProfile={handleViewProfile} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage} />;
    }
    if (viewingHashtag) {
        return <HashtagPage hashtag={viewingHashtag} onBack={handleBackToList} onSelectEntry={handleSelectEntry} onViewImage={handleViewImage} />;
    }

    switch (activeTab) {
      case 'Home':
        return <JournalListPage onSelectEntry={handleSelectEntry} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage} />;
      case 'Explore':
        return <ExplorePage onViewHashtag={handleViewHashtag} />;
      case 'Pesan':
        return <MessagesPage onStartChat={handleStartChat} />;
      case 'Profile':
        return <ProfilePage onSelectEntry={handleSelectEntry} />;
      case 'Notifikasi':
        return <NotificationListPage onSelectEntry={handleSelectEntry} />;
      case 'Settings':
        if (settingsView === 'bookmarks') {
            return <BookmarkPage onSelectEntry={handleSelectEntry} onBack={() => setSettingsView('main')} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage}/>;
        }
        return <SettingsPage onNavigate={setSettingsView} />;
      default:
        return <JournalListPage onSelectEntry={handleSelectEntry} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage}/>;
    }
  };


  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingScreen />}
      </AnimatePresence>
      <AnimatePresence>
        {showOnboarding && <OnboardingScreen onLogin={handleLogin} onGuest={handleGuest} />}
      </AnimatePresence>
      <AnimatePresence>
      {!isLoading && !showOnboarding && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col h-screen"
        >
          {viewingImageUrl && <ImageViewer imageUrl={viewingImageUrl} onClose={() => setViewingImageUrl(null)} />}
          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {renderContent()}
          </div>
          
          {activeTab === 'Home' && !isEditing && !viewingProfileId && !chattingWith && !viewingHashtag && (
            <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 z-20">
               <Button size="icon" className="rounded-full h-16 w-16 shadow-lg" onClick={() => handleNewPost('journal')}>
                  <FilePlus className="h-8 w-8" />
               </Button>
            </div>
          )}

          {activeTab !== 'Pesan' && !isEditing && !viewingProfileId && !chattingWith && <HelpChatbot />}
          <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
        </motion.div>
      )}
      </AnimatePresence>
    </>
  );
}
