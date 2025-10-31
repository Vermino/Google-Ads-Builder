import { CHAR_LIMITS } from './constants';

/**
 * Validates if a headline meets Google Ads character limit requirements
 */
export const isHeadlineValid = (text: string): boolean => {
  return text.length <= CHAR_LIMITS.HEADLINE;
};

/**
 * Validates if a description meets Google Ads character limit requirements
 */
export const isDescriptionValid = (text: string): boolean => {
  return text.length <= CHAR_LIMITS.DESCRIPTION;
};

/**
 * Validates if a URL path meets Google Ads character limit requirements
 */
export const isPathValid = (text: string): boolean => {
  return text.length <= CHAR_LIMITS.PATH;
};

/**
 * Gets the character validation status for UI display
 */
export const getCharCountStatus = (current: number, limit: number): 'valid' | 'warning' | 'error' => {
  if (current > limit) return 'error';
  if (current >= limit * 0.9) return 'warning';
  return 'valid';
};

/**
 * Validates if text is not empty
 */
export const isNotEmpty = (text: string): boolean => {
  return text.trim().length > 0;
};

/**
 * Validates URL format
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};
