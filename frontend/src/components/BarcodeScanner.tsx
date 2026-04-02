import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, ShieldAlert, Zap, ZapOff } from 'lucide-react';

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [success, setSuccess] = useState(false);
  const [searching, setSearching] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);

  // Sound feedback
  const playBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);

        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {
        console.warn("Audio feedback failed", e);
    }
  };

  const playVibrate = () => {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
    }
  };

  useEffect(() => {
    const scannerId = "reader";
    html5QrCodeRef.current = new Html5Qrcode(scannerId, { 
        formatsToSupport: [ 
            Html5QrcodeSupportedFormats.EAN_13, 
            Html5QrcodeSupportedFormats.EAN_8, 
            Html5QrcodeSupportedFormats.UPC_A, 
            Html5QrcodeSupportedFormats.UPC_E, 
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39
        ],
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
        },
        verbose: false 
    });

    const startScanner = async () => {
      try {
        await html5QrCodeRef.current?.start(
          { facingMode: "environment" },
          {
            fps: 30,
            qrbox: (viewWidth, viewHeight) => {
                // Wide rectangle for 1D barcodes like EAN-13
                const width = Math.min(viewWidth * 0.95, 420);
                const height = Math.min(viewHeight * 0.4, 160);
                return { width, height };
            },
            aspectRatio: 1.777778,
          },
          (decodedText) => {
            playBeep();
            playVibrate();
            setSuccess(true);
            setSearching(true);
            setTimeout(() => {
                onScan(decodedText);
            }, 800); // Slightly more delay to show "Detected!" message clearly
          },
          () => {}
        );
        
        setIsInitializing(false);
        
        // Check for flash capability
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
            setHasFlash(true); // Assume true for environment cameras on mobile
        }
      } catch (err: any) {
        console.error("Scanner start error:", err);
        setError("Unable to access camera. Please ensure permissions are granted.");
        setIsInitializing(false);
      }
    };

    startScanner();

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, [onScan]);

  const toggleFlash = async () => {
    if (!html5QrCodeRef.current) return;
    try {
        const newState = !flashOn;
        // In html5-qrcode, torch is controlled via applyVideoConstraints on the track
        // Note: This is sometimes flaky depending on the browser version
        const track = (html5QrCodeRef.current as any)._videoElement?.srcObject?.getVideoTracks()[0];
        if (track) {
            await track.applyConstraints({
                advanced: [{ torch: newState } as any]
            });
            setFlashOn(newState);
        }
    } catch (e) {
        console.error("Flash toggle failed", e);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden relative shadow-2xl">
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 z-10 p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Pro Scanner</h2>
          <p className="text-sm text-slate-500 mt-1">High-precision optical detection active</p>
        </div>

        <div className="p-4 bg-black relative min-h-[300px] flex items-center justify-center overflow-hidden">
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[30] bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                <p className="text-[10px] text-white font-bold uppercase tracking-widest whitespace-nowrap">
                   Center barcode in the box
                </p>
            </div>
            {isInitializing && !error && (
              <div className="text-white text-center z-10">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white mx-auto mb-3"></div>
                <p className="text-sm font-medium opacity-80 uppercase tracking-widest">Calibrating...</p>
              </div>
            )}
            
            {!isInitializing && !error && (
              <div className={`absolute inset-0 pointer-events-none z-10 flex items-center justify-center transition-all duration-300 ${success ? 'bg-emerald-500/30' : ''}`}>
                   <div className={`w-[420px] max-w-[95%] h-[160px] border-2 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)] transition-colors duration-200 ${success ? 'border-emerald-400' : 'border-blue-500'}`}>
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white -mt-1 -ml-1 rounded-tl"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white -mt-1 -mr-1 rounded-tr"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white -mb-1 -ml-1 rounded-bl"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white -mb-1 -mr-1 rounded-br"></div>
                      
                      {!success && <div className="w-full h-0.5 bg-blue-400 absolute top-0 animate-[scan_2s_linear_infinite] opacity-50 shadow-[0_0_8px_blue]"></div>}
                  </div>
                  
                  {success && (
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2">
                          <div className="text-emerald-400 font-black text-xl tracking-widest uppercase animate-bounce">
                              Detected!
                          </div>
                          {searching && (
                              <div className="bg-white/90 px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping"></div>
                                  <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest">Searching...</span>
                              </div>
                          )}
                      </div>
                  )}
              </div>
            )}

            {!isInitializing && hasFlash && (
                <button 
                  onClick={toggleFlash}
                  className={`absolute left-4 bottom-4 z-20 p-3 rounded-full transition-all ${flashOn ? 'bg-yellow-400 text-slate-900 border-2 border-yellow-200' : 'bg-white/10 text-white border border-white/20'}`}
                >
                    {flashOn ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5 opacity-70" />}
                </button>
            )}

            {error && (
              <div className="text-center px-6 z-10">
                <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3 opacity-80" />
                <p className="text-slate-300 text-sm leading-relaxed">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-6 px-5 py-2.5 bg-white text-slate-900 font-bold rounded-xl text-sm transition-all"
                >
                  Retry Connection
                </button>
              </div>
            )}
            
            <div id="reader" className="w-full h-full"></div>
        </div>

        <div className="p-6 bg-slate-50">
            <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input 
                    type="text" 
                    placeholder="Enter Barcode / SKU..." 
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
                <button 
                   type="submit"
                   className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-900 transition-all font-mono"
                >
                    ADD
                </button>
            </form>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span className="flex items-center gap-2 italic">
                    <Camera className="w-3.5 h-3.5" />
                    Auto-focus active
                </span>
                <span>v1.3 PRO</span>
            </div>
        </div>
      </div>
      
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default BarcodeScanner;
