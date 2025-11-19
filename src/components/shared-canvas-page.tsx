
'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { useCanvas } from '@/hooks/use-journal';
import { Button } from './ui/button';
import { ArrowLeft, Save, Trash2, Undo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const colors = ['#000000', '#EF4444', '#F97316', '#84CC16', '#22C55E', '#14B8A6', '#0EA5E9', '#6366F1', '#A855F7', '#EC4899'];

type SharedCanvasPageProps = {
    entryId: string;
    onBack: () => void;
};

export default function SharedCanvasPage({ entryId, onBack }: SharedCanvasPageProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const { paths, addPath, updateCanvasPreview } = useCanvas(entryId);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<{ x: number, y: number }[]>([]);
    const [color, setColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(4);
    const localPaths = useRef<Map<string, any>>(new Map());

    const drawPath = useCallback((ctx: CanvasRenderingContext2D, path: { points: {x:number, y:number}[], color: string, strokeWidth: number }) => {
        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = path.strokeWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (path.points.length > 0) {
            ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let i = 1; i < path.points.length; i++) {
                ctx.lineTo(path.points[i].x, path.points[i].y);
            }
        }
        ctx.stroke();
    }, []);

    const redrawCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        paths.forEach(path => {
            drawPath(ctx, path);
        });

    }, [paths, drawPath]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Set canvas dimensions based on container size
        const container = canvas.parentElement;
        if(container) {
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        }

        redrawCanvas();
    }, [paths, redrawCanvas]);

    const getCoordinates = (event: MouseEvent | TouchEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        const rect = canvas.getBoundingClientRect();
        if ('touches' in event) {
            return {
                x: event.touches[0].clientX - rect.left,
                y: event.touches[0].clientY - rect.top
            };
        }
        return {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        };
    };

    const handleMouseDown = (event: React.MouseEvent | React.TouchEvent) => {
        event.preventDefault();
        const coords = getCoordinates(event.nativeEvent);
        if (!coords) return;
        
        setIsDrawing(true);
        setCurrentPath([coords]);
    };

    const handleMouseMove = (event: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        event.preventDefault();
        const coords = getCoordinates(event.nativeEvent);
        if (!coords) return;
        
        setCurrentPath(prev => [...prev, coords]);

        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (ctx && currentPath.length > 1) {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            ctx.moveTo(currentPath[currentPath.length - 2].x, currentPath[currentPath.length - 2].y);
            ctx.lineTo(coords.x, coords.y);
            ctx.stroke();
        }
    };

    const handleMouseUp = () => {
        if (!isDrawing || currentPath.length === 0) return;
        setIsDrawing(false);
        addPath({ points: currentPath, color, strokeWidth });
        setCurrentPath([]);
    };
    
    const handleSavePreview = () => {
        const canvas = canvasRef.current;
        if(!canvas) return;
        
        const dataUrl = canvas.toDataURL('image/png');
        updateCanvasPreview(entryId, dataUrl);
        onBack();
    }


    return (
        <div className="h-screen w-screen flex flex-col bg-muted">
            <header className="flex items-center justify-between p-2 border-b bg-background shrink-0">
                <Button variant="ghost" size="icon" onClick={onBack}>
                    <ArrowLeft />
                </Button>
                <div className="flex items-center gap-2">
                    {colors.map(c => (
                        <motion.button
                            key={c}
                            onClick={() => setColor(c)}
                            className={cn(
                                'h-8 w-8 rounded-full border-2 transition-transform',
                                color === c ? 'border-ring' : 'border-transparent'
                            )}
                            style={{ backgroundColor: c }}
                            whileTap={{ scale: 1.2 }}
                        />
                    ))}
                </div>
                <Button variant="default" onClick={handleSavePreview}>
                    <Save className="mr-2 h-4 w-4"/> Simpan & Keluar
                </Button>
            </header>
            <main className="flex-1 relative">
                <canvas
                    ref={canvasRef}
                    className="absolute inset-0 w-full h-full bg-white"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                />
            </main>
        </div>
    );
}
