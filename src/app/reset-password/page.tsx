
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { auth, verifyPasswordResetCode, confirmPasswordReset } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import { LoaderCircle } from 'lucide-react';

const passwordSchema = z.object({
  password: z.string().min(6, 'Kata sandi minimal 6 karakter.'),
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

function ResetPasswordComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [oobCode, setOobCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    const code = searchParams.get('oobCode');
    if (!code) {
      setError('Kode pengaturan ulang tidak valid atau tidak ada.');
      setIsLoading(false);
      return;
    }

    verifyPasswordResetCode(auth, code)
      .then(() => {
        setOobCode(code);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Tautan pengaturan ulang tidak valid atau telah kedaluwarsa. Silakan coba lagi.');
        setIsLoading(false);
      });
  }, [searchParams]);

  const onSubmit = async (data: PasswordFormValues) => {
    if (!oobCode) return;
    setIsSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      toast({
        title: 'Kata Sandi Diperbarui',
        description: 'Kata sandi Anda telah berhasil diatur ulang. Anda akan diarahkan untuk masuk.',
      });
      setTimeout(() => router.push('/'), 2000);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Gagal Memperbarui Kata Sandi',
        description: 'Terjadi kesalahan. Silakan coba lagi.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Memverifikasi tautan...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Icons.logo className="mx-auto h-12 w-12 text-primary" />
          <CardTitle className="mt-4 text-2xl">Atur Ulang Kata Sandi</CardTitle>
          <CardDescription>
            {error ? 'Gagal memuat halaman' : 'Masukkan kata sandi baru Anda di bawah ini.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <p className="text-center text-destructive">{error}</p>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kata Sandi Baru</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="******" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ResetPasswordComponent />
        </Suspense>
    )
}
