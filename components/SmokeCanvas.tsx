import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Particle } from '../types';
import { CANVAS_CONFIG } from '../constants';
import { SimplexNoise } from '../utils/simplex';

interface SmokeCanvasProps {
  imageSrc: string;
}

const SmokeCanvas: React.FC<SmokeCanvasProps> = ({ imageSrc }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // State to track loading and interaction
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0); 

  // Refs for animation loop
  const particlesRef = useRef<Particle[]>([]);
  const requestRef = useRef<number>();
  const mouseProgressRef = useRef(0);
  const currentProgressRef = useRef(0);
  const simplexRef = useRef<SimplexNoise | null>(null);

  // Initialize Particles
  const initParticles = useCallback((img: HTMLImageElement, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
    // Initialize Noise once
    if (!simplexRef.current) {
      simplexRef.current = new SimplexNoise();
    }

    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);
    
    const scale = Math.min(width / img.width, height / img.height) * 0.75;
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const startX = (width - drawW) / 2;
    const startY = (height - drawH) / 2 + (height * 0.15); 

    ctx.drawImage(img, startX, startY, drawW, drawH);
    
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    const particles: Particle[] = [];
    const gap = CANVAS_CONFIG.gap;

    for (let y = 0; y < height; y += gap) {
      for (let x = 0; x < width; x += gap) {
        const index = (y * width + x) * 4;
        const alpha = data[index + 3];
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];

        // If pixel is visible and dark
        if (alpha > 100 && (r + g + b) < 650) { 
          particles.push({
            x: x,
            y: y,
            originX: x,
            originY: y,
            size: CANVAS_CONFIG.particleSize + (Math.random() * 1.0), 
            alpha: 1,
            vx: 0, 
            vy: 0,  
            delay: Math.random() * 0.5, 
            noiseOffset: Math.random() * 1000 
          });
        }
      }
    }

    particlesRef.current = particles;
    ctx.clearRect(0, 0, width, height); 
    setIsLoaded(true);
  }, []);

  // Fractal Brownian Motion like function to get multi-layered noise
  const getFBM = useCallback((x: number, y: number, t: number) => {
    const simplex = simplexRef.current;
    if (!simplex) return 0;
    
    // Mimic the logic: noise(p*s1)*w1 + noise(p*s2)*w2 ...
    // Scale1 = 0.003, Scale2 = 0.006 (Doubled)
    let n = simplex.noise3D(x * 0.003, y * 0.003, t) * 1.0;
    n += simplex.noise3D(x * 0.006, y * 0.006, t) * 0.5;
    n += simplex.noise3D(x * 0.012, y * 0.012, t) * 0.25;
    return n; // Range roughly -1.75 to 1.75
  }, []);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    const target = mouseProgressRef.current;
    const current = currentProgressRef.current;
    const ease = 0.05; 
    currentProgressRef.current = current + (target - current) * ease;
    
    ctx.clearRect(0, 0, width, height);

    const particles = particlesRef.current;
    const globalProgress = currentProgressRef.current;
    const time = Date.now() * 0.0003; // Slow time for graceful smoke

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      let pProgress = (globalProgress * 1.6) - p.delay;
      pProgress = Math.max(0, Math.min(1, pProgress));

      if (pProgress <= 0) {
        // Solid State
        p.x = p.originX;
        p.y = p.originY;
        p.alpha = 1;
        
        ctx.fillStyle = `${CANVAS_CONFIG.baseColor}1)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // --- NOISE DRIVEN SMOKE SIMULATION ---
        
        // 1. Get Gradient/Flow Field from FBM Noise
        // The noise value determines the angle of movement, creating swirls
        const noiseVal = getFBM(p.originX, p.originY, time); 
        
        // Map noise (-1.75 to 1.75) to an angle (0 to 2PI approx)
        // We add an offset based on pProgress so the swirl changes as it moves away
        const angle = noiseVal * Math.PI * 2; 

        // 2. Calculate Velocity Vector
        // Basic upward movement + turbulent swirl
        const swirlX = Math.cos(angle);
        const swirlY = Math.sin(angle);

        // 3. Apply displacement
        // Rise faster as progress increases
        const rise = pProgress * 250; 
        
        // Horizontal spread is driven by the noise swirl
        const spread = pProgress * 120;

        p.x = p.originX + (swirlX * spread);
        p.y = p.originY - rise + (swirlY * spread * 0.5); // Less Y swirl, mostly rise

        // 4. Expansion & Diffusion
        const sizeMult = 1 + (pProgress * 4); // Expand up to 5x
        
        // 5. Alpha Decay
        // Non-linear fade: stays visible for a bit, then fades
        p.alpha = Math.max(0, (1 - Math.pow(pProgress, 0.8)) * 0.7);

        if (p.alpha > 0.01) {
          ctx.fillStyle = `${CANVAS_CONFIG.baseColor}${p.alpha})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, (p.size * sizeMult) / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    requestRef.current = requestAnimationFrame(animate);
  }, [getFBM]);

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    let clientX;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = (e as React.MouseEvent).clientX;
    }
    const { innerWidth } = window;
    const rawProgress = Math.max(0, Math.min(1, clientX / innerWidth));
    mouseProgressRef.current = rawProgress;
    setProgress(rawProgress); 
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    let loadedImage: HTMLImageElement | null = null;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      if (loadedImage) {
        initParticles(loadedImage, canvas, ctx);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 

    const img = new Image();
    if (!imageSrc.startsWith('data:')) {
      img.crossOrigin = "Anonymous";
    }
    img.src = imageSrc;

    img.onload = () => {
      loadedImage = img;
      initParticles(img, canvas, ctx);
      requestRef.current = requestAnimationFrame(animate);
    };

    img.onerror = (e) => {
      console.error("Image load error:", e);
      setError("Failed to load image.");
    };

    return () => {
      window.removeEventListener('resize', handleResize);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [imageSrc, animate, initParticles]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-gray-100 cursor-ew-resize overflow-hidden touch-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleMouseMove}
    >
      <canvas ref={canvasRef} className="block w-full h-full" />

      {!isLoaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-gray-500 font-mono animate-pulse">Initializing FBM Smoke...</div>
        </div>
      )}
      
      {error && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-red-500 font-bold bg-white p-4 rounded shadow text-center max-w-lg">
            {error}
          </div>
        </div>
      )}

      <div className={`absolute bottom-8 left-0 right-0 text-center transition-opacity duration-500 pointer-events-none ${progress > 0.1 ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-gray-400 font-light tracking-widest text-sm uppercase">
          Move cursor horizontally to disperse
        </p>
      </div>
    </div>
  );
};

export default SmokeCanvas;