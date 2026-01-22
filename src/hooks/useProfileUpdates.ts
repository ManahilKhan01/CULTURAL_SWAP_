import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { profileService } from '@/lib/profileService';

interface ProfileData {
  id: string;
  full_name?: string;
  profile_image_url?: string;
  bio?: string;
  city?: string;
  country?: string;
  timezone?: string;
  availability?: string;
  languages?: string[];
  skills_offered?: string[];
  skills_wanted?: string[];
  updated_at?: string;
}

/**
 * Custom hook for real-time profile updates
 * Subscribes to changes on the user_profiles table and updates state
 * Also provides a refresh function for manual updates
 * 
 * Usage:
 * const profile = useProfileUpdates(userId);
 */
export const useProfileUpdates = (userId: string | null) => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile from database
  const fetchProfile = useCallback(async () => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const data = await profileService.getProfile(userId);
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Set up real-time subscription
  useEffect(() => {
    if (!userId) return;

    // Subscribe to updates on this user's profile
    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          console.log('Profile update received:', payload);

          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newProfile = payload.new as ProfileData;
            const oldProfile = payload.old as ProfileData;

            // Check if profile image changed
            if (newProfile.profile_image_url !== oldProfile?.profile_image_url) {
              console.log('Profile image changed, invalidating cache');

              // Clear image cache to force reload
              try {
                if (newProfile.profile_image_url) {
                  // Force reload all images with this URL
                  const images = document.querySelectorAll('img');
                  images.forEach((img) => {
                    if (img.src.includes(newProfile.profile_image_url!.split('?')[0])) {
                      const newSrc = newProfile.profile_image_url!;
                      img.src = '';
                      setTimeout(() => { img.src = newSrc; }, 0);
                    }
                  });
                }
              } catch (e) {
                console.warn('Error invalidating image cache:', e);
              }
            }

            // Update local state with new data
            setProfile(newProfile);

            // Clear related caches
            try {
              localStorage.removeItem('navbar_profile_cache');
              localStorage.removeItem('profile_page_cache');
              localStorage.removeItem('settings_profile_cache');
            } catch (e) {
              console.warn('Error clearing cache:', e);
            }

            // Dispatch event for other components
            window.dispatchEvent(new CustomEvent('profileUpdated', {
              detail: payload.new
            }));
          } else if (payload.eventType === 'DELETE') {
            setProfile(null);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Channel error subscribing to profile updates');
        }
      });

    // Cleanup subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refresh,
  };
};
