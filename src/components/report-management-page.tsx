'use client';

import { useReportedEntries, Report, JournalEntry, User } from '@/hooks/use-journal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Flag, Trash2, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
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

function ReportedEntryCard({ report, onDelete }: { report: Report; onDelete: (entryId: string, reportId: string) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Laporan untuk Postingan</CardTitle>
        <CardDescription>
          Dilaporkan oleh <span className="font-semibold">{report.reporter?.displayName || 'Anonim'}</span>{' '}
          {formatDistanceToNow(report.createdAt.toDate(), { locale: id, addSuffix: true })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg p-4 bg-muted/50">
           <div className="flex items-center gap-3 mb-2">
                <Avatar>
                    <AvatarFallback>{report.entry?.ownerId.charAt(0) || 'A'}</AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold">Postingan Asli</p>
                </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-4">{report.entry?.content}</p>
        </div>
      </CardContent>
      <CardContent>
         <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Hapus Postingan
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Anda yakin ingin menghapus postingan ini?</AlertDialogTitle>
                    <AlertDialogDescription>Tindakan ini akan menghapus postingan secara permanen dan menghapus laporan ini. Tindakan tidak dapat diurungkan.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(report.entryId, report.id)} className="bg-destructive hover:bg-destructive/90">Hapus</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}


export function ReportManagementPage({ onDelete }: { onDelete: (entryId: string, reportId: string) => void }) {
  const { reportedEntries, isLoading } = useReportedEntries();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Flag className="h-6 w-6 text-destructive" />
        <h2 className="text-2xl font-bold">Manajemen Laporan</h2>
      </div>

      {reportedEntries.length > 0 ? (
        <div className="space-y-4">
          {reportedEntries.map(report => (
            <ReportedEntryCard key={report.id} report={report} onDelete={onDelete} />
          ))}
        </div>
      ) : (
        <div className="text-center p-8 border-2 border-dashed rounded-lg">
          <Flag className="w-16 h-16 mx-auto text-muted-foreground" />
          <h3 className="mt-4 text-xl font-semibold">Tidak Ada Laporan</h3>
          <p className="mt-2 text-muted-foreground">Saat ini tidak ada postingan yang dilaporkan.</p>
        </div>
      )}
    </div>
  );
}
