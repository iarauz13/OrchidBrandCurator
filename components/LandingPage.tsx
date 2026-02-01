import React, { useRef, useState, useEffect, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 285;
const LOADING_TIMEOUT = 5000;

interface LandingPageProps {
  onEnter: () => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFailsafe, setIsFailsafe] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const imagesRef = useRef<HTMLImageElement[]>([]);

  const renderFrame = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement, width: number, height: number) => {
    if (!img || !ctx) return;
    const scale = Math.max(width / img.width, height / img.height);
    const x = (width / 2) - (img.width / 2) * scale;
    const y = (height / 2) - (img.height / 2) * scale;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
  }, []);

  const updateCanvasSize = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.width = window.innerWidth;
      canvasRef.current.height = window.innerHeight;

      if (imagesRef.current.length > 0) {
        const ctx = canvasRef.current.getContext("2d");
        const img = imagesRef.current[0];
        if (ctx && img && img.complete) {
          renderFrame(ctx, img, window.innerWidth, window.innerHeight);
        }
      }
    }
  }, [renderFrame]);

  useEffect(() => {
    window.addEventListener("resize", updateCanvasSize);
    updateCanvasSize();
    return () => window.removeEventListener("resize", updateCanvasSize);
  }, [updateCanvasSize]);

  useEffect(() => {
    let mounted = true;

    const timeoutId = setTimeout(() => {
      if (mounted && imagesRef.current.length === 0) {
        console.warn("Archival assets unreachable. Activating Silk Failsafe.");
        setIsFailsafe(true);
      }
    }, LOADING_TIMEOUT);

    const loadAssets = async () => {
      const loadedImages: HTMLImageElement[] = [];
      let loadedCount = 0;

      const loadSingleFrame = (i: number): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = () => resolve(null);
          // TARGET: Sequential PNG sequence
          img.src = `/orchid/orchid_${i.toString().padStart(3, "0")}.png`;
        });
      };

      for (let i = 1; i <= FRAME_COUNT; i++) {
        if (!mounted) break;
        const img = await loadSingleFrame(i);
        if (img) {
          loadedImages.push(img);
          loadedCount++;
          if (mounted) setLoadProgress(Math.round((loadedCount / FRAME_COUNT) * 100));
        } else if (i === 1) {
          if (mounted) setIsFailsafe(true);
          break;
        }
      }

      if (mounted && loadedImages.length > 0) {
        imagesRef.current = loadedImages;
        setIsLoaded(true);
        clearTimeout(timeoutId);
      }
    };

    loadAssets();
    return () => {
      mounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  useGSAP(() => {
    if (!isLoaded || isFailsafe || !canvasRef.current || imagesRef.current.length === 0) return;

    const context = canvasRef.current.getContext("2d");
    const frames = { current: 0 };

    gsap.to(frames, {
      current: imagesRef.current.length - 1,
      snap: "current",
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        start: "top top",
        end: "+=200%",
        scrub: 1,
        pin: true,
      },
      onUpdate: () => {
        const img = imagesRef.current[Math.floor(frames.current)];
        if (context && img) {
          renderFrame(context, img, canvasRef.current!.width, canvasRef.current!.height);
        }
      }
    });

    // Animate Logo Color via Filter
    // Start: White (Invert 1, Grayscale 1, Brightness 3)
    // End: Peach (Invert 1, Sepia 1, Hue Rotate -40deg, Saturate 4, Brightness 0.9)
    gsap.fromTo(logoRef.current,
      { filter: "invert(1) grayscale(1) brightness(3)" },
      {
        filter: "invert(1) sepia(1) hue-rotate(-20deg) saturate(4) brightness(1.5) contrast(1.2)",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=200%",
          scrub: true,
        }
      }
    );
  }, [isLoaded, isFailsafe, renderFrame]);

  return (
    <div className="landing-page-wrapper bg-black text-white min-h-screen">
      {/* Hero Section (Pinned) */}
      <div ref={containerRef} className={`relative w-full h-screen overflow-hidden ${isFailsafe ? 'silk-bg' : 'bg-black'}`}>
        <canvas
          ref={canvasRef}
          className={`block w-full h-full transition-opacity duration-1000 ${isLoaded && !isFailsafe ? 'opacity-60' : 'opacity-0'} ${isFailsafe ? 'hidden' : ''}`}
        />

        {!isLoaded && !isFailsafe && (
          <div className="absolute inset-0 z-40 flex items-center justify-center bg-black text-white">
            <div className="text-center">
              <div className="text-4xl font-display font-light mb-4 italic opacity-80">{loadProgress}%</div>
              <div className="w-48 h-px bg-white/10 relative overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-white transition-all duration-300"
                  style={{ width: `${loadProgress}%` }}
                />
              </div>
              <p className="mt-8 text-[9px] uppercase tracking-[0.6em] text-white/30 font-bold animate-pulse">
                Initializing Archive
              </p>
            </div>
          </div>
        )}

        <div className={`absolute inset-0 flex flex-col items-center justify-center z-20 px-6 transition-all duration-1000 ${(isLoaded || isFailsafe) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="mb-10 drop-shadow-2xl">
            <img
              ref={logoRef as any}
              src="/orchid_full_logo.png"
              alt="Orchid Architecture"
              className="w-full max-w-sm md:max-w-xl object-contain mix-blend-screen"
              style={{ filter: "invert(1) grayscale(1) brightness(3)" }}
            />
          </div>

          <p className="text-display-sm font-normal tracking-wide text-white/50 max-w-xl text-center leading-relaxed font-display mb-12">
            The architectural vault for your personal brand library.
            Archive and discover with editorial precision.
          </p>

          <button
            onClick={onEnter}
            className="group relative px-12 py-5 bg-white/5 border border-white/10 rounded-full font-sans font-semibold tracking-widest uppercase text-[10px] overflow-hidden transition-all hover:border-white/40 hover:bg-white/10 active:scale-95 shadow-2xl backdrop-blur-md"
          >
            <span className="relative z-10 text-white">Enter Registry</span>
            <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        </div>

        {(isLoaded || isFailsafe) && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 opacity-20 text-[9px] uppercase tracking-[0.8em] font-sans font-semibold flex flex-col items-center gap-6 text-white pointer-events-none">
            <span>{isFailsafe ? 'Archival UI Active' : 'Scroll to Pan'}</span>
            <div className="w-px h-12 bg-gradient-to-b from-white to-transparent" />
          </div>
        )}
      </div>

      {/* Philosophy / Features Section */}
      <div className="relative z-10 bg-black py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Philosophy Statement */}
          <div className="mb-32 text-center">
            <h2 className="text-3xl md:text-5xl font-display font-light mb-8 text-white/90">Curate with Intention.</h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed font-light">
              In an age of infinite feeds, Orchid helps you build a permanent sanctuary for your inspiration.
              Move beyond fleeting bookmarks into a structured, architectural library designed for clarity.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="p-8 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 mb-6 text-white/80 border border-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-white">Smart Import</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Effortlessly migrate from Instagram or messy CSVs. Our intelligent engine maps your columns and normalizes data automatically.
              </p>
            </div>

            <div className="p-8 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 mb-6 text-white/80 border border-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-white">Visual Folios</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Organize brands into visual collections. Create folios for "Sustainable Fashion" or "Interior Design" with drag-and-drop ease.
              </p>
            </div>

            <div className="p-8 border border-white/5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
              <div className="w-12 h-12 mb-6 text-white/80 border border-white/20 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-display font-medium mb-3 text-white">Privacy First</h3>
              <p className="text-sm text-white/40 leading-relaxed">
                Your sanctuary belongs to you. Data is stored locally or in your private cloud. No tracking, no ads, just your curated world.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black py-12 text-center">
        <p className="text-white/20 text-[10px] uppercase tracking-widest font-semibold">
          © 2026 Orchid. Crafted for the discerning.
        </p>
      </footer>
    </div>
  );
}
