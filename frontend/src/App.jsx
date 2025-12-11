import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Wifi, WifiOff, Shield, ShieldAlert, AlertTriangle, Settings, RefreshCw } from 'lucide-react';

const BACKEND_WS_URL = 'ws://localhost:8000/ws/detect';
const SEND_INTERVAL_MS = 150; // Send frames at ~7 FPS to backend
const RENDER_FPS = 30; // Smooth 30 FPS render loop

// Color scheme for different detection classes
const CLASS_COLORS = {
    helmet: { stroke: '#22c55e', fill: 'rgba(34, 197, 94, 0.2)', label: 'Helmet' },
    no_helmet: { stroke: '#ef4444', fill: 'rgba(239, 68, 68, 0.2)', label: 'No Helmet' },
    head: { stroke: '#f59e0b', fill: 'rgba(245, 158, 11, 0.2)', label: 'Head' },
    default: { stroke: '#3b82f6', fill: 'rgba(59, 130, 246, 0.2)', label: 'Detection' }
};

function getClassStyle(label) {
    const lowerLabel = label?.toLowerCase() || '';
    if (lowerLabel.includes('helmet') && !lowerLabel.includes('no')) {
        return CLASS_COLORS.helmet;
    } else if (lowerLabel.includes('no') || lowerLabel.includes('without')) {
        return CLASS_COLORS.no_helmet;
    } else if (lowerLabel.includes('head')) {
        return CLASS_COLORS.head;
    }
    return CLASS_COLORS.default;
}

function StatusBadge({ status, wsConnected }) {
    const statusConfig = {
        idle: { color: 'bg-slate-500', text: 'Idle', icon: CameraOff },
        connecting: { color: 'bg-yellow-500 status-pulse', text: 'Connecting...', icon: RefreshCw },
        streaming: { color: 'bg-green-500', text: 'Live', icon: Camera },
        error: { color: 'bg-red-500', text: 'Error', icon: AlertTriangle },
    };

    const config = statusConfig[status] || statusConfig.idle;
    const Icon = config.icon;

    return (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
                <span className="text-sm font-medium">{config.text}</span>
                <Icon className="w-4 h-4 text-slate-400" />
            </div>
            <div className="flex items-center gap-2">
                {wsConnected ? (
                    <Wifi className="w-4 h-4 text-green-400" />
                ) : (
                    <WifiOff className="w-4 h-4 text-red-400" />
                )}
                <span className="text-xs text-slate-400">
                    {wsConnected ? 'Connected' : 'Disconnected'}
                </span>
            </div>
        </div>
    );
}

