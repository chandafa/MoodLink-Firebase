'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Printer,
  Save,
  Trash2,
  ArrowLeft,
  Send,
  LoaderCircle
} from 'lucide-react';
import { useJournal, type JournalEntry, type Comment, getCurrentUserId } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ThemeToggle } from './theme-toggle';
import { Icons } from './icons';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';
import { Avatar, AvatarFallback } from './ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from './ui/scroll-area';

function CommentSection({ entryId }: { entryId: string }) {
    const { entries, addComment, isLoaded } = useJournal();
    const { toast } = useToast();
    const [newComment, setNewComment] = useState('');
    const [authorName, setAuthorName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const savedName = localStorage.getItem('moodlink-chat-user');
        if (savedName) {
            setAuthorName(JSON.parse(savedName).name);
        } else {
            setAuthorName('Anonim');
        }
    }, []);

    const entry = useMemo(() => entries.find(e => e.id === entryId), [entries, entryId]);
    const comments = useMemo(() => {
        return [...(entry?.comments || [])].sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }, [entry?.comments]);

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) {
            toast({ title: 'Komentar tidak boleh kosong', variant: 'destructive' });
            return;
        }
        setIsLoading(true);
        // Simulate network delay
        await new Promise(res => setTimeout(res, 500));
        addComment(entryId, newComment, authorName);
        setNewComment('');
        setIsLoading(false);
    }
    
    if (!isLoaded) return <Skeleton className="h-40 w-full" />;

    return (
        <Card className="mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare />
                    Komentar ({comments.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4 mb-6">
                     <Textarea 
                        placeholder={`Beri komentar sebagai ${authorName}...`}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        disabled={isLoading}
                     />
                     <Button type="submit" disabled={isLoading} className="self-end">
                        {isLoading ? <LoaderCircle className="animate-spin mr-2" /> : <Send className="mr-2" />}
                        Kirim
                     </Button>
                </form>
                <Separator />
                 <ScrollArea className="h-64 mt-4 pr-4">
                    <div className="space-y-4">
                        {comments.length > 0 ? comments.map(comment => (
                            <div key={comment.id} className="flex gap-3">
                                <Avatar>
                                    <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="font-bold">{comment.author}</p>
                                        <p className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleString()}</p>
                                    </div>
                                    <p className="text-sm mt-1">{comment.content}</p>
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Belum ada komentar. Jadilah yang pertama!</p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    )
}


type JournalAppProps = {
  selectedEntryId: string | null;
  onBack: () => void;
  setSelectedEntryId: (id: string | null) => void;
}

export function JournalApp({ selectedEntryId, onBack, setSelectedEntryId }: JournalAppProps) {
  const { entries, addEntry, updateEntry, deleteEntry, isLoaded } = useJournal();
  const [editorContent, setEditorContent] = useState('');
  
  const currentUserId = getCurrentUserId();
  
  const activeEntry = useMemo(() => {
    return entries.find(entry => entry.id === selectedEntryId) || null;
  }, [selectedEntryId, entries]);
  
  const isOwner = activeEntry?.ownerId === currentUserId;

  useEffect(() => {
    if (activeEntry) {
      setEditorContent(activeEntry.content);
    } else {
      // It's a new entry, so clear the editor
      setEditorContent('');
    }
  }, [activeEntry]);

  const handleSave = () => {
    if (activeEntry) {
      if(isOwner) {
         updateEntry(activeEntry.id, editorContent);
      }
    } else {
      const newEntry = addEntry(editorContent);
      if(newEntry) {
        setSelectedEntryId(newEntry.id);
      }
    }
  };

   const sortedEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries]);

  const handleDelete = () => {
    if (activeEntry && isOwner) {
      const entryIndex = sortedEntries.findIndex(e => e.id === selectedEntryId);
      deleteEntry(activeEntry.id);
      
      if (sortedEntries.length > 1) {
        let nextEntryId: string | null = null;
        if (entryIndex < sortedEntries.length - 1) {
            nextEntryId = sortedEntries[entryIndex + 1].id;
        } else if (entryIndex > 0) {
            nextEntryId = sortedEntries[entryIndex - 1].id;
        }
        setSelectedEntryId(nextEntryId);
        if (sortedEntries.length <= 1) {
          onBack();
        }
      } else {
        onBack();
      }
    }
  };
  
  const handlePrint = () => {
    const printableContent = `
      <html>
        <head>
          <title>Entri Jurnal</title>
          <style>
            body { font-family: 'Poppins', sans-serif; line-height: 1.6; }
            h1 { color: #333; }
            p { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Entri Jurnal dari ${activeEntry ? new Date(activeEntry.createdAt).toLocaleDateString() : 'MoodLink'}</h1>
          <hr />
          <p>${editorContent}</p>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
        printWindow.document.write(printableContent);
        printWindow.document.close();
        printWindow.print();
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 md:px-6 border-b bg-background/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
            <Button onClick={onBack} size="icon" variant="ghost" className="mr-2">
                <ArrowLeft />
            </Button>
          <Icons.logo className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold font-headline text-foreground">
            {activeEntry ? (isOwner ? 'Edit Entri' : 'Lihat Entri') : 'Entri Baru'}
          </h1>
        </div>
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 p-4 md:p-6 flex flex-col">
          { !isLoaded && !activeEntry ? (
             <Card className="flex-1 flex flex-col">
                <CardHeader> <Skeleton className="h-8 w-48" /> </CardHeader>
                <CardContent className="flex-1"> <Skeleton className="h-full w-full" /> </CardContent>
             </Card>
          ) : (
            <>
            <Card className="flex-1 flex flex-col shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">
                    {activeEntry ? activeEntry.content.split('\n')[0] : 'Entri Baru'}
                    </CardTitle>
                    {activeEntry && (
                        <p className="text-sm text-muted-foreground">
                            {isOwner ? `Terakhir diperbarui pada ${new Date(activeEntry.updatedAt).toLocaleString()}` : `Dibuat pada ${new Date(activeEntry.createdAt).toLocaleString()}`}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  {(isOwner || !activeEntry) && (
                    <Button onClick={handleSave} size="lg">
                      <Save className="mr-2 h-5 w-5" />
                      Simpan
                    </Button>
                  )}
                  {activeEntry && (
                    <>
                      <Button onClick={handlePrint} variant="outline" size="icon" aria-label="Print entry" className="hidden md:inline-flex">
                        <Printer className="h-5 w-5" />
                      </Button>
                      {isOwner && (
                        <Button onClick={handleDelete} variant="destructive" size="icon" aria-label="Delete entry">
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  placeholder="Mulai menulis..."
                  className="flex-1 text-base resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  value={editorContent}
                  onChange={e => setEditorContent(e.target.value)}
                  readOnly={!isOwner && !!activeEntry}
                />
              </CardContent>
            </Card>
            {activeEntryId && <CommentSection entryId={activeEntryId} />}
            </>
          )}
        </main>
    </div>
  );
}
