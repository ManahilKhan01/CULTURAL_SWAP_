import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Send, Loader2, Handshake, ChevronLeft, MoreVertical, CheckCheck, Paperclip, X, Download, FileText, Image as ImageIcon, File, Star, Archive, MessageCircle, Trash2, Bell } from "lucide-react";
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
import { chatManagementService } from "@/lib/chatManagementService";
import { aiAssistantService } from "@/lib/aiAssistantService";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { getCacheBustedImageUrl } from "@/lib/cacheUtils";

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
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'starred' | 'archived' | 'offers' | 'assistant'>('all');
  const [starredChats, setStarredChats] = useState<Set<string>>(new Set());
  const [archivedChats, setArchivedChats] = useState<Set<string>>(new Set());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Use the unread messages hook for real-time tracking
  const { markConversationAsRead } = useUnreadMessages(currentUser?.id || null);

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (!selectedConversation?.id || !currentUser) return;

    // Mark all unread messages in this conversation as read
    const markAsRead = async () => {
      try {
        await markConversationAsRead(selectedConversation.id);
        // Reload conversations to update the list (removes from unread filter)
        if (currentUser?.id) {
          await loadConversations(currentUser.id);
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
        // Non-blocking error - don't show toast as it can be distracting
      }
    };

    markAsRead();
  }, [selectedConversation?.id, currentUser, markConversationAsRead]);

  // Check if a user is an assistant
  const isAssistantUser = (profile: any) => {
    if (!profile?.full_name) return false;
    const name = profile.full_name.toLowerCase();
    return name.includes('assistant') || name.includes('support') || name.includes('system');
  };

  // Check if conversation is a custom offer (from offers table)
  const isCustomOfferConversation = (conv: any) => {
    return conv.swapId && !conv.isDefaultSwap;
  };

  // Apply filters to conversations
  const applyFilters = (convs: any[]) => {
    let filtered = [...convs];

    // Remove archived chats unless viewing archived filter
    if (activeFilter !== 'archived') {
      filtered = filtered.filter(conv => !archivedChats.has(conv.id));
    } else {
      filtered = filtered.filter(conv => archivedChats.has(conv.id));
    }

    // Apply specific filters
    switch (activeFilter) {
      case 'starred':
        filtered = filtered.filter(conv => starredChats.has(conv.id));
        break;
      case 'unread':
        // Unread: where current user is receiver and has unread messages
        filtered = filtered.filter(conv => {
          const lastMsg = conv.lastMessage;
          return lastMsg.receiver_id === currentUser?.id && !lastMsg.is_read;
        });
        break;
      case 'offers':
        filtered = filtered.filter(conv => isCustomOfferConversation(conv));
        break;
      case 'assistant':
        filtered = filtered.filter(conv => isAssistantUser(userProfiles[conv.otherUserId]));
        break;
      case 'all':
      default:
        break;
    }

    return filtered;
  };

  // Star/Unstar handlers
  const handleStarChat = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    try {
      if (starredChats.has(conversationId)) {
        await chatManagementService.unstarChat(currentUser.id, conversationId);
        setStarredChats(prev => {
          const updated = new Set(prev);
          updated.delete(conversationId);
          return updated;
        });
      } else {
        await chatManagementService.starChat(currentUser.id, conversationId);
        setStarredChats(prev => new Set(prev).add(conversationId));
      }
    } catch (error) {
      console.error('Error starring chat:', error);
      toast({ title: "Error", description: "Failed to star chat", variant: "destructive" });
    }
  };

  // Archive/Unarchive handlers
  const handleArchiveChat = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    try {
      if (archivedChats.has(conversationId)) {
        await chatManagementService.unarchiveChat(currentUser.id, conversationId);
        setArchivedChats(prev => {
          const updated = new Set(prev);
          updated.delete(conversationId);
          return updated;
        });
      } else {
        await chatManagementService.archiveChat(currentUser.id, conversationId);
        setArchivedChats(prev => new Set(prev).add(conversationId));
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
        }
      }
      loadConversations(currentUser.id);
      toast({
        title: "Success",
        description: archivedChats.has(conversationId) ? "Chat unarchived" : "Chat archived",
      });
    } catch (error) {
      console.error('Error archiving chat:', error);
      toast({ title: "Error", description: "Failed to archive chat", variant: "destructive" });
    }
  };

  // Open or create assistant chat
  const handleOpenAssistantChat = async () => {
    try {
      if (!currentUser) {
        toast({ title: "Error", description: "Please log in first", variant: "destructive" });
        return;
      }

      setMenuOpenId(null);

      try {
        // Get assistant profile
        const assistant = await aiAssistantService.getOrCreateAssistantUser();
        console.log('Assistant profile obtained:', assistant);

        // Get or create assistant conversation (returns virtual ID)
        const conversationId = await aiAssistantService.getOrCreateAssistantConversation(currentUser.id);
        console.log('Conversation ID:', conversationId);

        // For assistant chat, try to load from messages between user and assistant
        // If conversation ID is virtual (starts with "assistant-conv-"), query by users instead
        let convMessages: any[] = [];

        if (conversationId.startsWith('assistant-conv-')) {
          // Use message-based lookup (avoids conversations table entirely)
          console.log('Loading messages via message-based fallback');
          try {
            convMessages = await messageService.getConversation(currentUser.id, assistant.id);
          } catch (msgError) {
            console.warn('Could not load from messages, starting fresh:', msgError);
            convMessages = [];
          }
        } else {
          // Try normal conversation-based lookup
          try {
            convMessages = await messageService.getMessagesByConversation(conversationId);
          } catch (convError) {
            console.warn('Conversation lookup failed, trying message fallback:', convError);
            convMessages = await messageService.getConversation(currentUser.id, assistant.id);
          }
        }

        console.log('Messages loaded:', convMessages.length);

        // Load attachments
        const attachmentsMap: Record<string, any[]> = {};
        for (const msg of convMessages) {
          try {
            const msgAttachments = await attachmentService.getAttachmentsByMessage(msg.id);
            if (msgAttachments.length > 0) {
              attachmentsMap[msg.id] = msgAttachments;
            }
          } catch (e) {
            console.warn('Could not load attachments for message:', msg.id);
          }
        }

        // Set user profiles
        setUserProfiles(prev => ({
          ...prev,
          [assistant.id]: assistant
        }));

        // Select the assistant conversation
        setSelectedConversation({
          id: conversationId,
          otherUserId: assistant.id,
          otherProfile: assistant,
        });

        setOtherUserProfile(assistant);
        setMessages(convMessages);
        setAttachments(attachmentsMap);
        setCurrentSwap(null);

        // Reload conversations to show assistant chat if newly created
        await loadConversations(currentUser.id);

        toast({
          title: "Success",
          description: "Assistant chat opened",
        });
      } catch (error) {
        console.error('Full error opening assistant chat:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Error opening assistant chat:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to open assistant chat. Please check console for details.",
        variant: "destructive"
      });
    }
  };

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

      // Load chat metadata (starred and archived)
      if (uId) {
        const metadata = await chatManagementService.getAllChatMetadata(uId);
        setStarredChats(metadata.starredChats);
        setArchivedChats(metadata.archivedChats);
      }
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

    // Skip real-time subscriptions for virtual assistant conversations
    if (aiAssistantService.isAssistantConversation(selectedConversation.id)) {
      console.log('Using virtual conversation, skipping real-time subscriptions');
      return;
    }

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

  // Listen for profile updates to refresh user data
  useEffect(() => {
    const handleProfileUpdate = async () => {
      if (currentUser) {
        const updatedProfile = await profileService.getProfile(currentUser.id);
        if (updatedProfile) {
          setCurrentUser({ ...currentUser, ...updatedProfile });
        }
      }
      // Also refresh the other user profile if viewing a conversation
      if (selectedConversation?.otherUserId) {
        const updatedOtherProfile = await profileService.getProfile(selectedConversation.otherUserId);
        if (updatedOtherProfile) {
          setOtherUserProfile(updatedOtherProfile);
        }
      }
      // Refresh all user profiles in conversations
      if (currentUser) {
        await loadConversations(currentUser.id);
      }
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, [currentUser, selectedConversation]);

  // Real-time subscriptions for chat starred/archived status
  useEffect(() => {
    if (!currentUser?.id) return;

    const channel = supabase
      .channel(`chat_metadata:${currentUser.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_starred',
          filter: `user_id=eq.${currentUser.id}`,
        },
        async () => {
          // Reload starred chats
          const starred = await chatManagementService.getStarredChats(currentUser.id);
          setStarredChats(new Set(starred));
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_archived',
          filter: `user_id=eq.${currentUser.id}`,
        },
        async () => {
          // Reload archived chats
          const archived = await chatManagementService.getArchivedChats(currentUser.id);
          setArchivedChats(new Set(archived));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id]);

  const handleSendMessage = async () => {
    if (!messageText.trim() && selectedFiles.length === 0) return;

    try {
      setSending(true);

      // Check if this is an assistant conversation (uses virtual ID)
      const isAssistantChat = aiAssistantService.isAssistantConversation(selectedConversation.id);

      let newMessage: any;

      if (isAssistantChat) {
        // For assistant chat, create message locally without trying to save to DB
        newMessage = {
          id: `local-${Date.now()}-${Math.random()}`,
          conversation_id: selectedConversation.id,
          sender_id: currentUser.id,
          receiver_id: selectedConversation.otherUserId,
          content: messageText.trim() || "(File attachment)",
          created_at: new Date().toISOString(),
          is_read: true,
        };

        setMessages(prev => [...prev, newMessage]);
        console.log('Created local assistant message:', newMessage);
      } else {
        // For regular conversations, save to database
        newMessage = await messageService.sendMessage({
          sender_id: currentUser.id,
          receiver_id: selectedConversation.otherUserId,
          conversation_id: selectedConversation.id,
          swap_id: selectedConversation.swapId || undefined,
          content: messageText.trim() || "(File attachment)",
        });

        if (newMessage) {
          setMessages(prev => [...prev, newMessage]);
        }
      }

      if (newMessage) {
        // Upload attachments if any (for assistant chats, store locally; for regular, use DB)
        if (selectedFiles.length > 0) {
          const uploadedAttachments = [];
          for (const file of selectedFiles) {
            if (!isAssistantChat) {
              const attachment = await attachmentService.createAttachment(file, newMessage.id);
              uploadedAttachments.push(attachment);
            } else {
              // For assistant chat, create local attachment representation
              const localAttachment = {
                id: `local-att-${Date.now()}`,
                message_id: newMessage.id,
                file_name: file.name,
                file_size: file.size,
                file_url: URL.createObjectURL(file),
              };
              uploadedAttachments.push(localAttachment);
            }
          }
          setAttachments(prev => ({
            ...prev,
            [newMessage.id]: uploadedAttachments
          }));
        }

        // Log swap activity (only for regular conversations with swap context)
        if (!isAssistantChat && selectedConversation.swapId) {
          if (selectedFiles.length > 0) {
            await historyService.logActivity({
              swap_id: selectedConversation.swapId,
              user_id: currentUser.id,
              activity_type: 'file_exchange',
              description: `Shared ${selectedFiles.length} file(s)`,
              metadata: { file_count: selectedFiles.length }
            });
          }

          await historyService.logActivity({
            swap_id: selectedConversation.swapId,
            user_id: currentUser.id,
            activity_type: 'message',
            description: 'Sent a message',
            metadata: { message_id: newMessage.id }
          });
        }

        setMessageText("");
        setSelectedFiles([]);
        loadConversations(currentUser.id);

        // If this is an assistant chat, generate and send AI response
        if (otherUserProfile && aiAssistantService.isAssistantProfile(otherUserProfile)) {
          try {
            // Generate AI response
            const aiResponse = await aiAssistantService.generateResponse(messageText.trim(), messages);

            // Create a virtual assistant message for display
            const assistantMessage = {
              id: `assistant-${Date.now()}-${Math.random()}`,
              conversation_id: selectedConversation.id,
              sender_id: otherUserProfile.id,
              receiver_id: currentUser.id,
              content: aiResponse,
              created_at: new Date().toISOString(),
              is_read: true,
              is_assistant: true,
            };

            // Add AI message to UI with a slight delay for natural feel
            setTimeout(() => {
              setMessages(prev => [...prev, assistantMessage]);
              loadConversations(currentUser.id);
            }, 500);
          } catch (error) {
            console.error('Error generating AI response:', error);
            // Don't show error to user, just fail silently for AI responses
          }
        }
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

  const filteredConversations = applyFilters(conversations).filter(conv => {
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
                  <div className="relative">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full"
                      onClick={() => setMenuOpenId(menuOpenId ? null : 'menu')}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                    {menuOpenId === 'menu' && (
                      <div className="absolute right-0 mt-1 w-48 bg-white border border-border rounded-lg shadow-lg z-50">
                        <button
                          onClick={handleOpenAssistantChat}
                          className="w-full text-left px-4 py-2.5 hover:bg-terracotta/5 text-sm flex items-center gap-2 transition-colors border-b border-border text-terracotta font-semibold"
                        >
                          <MessageCircle className="h-4 w-4" />
                          Start Assistant Chat
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter(activeFilter === 'unread' ? 'all' : 'unread');
                            setMenuOpenId(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors ${activeFilter === 'unread' ? 'bg-terracotta/10 text-terracotta font-semibold' : ''}`}
                        >
                          <Bell className="h-4 w-4" />
                          Unread
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter(activeFilter === 'starred' ? 'all' : 'starred');
                            setMenuOpenId(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors ${activeFilter === 'starred' ? 'bg-terracotta/10 text-terracotta font-semibold' : ''}`}
                        >
                          <Star className="h-4 w-4" />
                          Starred
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter(activeFilter === 'offers' ? 'all' : 'offers');
                            setMenuOpenId(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors ${activeFilter === 'offers' ? 'bg-terracotta/10 text-terracotta font-semibold' : ''}`}
                        >
                          <Handshake className="h-4 w-4" />
                          Custom Offers
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter(activeFilter === 'assistant' ? 'all' : 'assistant');
                            setMenuOpenId(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors ${activeFilter === 'assistant' ? 'bg-terracotta/10 text-terracotta font-semibold' : ''}`}
                        >
                          <MessageCircle className="h-4 w-4" />
                          Assistant Chats
                        </button>
                        <button
                          onClick={() => {
                            setActiveFilter(activeFilter === 'archived' ? 'all' : 'archived');
                            setMenuOpenId(null);
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors border-t border-border ${activeFilter === 'archived' ? 'bg-terracotta/10 text-terracotta font-semibold' : ''}`}
                        >
                          <Archive className="h-4 w-4" />
                          Archived
                        </button>
                        {activeFilter !== 'all' && (
                          <button
                            onClick={() => {
                              setActiveFilter('all');
                              setMenuOpenId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center gap-2 transition-colors border-t border-border text-muted-foreground"
                          >
                            <X className="h-4 w-4" />
                            Clear Filter
                          </button>
                        )}
                      </div>
                    )}
                  </div>
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
                {/* Filter Indicator */}
                {activeFilter !== 'all' && (
                  <div className="px-4 py-2 bg-terracotta/5 border-b border-border">
                    <div className="flex items-center gap-2 text-sm">
                      {activeFilter === 'starred' && (
                        <>
                          <Star className="h-4 w-4 text-terracotta fill-terracotta" />
                          <span className="text-terracotta font-medium">Starred Chats</span>
                        </>
                      )}
                      {activeFilter === 'archived' && (
                        <>
                          <Archive className="h-4 w-4 text-terracotta" />
                          <span className="text-terracotta font-medium">Archived Chats</span>
                        </>
                      )}
                      {activeFilter === 'unread' && (
                        <>
                          <Bell className="h-4 w-4 text-terracotta" />
                          <span className="text-terracotta font-medium">Unread Messages</span>
                        </>
                      )}
                      {activeFilter === 'offers' && (
                        <>
                          <Handshake className="h-4 w-4 text-terracotta" />
                          <span className="text-terracotta font-medium">Custom Offers</span>
                        </>
                      )}
                      {activeFilter === 'assistant' && (
                        <>
                          <MessageCircle className="h-4 w-4 text-terracotta" />
                          <span className="text-terracotta font-medium">Assistant Chats</span>
                        </>
                      )}
                    </div>
                  </div>
                )}
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
                    const isStarred = starredChats.has(conv.id);
                    const isArchived = archivedChats.has(conv.id);
                    const isUnread = conv.lastMessage.receiver_id === currentUser?.id && !conv.lastMessage.is_read;
                    const isAssistant = isAssistantUser(profile);

                    return (
                      <div key={idx} className="relative group">
                        <button
                          onClick={() => selectConversation(conv)}
                          className={`w-full p-4 flex items-center gap-3 transition-all border-b border-border/50 text-left ${isAssistant ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-muted/50'} ${isSelected ? 'bg-primary/5 border-l-4 border-l-terracotta' : ''}`}
                        >
                          <div className="relative flex-shrink-0">
                            <img
                              key={getCacheBustedImageUrl(profile?.profile_image_url)}
                              src={getCacheBustedImageUrl(profile?.profile_image_url)}
                              alt="Avatar"
                              className={`h-12 w-12 rounded-full object-cover ring-2 shadow-sm ${isAssistant ? 'ring-blue-400 bg-blue-100' : 'ring-background'}`}
                            />
                            {isAssistant && (
                              <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white flex items-center justify-center" title="AI Assistant">
                                <span className="text-white text-xs font-bold">✨</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5 gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {isStarred && <Star className="h-3.5 w-3.5 flex-shrink-0 text-golden fill-golden" />}
                                <p className={`font-semibold truncate ${isAssistant ? 'text-blue-700' : 'text-foreground'} ${isUnread ? 'font-bold' : ''}`}>
                                  {isAssistant && '🤖 '}{profile?.full_name || 'User'}
                                </p>
                              </div>
                              <span className="text-[10px] uppercase font-medium text-muted-foreground flex-shrink-0">
                                {formatTime(conv.lastMessage.created_at)}
                              </span>
                            </div>
                            <p className={`text-xs truncate ${isSelected ? 'text-primary' : isAssistant ? 'text-blue-600 font-medium' : isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                              {conv.lastMessage.content}
                            </p>
                          </div>
                        </button>

                        {/* Chat Context Menu */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity z-40">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setMenuOpenId(menuOpenId === conv.id ? null : conv.id);
                              }}
                              className="p-1.5 hover:bg-muted rounded-lg transition-colors"
                            >
                              <MoreVertical className="h-4 w-4 text-muted-foreground" />
                            </button>
                            {menuOpenId === conv.id && (
                              <div className="absolute right-0 mt-0 w-40 bg-white border border-border rounded-lg shadow-lg">
                                <button
                                  onClick={(e) => handleStarChat(e, conv.id)}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2 transition-colors"
                                >
                                  <Star className={`h-4 w-4 ${isStarred ? 'fill-golden text-golden' : ''}`} />
                                  {isStarred ? 'Unstar' : 'Star'}
                                </button>
                                <button
                                  onClick={(e) => handleArchiveChat(e, conv.id)}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center gap-2 transition-colors border-t border-border"
                                >
                                  <Archive className="h-4 w-4" />
                                  {isArchived ? 'Unarchive' : 'Archive'}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
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
                  <div className={`p-3 px-4 md:p-4 border-b border-border flex items-center justify-between sticky top-0 backdrop-blur-sm z-10 ${isAssistantUser(otherUserProfile)
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100/50 border-blue-200'
                    : 'bg-white/40'
                    }`}>
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
                          key={getCacheBustedImageUrl(otherUserProfile?.profile_image_url)}
                          src={getCacheBustedImageUrl(otherUserProfile?.profile_image_url)}
                          alt="Avatar"
                          className={`h-10 w-10 rounded-full object-cover shadow-sm ring-1 ${isAssistantUser(otherUserProfile) ? 'ring-blue-400 bg-blue-100' : 'ring-border'
                            }`}
                        />
                        {isAssistantUser(otherUserProfile) ? (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 border-2 border-white text-[10px] flex items-center justify-center text-white font-bold">✨</div>
                        ) : (
                          <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold leading-none mb-1 ${isAssistantUser(otherUserProfile) ? 'text-blue-700' : ''}`}>
                          {isAssistantUser(otherUserProfile) && '🤖 '}{otherUserProfile?.full_name || 'User'}
                        </p>
                        <p className={`text-xs truncate ${isAssistantUser(otherUserProfile) ? 'text-blue-600' : 'text-muted-foreground'}`}>
                          {isAssistantUser(otherUserProfile) ? 'AI Assistant' : otherUserProfile?.city || 'CultureSwap user'}
                        </p>
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
                                      : `rounded-bl-sm border ${isAssistantUser(otherUserProfile) ? 'bg-blue-50 border-blue-200 text-foreground' : 'bg-white border-border/50 text-foreground'}`
                                      }`}
                                  >
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                                    <div className={`text-[10px] mt-1 flex items-center gap-1 ${isMe ? 'text-white/80 justify-end' : isAssistantUser(otherUserProfile) ? 'text-blue-600' : 'text-muted-foreground'}`}>
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
                      <div className="flex-1 flex items-end">
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
                          className="flex-1 resize-none border-none outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 focus:shadow-none px-1 py-3 text-sm min-h-[44px] max-h-[120px] bg-transparent"
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

export default Messages;