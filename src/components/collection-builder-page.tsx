
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useJournal, JournalEntry, JournalCollection } from '@/hooks/use-journal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BookCopy, Save, Trash2, LoaderCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const collectionSchema = z.object({
  title: z.string().min(3, { message: "Judul minimal 3 karakter." }).max(100),
  description: z.string().max(300, { message: "Deskripsi maksimal 300 karakter." }).optional(),
  entryIds: z.array(z.string()).min(1, { message: "Pilih setidaknya satu postingan." }),
});

type CollectionFormValues = z.infer<typeof collectionSchema>;

export function CollectionBuilderPage({ onBack, collectionId }: { onBack: () => void; collectionId: string | null }) {
  const { entries, collections, addCollection, updateCollection, deleteCollection, currentAuthUserId, isLoaded } = useJournal();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const existingCollection = useMemo(() => {
    if (!collectionId) return null;
    return collections.find(c => c.id === collectionId) || null;
  }, [collections, collectionId]);
  
  const userEntries = useMemo(() => {
      if (!currentAuthUserId) return [];
      return entries
          .filter(e => e.ownerId === currentAuthUserId && e.postType === 'journal')
          .sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
  }, [entries, currentAuthUserId]);


  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      title: '',
      description: '',
      entryIds: [],
    },
  });

  useEffect(() => {
    if (existingCollection) {
      form.reset({
        title: existingCollection.title,
        description: existingCollection.description,
        entryIds: existingCollection.entryIds,
      });
    }
  }, [existingCollection, form]);
  
  const onSubmit = async (data: CollectionFormValues) => {
    setIsSubmitting(true);
    try {
      if (existingCollection) {
        await updateCollection(existingCollection.id, data.title, data.description || '', data.entryIds);
      } else {
        await addCollection(data.title, data.description || '', data.entryIds);
      }
      onBack();
    } catch (error) {
        console.error("Failed to save collection", error);
        toast({ title: 'Gagal Menyimpan', description: 'Terjadi kesalahan saat menyimpan koleksi.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingCollection) return;
    setIsDeleting(true);
    try {
        await deleteCollection(existingCollection.id);
        toast({title: 'Koleksi Dihapus'});
        onBack();
    } catch (error) {
        console.error("Failed to delete collection", error);
        toast({ title: 'Gagal Menghapus', variant: 'destructive' });
    } finally {
        setIsDeleting(false);
    }
  }

  if (!isLoaded) {
    return <div className="container mx-auto py-8 px-4"><Skeleton className="h-96 w-full" /></div>;
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4">
      <header className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Button onClick={onBack} size="icon" variant="ghost">
            <ArrowLeft />
          </Button>
          <div className="flex items-center gap-3">
            <BookCopy className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-headline text-foreground">
              {existingCollection ? 'Edit Koleksi' : 'Buat Koleksi'}
            </h1>
          </div>
        </div>
        {existingCollection && (
             <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDeleting}>
                        <Trash2 className="mr-2 h-4 w-4" /> Hapus
                    </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin ingin menghapus koleksi ini?</AlertDialogTitle>
                        <AlertDialogDescription>Tindakan ini tidak dapat diurungkan.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        )}
      </header>
      
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Detail Koleksi</CardTitle>
            <CardDescription>Beri nama dan deskripsi untuk koleksi jurnal Anda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="title">Judul Koleksi</Label>
              <Input id="title" {...form.register('title')} />
              {form.formState.errors.title && <p className="text-sm text-destructive mt-1">{form.formState.errors.title.message}</p>}
            </div>
            <div>
              <Label htmlFor="description">Deskripsi (Opsional)</Label>
              <Textarea id="description" {...form.register('description')} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pilih Postingan</CardTitle>
            <CardDescription>Pilih postingan jurnal yang ingin Anda masukkan ke dalam koleksi ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-72 w-full rounded-md border">
              <div className="p-4">
                {form.formState.errors.entryIds && <p className="text-sm text-destructive mb-2">{form.formState.errors.entryIds.message}</p>}
                <Controller
                  control={form.control}
                  name="entryIds"
                  render={({ field }) => (
                    <div className="space-y-2">
                      {userEntries.map((entry) => (
                        <div key={entry.id} className="flex items-start space-x-3 rounded-md p-2 hover:bg-accent">
                          <Checkbox
                            id={entry.id}
                            checked={field.value?.includes(entry.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...(field.value || []), entry.id])
                                : field.onChange(field.value?.filter((value) => value !== entry.id));
                            }}
                          />
                          <div className="grid gap-1.5 leading-none">
                            <label htmlFor={entry.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {entry.content.split('\n')[0] || 'Tanpa Judul'}
                            </label>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                               {entry.content.substring(entry.content.indexOf('\n') + 1) || entry.content}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={isSubmitting}>
               {isSubmitting ? <LoaderCircle className="animate-spin mr-2"/> : <Save className="mr-2 h-5 w-5" />}
               {existingCollection ? 'Simpan Perubahan' : 'Buat Koleksi'}
            </Button>
        </div>
      </form>
    </div>
  );
}
