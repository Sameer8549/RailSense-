import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Maximize2, X, AlertCircle, PlayCircle, Columns, ScanSearch, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button.jsx";
import { cn } from "@/lib/utils.js";

// -- Helper: Audio Player Dummy ---------------------------------------
function AudioPlayer({ url }) {
  return (
    <div className="flex items-center gap-3 bg-muted/30 border border-border rounded-xl p-3 w-full max-w-sm">
      <button className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 hover:bg-primary/20 transition-colors">
        <PlayCircle className="w-5 h-5" />
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs font-semibold mb-1.5">
          <span>Voice Report</span>
          <span className="text-muted-foreground">0:14 / 0:42</span>
        </div>
        <div className="h-1.5 bg-background rounded-full overflow-hidden w-full">
          <div className="h-full bg-primary rounded-full" style={{ width: "33%" }} />
        </div>
      </div>
    </div>
  );
}

// -- Main EvidenceViewer Component -----------------------------------
export default function EvidenceViewer({ evidence }) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showAi, setShowAi] = useState(true);
  const [showComparison, setShowComparison] = useState(false);

  if (!evidence || (!evidence.images?.length && !evidence.audioUrl)) {
    return <div className="text-sm text-muted-foreground italic">No evidence provided.</div>;
  }

  const images = evidence.images || [];
  const activeImg = images[activeIndex];
  const canCompare = evidence.afterPhotoUrl && activeIndex === 0; // Usually compare first pic with after pic

  const openLightbox = (index) => {
    setActiveIndex(index);
    setLightboxOpen(true);
    setShowComparison(false);
  };

  return (
    <div className="space-y-3">
      {/* Thumbnail Strip */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => openLightbox(i)}
              className="relative group h-20 w-28 rounded-lg overflow-hidden border border-border/50 bg-muted hover:ring-2 hover:ring-primary/50 transition-all focus:outline-none"
            >
              <img src={img.url} alt="Evidence thumbnail" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
              {img.aiDetections?.length > 0 && (
                <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-md text-[9px] font-bold text-primary-foreground px-1.5 py-0.5 rounded flex items-center gap-1">
                  <ScanSearch className="w-2.5 h-2.5" /> AI
                </div>
              )}
            </button>
          ))}
          
          {/* Audio Dummy Thumbnail */}
          {evidence.audioUrl && (
             <div className="h-20 w-28 rounded-lg border border-border/50 bg-muted flex flex-col items-center justify-center gap-1 text-muted-foreground">
               <PlayCircle className="w-5 h-5 opacity-50" />
               <span className="text-[10px] font-bold">Audio Log</span>
             </div>
          )}
        </div>
      )}

      {/* Inline Audio Player if only audio exists or to show alongside thumbs */}
      {evidence.audioUrl && images.length === 0 && (
        <AudioPlayer url={evidence.audioUrl} />
      )}

      {/* Lightbox Portal (Fixed overlay) */}
      <AnimatePresence>
        {lightboxOpen && activeImg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col"
          >
            {/* Header */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-border shrink-0">
              <div className="text-white/80 text-sm font-semibold flex items-center gap-3">
                <span>Evidence Viewer</span>
                <span className="text-white/40">|</span>
                <span>{activeImg.caption}</span>
              </div>
              <div className="flex items-center gap-2">
                {canCompare && (
                  <Button variant="secondary" size="sm" onClick={() => setShowComparison(!showComparison)}
                    className={"h-8 gap-2 border-border text-xs font-bold " + (showComparison ? "bg-primary text-primary-foreground border-primary" : "bg-white/10 text-white hover:bg-white/20")}>
                    <Columns className="w-3.5 h-3.5" /> 
                    {showComparison ? "Hide Comparison" : "Compare Before/After"}
                  </Button>
                )}
                {activeImg.aiDetections?.length > 0 && !showComparison && (
                  <Button variant="secondary" size="sm" onClick={() => setShowAi(!showAi)}
                    className={"h-8 gap-2 border-border text-xs font-bold " + (showAi ? "bg-primary text-primary-foreground border-primary" : "bg-white/10 text-white hover:bg-white/20")}>
                    <ScanSearch className="w-3.5 h-3.5" /> 
                    {showAi ? "Hide AI Analysis" : "Show AI Analysis"}
                  </Button>
                )}
                <div className="w-px h-6 bg-white/20 mx-2" />
                <button onClick={() => setLightboxOpen(false)} className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 min-h-0 relative p-6 flex items-center justify-center">
              {showComparison ? (
                // Comparison Mode
                <div className="w-full h-full flex flex-col md:flex-row gap-6 items-center justify-center">
                   <div className="relative h-full flex flex-col w-full md:w-1/2">
                     <div className="absolute top-4 left-4 z-10 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
                       <AlertCircle className="w-3.5 h-3.5 text-red-400" /> Before Resolution
                     </div>
                     <img src={activeImg.url} className="w-full h-full object-contain rounded-xl border border-border" alt="Before" />
                   </div>
                   <div className="relative h-full flex flex-col w-full md:w-1/2">
                     <div className="absolute top-4 left-4 z-10 bg-black/60 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-border flex items-center gap-2">
                       <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> After Resolution
                     </div>
                     <img src={evidence.afterPhotoUrl} className="w-full h-full object-contain rounded-xl border border-border" alt="After" />
                   </div>
                </div>
              ) : (
                // Single Image Mode
                <div className="relative max-w-full max-h-full">
                  <img src={activeImg.url} alt="Evidence" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-border" />
                  
                  {/* AI Bounding Boxes */}
                  <AnimatePresence>
                    {showAi && activeImg.aiDetections?.map((box, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: idx * 0.1 }}
                        className="absolute border-2 border-primary ring-1 ring-black/50 shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)] z-10"
                        style={{ left: box.x + "%", top: box.y + "%", width: box.w + "%", height: box.h + "%" }}
                      >
                        {/* Label Badge */}
                        <div className="absolute -top-7 left-0 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap flex items-center gap-1.5">
                          <ScanSearch className="w-3 h-3" />
                          {box.label}
                          <span className="bg-black/20 px-1 rounded ml-1">{Math.round(box.confidence * 100)}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
            
            {/* Thumbnail Strip (Bottom) */}
            {images.length > 1 && !showComparison && (
              <div className="h-24 shrink-0 bg-black/50 border-t border-border flex items-center justify-center gap-3 px-6 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveIndex(i)} className={"h-16 w-24 rounded-md overflow-hidden border-2 transition-all opacity-60 hover:opacity-100 " + (activeIndex === i ? "border-primary opacity-100 scale-105" : "border-transparent")}>
                    <img src={img.url} className="w-full h-full object-cover" alt="Thumb" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
