import React, { useRef, useState, useEffect } from 'react';
import { X, Camera, RefreshCw, Check, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCapture: (file: File) => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
    const [isCapturing, setIsCapturing] = useState(false);

    const startCamera = async () => {
        try {
            setError(null);
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: facingMode },
                audio: false
            });

            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
            setIsReady(true);
        } catch (err) {
            console.error('Error accessing camera:', err);
            setError('Could not access camera. Please ensure you have given permission.');
        }
    };

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [isOpen, facingMode]);

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        setIsReady(false);
        setCapturedImage(null);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg');
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
    };

    const handleConfirm = () => {
        if (capturedImage && !isCapturing) {
            setIsCapturing(true);
            // Convert dataUrl to File
            fetch(capturedImage)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `camera_capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    onCapture(file);
                    onClose();
                })
                .catch(err => {
                    console.error('Error processing captured image:', err);
                    setError('Failed to process image. Please try again.');
                })
                .finally(() => setIsCapturing(false));
        }
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-card rounded-2xl overflow-hidden shadow-2xl border border-border">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/50 to-transparent">
                    <h3 className="text-white font-semibold">Camera</h3>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Viewfinder/Preview */}
                <div className="relative aspect-[3/4] bg-black flex items-center justify-center overflow-hidden">
                    {error ? (
                        <div className="p-8 text-center text-white space-y-4">
                            <p className="opacity-80">{error}</p>
                            <Button onClick={startCamera} variant="outline" className="border-white/20 text-white hover:bg-white/10">
                                Try Again
                            </Button>
                        </div>
                    ) : capturedImage ? (
                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover animate-in zoom-in-95 duration-200" />
                    ) : (
                        <>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover mirror"
                                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
                            />
                            {!isReady && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <RefreshCw className="h-8 w-8 text-white animate-spin opacity-50" />
                                </div>
                            )}
                        </>
                    )}
                    <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Controls */}
                <div className="p-6 bg-card flex flex-col items-center gap-6">
                    {capturedImage ? (
                        <div className="flex gap-4 w-full">
                            <Button
                                onClick={handleRetake}
                                variant="outline"
                                className="flex-1 rounded-xl h-12 gap-2"
                            >
                                <Undo2 className="h-5 w-5" />
                                Retake
                            </Button>
                            <Button
                                onClick={handleConfirm}
                                variant="terracotta"
                                className="flex-[2] rounded-xl h-12 gap-2 shadow-lg"
                            >
                                <Check className="h-5 w-5" />
                                Send Photo
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-center gap-8 w-full">
                            <button
                                onClick={toggleCamera}
                                className="p-3 rounded-full bg-muted hover:bg-muted/80 text-foreground transition-all active:scale-90"
                            >
                                <RefreshCw className="h-6 w-6" />
                            </button>

                            <button
                                onClick={capturePhoto}
                                disabled={!isReady}
                                className="h-20 w-20 rounded-full border-[6px] border-muted flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                <div className="h-14 w-14 rounded-full bg-terracotta shadow-lg flex items-center justify-center text-white">
                                    <Camera className="h-6 w-6" />
                                </div>
                            </button>

                            <div className="w-12 h-12" /> {/* Spacer for symmetry */}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
