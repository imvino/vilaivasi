//lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Helper function for combining Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Levenshtein distance for calculating string similarity
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  
  // Create a matrix of size (m+1) x (n+1)
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0));
  
  // Initialize the first row and column
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // deletion
          dp[i][j - 1] + 1, // insertion
          dp[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  
  return dp[m][n];
}

// Calculate similarity score between two strings (0 to 1)
export function calculateSimilarity(str1: string, str2: string): number {
  // Normalize strings: convert to lowercase and remove extra spaces
  const normalized1 = str1.toLowerCase().trim();
  const normalized2 = str2.toLowerCase().trim();
  
  if (normalized1 === normalized2) return 1.0;
  if (normalized1.length === 0 || normalized2.length === 0) return 0.0;
  
  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  
  // Calculate similarity score (0 to 1)
  return 1 - distance / maxLength;
}

// Function to normalize brand names for comparison
export function normalizeBrandName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

// Function to check if two brand names are similar enough to be considered matches
export function areBrandsSimilar(brand1: string, brand2: string, threshold = 0.8): boolean {
  const normalizedBrand1 = normalizeBrandName(brand1);
  const normalizedBrand2 = normalizeBrandName(brand2);
  
  // Check if one brand contains the other
  if (normalizedBrand1.includes(normalizedBrand2) || normalizedBrand2.includes(normalizedBrand1)) {
    return true;
  }
  
  // Calculate similarity score
  const similarity = calculateSimilarity(normalizedBrand1, normalizedBrand2);
  return similarity >= threshold;
}

// Function to generate a suggested canonical brand name from a list of variant names
export function suggestCanonicalName(brandNames: string[]): string {
  if (brandNames.length === 0) return '';
  if (brandNames.length === 1) return brandNames[0];
  
  // Sort by length (shortest to longest)
  const sortedBrands = [...brandNames].sort((a, b) => a.length - b.length);
  
  // Find the most common words across all brand names
  const words = sortedBrands.flatMap(brand => 
    brand.toLowerCase().split(/\s+/).filter(word => word.length > 1)
  );
  
  // Count word frequency
  const wordCounts = words.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Find most common words and sort by frequency
  const mostCommonWords = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);
  
  // If we have common words, use them; otherwise return the shortest name
  if (mostCommonWords.length > 0) {
    // Use the most common words to form a canonical name
    return mostCommonWords
      .slice(0, Math.min(3, mostCommonWords.length))
      .join(' ')
      .replace(/\b\w/g, c => c.toUpperCase());  // Capitalize first letter of each word
  }
  
  return sortedBrands[0];
}

// Function to format date
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}