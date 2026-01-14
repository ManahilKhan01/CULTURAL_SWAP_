import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Send, Loader2, Handshake, ChevronLeft, MoreVertical, CheckCheck, Paperclip, X, Download, FileText, Image as ImageIcon, File } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import { supabase } from "@/lib/supabase";
import { messageService } from "@/lib/messageService";
import { profileService } from "@/lib/profileService";
import { swapService } from "@/lib/swapService";
import { attachmentService } from "@/lib/attachmentService";
import { historyService } from "@/lib/historyService";
import { offerService, Offer } from "@/lib/offerService";
import { useToast } from "@/hooks/use-toast";
import { CreateOfferDialog } from "@/components/CreateOfferDialog";
import { OfferCard } from "@/components/OfferCard";

const Messages = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const userIdParam = searchParams.get('user');
  const swapIdParam = searchParams.get('swap');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUserProfile, setOtherUserProfile] = useState<any>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, any>>({});
  const [currentSwap, setCurrentSwap] = useState<any>(null);
  const [createOfferOpen, setCreateOfferOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState<Record<string, any[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadConversations = async (uId: string) => {
    try {
      const allConversations = await messageService.getConversations(uId);

      // Load profiles for all other users in conversations
      const profiles: Record<string, any> = { ...userProfiles };
      for (const conv of allConversations) {
        if (!profiles[conv.otherUserId]) {
          const profile = await profileService.getProfile(conv.otherUserId);
          profiles[conv.otherUserId] = profile;
        }
      }
      setUserProfiles(profiles);
      setConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        setCurrentUser(user);

        await loadConversations(user.id);

        if (userIdParam) {
          const otherProfile = await profileService.getProfile(userIdParam);
          setOtherUserProfile(otherProfile);

          // Get or create conversation ID
          const convId = await messageService.getOrCreateConversation(user.id, userIdParam);
          const convMessages = await messageService.getMessagesByConversation(convId);

          if (swapIdParam) {
            const swap = await swapService.getSwapById(swapIdParam);
            setCurrentSwap(swap);
          }

          setMessages(convMessages);

          // Load attachments for all messages
          const attachmentsMap: Record<string, any[]> = {};
          for (const msg of convMessages) {
            const msgAttachments = await attachmentService.getAttachmentsByMessage(msg.id);
            if (msgAttachments.length > 0) {
              attachmentsMap[msg.id] = msgAttachments;
            }
          }
          setAttachments(attachmentsMap);

          setSelectedConversation({
            id: convId,
            otherUserId: userIdParam,
            otherProfile,
            swapId: swapIdParam,
          });
        }
      } catch (error) {
        console.error('Error loading initial data (full error):', error);
        toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [userIdParam, swapIdParam]);

  // Real-time subscription for global messages (updates conversation list)
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('global_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${currentUser.id}`,
        },
        () => {
          loadConversations(currentUser.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // Real-time for current conversation
  useEffect(() => {
    if (!selectedConversation?.id || !currentUser) return;

    const channel = supabase
      .channel(`chat:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen for all changes including updates
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new;
            setMessages(prev => {
              if (prev.find(m => m.id === newMsg.id)) return prev;
              const next = [...prev, newMsg].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
              return next;
            });

            // Load attachments for new message
            const msgAttachments = await attachmentService.getAttachmentsByMessage(newMsg.id);
            if (msgAttachments.length > 0) {
              setAttachments(prev => ({ ...prev, [newMsg.id]: msgAttachments }));
            }

            loadConversations(currentUser.id);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'swap_offers',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        () => {
          // Re-load messages to get updated offer status (though it's in messages metadata usually, 
          // but we fetch the offer by ID in the card so it should be fine)
          const loadMsgs = async () => {
            const msgs = await messageService.getMessagesByConversation(selectedConversation.id);
            setMessages(msgs);
          };
          loadMsgs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedConversation?.id, currentUser]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;

    try {
      setSending(true);
      const newMessage = await messageService.sendMessage({
        sender_id: currentUser.id,
        receiver_id: selectedConversation.otherUserId,
        conversation_id: selectedConversation.id,
        swap_id: selectedConversation.swapId || undefined,
        content: messageText.trim() || "(File attachment)",
      });

      if (newMessage) {
        // Upload attachments if any
        if (selectedFiles.length > 0) {
          const uploadedAttachments = [];
          for (const file of selectedFiles) {
            const attachment = await attachmentService.createAttachment(file, newMessage.id);
            uploadedAttachments.push(attachment);
          }
          setAttachments(prev => ({
            ...prev,
            [newMessage.id]: uploadedAttachments
          }));

          // Log file exchange activity if swap context exists
          if (selectedConversation.swapId) {
            await historyService.logActivity({
              swap_id: selectedConversation.swapId,
              user_id: currentUser.id,
              activity_type: 'file_exchange',
              description: `Shared ${selectedFiles.length} file(s)`,
              metadata: { file_count: selectedFiles.length }
            });
          }
        }

        // Log message activity if swap context exists
        if (selectedConversation.swapId) {
          await historyService.logActivity({
            swap_id: selectedConversation.swapId,
            user_id: currentUser.id,
            activity_type: 'message',
            description: 'Sent a message',
            metadata: { message_id: newMessage.id }
          });
        }

        setMessages(prev => [...prev, newMessage]);
        setMessageText("");
        setSelectedFiles([]);
        loadConversations(currentUser.id);
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

  const selectConversation = async (conversation: any) => {
    try {
      setLoading(false);
      const otherProfile = userProfiles[conversation.otherUserId];
      setOtherUserProfile(otherProfile);

      const convMessages = await messageService.getMessagesByConversation(conversation.id);

      setSelectedConversation({
        ...conversation,
        otherProfile,
      });
      setMessages(convMessages);

      // Load attachments for all messages
      const attachmentsMap: Record<string, any[]> = {};
      for (const msg of convMessages) {
        const msgAttachments = await attachmentService.getAttachmentsByMessage(msg.id);
        if (msgAttachments.length > 0) {
          attachmentsMap[msg.id] = msgAttachments;
        }
      }
      setAttachments(attachmentsMap);

      if (conversation.swapId) {
        const swap = await swapService.getSwapById(conversation.swapId);
        setCurrentSwap(swap);
      } else {
        setCurrentSwap(null);
      }
    } catch (error) {
      console.error('Error selecting conversation:', error);
      toast({ title: "Error", description: "Failed to load conversation", variant: "destructive" });
    }
  };

  const handleOfferCreated = () => {
    if (selectedConversation?.id) {
      const load = async () => {
        const msgs = await messageService.getMessagesByConversation(selectedConversation.id);
        setMessages(msgs);
      };
      load();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredConversations = conversations.filter(conv => {
    const profile = userProfiles[conv.otherUserId];
    const name = profile?.full_name?.toLowerCase() || "";
    return name.includes(searchQuery.toLowerCase());
  });

  const canCreateOffer = selectedConversation && currentUser;

  return (
    <div className="flex flex-col h-screen bg-background">
      <Navbar isLoggedIn={true} />

      <div className="flex-1 overflow-hidden">
        <div className="container mx-auto h-full py-4 px-4 md:py-8">
          <div className="bg-card rounded-2xl border border-border shadow-xl h-full flex overflow-hidden">

            {/* Left Panel: Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-border bg-muted/10 ${selectedConversation && 'hidden md:flex'}`}>
              <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold font-display">Messages</h2>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search people..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-background/50 border-muted focus-visible:ring-terracotta"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {loading ? (
                  <div className="p-8 text-center">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-terracotta" />
                  </div>
                ) : filteredConversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">
                    <p className="text-sm">No conversations found</p>
                  </div>
                ) : (
                  filteredConversations.map((conv, idx) => {
                    const profile = userProfiles[conv.otherUserId];
                    const isSelected = selectedConversation?.otherUserId === conv.otherUserId;
                    return (
                      <button
                        key={idx}
                        onClick={() => selectConversation(conv)}
                        className={`w-full p-4 flex items-center gap-3 transition-all hover:bg-muted/50 border-b border-border/50 text-left ${isSelected ? 'bg-primary/5 border-l-4 border-l-terracotta' : ''}`}
                      >
                        <div className="relative flex-shrink-0">
                          <img
                            src={profile?.profile_image_url || "/placeholder.svg"}
                            alt="Avatar"
                            className="h-12 w-12 rounded-full object-cover ring-2 ring-background shadow-sm"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="font-semibold text-foreground truncate">
                              {profile?.full_name || 'User'}
                            </p>
                            <span className="text-[10px] uppercase font-medium text-muted-foreground">
                              {formatTime(conv.lastMessage.created_at)}
                            </span>
                          </div>
                          <p className={`text-xs truncate ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                            {conv.lastMessage.content}
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Panel: Chat Window */}
            <div className={`flex-1 flex flex-col bg-background/50 ${!selectedConversation && 'hidden md:flex'}`}>
              {selectedConversation ? (
                <>
                  {/* Chat Header */}
                  <div className="p-3 px-4 md:p-4 border-b border-border flex items-center justify-between bg-white/40 sticky top-0 backdrop-blur-sm z-10">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden -ml-2 rounded-full"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ChevronLeft className="h-6 w-6" />
                      </Button>
                      <div className="relative">
                        <img
                          src={otherUserProfile?.profile_image_url || "/placeholder.svg"}
                          alt="Avatar"
                          className="h-10 w-10 rounded-full object-cover shadow-sm ring-1 ring-border"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold leading-none mb-1">{otherUserProfile?.full_name || 'User'}</p>
                        <p className="text-xs text-muted-foreground truncate">{otherUserProfile?.city || 'CultureSwap user'}</p>
                      </div>
                    </div>

                    {canCreateOffer && (
                      <Button
                        variant="terracotta"
                        size="sm"
                        onClick={() => setCreateOfferOpen(true)}
                        className="rounded-full px-4 shadow-md transition-transform hover:scale-105"
                      >
                        <Handshake className="h-4 w-4 mr-2" />
                        Send Offer
                      </Button>
                    )}
                  </div>

                  {/* Messages Stream */}
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-soft-sand/20">
                    {messages.length > 0 ? (
                      messages.map((message, index) => {
                        const isMe = message.sender_id === currentUser?.id;
                        const hasOffer = !!message.offer_id;

                        return (
                          <div
                            key={message.id}
                            className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
                          >
                            <div className="max-w-[85%] md:max-w-[70%]">
                              {hasOffer ? (
                                <OfferCard
                                  offerId={message.offer_id}
                                  currentUserId={currentUser?.id || ''}
                                  onOfferUpdated={handleOfferCreated}
                                />
                              ) : (
                                <div className="space-y-1">
                                  <div
                                    className={`rounded-2xl px-4 py-2.5 shadow-sm ${isMe
                                      ? 'bg-terracotta text-white rounded-br-sm'
                                      : 'bg-white text-foreground rounded-bl-sm border border-border/50'
                                      }`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-white/80 justify-end' : 'text-muted-foreground'}`}>
                                      {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      {isMe && <CheckCheck className="h-3 w-3" />}
                                    </div>
                                  </div>
                                  {/* Attachments */}
                                  {attachments[message.id]?.map((attachment: any) => (
                                    <div key={attachment.id} className="rounded-lg overflow-hidden">
                                      {attachmentService.isImage(attachment.file_type) ? (
                                        <img
                                          src={attachment.url}
                                          alt={attachment.file_name}
                                          className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90"
                                          onClick={() => window.open(attachment.url, '_blank')}
                                        />
                                      ) : (
                                        <a
                                          href={attachment.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg hover:bg-muted text-sm"
                                        >
                                          <FileText className="h-4 w-4" />
                                          <span className="truncate">{attachment.file_name}</span>
                                          <Download className="h-3 w-3 ml-auto" />
                                        </a>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-muted-foreground space-y-2 opacity-60">
                        <MessageCircle className="h-12 w-12 stroke-1" />
                        <p className="text-sm">No messages yet. Send a greeting!</p>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-muted/20 border-t border-border">
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
                            <span className="text-xs text-muted-foreground">
                              {attachmentService.formatFileSize(file.size)}
                            </span>
                            <button onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== index))}>
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="container max-w-4xl mx-auto flex gap-2 items-end">
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          setSelectedFiles(prev => [...prev, ...files]);
                        }}
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
                      <div className="flex-1 bg-background rounded-2xl border border-muted-foreground/20 px-3 py-1 flex items-end shadow-sm focus-within:ring-1 focus-within:ring-terracotta/50">
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
                          className="flex-1 resize-none border-none focus-visible:ring-0 px-1 py-3 text-sm min-h-[44px] max-h-[120px]"
                          rows={1}
                        />
                      </div>
                      <Button
                        variant="terracotta"
                        size="icon"
                        onClick={handleSendMessage}
                        disabled={sending || (!messageText.trim() && selectedFiles.length === 0)}
                        className="h-11 w-11 rounded-2xl shadow-md transition-transform active:scale-95"
                      >
                        {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-muted/10">
                  <div className="h-20 w-20 bg-gradient-to-br from-terracotta/10 to-teal/10 rounded-full flex items-center justify-center mb-4">
                    <Handshake className="h-10 w-10 text-terracotta/60" />
                  </div>
                  <h3 className="text-xl font-display font-semibold mb-2">Your Conversations</h3>
                  <p className="text-muted-foreground max-w-xs mx-auto text-sm leading-relaxed">
                    Select a conversation from the list to view your chat history and swap offers.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {selectedConversation && (
        <CreateOfferDialog
          open={createOfferOpen}
          onOpenChange={setCreateOfferOpen}
          conversationId={selectedConversation.id}
          swapId={currentSwap?.id}
          receiverId={selectedConversation.otherUserId}
          onOfferCreated={handleOfferCreated}
        />
      )}
    </div>
  );
};

import { MessageCircle } from "lucide-react";

export default Messages;