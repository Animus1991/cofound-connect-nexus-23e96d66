import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare,
  Search,
  Send,
  Paperclip,
  Phone,
  Video,
  MoreVertical,
  Users,
  Star,
  Clock,
  Archive,
  Trash2,
  Edit,
  Filter,
  Plus,
  Settings,
  Bell,
  UserPlus,
  Briefcase,
  Heart,
  Zap,
  Check,
  CheckCheck,
  Image,
  FileText,
  Calendar,
  MapPin,
  Info,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Pin,
  PinOff,
  Smile,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Share2,
  Download,
  Reply,
  ReplyAll,
  Forward,
  Bookmark,
  BookmarkOff
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    isOnline?: boolean;
    isTyping?: boolean;
  };
  content: string;
  type: 'text' | 'image' | 'file' | 'voice' | 'video';
  timestamp: string;
  status: 'sending' | 'sent' | 'delivered' | 'read';
  attachments?: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
  }>;
  reactions?: Array<{
    emoji: string;
    userId: string;
    userName: string;
  }>;
  replyTo?: {
    id: string;
    content: string;
    sender: string;
  };
  isPinned?: boolean;
  isEdited?: boolean;
  editedAt?: string;
}

interface Conversation {
  id: string;
  participant: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    location?: string;
    isOnline?: boolean;
    lastSeen?: string;
    unreadCount?: number;
    isTyping?: boolean;
  };
  type: 'direct' | 'group';
  groupName?: string;
  groupMembers?: number;
  lastMessage?: {
    content: string;
    timestamp: string;
    sender: string;
    type: string;
  };
  status: 'active' | 'archived' | 'muted';
  tags?: string[];
  priority?: 'high' | 'normal' | 'low';
  sharedFiles?: number;
  sharedLinks?: number;
  isPinned?: boolean;
}

interface MessageThreadProps {
  conversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string, type: string) => void;
  onMessageAction: (messageId: string, action: string) => void;
  isTyping: boolean;
  onTypingChange: (typing: boolean) => void;
}

