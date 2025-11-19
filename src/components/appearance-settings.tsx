
'use client';

import { useRef, useState } from "react";
import { useAppearance } from "@/hooks/use-appearance";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Palette, Wallpaper, Sparkles, PaintRoller } from "lucide-react";

export function AppearanceSettings() {
    const { settings, setSettings, resetSettings } = useAppearance();
    const [localSettings, setLocalSettings] = useState(settings);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setLocalSettings(prev => ({...prev, backgroundImage: result}));
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleColorChange = (key: 'textColor' | 'accentColor', value: string) => {
        setLocalSettings(prev => ({...prev, [key]: value}));
    };

    const handleSave = () => {
        setSettings(localSettings);
    };

    const handleReset = () => {
        resetSettings();
        setLocalSettings({ backgroundImage: '', textColor: '#000000', accentColor: '#6D28D9' });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Palette/> Tampilan Kustom</CardTitle>
                <CardDescription>Personalisasikan tampilan aplikasi dengan gambar latar dan skema warna Anda sendiri.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="bg-image" className="flex items-center gap-2"><Wallpaper/> Gambar Latar</Label>
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>Pilih Gambar</Button>
                    <Input id="bg-image" type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                    {localSettings.backgroundImage && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            Pratinjau: <img src={localSettings.backgroundImage} alt="pratinjau latar" className="w-20 h-10 object-cover rounded-md border" />
                        </div>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="text-color" className="flex items-center gap-2"><Sparkles/> Warna Teks Utama</Label>
                    <div className="flex items-center gap-2">
                        <Input 
                            id="text-color" 
                            type="color" 
                            value={localSettings.textColor} 
                            onChange={(e) => handleColorChange('textColor', e.target.value)} 
                            className="w-12 h-10 p-1"
                        />
                        <span className="text-sm text-muted-foreground">{localSettings.textColor}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="accent-color" className="flex items-center gap-2"><PaintRoller/> Warna Aksen & Ikon</Label>
                     <div className="flex items-center gap-2">
                        <Input 
                            id="accent-color" 
                            type="color" 
                            value={localSettings.accentColor} 
                            onChange={(e) => handleColorChange('accentColor', e.target.value)}
                            className="w-12 h-10 p-1"
                        />
                         <span className="text-sm text-muted-foreground">{localSettings.accentColor}</span>
                    </div>
                </div>
                 <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={handleReset}>Reset</Button>
                    <Button onClick={handleSave}>Simpan Tampilan</Button>
                </div>
            </CardContent>
        </Card>
    );
}
