import { supabase } from './supabase';

interface SessionData {
    swap_id: string;
    scheduled_at?: string;
}

export const sessionService = {
    // Generate a Google Meet-style link (placeholder)
    generateMeetLink(): string {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const randomString = () => {
            let result = '';
            for (let i = 0; i < 3; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        };

        return `https://meet.google.com/${randomString()}-${randomString()}-${randomString()}`;
    },

    // Create a new session
    async createSession(sessionData: SessionData) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const meetLink = this.generateMeetLink();

            const { data, error } = await supabase
                .from('swap_sessions')
                .insert([
                    {
                        swap_id: sessionData.swap_id,
                        meet_link: meetLink,
                        scheduled_at: sessionData.scheduled_at || new Date().toISOString(),
                        status: 'scheduled',
                        created_by: user.id,
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            // Log activity in swap history
            await supabase.from('swap_history').insert([
                {
                    swap_id: sessionData.swap_id,
                    user_id: user.id,
                    activity_type: 'session',
                    description: 'Created a new session',
                    metadata: { session_id: data.id, meet_link: meetLink }
                }
            ]);

            return data;
        } catch (error) {
            console.error('sessionService.createSession error:', error);
            throw error;
        }
    },

    // Get all sessions for a swap
    async getSessionsBySwap(swapId: string) {
        try {
            const { data, error } = await supabase
                .from('swap_sessions')
                .select('*')
                .eq('swap_id', swapId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('sessionService.getSessionsBySwap error:', error);
            throw error;
        }
    },

    // Start a session
    async startSession(sessionId: string) {
        try {
            const { data, error } = await supabase
                .from('swap_sessions')
                .update({
                    status: 'in_progress',
                    started_at: new Date().toISOString()
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('sessionService.startSession error:', error);
            throw error;
        }
    },

    // End a session and calculate duration
    async endSession(sessionId: string) {
        try {
            const { data: session, error: fetchError } = await supabase
                .from('swap_sessions')
                .select('*, swaps(total_hours, remaining_hours)')
                .eq('id', sessionId)
                .single();

            if (fetchError) throw fetchError;

            const endedAt = new Date();
            const startedAt = new Date(session.started_at || session.created_at);
            const durationMinutes = Math.round((endedAt.getTime() - startedAt.getTime()) / 60000);

            const { data, error } = await supabase
                .from('swap_sessions')
                .update({
                    status: 'completed',
                    ended_at: endedAt.toISOString(),
                    duration_minutes: durationMinutes
                })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;

            // Update swap hours
            await this.updateSwapHours(session.swap_id, durationMinutes);

            return data;
        } catch (error) {
            console.error('sessionService.endSession error:', error);
            throw error;
        }
    },

    // Update swap hours after session
    async updateSwapHours(swapId: string, durationMinutes: number) {
        try {
            const { data: swap, error: fetchError } = await supabase
                .from('swaps')
                .select('remaining_hours')
                .eq('id', swapId)
                .single();

            if (fetchError) throw fetchError;

            const hoursUsed = Math.round((durationMinutes / 60) * 10) / 10; // Round to 1 decimal
            const newRemainingHours = Math.max(0, (swap.remaining_hours || 0) - hoursUsed);

            const { data, error } = await supabase
                .from('swaps')
                .update({ remaining_hours: newRemainingHours })
                .eq('id', swapId)
                .select()
                .single();

            if (error) throw error;

            // Log activity
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('swap_history').insert([
                    {
                        swap_id: swapId,
                        user_id: user.id,
                        activity_type: 'session',
                        description: `Session completed: ${hoursUsed} hours used`,
                        metadata: { duration_minutes: durationMinutes, hours_used: hoursUsed }
                    }
                ]);
            }

            return data;
        } catch (error) {
            console.error('sessionService.updateSwapHours error:', error);
            throw error;
        }
    },

    // Get session by ID
    async getSessionById(sessionId: string) {
        try {
            const { data, error } = await supabase
                .from('swap_sessions')
                .select('*')
                .eq('id', sessionId)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('sessionService.getSessionById error:', error);
            throw error;
        }
    },

    // Cancel a session
    async cancelSession(sessionId: string) {
        try {
            const { data, error } = await supabase
                .from('swap_sessions')
                .update({ status: 'cancelled' })
                .eq('id', sessionId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('sessionService.cancelSession error:', error);
            throw error;
        }
    }
};
