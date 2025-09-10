import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function classifySoil(sand: number, silt: number, clay: number): string {
  // Normalize percentages if they don't sum to 100
  let total = sand + silt + clay;
  if (total === 0) return 'Unclassified';
  if (Math.abs(100 - total) > 5) {
      sand = (sand / total) * 100;
      silt = (silt / total) * 100;
      clay = (clay / total) * 100;
  }

  if (silt + 1.5 * clay < 15) return 'Sand';
  if (silt + 1.5 * clay >= 15 && silt + 2 * clay < 30) return 'Loamy Sand';
  if (clay >= 7 && clay < 20 && sand > 52 && silt + 2 * clay >= 30) return 'Sandy Loam';
  if (clay < 7 && silt >= 50 && silt + 2 * clay >= 30) return 'Silt Loam';
  if (clay >= 7 && clay < 27 && silt >= 28 && silt < 50 && sand <= 52) return 'Loam';
  if (clay >= 20 && clay < 35 && silt < 28 && sand > 45) return 'Sandy Clay Loam';
  if (clay >= 27 && clay < 40 && sand <= 20) return 'Silty Clay Loam';
  if (clay >= 27 && clay < 40 && sand > 20 && sand <= 45) return 'Clay Loam';
  if (clay >= 35 && sand > 45) return 'Sandy Clay';
  if (clay >= 40 && silt >= 40) return 'Silty Clay';
  if (clay >= 40 && sand <= 45 && silt < 40) return 'Clay';
  
  return 'Loam'; // Fallback
}
