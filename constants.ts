// Using the raw GitHub URL for the silhouette image.
// We use raw.githubusercontent.com to ensure we get the image binary, not the GitHub HTML page.
export const SOURCE_IMAGE_SRC = "https://raw.githubusercontent.com/dantenerolmh/Tuchuang/main/silhouette.png";

export const CANVAS_CONFIG = {
  gap: 3, // Increased from 2 to 3 to handle the heavier FBM noise calculations smoothly
  particleSize: 1.8, // Slightly larger to maintain visibility with lower density
  baseColor: 'rgba(50, 55, 60, ', // Dark slate gray for tobacco smoke look
};