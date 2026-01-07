import { supabase } from './supabase';

interface ActivityData {
    swap_id: string;
    user_id: string;
    activity_type: 'message' | 'session' | 'file_exchange' | 'status_change';
    description: string;
    metadata?: Record<string, any>;
}

interface ActivityStats {
    totalMessages: number;
    totalSessions: number;
    totalFiles: number;
    totalTimeSpent: number; // in minutes
}

export const historyService = {
    // Log an activity
    async logActivity(activityData: ActivityData) {
        try {
            const { data, error } = await supabase
                .from('swap_history')
                .insert([activityData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('historyService.logActivity error:', error);
            throw error;
        }
    },

    // Get complete history for a swap
    async getSwapHistory(swapId: string) {
        try {
            const { data, error } = await supabase
                .from('swap_history')
                .select('*')
                .eq('swap_id', swapId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('historyService.getSwapHistory error:', error);
            throw error;
        }
    },

    // Get activity statistics for a swap
    async getActivityStats(swapId: string): Promise<ActivityStats> {
        try {
            const history = await this.getSwapHistory(swapId);

            const stats: ActivityStats = {
                totalMessages: 0,
                totalSessions: 0,
                totalFiles: 0,
                totalTimeSpent: 0
            };

            history.forEach(activity => {
                switch (activity.activity_type) {
                    case 'message':
                        stats.totalMessages++;
                        break;
                    case 'session':
                        stats.totalSessions++;
                        if (activity.metadata?.duration_minutes) {
                            stats.totalTimeSpent += activity.metadata.duration_minutes;
                        }
                        break;
                    case 'file_exchange':
                        stats.totalFiles++;
                        break;
                }
            });

            return stats;
        } catch (error) {
            console.error('historyService.getActivityStats error:', error);
            throw error;
        }
    },

    // Get history by activity type
    async getHistoryByType(swapId: string, activityType: string) {
        try {
            const { data, error } = await supabase
                .from('swap_history')
                .select('*')
                .eq('swap_id', swapId)
                .eq('activity_type', activityType)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('historyService.getHistoryByType error:', error);
            throw error;
        }
    },

    // Get recent activities (limit)
    async getRecentActivities(swapId: string, limit: number = 10) {
        try {
            const { data, error } = await supabase
                .from('swap_history')
                .select('*')
                .eq('swap_id', swapId)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('historyService.getRecentActivities error:', error);
            throw error;
        }
    }
};
