export interface Particle {
  x: number;      // Current X
  y: number;      // Current Y
  originX: number; // Original X from image
  originY: number; // Original Y from image
  size: number;
  alpha: number;   // Opacity
  
  // Physics properties for the smoke simulation
  vx: number;      // Random velocity X bias
  vy: number;      // Random velocity Y bias
  delay: number;   // Threshold for when this particle starts moving (0-1)
  noiseOffset: number; // For perlin-like movement
}

export interface SmokeConfig {
  gap: number;         // Pixel skip (quality vs performance)
  particleSize: number;
  mouseEase: number;   // How fast the effect catches up to mouse
}