function StatsPanel({ detections, frameCount }) {
    const helmetCount = detections.filter(d => {
        const label = d.label?.toLowerCase() || '';
        return label.includes('helmet') && !label.includes('no');
    }).length;

    const noHelmetCount = detections.filter(d => {
        const label = d.label?.toLowerCase() || '';
        return label.includes('no') || label.includes('without');
    }).length;

    const safetyScore = detections.length === 0 ? 100 :
        Math.round((helmetCount / Math.max(1, helmetCount + noHelmetCount)) * 100);

    return (
        <div className="glass rounded-xl p-4 space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary-400" />
                Detection Stats
            </h3>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-400">{helmetCount}</div>
                    <div className="text-xs text-slate-400">With Helmet</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-400">{noHelmetCount}</div>
                    <div className="text-xs text-slate-400">Without Helmet</div>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Safety Score</span>
                    <span className={safetyScore >= 80 ? 'text-green-400' : safetyScore >= 50 ? 'text-yellow-400' : 'text-red-400'}>
                        {safetyScore}%
                    </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-500 ${safetyScore >= 80 ? 'bg-green-500' : safetyScore >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                        style={{ width: `${safetyScore}%` }}
                    />
                </div>
            </div>

            <div className="text-xs text-slate-500 text-center">
                Frame #{frameCount}
            </div>
        </div>
    );
}

function DetectionList({ detections }) {
    if (detections.length === 0) {
        return (
            <div className="glass rounded-xl p-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary-400" />
                    Detections
                </h3>
                <div className="text-center py-8 text-slate-500">
                    <ShieldAlert className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No detections yet</p>
                    <p className="text-xs">Waiting for camera feed...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="glass rounded-xl p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary-400" />
                Detections ({detections.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {detections.map((det, idx) => {
                    const style = getClassStyle(det.label);
                    return (
                        <div
                            key={idx}
                            className="flex items-center justify-between bg-slate-800/50 rounded-lg p-2"
                        >
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: style.stroke }}
                                />
                                <span className="text-sm font-medium">{det.label || 'Unknown'}</span>
                            </div>
                            <span className="text-xs text-slate-400">
                                {(det.conf * 100).toFixed(1)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function App() {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const wsRef = useRef(null);
    const renderLoopRef = useRef(null);
    const sendIntervalRef = useRef(null);
    const detectionsRef = useRef([]); // Store detections in ref for smooth rendering

    const [status, setStatus] = useState('idle');
    const [wsConnected, setWsConnected] = useState(false);
    const [detections, setDetections] = useState([]);
    const [frameCount, setFrameCount] = useState(0);
    const [error, setError] = useState(null);

    // Smooth render loop - runs at consistent FPS, independent of detection responses
    const renderLoop = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < 2) {
            renderLoopRef.current = requestAnimationFrame(renderLoop);
            return;
        }

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        // Always draw the current video frame first (smooth video)
        ctx.drawImage(video, 0, 0, w, h);

        // Overlay detection boxes from the latest detections
        const dets = detectionsRef.current;
        dets.forEach(det => {
            const [x1, y1, x2, y2] = det.xyxy;
            const style = getClassStyle(det.label);

            // Scale coordinates to canvas size (detections are for 640px width)
            const scaleX = w / 640;
            const scaleY = h / (640 * (video.videoHeight / video.videoWidth));
            const sx1 = x1 * scaleX;
            const sy1 = y1 * scaleY;
            const sx2 = x2 * scaleX;
            const sy2 = y2 * scaleY;

            // Draw filled background
            ctx.fillStyle = style.fill;
            ctx.fillRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

            // Draw border
            ctx.strokeStyle = style.stroke;
            ctx.lineWidth = 3;
            ctx.strokeRect(sx1, sy1, sx2 - sx1, sy2 - sy1);

            // Draw label background
            const label = `${det.label || 'Detection'} ${(det.conf * 100).toFixed(0)}%`;
            ctx.font = 'bold 14px Inter, sans-serif';
            const textWidth = ctx.measureText(label).width;

            ctx.fillStyle = style.stroke;
            ctx.fillRect(sx1, sy1 - 24, textWidth + 12, 24);

            // Draw label text
            ctx.fillStyle = '#ffffff';
            ctx.fillText(label, sx1 + 6, sy1 - 7);
        });

        renderLoopRef.current = requestAnimationFrame(renderLoop);
    }, []);

    // Send frames to backend at fixed interval (separate from render)
    const sendFrame = useCallback(() => {
        const video = videoRef.current;
        const ws = wsRef.current;

        if (!video || !ws || ws.readyState !== WebSocket.OPEN || video.readyState < 2) {
            return;
        }

        // Create temporary canvas for sending
        const tempCanvas = document.createElement('canvas');
        const aspectRatio = video.videoHeight / video.videoWidth;
        tempCanvas.width = 640;
        tempCanvas.height = Math.round(640 * aspectRatio);
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Send frame to backend
        const b64 = tempCanvas.toDataURL('image/jpeg', 0.7);
        ws.send(JSON.stringify({ image: b64 }));
    }, []);

    // Handle incoming WebSocket messages
    const handleMessage = useCallback((event) => {
        try {
            const data = JSON.parse(event.data);
            if (data.error) {
                console.warn('Detection error:', data.error);
                return;
            }

            const dets = data.detections || [];
            detectionsRef.current = dets; // Update ref for render loop
            setDetections(dets); // Update state for UI
            setFrameCount(prev => prev + 1);
        } catch (e) {
            console.warn('Failed to parse message:', e);
        }
    }, []);

    // Initialize camera and WebSocket
    useEffect(() => {
        let mounted = true;

        async function init() {
            setStatus('connecting');
            setError(null);

            // Connect WebSocket
            try {
                const ws = new WebSocket(BACKEND_WS_URL);
                wsRef.current = ws;

                ws.onopen = () => {
                    if (mounted) {
                        setWsConnected(true);
                        console.log('WebSocket connected');
                    }
                };

                ws.onmessage = handleMessage;

                ws.onerror = (e) => {
                    console.error('WebSocket error:', e);
                    if (mounted) {
                        setError('WebSocket connection failed. Is the backend running?');
                    }
                };

                ws.onclose = () => {
                    if (mounted) {
                        setWsConnected(false);
                        console.log('WebSocket closed');
                    }
                };
            } catch (e) {
                setError('Failed to connect to backend');
                setStatus('error');
                return;
            }

            // Start camera
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'environment' }
                });

                if (!mounted) {
                    stream.getTracks().forEach(t => t.stop());
                    return;
                }

                const video = videoRef.current;
                const canvas = canvasRef.current;

                if (video && canvas) {
                    video.srcObject = stream;

                    video.onloadedmetadata = () => {
                        // Set canvas size based on video aspect ratio
                        const aspectRatio = video.videoHeight / video.videoWidth;
                        canvas.width = 640;
                        canvas.height = Math.round(640 * aspectRatio);

                        video.play();
                        setStatus('streaming');

                        // Start smooth render loop
                        renderLoopRef.current = requestAnimationFrame(renderLoop);

                        // Start sending frames at fixed interval
                        sendIntervalRef.current = setInterval(sendFrame, SEND_INTERVAL_MS);
                    };
                }
            } catch (e) {
                console.error('Camera error:', e);
                if (mounted) {
                    setError('Camera access denied or unavailable');
                    setStatus('error');
                }
            }
        }

        init();

        return () => {
            mounted = false;

            // Cleanup render loop
            if (renderLoopRef.current) {
                cancelAnimationFrame(renderLoopRef.current);
            }

            // Cleanup send interval
            if (sendIntervalRef.current) {
                clearInterval(sendIntervalRef.current);
            }

            // Cleanup WebSocket
            if (wsRef.current) {
                wsRef.current.close();
            }

            // Cleanup camera
            const video = videoRef.current;
            if (video?.srcObject) {
                video.srcObject.getTracks().forEach(t => t.stop());
            }
        };
    }, [handleMessage, renderLoop, sendFrame]);

    return (
        <div className="min-h-screen p-4 md:p-8">
            {/* Header */}
            <header className="max-w-7xl mx-auto mb-6">
                <div className="glass rounded-2xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                            <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-primary-300 to-primary-500 bg-clip-text text-transparent">
                                Helmet Detection
                            </h1>
                            <p className="text-xs md:text-sm text-slate-400">Real-time Safety Monitoring</p>
                        </div>
                    </div>
                    <StatusBadge status={status} wsConnected={wsConnected} />
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto">
                {error && (
                    <div className="mb-6 glass rounded-xl p-4 border border-red-500/30 bg-red-500/10">
                        <div className="flex items-center gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                            <div>
                                <p className="text-red-300 font-medium">Connection Error</p>
                                <p className="text-sm text-red-400/80">{error}</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Make sure the backend is running: <code className="bg-slate-800 px-2 py-0.5 rounded">uvicorn app.main:app --reload</code>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-4 gap-6">
                    {/* Video Feed */}
                    <div className="lg:col-span-3">
                        <div className="glass rounded-2xl p-4 md:p-6">
                            <div className="relative bg-slate-900 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                                <video
                                    ref={videoRef}
                                    className="hidden"
                                    playsInline
                                    muted
                                />
                                <canvas
                                    ref={canvasRef}
                                    className="w-full h-full object-contain"
                                />

                                {status === 'connecting' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                                        <div className="text-center">
                                            <RefreshCw className="w-12 h-12 text-primary-400 mx-auto mb-3 animate-spin" />
                                            <p className="text-slate-300">Initializing camera...</p>
                                        </div>
                                    </div>
                                )}

                                {status === 'streaming' && (
                                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 px-3 py-1.5 rounded-full">
                                        <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                                        <span className="text-xs font-medium text-white">LIVE</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <StatsPanel detections={detections} frameCount={frameCount} />
                        <DetectionList detections={detections} />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto mt-8 text-center text-xs text-slate-500">
                <p>Powered by YOLOv8 • Real-time Object Detection</p>
            </footer>
        </div>
    );
}
