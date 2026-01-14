import { supabase } from './supabase';

interface SwapData {
  title: string;
  description?: string;
  skill_offered: string;
  skill_wanted: string;
  category?: string;
  duration?: string;
  format?: string;
}

export const swapService = {
  // Create a new swap
  async createSwap(userId: string, swapData: SwapData) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .insert([
          {
            user_id: userId,
            ...swapData,
            status: 'open'
          }
        ])
        .select();

      if (error) {
        console.error('Error creating swap:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('swapService.createSwap error:', error);
      throw error;
    }
  },

  // Get all swaps
  async getAllSwaps() {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .in('status', ['open', 'active', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching swaps:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('swapService.getAllSwaps error:', error);
      throw error;
    }
  },

  // Get swaps by category
  async getSwapsByCategory(category: string) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .eq('category', category)
        .in('status', ['open', 'active', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching swaps by category:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('swapService.getSwapsByCategory error:', error);
      throw error;
    }
  },

  // Get swaps by user
  async getSwapsByUser(userId: string) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user swaps:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('swapService.getSwapsByUser error:', error);
      throw error;
    }
  },

  // Get single swap by ID
  async getSwapById(swapId: string) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .eq('id', swapId);

      if (error) {
        console.error('Error fetching swap:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('swapService.getSwapById error:', error);
      throw error;
    }
  },

  // Update swap
  async updateSwap(swapId: string, updates: Partial<SwapData>) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .update(updates)
        .eq('id', swapId)
        .select();

      if (error) {
        console.error('Error updating swap:', error);
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('swapService.updateSwap error:', error);
      throw error;
    }
  },

  // Delete swap
  async deleteSwap(swapId: string) {
    try {
      const { error } = await supabase
        .from('swaps')
        .delete()
        .eq('id', swapId);

      if (error) {
        console.error('Error deleting swap:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('swapService.deleteSwap error:', error);
      throw error;
    }
  },

  // Search swaps by skill offered
  async searchBySkillOffered(skill: string) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .ilike('skill_offered', `%${skill}%`)
        .in('status', ['open', 'active', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching swaps by skill offered:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('swapService.searchBySkillOffered error:', error);
      throw error;
    }
  },

  // Search swaps by skill wanted
  async searchBySkillWanted(skill: string) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .ilike('skill_wanted', `%${skill}%`)
        .in('status', ['open', 'active', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error searching swaps by skill wanted:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('swapService.searchBySkillWanted error:', error);
      throw error;
    }
  },

  // Get swaps matching skills (user wants to offer what swap wants, and vice versa)
  async getMatchingSwaps(userSkillsOffered: string[], userSkillsWanted: string[]) {
    try {
      // Get swaps where user can help (user's offered skills match swap's wanted skills)
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .in('skill_wanted', userSkillsWanted)
        .in('status', ['open', 'active', 'cancelled'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error getting matching swaps:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('swapService.getMatchingSwaps error:', error);
      throw error;
    }
  },

  // Get all swaps where user is either the owner OR the partner
  async getUserSwapsWithPartner(userId: string) {
    try {
      const { data, error } = await supabase
        .from('swaps')
        .select('*')
        .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user swaps with partner:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('swapService.getUserSwapsWithPartner error:', error);
      throw error;
    }
  },

  // Get total count of completed swaps for a user (as owner or partner)
  async getCompletedSwapsCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('swaps')
        .select('*', { count: 'exact', head: true })
        .or(`user_id.eq.${userId},partner_id.eq.${userId}`)
        .eq('status', 'completed');

      if (error) {
        console.error('Error fetching completed swaps count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('swapService.getCompletedSwapsCount error:', error);
      throw error;
    }
  },

  // Cancel a swap - sets status to cancelled
  async cancelSwap(swapId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get the swap first to check permissions and notify other user
      const swap = await this.getSwapById(swapId);
      if (!swap) throw new Error('Swap not found');

      // Check if user is owner or partner
      if (swap.user_id !== user.id && swap.partner_id !== user.id) {
        throw new Error('You are not authorized to cancel this swap');
      }

      const { data, error } = await supabase
        .from('swaps')
        .update({ status: 'cancelled' })
        .eq('id', swapId)
        .select()
        .single();

      if (error) {
        console.error('Error cancelling swap:', error);
        throw error;
      }

      // Notify the other user
      const otherUserId = swap.user_id === user.id ? swap.partner_id : swap.user_id;
      if (otherUserId) {
        await supabase.from('notifications').insert([{
          user_id: otherUserId,
          type: 'swap_cancelled',
          title: 'Swap Cancelled',
          message: 'A swap you were participating in has been cancelled.',
          data: { swap_id: swapId },
          is_read: false
        }]);
      }

      return data;
    } catch (error) {
      console.error('swapService.cancelSwap error:', error);
      throw error;
    }
  },

  // Subscribe to swap changes for a user
  subscribeToUserSwaps(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel(`swaps:user_id=eq.${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swaps',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'swaps',
          filter: `partner_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }
};
