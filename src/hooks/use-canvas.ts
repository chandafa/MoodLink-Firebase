
'use client';

import { useState, useEffect } from 'react';
import { db, collection, query, addDoc, updateDoc, doc, onSnapshot, serverTimestamp } from '@/lib/firebase';
import type { CanvasPath } from '@/lib/types';

export function useCanvas(entryId: string) {
    const [paths, setPaths] = useState<CanvasPath[]>([]);
    
    useEffect(() => {
        if (!entryId) return;
        const pathsRef = collection(db, 'journals', entryId, 'paths');
        const q = query(pathsRef);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newPaths: CanvasPath[] = [];
            snapshot.forEach(doc => {
                newPaths.push({ id: doc.id, ...doc.data() } as CanvasPath);
            });
            setPaths(newPaths);
        });

        return () => unsubscribe();
    }, [entryId]);

    const addPath = async (path: Omit<CanvasPath, 'id'>) => {
        if (!entryId) return;
        const pathsRef = collection(db, 'journals', entryId, 'paths');
        await addDoc(pathsRef, path);
    };
    
    const updateCanvasPreview = async (entryId: string, dataUrl: string) => {
        const entryRef = doc(db, 'journals', entryId);
        await updateDoc(entryRef, {
            canvasPreview: dataUrl,
            updatedAt: serverTimestamp()
        });
    };

    return { paths, addPath, updateCanvasPreview };
}
