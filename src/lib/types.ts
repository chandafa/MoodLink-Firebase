
import type { Timestamp } from '@/lib/firebase';

export type Visibility = 'public' | 'private' | 'restricted';

export type Comment = {
  id: string;
  authorId: string;
  authorName: string; // denormalized for easier display
  authorAvatar: string; // denormalized
  content: string;
  imageUrl?: string | null;
  createdAt: Timestamp; // Firestore Timestamp
  parentId: string | null; // For threading
  likes: number;
  likedBy: string[];
};

export type User = {
  id: string;
  displayName: string;
  avatar: string;
  bio: string;
  followers: string[];
  following: string[];
  points: number;
  level: number;
  bannerUrl?: string;
  badges: string[];
  notificationsEnabled?: boolean;
  questState?: { [key: string]: boolean | 'claimed' };
  lastQuestReset?: string; // YYYY-MM-DD
  isBlocked?: boolean;
  isPrivate?: boolean;
  activeTitle?: string | null;
  unlockedTitles: string[];
  unlockedAvatars: string[];
};

export type PostType = 'journal' | 'voting' | 'capsule' | 'quiz' | 'shared-canvas';

export type VoteOption = {
  text: string;
  votes: number;
};

export type CanvasPath = {
    id?: string;
    points: { x: number, y: number }[];
    color: string;
    strokeWidth: number;
};

export type JournalEntry = {
  id:string;
  ownerId: string;
  postType: PostType;
  content: string;
  createdAt: Timestamp; // Firestore Timestamp
  updatedAt: Timestamp; // Firestore Timestamp
  openAt: Timestamp; // Firestore Timestamp, for capsules
  commentCount: number;
  likes: number;
  likedBy: string[];
  bookmarkedBy: string[];
  images: string[]; // URLs from Firebase Storage or cPanel hosting
  musicUrl?: string | null; // URL for the music file
  options: VoteOption[];
  votedBy: string[]; // Stores "userId_optionIndex"
  visibility: Visibility;
  allowedUserIds: string[];
  hashtags: string[];
  cardColor?: string; // e.g. 'rose', 'sky'
  fontFamily?: string; // e.g. 'font-body'
  correctAnswerIndex?: number; // For quiz type
  canvasPreview?: string; // For shared-canvas
  repostCount?: number;
  isRepost?: boolean;
  originalAuthorId?: string;
  originalAuthorName?: string;
};

export type Report = {
    id: string;
    entryId: string;
    reportedBy: string;
    createdAt: Timestamp;
    entry: JournalEntry; 
    reporter?: User;
};

export type JournalCollection = {
    id: string;
    ownerId: string;
    title: string;
    description: string;
    entryIds: string[];
    createdAt: Timestamp;
    updatedAt: Timestamp;
};

export type ChatMessage = {
    id: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    audioUrl?: string;
    createdAt: Timestamp;
};

export type Conversation = {
    id: string; // roomId
    lastMessage: string;
    lastMessageTimestamp: Timestamp;
    participantIds: string[];
    participantDetails: {
        [key: string]: {
            displayName: string;
            avatar: string;
        }
    };
    unreadCounts: {
        [key: string]: number;
    };
};

export type Notification = {
  id: string;
  userId: string;         // The user who receives the notification
  actorId: string;        // The user who performed the action
  actorName: string;      // The display name of the actor
  type: 'like' | 'comment' | 'follow' | 'reply';
  journalId?: string;     // The ID of the journal related to the action
  journalContent?: string; // A snippet of the journal content
  isRead: boolean;
  createdAt: Timestamp;
};

export type Hashtag = {
  name: string;
  count: number;
  updatedAt: Timestamp;
};

export type ShopItem = {
    id: string;
    name: string;
    description: string;
    price: number;
    type: 'title' | 'avatar' | 'banner';
    icon?: string; // For titles or avatars
};
