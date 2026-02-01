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
        end: "+=300%",
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
  }, [isLoaded, isFailsafe, renderFrame]);

  return (
    <div className="landing-page-wrapper">
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
          <h1 className="text-white text-display-lg font-light tracking-tight mb-8 leading-tight font-display drop-shadow-2xl">
            Orchid.
          </h1>

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
    </div>
  );
}
