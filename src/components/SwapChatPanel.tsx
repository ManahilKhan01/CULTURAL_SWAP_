import { useState, useEffect, useRef } from "react";
import { Send, Loader2, Paperclip, X, CheckCheck, Download, FileText, Image as ImageIcon, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { messageService } from "@/lib/messageService";
import { attachmentService } from "@/lib/attachmentService";
import { historyService } from "@/lib/historyService";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { OfferCard } from "@/components/OfferCard";

interface SwapChatPanelProps {
    swapId: string;
    currentUserId: string;
    otherUserId: string;
    otherUserName?: string;
    otherUserAvatar?: string;
    onClose?: () => void;
}

export const SwapChatPanel = ({
    swapId,
    currentUserId,
    otherUserId,
    otherUserName = "User",
    otherUserAvatar,
    onClose
}: SwapChatPanelProps) => {
    const [messages, setMessages] = useState<any[]>([]);
    const [messageText, setMessageText] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [attachments, setAttachments] = useState<Record<string, any[]>>({});
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        loadMessages();
    }, [swapId, currentUserId, otherUserId]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    // Real-time subscription
    useEffect(() => {
        if (!conversationId) return;

        const channel = supabase
            .channel(`swap_chat:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                async (payload) => {
                    const newMsg = payload.new;
                    setMessages(prev => {
                        if (prev.find(m => m.id === newMsg.id)) return prev;
                        return [...prev, newMsg].sort((a, b) =>
                            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                        );
                    });

                    // Load attachments for new message
                    const msgAttachments = await attachmentService.getAttachmentsByMessage(newMsg.id);
                    if (msgAttachments.length > 0) {
                        setAttachments(prev => ({ ...prev, [newMsg.id]: msgAttachments }));
                    }
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'swap_offers',
                },
                () => {
                    loadMessages();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, swapId]);

    const loadMessages = async () => {
        try {
            setLoading(true);

            // Get or create conversation
            const convId = await messageService.getOrCreateConversation(currentUserId, otherUserId);
            setConversationId(convId);

            // Get messages for this conversation (no swap_id filtering to sync with main chat)
            const data = await messageService.getMessagesByConversation(convId);
            setMessages(data || []);

            // Load attachments for all messages
            const attachmentsMap: Record<string, any[]> = {};
            for (const msg of data || []) {
                const msgAttachments = await attachmentService.getAttachmentsByMessage(msg.id);
                if (msgAttachments.length > 0) {
                    attachmentsMap[msg.id] = msgAttachments;
                }
            }
            setAttachments(attachmentsMap);

        } catch (error) {
            console.error("Error loading swap messages:", error);
            toast({
                title: "Error",
                description: "Failed to load messages",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOfferUpdated = () => {
        loadMessages();
    };

    const handleSendMessage = async () => {
        if (!messageText.trim() && selectedFiles.length === 0) return;

        try {
            setSending(true);

            // Send message
            const newMessage = await messageService.sendMessage({
                sender_id: currentUserId,
                receiver_id: otherUserId,
                conversation_id: conversationId!,
                swap_id: swapId || undefined,
                content: messageText.trim() || "(File attachment)"
            });

            if (newMessage) {
                // Upload attachments if any
                if (selectedFiles.length > 0) {
                    const uploadedAttachments = [];
                    for (const file of selectedFiles) {
                        const attachment = await attachmentService.createAttachment(file, newMessage.id);
                        uploadedAttachments.push(attachment);
                    }

                    // Update attachments state
                    setAttachments(prev => ({
                        ...prev,
                        [newMessage.id]: uploadedAttachments
                    }));

                    // Log file exchange activity
                    await historyService.logActivity({
                        swap_id: swapId,
                        user_id: currentUserId,
                        activity_type: 'file_exchange',
                        description: `Shared ${selectedFiles.length} file(s)`,
                        metadata: { file_count: selectedFiles.length }
                    });
                }

                // Log message activity
                await historyService.logActivity({
                    swap_id: swapId,
                    user_id: currentUserId,
                    activity_type: 'message',
                    description: 'Sent a message',
                    metadata: { message_id: newMessage.id }
                });

                setMessages(prev => [...prev, newMessage]);
                setMessageText("");
                setSelectedFiles([]);
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to send message",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        setSelectedFiles(prev => [...prev, ...files]);
    };

    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <Card className="h-full flex flex-col shadow-xl">
            <CardHeader className="border-b p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {otherUserAvatar && (
                            <img
                                src={otherUserAvatar}
                                alt={otherUserName}
                                className="h-10 w-10 rounded-full object-cover ring-2 ring-border"
                            />
                        )}
                        <div>
                            <CardTitle className="text-lg">{otherUserName}</CardTitle>
                            <p className="text-xs text-muted-foreground">Swap Chat</p>
                        </div>
                    </div>
                    {onClose && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={onClose}
                            className="h-8 w-8 rounded-full"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 overflow-hidden">
                {/* Messages Area */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5 scroll-smooth">
                        {loading ? (
                            <div className="flex items-center justify-center h-full">
                                <Loader2 className="h-6 w-6 animate-spin text-terracotta" />
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                <p className="text-sm">No messages yet. Start the conversation!</p>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const isMe = message.sender_id === currentUserId;
                                const msgAttachments = attachments[message.id] || [];
                                const hasOffer = !!message.offer_id;

                                return (
                                    <div
                                        key={message.id}
                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                                    >
                                        <div className="max-w-[85%] space-y-1">
                                            {hasOffer ? (
                                                <OfferCard
                                                    offerId={message.offer_id}
                                                    currentUserId={currentUserId}
                                                    onOfferUpdated={handleOfferUpdated}
                                                />
                                            ) : (
                                                <>
                                                    <div
                                                        className={`rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                                            ? 'bg-terracotta text-white rounded-br-sm'
                                                            : 'bg-white text-foreground rounded-bl-sm border border-border/50'
                                                            }`}
                                                    >
                                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                                            {message.content}
                                                        </p>
                                                        <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-white/80 justify-end' : 'text-muted-foreground'
                                                            }`}>
                                                            {formatTime(message.created_at)}
                                                            {isMe && <CheckCheck className="h-3 w-3" />}
                                                        </div>
                                                    </div>

                                                    {/* Attachments */}
                                                    {msgAttachments.length > 0 && (
                                                        <div className="space-y-1">
                                                            {msgAttachments.map((attachment: any) => (
                                                                <div
                                                                    key={attachment.id}
                                                                    className={`rounded-lg overflow-hidden ${isMe ? 'ml-auto' : 'mr-auto'
                                                                        }`}
                                                                >
                                                                    {attachmentService.isImage(attachment.file_type) ? (
                                                                        <div className="relative group/img">
                                                                            <img
                                                                                src={attachment.url}
                                                                                alt={attachment.file_name}
                                                                                className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-95 shadow-sm border border-border/20 transition-all"
                                                                                onClick={() => window.open(attachment.url, '_blank')}
                                                                            />
                                                                            <a
                                                                                href={attachment.url}
                                                                                download={attachment.file_name}
                                                                                onClick={(e) => e.stopPropagation()}
                                                                                className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black/70"
                                                                            >
                                                                                <Download className="h-3 w-3" />
                                                                            </a>
                                                                        </div>
                                                                    ) : (
                                                                        <a
                                                                            href={attachment.url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl hover:bg-muted text-sm group transition-all border border-border/10"
                                                                        >
                                                                            <FileText className="h-4 w-4 text-muted-foreground group-hover:text-terracotta transition-colors" />
                                                                            <span className="truncate flex-1">{attachment.file_name}</span>
                                                                            <div className="h-7 w-7 rounded-full bg-background/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                <Download className="h-4 w-4" />
                                                                            </div>
                                                                        </a>
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-muted/10 backdrop-blur-sm">
                    {/* Selected Files Preview */}
                    {selectedFiles.length > 0 && (
                        <div className="mb-2 space-y-1">
                            {selectedFiles.map((file, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                                >
                                    <Paperclip className="h-3 w-3" />
                                    <span className="flex-1 truncate">{file.name}</span>
                                    <button onClick={() => removeFile(index)}>
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 items-end">
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Paperclip className="h-5 w-5" />
                        </Button>
                        <div className="flex-1 bg-muted/30 rounded-2xl border border-border px-3 py-1">
                            <Textarea
                                placeholder="Type your message..."
                                value={messageText}
                                onChange={(e) => setMessageText(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                                className="resize-none border-none focus-visible:ring-0 px-1 py-2 text-sm min-h-[40px] max-h-[120px] bg-transparent"
                                rows={1}
                            />
                        </div>
                        <Button
                            variant="terracotta"
                            size="icon"
                            onClick={handleSendMessage}
                            disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
                            className="rounded-2xl"
                        >
                            {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
