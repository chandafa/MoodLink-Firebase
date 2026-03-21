
'use client';

import { useState, useEffect } from 'react';
import { db, collection, query, orderBy, onSnapshot, getDoc, doc } from '@/lib/firebase';
import type { Report, JournalEntry, User } from '@/lib/types';


// Hook for admins to get reported entries
export function useReportedEntries() {
    const [reportedEntries, setReportedEntries] = useState<Report[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const reportsRef = collection(db, 'reports');
        const q = query(reportsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            const enrichedReports: Report[] = [];

            for (const report of reports) {
                const entryRef = doc(db, 'journals', report.entryId);
                const entrySnap = await getDoc(entryRef);

                if (entrySnap.exists()) {
                    const reporterRef = doc(db, 'users', report.reportedBy);
                    const reporterSnap = await getDoc(reporterRef);
                    
                    enrichedReports.push({
                        ...report,
                        entry: { id: entrySnap.id, ...entrySnap.data() } as JournalEntry,
                        reporter: reporterSnap.exists() ? { id: reporterSnap.id, ...reporterSnap.data() } as User : undefined,
                    } as Report);
                }
            }
            setReportedEntries(enrichedReports);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching reported entries:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { reportedEntries, isLoading };
}
