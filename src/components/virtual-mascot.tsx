
'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Icons } from './icons';
import { User } from '@/hooks/use-journal';

const getDynamicGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
        return { timeOfDay: 'pagi', message: 'Selamat pagi 🌞, semoga hari ini cerah kayak kamu.' };
    }
    if (hour >= 12 && hour < 15) {
        return { timeOfDay: 'siang', message: 'Sudah makan siang belum? Jangan terlalu sibuk ya 🍱.' };
    }
    if (hour >= 15 && hour < 18) {
        return { timeOfDay: 'sore', message: 'Semangat sore! Sebentar lagi waktunya santai.' };
    }
    return { timeOfDay: 'malam', message: 'Waktunya istirahat, recharge dulu ⚡.' };
};


export function VirtualMascot({ user, onClose }: { user: User, onClose: () => void }) {
    const { timeOfDay, message } = useMemo(() => getDynamicGreeting(), []);
    
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.7, opacity: 0 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                    className="relative bg-card rounded-xl shadow-2xl p-8 max-w-sm w-full text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <Button
                        size="icon"
                        variant="ghost"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                    
                    <motion.div
                        animate={{
                            scale: [1, 1.05, 1],
                            rotate: [-2, 2, -2, 2, 0],
                        }}
                        transition={{
                            duration: 2,
                            ease: "easeInOut",
                            repeat: Infinity,
                            repeatType: "loop",
                        }}
                    >
                        <Icons.logo className="h-28 w-28 text-primary mx-auto" />
                    </motion.div>
                    
                    <h2 className="text-2xl font-bold mt-4">
                        Selamat {timeOfDay}, {user.displayName.split(' ')[0]}!
                    </h2>
                    
                    <p className="text-muted-foreground mt-2">
                        {message}
                    </p>
                    
                    <Button onClick={onClose} className="mt-6 w-full">
                        Siap!
                    </Button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

    
