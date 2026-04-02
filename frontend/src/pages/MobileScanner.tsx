import { useState, useCallback, useEffect, useRef } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { useQueryClient } from "@tanstack/react-query";
import { X, Search, Plus, Minus, CheckCircle, Zap, ZapOff, ShieldAlert, Camera, Package } from "lucide-react";
import { productsApi, inventoryApi } from "../api/endpoints";
import AddProductModal from "./AddProductModal";

export default function MobileScanner() {
  const [scanning, setScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [product, setProduct] = useState<any | null>(null);
  const [qtyChange, setQtyChange] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [flashOn, setFlashOn] = useState(false);
  const [hasFlash, setHasFlash] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [prefill, setPrefill] = useState<any>(null);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [availableCameras, setAvailableCameras] = useState<any[]>([]);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const qc = useQueryClient();

  const playBeep = () => {
    try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.2);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (e) {}
  };

  const playVibrate = () => {
    if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(200);
    }
  };

  const stopScanner = useCallback(async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        try {
            await html5QrCodeRef.current.stop();
        } catch (e) {
            console.error("Stop failed", e);
        }
    }
  }, []);

  const startScanner = useCallback(async () => {
    setScanning(true);
    setIsInitializing(true);
    setError(null);
    setProduct(null);
    setSuccess(false);
    setScanSuccess(false);

    // Wait for DOM
    setTimeout(async () => {
        try {
            const scannerId = "reader";
            if (html5QrCodeRef.current) {
                await stopScanner();
            }
            
            html5QrCodeRef.current = new Html5Qrcode(scannerId, { 
                formatsToSupport: [ 
                    Html5QrcodeSupportedFormats.EAN_13, 
                    Html5QrcodeSupportedFormats.EAN_8, 
                    Html5QrcodeSupportedFormats.UPC_A, 
                    Html5QrcodeSupportedFormats.UPC_E, 
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39
                ],
                experimentalFeatures: { useBarCodeDetectorIfSupported: true },
                verbose: false 
            });

            const config: any = {
                fps: 30,
                qrbox: (vw: number, vh: number) => {
                    const width = Math.min(vw * 0.9, 360);
                    const height = Math.min(vh * 0.45, 180);
                    return { width, height };
                },
            };

            const startWithConstraints = async (constraints: any) => {
                try {
                    await html5QrCodeRef.current?.start(
                        constraints,
                        config,
                        async (decodedText) => {
                            playBeep();
                            playVibrate();
                            setScanSuccess(true);
                            await stopScanner();
                            setScanning(false);
                            await fetchProductByBarcode(decodedText);
                        },
                        () => {}
                    );
                    return true;
                } catch (e) {
                    console.warn("Constraint failed", constraints, e);
                    return false;
                }
            };

            // Strategy 1: High quality environment
            let started = await startWithConstraints({ 
                facingMode: "environment",
                width: { ideal: 1280 },
                height: { ideal: 720 }
            });

            // Strategy 2: Standard environment
            if (!started) {
                started = await startWithConstraints({ facingMode: "environment" });
            }

            // Strategy 3: Any camera
            if (!started) {
                started = await startWithConstraints({ facingMode: "user" });
            }

            // Strategy 4: Brute force first camera ID
            if (!started) {
                const cameras = await Html5Qrcode.getCameras();
                if (cameras && cameras.length > 0) {
                    started = await startWithConstraints({ deviceId: cameras[0].id });
                }
            }

            if (!started) throw new Error("All camera strategies failed.");

            setIsInitializing(false);
            const cameras = await Html5Qrcode.getCameras();
            if (cameras && cameras.length > 0) {
                setAvailableCameras(cameras);
                setHasFlash(true);
            }

        } catch (err: any) {
            console.error("Scanner failed", err);
            if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                setError("Security Error: Camera requires an HTTPS connection on mobile devices.");
            } else {
                setError("Camera Error: Please ensure camera permissions are granted and no other app is using it.");
            }
            setIsInitializing(false);
        }
    }, 100);
  }, [stopScanner]);

  const cycleCamera = useCallback(async () => {
    if (availableCameras.length < 2) return;
    const nextIndex = (cameraIndex + 1) % availableCameras.length;
    setCameraIndex(nextIndex);
    await stopScanner();
    setScanning(true);
    setIsInitializing(true);
    
    setTimeout(async () => {
        try {
            const scannerId = "reader";
            html5QrCodeRef.current = new Html5Qrcode(scannerId);
            await html5QrCodeRef.current.start(
                availableCameras[nextIndex].id,
                {
                    fps: 30,
                    qrbox: (vw, vh) => ({ width: Math.min(vw * 0.9, 360), height: Math.min(vh * 0.45, 180) }),
                },
                async (decodedText) => {
                    playBeep();
                    playVibrate();
                    setScanSuccess(true);
                    await stopScanner();
                    setScanning(false);
                    await fetchProductByBarcode(decodedText);
                },
                () => {}
            );
            setIsInitializing(false);
        } catch (e) {
            setError("Failed to switch camera.");
            setIsInitializing(false);
        }
    }, 100);
  }, [availableCameras, cameraIndex, stopScanner]);

  useEffect(() => {
    return () => {
        stopScanner();
    };
  }, [stopScanner]);

  const toggleFlash = async () => {
    if (!html5QrCodeRef.current) return;
    try {
        const newState = !flashOn;
        const track = (html5QrCodeRef.current as any)._videoElement?.srcObject?.getVideoTracks()[0];
        if (track) {
            await track.applyConstraints({ advanced: [{ torch: newState } as any] });
            setFlashOn(newState);
        }
    } catch (e) {}
  };

  const fetchProductByBarcode = async (barcode: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsApi.barcodeLookup(barcode);
      if (res.data.found_locally && res.data.product) {
        setProduct(res.data.product);
        setQtyChange(0);
      } else {
        // If external data exists, or if not found, we offer to add it.
        setPrefill(res.data.external_data || { barcode: barcode });
        setShowAddModal(true);
      }
    } catch {
       // On technical error, at least capture the barcode for manual input
       setPrefill({ barcode: barcode });
       setShowAddModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async () => {
    if (!product || qtyChange === 0) return;
    setLoading(true);
    try {
      const locRes = await inventoryApi.locations();
      if (!locRes.data.results || locRes.data.results.length === 0) {
         setError("No locations available.");
         return;
      }
      const location_id = locRes.data.results[0].id;
      
      // Get the correct variant ID (defaulting to the first one for direct scan)
      // Products returned from barcodeLookup include variant info if it was a variant match
      const variant_id = product.variants?.[0]?.id || product.id; 

      await inventoryApi.adjust({
        variant_id,
        location_id,
        quantity_change: qtyChange,
        notes: "Quick Mobile Scan"
      });

      setSuccess(true);
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      
      setTimeout(() => {
        setSuccess(false);
        setProduct(null);
      }, 2000);
    } catch {
      setError("Failed to adjust stock.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-slate-900">Mobile Scanner</h1>
        <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">PWA Quick Stock Adjustments</p>
      </div>

      {!scanning && !product && !success && (
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center space-y-4">
           <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2">
              <Search className="w-10 h-10" />
           </div>
           <p className="text-slate-600 font-medium">Scan an item's barcode from your device camera to instantly update stock levels.</p>
           <button 
             onClick={startScanner}
             className="w-full mt-4 bg-slate-900 text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-slate-800 transition-all active:scale-95"
           >
             Start Camera Scanner
           </button>
        </div>
      )}

      {scanning && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden relative animate-in zoom-in-95 duration-200">
           <div className="flex justify-between items-center p-4 bg-slate-50 border-b border-slate-100">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="font-bold text-slate-700 text-sm">Active Scanner</span>
             </div>
             <button onClick={() => { stopScanner(); setScanning(false); }} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors">
               <X className="w-5 h-5" />
             </button>
           </div>
           
           {/* Scanner Engine Container */}
           <div className="relative min-h-[350px] bg-slate-900 border-none overflow-hidden">
                {/* Visual Overlay (Pointer Events None) */}
                <div className="absolute inset-0 z-20 pointer-events-none grid place-items-center transition-all">
                    <div className="relative flex items-center justify-center w-full h-full">
                        {/* Center Guidance Box */}
                        <div className={`relative w-[420px] max-w-[90%] h-[160px] border-2 rounded-2xl overflow-hidden shadow-[0_0_0_4000px_rgba(0,0,0,0.7)] transition-all ${scanSuccess ? 'border-emerald-400 scale-105' : 'border-blue-500'}`}>
                             {!scanSuccess && (
                                 <div className="w-full h-1.5 bg-blue-400 absolute top-0 animate-[scan_2s_ease-in-out_infinite] opacity-80 blur-[1px] shadow-[0_0_20px_#60a5fa]"></div>
                             )}
                        </div>
                        
                        {/* Status overlays inside logic sub-container */}
                        {!scanSuccess && (
                             <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[30] bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                                 <p className="text-[10px] text-white font-bold uppercase tracking-widest whitespace-nowrap">
                                    Align barcode in the center
                                 </p>
                             </div>
                        )}

                        {scanSuccess && (
                             <div className="absolute z-20 flex flex-col items-center gap-3 animate-in zoom-in-50">
                                 <div className="bg-emerald-500 text-white p-3 rounded-full shadow-xl">
                                     <CheckCircle className="w-10 h-10" />
                                 </div>
                                 <div className="text-white font-black text-2xl uppercase tracking-tighter drop-shadow-lg">Detected!</div>
                             </div>
                        )}
                    </div>
                </div>

                {isInitializing && (
                   <div className="absolute inset-0 z-30 bg-slate-900 flex flex-col items-center justify-center text-white text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-white mx-auto mb-4"></div>
                      <p className="text-xs font-bold opacity-60 uppercase tracking-widest animate-pulse">Requesting Camera Feed...</p>
                   </div>
                )}

                {/* Control Buttons Overlay */}
                <div className="absolute right-4 bottom-4 left-4 z-[40] flex justify-between items-center">
                    {hasFlash && (
                        <button 
                          onClick={toggleFlash}
                          className={`p-4 rounded-full shadow-2xl transition-all ${flashOn ? 'bg-yellow-400 text-slate-900 ring-4 ring-yellow-200' : 'bg-white/10 text-white border border-white/20'}`}
                        >
                            {flashOn ? <Zap className="w-6 h-6" /> : <ZapOff className="w-6 h-6 opacity-70" />}
                        </button>
                    )}
                    
                    {availableCameras.length > 1 && (
                         <button 
                           onClick={cycleCamera}
                           className="bg-white/10 text-white border border-white/20 p-4 rounded-full shadow-2xl backdrop-blur-md hover:bg-white/20 transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                         >
                             <Camera className="w-5 h-5" />
                             {availableCameras.length} Cams
                         </button>
                    )}
                </div>
                
                {/* The actual video target div - No complex flex styles here */}
                <div id="reader" className="w-full h-full min-h-[350px] relative z-0"></div>
           </div>
        </div>
      )}

      {loading && !scanning && !product && (
         <div className="bg-white p-12 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Connecting to inventory...</p>
         </div>
      )}

      {error && !scanning && (
         <div className="bg-rose-50 text-rose-600 p-6 rounded-2xl border border-rose-200 text-sm font-bold text-center animate-in shake duration-300">
            <ShieldAlert className="w-10 h-10 mx-auto mb-3 opacity-50" />
            {error}
            <button 
              onClick={startScanner} 
              className="mt-6 w-full bg-rose-600 text-white py-3 rounded-xl hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200"
            >
              Try Again
            </button>
         </div>
      )}

      {success && (
         <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center animate-in zoom-in-95">
            <div className="w-24 h-24 bg-white rounded-full shadow-xl shadow-emerald-200 flex items-center justify-center mb-6">
                <CheckCircle className="w-16 h-16 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-black text-emerald-900">Stock Updated!</h3>
            <p className="text-emerald-700 font-medium mt-2">The inventory has been adjusted successfully.</p>
         </div>
      )}

      {product && !success && !loading && (
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 border border-slate-100">
          <div className="bg-slate-900 text-white p-6 pb-12">
             <div className="flex justify-between items-start mb-4">
                <div className="bg-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Match Found</div>
                <button onClick={() => setProduct(null)} className="text-white/40 hover:text-white transition-colors">
                  <X className="w-6 h-6" />
                </button>
             </div>
             <h2 className="text-2xl font-black leading-tight">{product.name}</h2>
             <p className="text-white/60 font-mono text-xs mt-1 uppercase tracking-tighter">{product.sku}</p>
          </div>
          
          <div className="p-6 -mt-8 bg-white rounded-t-3xl space-y-8">
             <div className="flex justify-center -mt-16">
                <div className="w-32 h-32 bg-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden">
                    {product.images?.[0] ? (
                       <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-300">
                          <Package className="w-12 h-12" />
                       </div>
                    )}
                </div>
             </div>

             <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
                <div className="flex flex-col items-center gap-4">
                   <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Adjust Quantity</span>
                   <div className="flex items-center gap-8">
                      <button 
                        onClick={() => setQtyChange(q => q - 1)}
                        className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 text-rose-500 hover:text-rose-600 active:scale-95 transition-all flex items-center justify-center"
                      >
                        <Minus className="w-8 h-8" />
                      </button>
                      <div className="text-center">
                        <span className="text-5xl font-black text-slate-900 tabular-nums leading-none">
                            {qtyChange > 0 ? `+${qtyChange}` : qtyChange}
                        </span>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">Units</p>
                      </div>
                      <button 
                        onClick={() => setQtyChange(q => q + 1)}
                        className="w-14 h-14 rounded-2xl bg-white shadow-md border border-slate-200 text-emerald-500 hover:text-emerald-600 active:scale-95 transition-all flex items-center justify-center"
                      >
                        <Plus className="w-8 h-8" />
                      </button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100/50">
                    <span className="text-[10px] font-bold text-blue-500 uppercase block mb-1">Current Stock</span>
                    <span className="text-xl font-black text-blue-900">{product.total_stock} Units</span>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100/50">
                    <span className="text-[10px] font-bold text-amber-600 uppercase block mb-1">Selling Price</span>
                    <span className="text-xl font-black text-amber-900">${product.selling_price}</span>
                </div>
             </div>

             <button 
               onClick={handleAdjustStock}
               disabled={qtyChange === 0 || loading}
               className="w-full bg-slate-900 text-white font-black py-5 rounded-2xl shadow-xl hover:bg-slate-800 disabled:opacity-30 transition-all active:scale-95 shadow-slate-200"
             >
               {loading ? "Updating..." : "Save Adjustment"}
             </button>
          </div>
        </div>
      )}

      {/* Quick Add Product Modal */}
      <AddProductModal 
        open={showAddModal} 
        onClose={() => { setShowAddModal(false); setPrefill(null); startScanner(); }} 
        prefill={prefill}
      />

      {/* Internal Style for Scanning Animation & Video Fix */}
      <style>{`
        #reader video {
            object-fit: cover !important;
            width: 100% !important;
            height: 100% !important;
            opacity: 1 !important;
            display: block !important;
        }
        #reader {
            overflow: hidden;
            border-radius: 1.5rem;
        }
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-in {
          animation-duration: 400ms;
          animation-fill-mode: both;
        }
        .zoom-in-95 {
           animation-name: zoom-in;
        }
        @keyframes zoom-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .slide-in-from-bottom-8 {
           animation-name: slide-up;
        }
        @keyframes slide-up {
          from { transform: translateY(2rem); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
