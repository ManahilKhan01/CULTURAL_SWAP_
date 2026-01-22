/**
 * Utility function to clear all profile-related caches
 * Call this when you update a profile to ensure all components fetch fresh data
 */
export const clearProfileCaches = () => {
  try {
    // Clear specific profile caches
    localStorage.removeItem('navbar_profile_cache');
    localStorage.removeItem('profile_page_cache');
    localStorage.removeItem('settings_profile_cache');

    // You can add more cache keys here as needed

    console.log('Profile caches cleared');
  } catch (error) {
    console.warn('Error clearing profile caches:', error);
  }
};

/**
 * Utility function to force refresh all profile data in the app
 * Dispatches a custom event that profile hooks listen to
 */
export const dispatchProfileUpdate = (profileData?: any) => {
  try {
    refreshImageCache(); // Update stable timestamp for images
    window.dispatchEvent(new CustomEvent('profileUpdated', {
      detail: profileData || {}
    }));
    console.log('Profile update event dispatched');
  } catch (error) {
    console.warn('Error dispatching profile update:', error);
  }
};

/**
 * Utility function to refresh a specific profile
 * Used when you need to update a profile image or other data in real-time
 */
export const refreshProfileInCache = (userId: string, profileData: any) => {
  try {
    refreshImageCache();
    clearProfileCaches();
    dispatchProfileUpdate(profileData);
  } catch (error) {
    console.warn('Error refreshing profile in cache:', error);
  }
};

// Use a stable timestamp that only changes when explicitly requested or on page load
let lastGlobalUpdate = Date.now().toString();

/**
 * Generate cache-busted URL with stable timestamp
 * Forces browser to reload image only when needed, preventing blinking
 */
export const getCacheBustedImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '/download.png';

  // If already has cache-busting parameter, return as-is
  if (imageUrl.includes('?v=')) return imageUrl;

  // If it's the default placeholder, no need for cache-busting
  if (imageUrl.includes('/download.png')) return imageUrl;

  // Add a stable timestamp to force cache invalidation only when global state changes
  const separator = imageUrl.includes('?') ? '&' : '?';
  return `${imageUrl}${separator}v=${lastGlobalUpdate}`;
};

/**
 * Refresh the global cache-busting timestamp
 */
export const refreshImageCache = () => {
  lastGlobalUpdate = Date.now().toString();
};

/**
 * Force reload of profile images by clearing browser cache
 * This helps ensure updated images are displayed immediately
 */
export const invalidateProfileImageCache = (imageUrl: string) => {
  try {
    // Clear any cached image elements
    if (typeof window !== 'undefined') {
      const images = document.querySelectorAll(`img[src*="${imageUrl}"]`);
      images.forEach((img) => {
        const htmlImg = img as HTMLImageElement;
        const currentSrc = htmlImg.src;
        htmlImg.src = ''; // Clear src
        setTimeout(() => {
          htmlImg.src = getCacheBustedImageUrl(currentSrc); // Reload with cache-busting
        }, 0);
      });
    }
  } catch (error) {
    console.warn('Error invalidating profile image cache:', error);
  }
};

