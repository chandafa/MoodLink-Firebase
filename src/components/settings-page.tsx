'use client';

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
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Icons } from './icons';
import { ThemeToggle } from './theme-toggle';
import { useTheme } from "./theme-provider";

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme } = useTheme();

  const handleResetData = () => {
    localStorage.clear();
    toast({
      title: 'Data Reset',
      description: 'All your local data has been cleared. The app will now reload.',
    });
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8 px-4">
      <header className="flex items-center gap-3 mb-8">
        <Icons.logo className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold font-headline text-foreground">
          Settings
        </h1>
      </header>

      <div className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Customize the look and feel of the app.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode">Dark Mode</Label>
              <ThemeToggle />
            </div>
            {/* Future language setting */}
            <div className="flex items-center justify-between">
              <Label htmlFor="language">Language</Label>
              <Button variant="outline" disabled>English</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
             <CardDescription>Manage how you receive notifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications-toggle">Enable Notifications</Label>
              <Switch id="notifications-toggle" disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Data Management</CardTitle>
            <CardDescription>Manage your application data.</CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Reset All Data</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your
                    journal entries, profile information, and settings from this device.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetData}>
                    Yes, delete my data
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>Version 1.0.0</p>
        <p>Copyright &copy; 2025 chandafa - chann</p>
      </div>
    </div>
  );
}
