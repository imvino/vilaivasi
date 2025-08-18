const fuzzball = require('fuzzball');

// Fuzzy matching utility functions
const fuzzyUtils = {
  /**
   * Calculate similarity score between two strings
   * @param {string} str1 - First string to compare
   * @param {string} str2 - Second string to compare
   * @param {object} options - Options for fuzzy matching
   * @returns {number} - Similarity score (0-100)
   */
  getScore: (str1, str2, options = {}) => {
    const defaultOptions = {
      useCollation: true,
      full_process: true,
      force_ascii: false,
      ...options
    };
    
    return fuzzball.ratio(str1, str2, defaultOptions);
  },

  /**
   * Find potential matches for a brand name from a list of candidates
   * @param {string} brandName - Brand name to match
   * @param {Array<{id: number, name: string}>} candidates - List of candidate brands
   * @param {number} threshold - Minimum score to consider a match (0-100)
   * @returns {Array<{id: number, name: string, score: number}>} - Sorted potential matches
   */
  findPotentialMatches: (brandName, candidates, threshold = 80) => {
    const results = candidates.map(candidate => {
      const score = fuzzyUtils.getScore(brandName.toLowerCase(), candidate.name.toLowerCase());
      return {
        ...candidate,
        score
      };
    })
    .filter(result => result.score >= threshold)
    .sort((a, b) => b.score - a.score);
    
    return results;
  },

  /**
   * Find matches between two brand lists
   * @param {Array<{id: number, name: string}>} list1 - First list of brands
   * @param {Array<{id: number, name: string}>} list2 - Second list of brands
   * @param {number} threshold - Minimum score to consider a match (0-100)
   * @returns {Array<{brand1: object, brand2: object, score: number}>} - Sorted matches
   */
  findMatchesBetweenLists: (list1, list2, threshold = 80) => {
    const matches = [];
    
    for (const brand1 of list1) {
      const potentialMatches = fuzzyUtils.findPotentialMatches(brand1.name, list2, threshold);
      
      for (const match of potentialMatches) {
        matches.push({
          brand1,
          brand2: match,
          score: match.score
        });
      }
    }
    
    return matches.sort((a, b) => b.score - a.score);
  },

  /**
   * Normalize brand names for better matching
   * @param {string} brandName - Brand name to normalize
   * @returns {string} - Normalized brand name
   */
  normalizeBrandName: (brandName) => {
    if (!brandName) return '';
    
    return brandName
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')    // Replace multiple spaces with a single space
      .trim();
  },

  /**
   * Compare two brand names and return a similarity score
   * @param {string} brandName1 - First brand name to compare
   * @param {string} brandName2 - Second brand name to compare
   * @returns {number} - Similarity score (0-100)
   */
  compareBrandNames: (brandName1, brandName2) => {
    const normalizedBrandName1 = fuzzyUtils.normalizeBrandName(brandName1);
    const normalizedBrandName2 = fuzzyUtils.normalizeBrandName(brandName2);
    
    return fuzzyUtils.getScore(normalizedBrandName1, normalizedBrandName2);
  },

  /**
   * Find the best match for a brand name from a list of candidates
   * @param {string} brandName - Brand name to match
   * @param {Array<{id: number, name: string}>} candidates - List of candidate brands
   * @returns {{id: number, name: string, score: number}} - Best match
   */
  findBestMatch: (brandName, candidates) => {
    const potentialMatches = fuzzyUtils.findPotentialMatches(brandName, candidates);
    
    return potentialMatches[0];
  }
};

module.exports = fuzzyUtils;
