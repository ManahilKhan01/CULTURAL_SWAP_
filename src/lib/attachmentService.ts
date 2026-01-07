import { supabase } from './supabase';

interface AttachmentData {
    message_id: string;
    file_name: string;
    file_type: string;
    file_size: number;
    storage_path: string;
    url: string;
}

export const attachmentService = {
    // Upload a file to Supabase Storage
    async uploadFile(file: File, messageId: string): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${messageId}_${Date.now()}.${fileExt}`;
            const filePath = `${messageId}/${fileName}`;

            const { data, error } = await supabase.storage
                .from('message-attachments')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('message-attachments')
                .getPublicUrl(filePath);

            return urlData.publicUrl;
        } catch (error) {
            console.error('attachmentService.uploadFile error:', error);
            throw error;
        }
    },

    // Create attachment record in database
    async createAttachment(file: File, messageId: string): Promise<any> {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${messageId}_${Date.now()}.${fileExt}`;
            const filePath = `${messageId}/${fileName}`;

            // Upload to storage
            const url = await this.uploadFile(file, messageId);

            // Create database record
            const attachmentData: AttachmentData = {
                message_id: messageId,
                file_name: file.name,
                file_type: file.type,
                file_size: file.size,
                storage_path: filePath,
                url: url
            };

            const { data, error } = await supabase
                .from('message_attachments')
                .insert([attachmentData])
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('attachmentService.createAttachment error:', error);
            throw error;
        }
    },

    // Get attachments for a message
    async getAttachmentsByMessage(messageId: string) {
        try {
            const { data, error } = await supabase
                .from('message_attachments')
                .select('*')
                .eq('message_id', messageId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('attachmentService.getAttachmentsByMessage error:', error);
            throw error;
        }
    },

    // Delete an attachment
    async deleteAttachment(attachmentId: string) {
        try {
            // Get attachment details first
            const { data: attachment, error: fetchError } = await supabase
                .from('message_attachments')
                .select('*')
                .eq('id', attachmentId)
                .single();

            if (fetchError) throw fetchError;

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('message-attachments')
                .remove([attachment.storage_path]);

            if (storageError) throw storageError;

            // Delete from database
            const { error: dbError } = await supabase
                .from('message_attachments')
                .delete()
                .eq('id', attachmentId);

            if (dbError) throw dbError;

            return true;
        } catch (error) {
            console.error('attachmentService.deleteAttachment error:', error);
            throw error;
        }
    },

    // Get download URL for an attachment
    async getDownloadUrl(attachmentId: string): Promise<string> {
        try {
            const { data: attachment, error } = await supabase
                .from('message_attachments')
                .select('storage_path')
                .eq('id', attachmentId)
                .single();

            if (error) throw error;

            const { data } = supabase.storage
                .from('message-attachments')
                .getPublicUrl(attachment.storage_path);

            return data.publicUrl;
        } catch (error) {
            console.error('attachmentService.getDownloadUrl error:', error);
            throw error;
        }
    },

    // Check if file type is an image
    isImage(fileType: string): boolean {
        return fileType.startsWith('image/');
    },

    // Check if file type is a document
    isDocument(fileType: string): boolean {
        const docTypes = ['application/pdf', 'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
        return docTypes.includes(fileType);
    },

    // Format file size for display
    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
};
