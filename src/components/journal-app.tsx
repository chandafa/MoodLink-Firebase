'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  BookText,
  FilePlus,
  Printer,
  Search,
  Trash2,
  Save,
  ArrowLeft
} from 'lucide-react';
import { useJournal, type JournalEntry } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThemeToggle } from './theme-toggle';
import { Icons } from './icons';
import { Separator } from './ui/separator';
import { Skeleton } from './ui/skeleton';

function EmptyState() {
  return (
    <div className="text-center p-8 flex flex-col items-center justify-center h-full">
      <div className="p-4 bg-secondary rounded-full mb-4">
        <BookText className="w-16 h-16 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">Your journal is empty</h3>
      <p className="text-muted-foreground">
        Click on "New Entry" to start writing your thoughts.
      </p>
    </div>
  );
}

function EntryCard({
  entry,
  isActive,
  onClick,
}: {
  entry: JournalEntry;
  isActive: boolean;
  onClick: () => void;
}) {
  const formattedDate = new Date(entry.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Card
      className={`cursor-pointer transition-all ${
        isActive
          ? 'border-primary shadow-lg'
          : 'border-transparent hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <p className="font-semibold text-sm truncate">
          {entry.content.split('\n')[0]}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{formattedDate}</p>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
          {entry.content.substring(entry.content.indexOf('\n') + 1) || entry.content}
        </p>
      </CardContent>
    </Card>
  );
}

type JournalAppProps = {
  selectedEntryId: string | null;
  onBack: () => void;
  setSelectedEntryId: (id: string | null) => void;
}

export function JournalApp({ selectedEntryId, onBack, setSelectedEntryId }: JournalAppProps) {
  const { entries, addEntry, updateEntry, deleteEntry, isLoaded } =
    useJournal();
  const [editorContent, setEditorContent] = useState('');
  
  const activeEntryId = selectedEntryId;

  const activeEntry = useMemo(() => {
    return entries.find(entry => entry.id === activeEntryId) || null;
  }, [activeEntryId, entries]);

  useEffect(() => {
    if (activeEntry) {
      setEditorContent(activeEntry.content);
    } else {
      setEditorContent('');
    }
  }, [activeEntry]);

  const handleSave = () => {
    if (activeEntry) {
      updateEntry(activeEntry.id, editorContent);
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
    if (activeEntry) {
      const entryIndex = sortedEntries.findIndex(e => e.id === activeEntryId);
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
          <title>Journal Entry</title>
          <style>
            body { font-family: 'Poppins', sans-serif; line-height: 1.6; }
            h1 { color: #333; }
            p { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>Journal Entry from ${activeEntry ? new Date(activeEntry.createdAt).toLocaleDateString() : 'MoodLink'}</h1>
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
            {activeEntry ? 'Edit Entry' : 'New Entry'}
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
            <Card className="flex-1 flex flex-col shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">
                    {activeEntry ? 'Edit Entry' : 'New Entry'}
                    </CardTitle>
                    {activeEntry && (
                        <p className="text-sm text-muted-foreground">
                            Last updated on {new Date(activeEntry.updatedAt).toLocaleString()}
                        </p>
                    )}
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleSave} size="lg">
                    <Save className="mr-2 h-5 w-5" />
                    {activeEntry ? 'Save' : 'Save'}
                  </Button>
                  {activeEntry && (
                    <>
                      <Button onClick={handlePrint} variant="outline" size="icon" aria-label="Print entry" className="hidden md:inline-flex">
                        <Printer className="h-5 w-5" />
                      </Button>
                      <Button onClick={handleDelete} variant="destructive" size="icon" aria-label="Delete entry">
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <Textarea
                  placeholder="Start writing..."
                  className="flex-1 text-base resize-none bg-transparent border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
                  value={editorContent}
                  onChange={e => setEditorContent(e.target.value)}
                />
              </CardContent>
            </Card>
          )}
        </main>
    </div>
  );
}
