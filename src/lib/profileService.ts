import { supabase } from './supabase';

// ============================================================================
// USER PROFILE SERVICE
// ============================================================================

export const profileService = {
  // Get user profile
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId);

    if (error) throw error;
    return data?.[0] || null;
  },

  // Create user profile (for new signups)
  async createProfile(
    userId: string,
    email: string,
    fullName: string,
    profileData?: any
  ) {
    const { data, error } = await supabase.from('user_profiles').insert([
      {
        id: userId,
        email,
        full_name: fullName,
        ...profileData,
      },
    ]);

    if (error) throw error;
    return data;
  },

  // Update user profile
  async updateProfile(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Upload profile image to storage and update profile
  async uploadAndUpdateProfileImage(userId: string, imageFile: File) {
    try {
      // Get current profile to check for existing image
      const currentProfile = await this.getProfile(userId);
      const oldImageUrl = currentProfile?.profile_image_url;

      // Delete old image if it exists and is not the default placeholder
      if (oldImageUrl && !oldImageUrl.includes('/download.png')) {
        try {
          // Extract the file path from the URL
          const urlParts = oldImageUrl.split('/profile-images/');
          if (urlParts.length > 1) {
            const oldFilePath = `profile-images/${urlParts[1].split('?')[0]}`; // Remove query params

            const { error: deleteError } = await supabase.storage
              .from('user-profiles')
              .remove([oldFilePath]);

            if (deleteError) {
              console.warn('Failed to delete old profile image:', deleteError);
              // Continue with upload even if deletion fails
            } else {
              console.log('Old profile image deleted successfully');
            }
          }
        } catch (deleteErr) {
          console.warn('Error deleting old image:', deleteErr);
          // Continue with upload even if deletion fails
        }
      }

      // Create a unique filename
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-images/${userId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('user-profiles')
        .upload(filePath, imageFile, {
          cacheControl: '3600',
          upsert: false // Don't upsert, we want unique files
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(filePath);

      // Add cache-busting timestamp to URL
      const timestamp = Date.now();
      const imageUrl = `${urlData.publicUrl}?v=${timestamp}`;

      // Update profile with image URL
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          profile_image_url: imageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) throw error;

      // Dispatch profile update event for real-time UI updates
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('profileUpdated', {
          detail: data?.[0]
        }));
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Error uploading profile image:', error);
      throw error;
    }
  },

  // Update profile image (for URLs only)
  async updateProfileImage(userId: string, imageUrl: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ profile_image_url: imageUrl })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Update bio
  async updateBio(userId: string, bio: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ bio })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Update location (city, country)
  async updateLocation(
    userId: string,
    city: string,
    country: string
  ) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ city, country })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Update timezone
  async updateTimezone(userId: string, timezone: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ timezone })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Update availability
  async updateAvailability(userId: string, availability: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ availability })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Update languages
  async updateLanguages(userId: string, languages: string[]) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ languages })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Add language
  async addLanguage(userId: string, language: string) {
    const profile = await this.getProfile(userId);
    const languages = [...(profile.languages || []), language];
    const uniqueLanguages = [...new Set(languages)];

    return this.updateLanguages(userId, uniqueLanguages);
  },

  // Remove language
  async removeLanguage(userId: string, language: string) {
    const profile = await this.getProfile(userId);
    const languages = profile.languages?.filter((l: string) => l !== language) || [];

    return this.updateLanguages(userId, languages);
  },

  // Update skills offered
  async updateSkillsOffered(userId: string, skills: string[]) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ skills_offered: skills })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Add skill to offered
  async addSkillOffered(userId: string, skill: string) {
    const profile = await this.getProfile(userId);
    const skills = [...(profile?.skills_offered || []), skill];
    const uniqueSkills = [...new Set(skills)];

    return this.updateSkillsOffered(userId, uniqueSkills);
  },

  // Remove skill from offered
  async removeSkillOffered(userId: string, skill: string) {
    const profile = await this.getProfile(userId);
    const skills = profile?.skills_offered?.filter((s: string) => s !== skill) || [];

    return this.updateSkillsOffered(userId, skills);
  },

  // Update skills wanted
  async updateSkillsWanted(userId: string, skills: string[]) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ skills_wanted: skills })
      .eq('id', userId)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  },

  // Add skill to wanted
  async addSkillWanted(userId: string, skill: string) {
    const profile = await this.getProfile(userId);
    const skills = [...(profile?.skills_wanted || []), skill];
    const uniqueSkills = [...new Set(skills)];

    return this.updateSkillsWanted(userId, uniqueSkills);
  },

  // Remove skill from wanted
  async removeSkillWanted(userId: string, skill: string) {
    const profile = await this.getProfile(userId);
    const skills = profile?.skills_wanted?.filter((s: string) => s !== skill) || [];

    return this.updateSkillsWanted(userId, skills);
  },

  // Get all timezones
  async getTimezones() {
    const { data, error } = await supabase
      .from('timezones')
      .select('*')
      .order('name');

    if (error) throw error;
    return data;
  },

  // Search profiles by skill offered
  async searchBySkillOffered(skill: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .contains('skills_offered', [skill]);

    if (error) throw error;
    return data;
  },

  // Search profiles by skill wanted
  async searchBySkillWanted(skill: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .contains('skills_wanted', [skill]);

    if (error) throw error;
    return data;
  },

  // Get profiles by country
  async getProfilesByCountry(country: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('country', country)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Get profiles by timezone
  async getProfilesByTimezone(timezone: string) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('timezone', timezone)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Search profiles with multiple filters
  async searchProfiles(filters: {
    country?: string;
    timezone?: string;
    skillOffered?: string;
    skillWanted?: string;
  }) {
    let query = supabase.from('user_profiles').select('*');

    if (filters.country) {
      query = query.eq('country', filters.country);
    }

    if (filters.timezone) {
      query = query.eq('timezone', filters.timezone);
    }

    if (filters.skillOffered) {
      query = query.contains('skills_offered', [filters.skillOffered]);
    }

    if (filters.skillWanted) {
      query = query.contains('skills_wanted', [filters.skillWanted]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
