
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type AppearanceSettings = {
    backgroundImage: string;
    textColor: string;
    accentColor: string;
};

type AppearanceContextType = {
    settings: AppearanceSettings;
    setSettings: (settings: AppearanceSettings) => void;
    resetSettings: () => void;
};

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

const defaultSettings: AppearanceSettings = {
    backgroundImage: '',
    textColor: '#000000', // Default dark text
    accentColor: '#6D28D9', // Default purple accent
};

function applyStyles(settings: AppearanceSettings) {
    const styleId = 'custom-appearance-styles';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = styleId;
        document.head.appendChild(styleTag);
    }
    
    // Convert hex to HSL for theme compatibility
    const hexToHsl = (hex: string): string => {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;

        if (max !== min) {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
    }
    
    const textColorHsl = hexToHsl(settings.textColor);
    const accentColorHsl = hexToHsl(settings.accentColor);

    styleTag.innerHTML = `
        body {
            ${settings.backgroundImage ? `
                background-image: url(${settings.backgroundImage});
                background-size: cover;
                background-position: center;
                background-attachment: fixed;
            ` : ''}
        }
        
        :root {
            --foreground: ${textColorHsl};
            --primary: ${accentColorHsl};
            --ring: ${accentColorHsl};
        }
        
        /* Ensure some elements get the accent color */
        .lucide, .text-primary {
            color: hsl(var(--primary));
        }
         .bg-primary {
            background-color: hsl(var(--primary));
        }
        .border-primary {
            border-color: hsl(var(--primary));
        }
    `;
}

export function AppearanceProvider({ children }: { children: ReactNode }) {
    const [settings, setSettingsState] = useState<AppearanceSettings>(defaultSettings);

    useEffect(() => {
        const storedSettings = localStorage.getItem('moodlink-appearance');
        if (storedSettings) {
            const parsedSettings = JSON.parse(storedSettings);
            setSettingsState(parsedSettings);
            applyStyles(parsedSettings);
        }
    }, []);

    const setSettings = (newSettings: AppearanceSettings) => {
        localStorage.setItem('moodlink-appearance', JSON.stringify(newSettings));
        setSettingsState(newSettings);
        applyStyles(newSettings);
    };

    const resetSettings = () => {
        localStorage.removeItem('moodlink-appearance');
        setSettingsState(defaultSettings);
        applyStyles(defaultSettings);
        // Also remove injected style tag
        const styleTag = document.getElementById('custom-appearance-styles');
        if (styleTag) {
            styleTag.innerHTML = '';
        }
    }

    return (
        <AppearanceContext.Provider value={{ settings, setSettings, resetSettings }}>
            {children}
        </AppearanceContext.Provider>
    );
}

export function useAppearance() {
    const context = useContext(AppearanceContext);
    if (context === undefined) {
        throw new Error('useAppearance must be used within a AppearanceProvider');
    }
    return context;
}