function MessageThread({ conversation, messages, onSendMessage, onMessageAction, isTyping, onTypingChange }: MessageThreadProps) {
  const [messageInput, setMessageInput] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isTyping && messageInput) {
      const timeout = setTimeout(() => onTypingChange(false), 1000);
      return () => clearTimeout(timeout);
    }
  }, [messageInput, isTyping, onTypingChange]);

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      onSendMessage(messageInput, 'text');
      setMessageInput('');
      setReplyingTo(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const getMessageStatusIcon = (status: string) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 text-gray-400" />;
      case 'sent': return <Check className="w-3 h-3 text-gray-400" />;
      case 'delivered': return <CheckCheck className="w-3 h-3 text-blue-400" />;
      case 'read': return <CheckCheck className="w-3 h-3 text-blue-600" />;
      default: return null;
    }
  };

  return (
    <div className={`flex flex-col h-full bg-background ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Thread Header */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          {isFullscreen && (
            <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
          )}
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={conversation.participant.avatar} />
              <AvatarFallback>
                {conversation.participant.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{conversation.participant.name}</h3>
              <p className="text-sm text-muted-foreground">
                {conversation.participant.isOnline ? 'Active now' : 
                 conversation.participant.isTyping ? 'Typing...' :
                 conversation.participant.lastSeen ? `Last seen ${new Date(conversation.participant.lastSeen).toLocaleDateString()}` :
                 'Offline'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm">
            <Phone className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Video className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm">
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.senderId === 'current-user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[70%] ${message.senderId === 'current-user' ? 'order-2' : 'order-1'}`}>
                {message.replyTo && (
                  <div className="mb-1 p-2 bg-muted/50 rounded-lg border-l-2 border-blue-500">
                    <p className="text-xs text-muted-foreground mb-1">
                      Replying to {message.replyTo.sender}
                    </p>
                    <p className="text-sm truncate">{message.replyTo.content}</p>
                  </div>
                )}
                
                <div
                  className={`relative group p-3 rounded-lg ${
                    message.senderId === 'current-user' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-muted'
                  }`}
                >
                  {message.isPinned && (
                    <div className="absolute -top-2 -right-2">
                      <Pin className="w-4 h-4 text-yellow-500" />
                    </div>
                  )}
                  
                  {message.type === 'text' && (
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  )}
                  
                  {message.type === 'image' && (
                    <div className="space-y-2">
                      <img 
                        src={message.attachments?.[0]?.url} 
                        alt="Shared image"
                        className="rounded-lg max-w-full h-auto"
                      />
                      {message.content && <p className="text-sm">{message.content}</p>}
                    </div>
                  )}
                  
                  {message.type === 'file' && (
                    <div className="flex items-center space-x-2 p-2 bg-background/20 rounded">
                      <FileText className="w-4 h-4" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{message.attachments?.[0]?.name}</p>
                        <p className="text-xs opacity-70">
                          {message.attachments?.[0]?.size ? `${(message.attachments[0].size / 1024).toFixed(1)} KB` : ''}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs opacity-70">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.isEdited && (
                        <span className="text-xs opacity-70">(edited)</span>
                      )}
                    </div>
                    
                    {message.senderId === 'current-user' && (
                      <div className="flex items-center space-x-1">
                        {getMessageStatusIcon(message.status)}
                      </div>
                    )}
                  </div>
                  
                  {/* Message Actions */}
                  <div className="absolute -top-8 right-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background border rounded-lg shadow-lg p-1 flex items-center space-x-1">
                    <Button variant="ghost" size="sm" onClick={() => setReplyingTo(message.id)}>
                      <Reply className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Forward className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Bookmark className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Pin className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Reactions */}
                {message.reactions && message.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {message.reactions.map((reaction, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {reaction.emoji} {reaction.userName}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Reply Preview */}
      {replyingTo && (
        <div className="p-3 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Replying to message</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setReplyingTo(null)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="p-4 border-t bg-background/95 backdrop-blur-sm">
        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <div className="flex items-center space-x-2 bg-muted rounded-lg p-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="w-4 h-4" />
              </Button>
              <Input
                ref={inputRef}
                value={messageInput}
                onChange={(e) => {
                  setMessageInput(e.target.value);
                  if (!isTyping && e.target.value) onTypingChange(true);
                }}
                onKeyPress={handleKeyPress}
                placeholder="Type a message..."
                className="border-0 bg-transparent focus-visible:ring-0"
              />
              <Button variant="ghost" size="sm">
                <Smile className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Mic className={`w-4 h-4 ${isRecording ? 'text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
          <Button 
            onClick={handleSendMessage}
            disabled={!messageInput.trim()}
            size="sm"
            className="gap-2"
          >
            <Send className="w-4 h-4" />
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function AdvancedMessagingHub() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isTyping, setIsTyping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockConversations: Conversation[] = [
        {
          id: '1',
          participant: {
            id: '1',
            name: 'Sarah Chen',
            avatar: '',
            headline: 'Full-stack developer & AI enthusiast',
            location: 'San Francisco, CA',
            isOnline: true,
            unreadCount: 3,
            isTyping: false
          },
          type: 'direct',
          lastMessage: {
            content: 'Hey! I reviewed your proposal and it looks great. When can we discuss the next steps?',
            timestamp: '2024-01-15T14:30:00Z',
            sender: 'Sarah Chen',
            type: 'text'
          },
          status: 'active',
          tags: ['co-founder', 'technical'],
          priority: 'high',
          sharedFiles: 5,
          sharedLinks: 12,
          isPinned: true
        },
        {
          id: '2',
          participant: {
            id: '2',
            name: 'Michael Rodriguez',
            avatar: '',
            headline: 'Serial entrepreneur & startup advisor',
            location: 'New York, NY',
            isOnline: false,
            lastSeen: '2024-01-15T10:20:00Z',
            unreadCount: 0,
            isTyping: false
          },
          type: 'direct',
          lastMessage: {
            content: 'The pitch deck looks solid. Let me know if you need help with the financial projections.',
            timestamp: '2024-01-14T16:45:00Z',
            sender: 'Michael Rodriguez',
            type: 'text'
          },
          status: 'active',
          tags: ['mentor', 'advisor'],
          priority: 'normal',
          sharedFiles: 3,
          sharedLinks: 8
        },
        {
          id: '3',
          participant: {
            id: '3',
            name: 'Product Team',
            avatar: '',
            headline: 'Product development discussions',
            location: 'Remote',
            isOnline: true,
            unreadCount: 7,
            isTyping: true
          },
          type: 'group',
          groupName: 'Product Team',
          groupMembers: 8,
          lastMessage: {
            content: 'Emily: The new designs are ready for review',
            timestamp: '2024-01-15T13:15:00Z',
            sender: 'Emily Johnson',
            type: 'text'
          },
          status: 'active',
          tags: ['team', 'product'],
          priority: 'normal',
          sharedFiles: 23,
          sharedLinks: 45
        }
      ];
      setConversations(mockConversations);
    } catch (error) {
      toast({
        title: "Error loading conversations",
        description: "Failed to load your conversations. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      // Mock data for now - replace with actual API call
      const mockMessages: Message[] = [
        {
          id: '1',
          conversationId,
          senderId: '1',
          sender: {
            id: '1',
            name: 'Sarah Chen',
            avatar: '',
            isOnline: true
          },
          content: 'Hey! I reviewed your proposal and it looks great. When can we discuss the next steps?',
          type: 'text',
          timestamp: '2024-01-15T14:30:00Z',
          status: 'read',
          reactions: [
            { emoji: '👍', userId: 'current-user', userName: 'You' }
          ]
        },
        {
          id: '2',
          conversationId,
          senderId: 'current-user',
          sender: {
            id: 'current-user',
            name: 'You',
            avatar: '',
            isOnline: true
          },
          content: 'That\'s fantastic! I\'m available tomorrow afternoon or Friday morning. What works better for you?',
          type: 'text',
          timestamp: '2024-01-15T14:35:00Z',
          status: 'read'
        },
        {
          id: '3',
          conversationId,
          senderId: '1',
          sender: {
            id: '1',
            name: 'Sarah Chen',
            avatar: '',
            isOnline: true
          },
          content: 'Tomorrow afternoon works perfectly! How about 2 PM PST? I can share my screen and we can go through the technical details.',
          type: 'text',
          timestamp: '2024-01-15T14:40:00Z',
          status: 'read',
          isPinned: true
        }
      ];
      setMessages(mockMessages);
    } catch (error) {
      toast({
        title: "Error loading messages",
        description: "Failed to load messages. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (content: string, type: string) => {
    if (!selectedConversation) return;

    try {
      const newMessage: Message = {
        id: Date.now().toString(),
        conversationId: selectedConversation.id,
        senderId: 'current-user',
        sender: {
          id: 'current-user',
          name: 'You',
          avatar: '',
          isOnline: true
        },
        content,
        type: type as any,
        timestamp: new Date().toISOString(),
        status: 'sending'
      };

      setMessages(prev => [...prev, newMessage]);

      // Simulate API call
      setTimeout(() => {
        setMessages(prev => 
          prev.map(msg => 
            msg.id === newMessage.id 
              ? { ...msg, status: 'sent' as const }
              : msg
          )
        );
        
        setTimeout(() => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === newMessage.id 
                ? { ...msg, status: 'delivered' as const }
                : msg
            )
          );
        }, 1000);
      }, 500);

      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id
            ? {
                ...conv,
                lastMessage: {
                  content,
                  timestamp: new Date().toISOString(),
                  sender: 'You',
                  type
                }
              }
            : conv
        )
      );
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = searchQuery === '' || 
      conv.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.participant.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'unread' && conv.participant.unreadCount && conv.participant.unreadCount > 0) ||
      (activeTab === 'pinned' && conv.isPinned) ||
      (activeTab === 'archived' && conv.status === 'archived');
    
    return matchesSearch && matchesTab;
  });

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-80 border-r p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Conversations List */}
      <div className="w-80 border-r flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <Filter className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="unread" className="text-xs">Unread</TabsTrigger>
              <TabsTrigger value="pinned" className="text-xs">Pinned</TabsTrigger>
              <TabsTrigger value="archived" className="text-xs">Archived</TabsTrigger>
            </TabsList>
          </div>

          {/* Conversations List */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={conversation.participant.avatar} />
                        <AvatarFallback>
                          {conversation.participant.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.participant.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                      )}
                      {conversation.participant.isTyping && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background animate-pulse"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">
                          {conversation.type === 'group' ? conversation.groupName : conversation.participant.name}
                        </h3>
                        <div className="flex items-center space-x-1">
                          {conversation.isPinned && <Pin className="w-3 h-3 text-yellow-500" />}
                          {conversation.participant.unreadCount && conversation.participant.unreadCount > 0 && (
                            <Badge variant="default" className="text-xs">
                              {conversation.participant.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1 truncate">
                        {conversation.participant.headline}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate flex-1">
                          {conversation.lastMessage?.sender && (
                            <span className="font-medium">{conversation.lastMessage.sender}: </span>
                          )}
                          {conversation.lastMessage?.content}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {conversation.lastMessage && formatTimestamp(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                      
                      {/* Tags */}
                      {conversation.tags && conversation.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {conversation.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {conversation.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{conversation.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>

        {/* Sidebar Footer */}
        <div className="p-4 border-t">
          <Button className="w-full gap-2">
            <Plus className="w-4 h-4" />
            New Conversation
          </Button>
        </div>
      </div>

      {/* Main Content - Message Thread */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <MessageThread
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={handleSendMessage}
            onMessageAction={(messageId, action) => console.log('Message action:', messageId, action)}
            isTyping={isTyping}
            onTypingChange={setIsTyping}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Select a conversation</h3>
              <p className="text-muted-foreground">Choose a conversation from the sidebar to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTimestamp(timestamp: string) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
  
  if (diffInHours < 1) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (diffInHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
