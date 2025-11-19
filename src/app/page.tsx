

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
import { PostType, User, JournalCollection, useJournal } from '@/hooks/use-journal';
import PublicProfilePage from '@/components/public-profile-page';
import PrivateChatPage from '@/components/private-chat-page';
import { NotificationListPage } from '@/components/notification-list-page';
import { ExplorePage } from '@/components/explore-page';
import HashtagPage from '@/components/hashtag-page';
import { ImageViewer } from '@/components/image-viewer';
import { Button } from '@/components/ui/button';
import { ShieldCheck, FilePlus, BookText, Vote, Hourglass, LoaderCircle, Target, Search } from 'lucide-react';
import { CollectionBuilderPage } from '@/components/collection-builder-page';
import { VirtualMascot } from '@/components/virtual-mascot';
import { DailyQuest } from '@/components/daily-quest';
import { Sidebar } from '@/components/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ThemeToggle } from '@/components/theme-toggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { DevTools } from '@/components/dev-tools';


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
        <Button onClick={onLogin} size="lg" className="w-full">Masuk dengan Email</Button>
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

function LoadingScreen({ text = "Memuat data..." }: { text?: string }) {
    return (
        <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
            <LoaderCircle className="h-12 w-12 text-primary animate-spin" />
            <p className="mt-4 text-muted-foreground">{text}</p>
        </div>
    );
}

export default function Home() {
  const { isLoaded, isAnonymous, currentUser, signOutUser } = useJournal();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Home');
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);
  const [newPostType, setNewPostType] = useState<PostType>('journal');
  const [isEditing, setIsEditing] = useState(false);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);
  const [chattingWith, setChattingWith] = useState<User | null>(null);
  const [viewingHashtag, setViewingHashtag] = useState<string | null>(null);
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null);
  const [isBuildingCollection, setIsBuildingCollection] = useState(false);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [showMascot, setShowMascot] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [avatarClickCount, setAvatarClickCount] = useState(0);
  const [showDevTools, setShowDevTools] = useState(false);


  useEffect(() => {
    if (isLoaded) {
      if (currentUser?.isBlocked) {
          // If user is blocked, we keep the loading screen up indefinitely.
          // The useJournal hook will stop fetching data.
          setIsLoading(true);
          return;
      }
      setIsLoading(false); // Hide main loading screen for non-blocked users
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
        
        // Mascot logic
        const mascotLastShown = localStorage.getItem('mascotLastShown');
        const today = new Date().toDateString();
        if (mascotLastShown !== today) {
            setShowMascot(true);
            localStorage.setItem('mascotLastShown', today);
        }
      }
    }
  }, [isLoaded, isAnonymous, currentUser]);

  const handleLogin = () => {
    setShowOnboarding(false);
    setActiveTab('Settings');
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
    setIsBuildingCollection(false);
    setSelectedCollectionId(null);
    setIsSidebarOpen(false);
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
  
  const handleBuildCollection = (collectionId: string | null) => {
    resetViews();
    setSelectedCollectionId(collectionId);
    setIsBuildingCollection(true);
  };

  const handleSidebarNavigate = (tabName: string) => {
      resetViews();
      setActiveTab(tabName);
  }

  const handleAvatarClick = () => {
    const newCount = avatarClickCount + 1;
    setAvatarClickCount(newCount);
    if (newCount >= 5) {
      setShowDevTools(true);
      setAvatarClickCount(0);
    }
  };


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
    if(isBuildingCollection) {
        return <CollectionBuilderPage onBack={handleBackToList} collectionId={selectedCollectionId} />;
    }

    switch (activeTab) {
      case 'Home':
        return <JournalListPage onSelectEntry={handleSelectEntry} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage} searchTerm={searchTerm} />;
      case 'Explore':
        return <ExplorePage onViewHashtag={handleViewHashtag} />;
      case 'Pesan':
        return <MessagesPage onStartChat={handleStartChat} />;
      case 'Settings':
        return <SettingsPage setActiveTab={setActiveTab} />;
      case 'Profile':
        return <ProfilePage onSelectEntry={handleSelectEntry} onBuildCollection={handleBuildCollection} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage} />;
      case 'Notifikasi':
        return <NotificationListPage onSelectEntry={handleSelectEntry} />;
      default:
        return <JournalListPage onSelectEntry={handleSelectEntry} onViewHashtag={handleViewHashtag} onViewImage={handleViewImage} searchTerm={searchTerm} />;
    }
  };


  return (
    <>
      <AnimatePresence>
        {isLoading && <LoadingScreen text={currentUser?.isBlocked ? "Akses ditangguhkan..." : "Memuat data..."} />}
      </AnimatePresence>
      <AnimatePresence>
        {showOnboarding && <OnboardingScreen onLogin={handleLogin} onGuest={handleGuest} />}
      </AnimatePresence>
      <DevTools isOpen={showDevTools} onOpenChange={setShowDevTools} />
       <AnimatePresence>
          {isSidebarOpen && (
            <Sidebar 
                user={currentUser} 
                onClose={() => setIsSidebarOpen(false)} 
                onNavigate={handleSidebarNavigate}
                onSignOut={signOutUser}
                onAvatarClick={handleAvatarClick}
            />
          )}
      </AnimatePresence>
      <AnimatePresence>
        {showMascot && currentUser && (
            <VirtualMascot 
                user={currentUser} 
                onClose={() => setShowMascot(false)} 
            />
        )}
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
          
          {!isEditing && !viewingProfileId && !chattingWith && !viewingHashtag && (
            <header className="sticky top-0 z-10 flex items-center justify-between py-2 px-4 bg-background/80 backdrop-blur-sm border-b">
                <div className="flex items-center gap-3 w-1/3">
                    {currentUser && <Avatar className="h-8 w-8 cursor-pointer" onClick={() => { setIsSidebarOpen(true); handleAvatarClick(); }}><AvatarFallback>{currentUser.avatar}</AvatarFallback></Avatar>}
                </div>
                 <div className="flex items-center gap-3 w-1/3 justify-center">
                    <Icons.logo className="h-7 w-7 text-primary" />
                </div>
                <div className="flex w-1/3 justify-end items-center gap-2">
                     <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(true)}>
                        <Search className="h-5 w-5" />
                    </Button>
                    <ThemeToggle />
                </div>
            </header>
          )}

           <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cari Postingan</DialogTitle>
                  <DialogDescription>
                    Cari berdasarkan konten atau tagar.
                  </DialogDescription>
                </DialogHeader>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="Cari postingan atau #tag..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </DialogContent>
            </Dialog>

          <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
            {renderContent()}
          </div>
          
          {activeTab === 'Home' && !isEditing && !viewingProfileId && !chattingWith && !viewingHashtag && (
            <div className="fixed bottom-20 right-6 md:bottom-6 md:right-6 z-20 flex flex-col gap-4">
              <DailyQuest />
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

    

    