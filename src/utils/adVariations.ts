import type { Headline, Description } from '../types';

export interface AdVariation {
  headlines: string[]; // Top 3 headlines to show
  descriptions: string[]; // Top 2 descriptions to show
}

/**
 * Generates ad variations respecting pinned positions
 * - Pinned headlines stay in their positions (1-3)
 * - Pinned descriptions stay in their positions (1-2)
 * - Unpinned assets are randomly shuffled for variety
 */
export const generateAdVariations = (
  headlines: Headline[],
  descriptions: Description[],
  count: number = 10
): AdVariation[] => {
  const variations: AdVariation[] = [];

  for (let i = 0; i < count; i++) {
    const variation = generateSingleVariation(headlines, descriptions);
    variations.push(variation);
  }

  return variations;
};

const generateSingleVariation = (
  headlines: Headline[],
  descriptions: Description[]
): AdVariation => {
  // Separate pinned and unpinned headlines
  const pinnedHeadlines = headlines.filter((h) => h.pinned && h.pinnedPosition);
  const unpinnedHeadlines = headlines.filter((h) => !h.pinned);

  // Separate pinned and unpinned descriptions
  const pinnedDescriptions = descriptions.filter((d) => d.pinned && d.pinnedPosition);
  const unpinnedDescriptions = descriptions.filter((d) => !d.pinned);

  // Create result arrays
  const resultHeadlines: string[] = ['', '', ''];
  const resultDescriptions: string[] = ['', ''];

  // Place pinned headlines in their positions
  pinnedHeadlines.forEach((h) => {
    if (h.pinnedPosition && h.pinnedPosition >= 1 && h.pinnedPosition <= 3) {
      resultHeadlines[h.pinnedPosition - 1] = h.text;
    }
  });

  // Place pinned descriptions in their positions
  pinnedDescriptions.forEach((d) => {
    if (d.pinnedPosition && d.pinnedPosition >= 1 && d.pinnedPosition <= 2) {
      resultDescriptions[d.pinnedPosition - 1] = d.text;
    }
  });

  // Shuffle unpinned headlines and fill empty positions
  const shuffledHeadlines = shuffle([...unpinnedHeadlines]);
  let headlineIndex = 0;
  for (let i = 0; i < 3; i++) {
    if (!resultHeadlines[i] && headlineIndex < shuffledHeadlines.length) {
      resultHeadlines[i] = shuffledHeadlines[headlineIndex].text;
      headlineIndex++;
    }
  }

  // Shuffle unpinned descriptions and fill empty positions
  const shuffledDescriptions = shuffle([...unpinnedDescriptions]);
  let descriptionIndex = 0;
  for (let i = 0; i < 2; i++) {
    if (!resultDescriptions[i] && descriptionIndex < shuffledDescriptions.length) {
      resultDescriptions[i] = shuffledDescriptions[descriptionIndex].text;
      descriptionIndex++;
    }
  }

  return {
    headlines: resultHeadlines.filter((h) => h), // Remove empty strings
    descriptions: resultDescriptions.filter((d) => d), // Remove empty strings
  };
};

/**
 * Fisher-Yates shuffle algorithm
 */
const shuffle = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};
