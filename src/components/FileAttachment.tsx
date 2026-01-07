import { useState, useRef } from "react";
import { Paperclip, X, FileText, Image as ImageIcon, File, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { attachmentService } from "@/lib/attachmentService";
import { useToast } from "@/hooks/use-toast";

interface FileAttachmentProps {
    messageId?: string;
    onFileSelect?: (files: File[]) => void;
    attachments?: any[];
    showUploadButton?: boolean;
}

export const FileAttachment = ({
    messageId,
    onFileSelect,
    attachments = [],
    showUploadButton = true
}: FileAttachmentProps) => {
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setSelectedFiles(prev => [...prev, ...files]);
            if (onFileSelect) {
                onFileSelect(files);
            }
        }
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const getFileIcon = (fileType: string) => {
        if (attachmentService.isImage(fileType)) {
            return <ImageIcon className="h-5 w-5" />;
        } else if (attachmentService.isDocument(fileType)) {
            return <FileText className="h-5 w-5" />;
        }
        return <File className="h-5 w-5" />;
    };

    const handleDownload = async (attachment: any) => {
        try {
            const url = await attachmentService.getDownloadUrl(attachment.id);
            window.open(url, '_blank');
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to download file",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="space-y-2">
            {/* Upload Button */}
            {showUploadButton && (
                <div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileSelect}
                        className="hidden"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                    >
                        {uploading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Paperclip className="h-4 w-4 mr-2" />
                        )}
                        Attach File
                    </Button>
                </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="space-y-2">
                    {selectedFiles.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border"
                        >
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {attachmentService.formatFileSize(file.size)}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFile(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Existing Attachments Display */}
            {attachments.length > 0 && (
                <div className="space-y-2">
                    {attachments.map((attachment) => (
                        <div
                            key={attachment.id}
                            className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 border border-border/50"
                        >
                            {attachmentService.isImage(attachment.file_type) ? (
                                <img
                                    src={attachment.url}
                                    alt={attachment.file_name}
                                    className="h-16 w-16 object-cover rounded"
                                />
                            ) : (
                                getFileIcon(attachment.file_type)
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.file_name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {attachmentService.formatFileSize(attachment.file_size)}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(attachment)}
                            >
                                <Download className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
