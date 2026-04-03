import React, { useState, useEffect } from "react";
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
  Clock,
  Check,
  X,
  UserPlus,
  Users,
  Star,
  Briefcase,
  Heart,
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Archive,
  Trash2,
  MoreVertical,
  Calendar,
  MapPin,
  Filter,
  Settings,
  Bell,
  BellOff,
  Volume2,
  VolumeX,
  Shield,
  Flag,
  Ban,
  Info,
  FileText,
  Download,
  ChevronRight,
  Sparkles,
  Target,
  Award,
  TrendingUp,
  Timer,
  UserCheck,
  UserX,
  MessageCircle,
  Phone,
  Video
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface MessageRequest {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    location?: string;
    skills: string[];
    compatibilityScore?: number;
    mutualConnections?: number;
    verified?: boolean;
    responseRate?: number;
    averageResponseTime?: string;
  };
  message: {
    content: string;
    type: 'text' | 'connection_request' | 'mentorship_request' | 'collaboration_request';
    attachments?: Array<{
      id: string;
      name: string;
      type: string;
      url: string;
    }>;
    sharedProfile?: {
      name: string;
      headline: string;
      skills: string[];
    };
  };
  metadata: {
    sentAt: string;
    expiresAt?: string;
    priority: 'high' | 'normal' | 'low';
    source: 'match' | 'community' | 'mentor' | 'direct' | 'referral';
    tags: string[];
    isSpam?: boolean;
    isReported?: boolean;
    autoResponseAvailable?: boolean;
  };
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'archived';
  responseDeadline?: string;
  reminderSent?: boolean;
  followUpSent?: boolean;
}

interface MessageRequestManagementProps {
  onRequestAction: (requestId: string, action: 'accept' | 'decline' | 'archive' | 'spam') => void;
  onSendMessage: (requestId: string, message: string) => void;
  onViewProfile: (userId: string) => void;
}

export default function MessageRequestManagement({ 
  onRequestAction, 
  onSendMessage, 
  onViewProfile 
}: MessageRequestManagementProps) {
  const [requests, setRequests] = useState<MessageRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<MessageRequest | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    source: 'all' as string,
    priority: 'all' as string,
    hasAttachments: false,
    isVerified: false,
    minCompatibility: 0
  });
  const [bulkSelected, setBulkSelected] = useState<string[]>([]);
  const [replyMessage, setReplyMessage] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockRequests: MessageRequest[] = [
        {
          id: '1',
          sender: {
            id: '1',
            name: 'Sarah Chen',
            avatar: '',
            headline: 'Full-stack developer & AI enthusiast',
            location: 'San Francisco, CA',
            skills: ['React', 'TypeScript', 'Node.js', 'Machine Learning'],
            compatibilityScore: 92,
            mutualConnections: 3,
            verified: true,
            responseRate: 85,
            averageResponseTime: '2 hours'
          },
          message: {
            content: 'Hi! I came across your profile and was really impressed by your experience with scalable backend systems. I\'m currently working on a B2B SaaS platform that needs a strong technical co-founder. Would you be interested in discussing this further?',
            type: 'connection_request',
            sharedProfile: {
              name: 'Sarah Chen',
              headline: 'Full-stack developer & AI enthusiast',
              skills: ['React', 'TypeScript', 'Node.js', 'Machine Learning']
            }
          },
          metadata: {
            sentAt: '2024-01-15T14:30:00Z',
            expiresAt: '2024-01-22T14:30:00Z',
            priority: 'high',
            source: 'match',
            tags: ['co-founder', 'technical', 'SaaS'],
            autoResponseAvailable: true
          },
          status: 'pending',
          responseDeadline: '2024-01-18T14:30:00Z',
          reminderSent: false,
          followUpSent: false
        },
        {
          id: '2',
          sender: {
            id: '2',
            name: 'Michael Rodriguez',
            avatar: '',
            headline: 'Serial entrepreneur & startup advisor',
            location: 'New York, NY',
            skills: ['Business Strategy', 'Fundraising', 'Growth Hacking', 'Marketing'],
            compatibilityScore: 78,
            mutualConnections: 5,
            verified: true,
            responseRate: 92,
            averageResponseTime: '1 hour'
          },
          message: {
            content: 'I\'ve been following your work and would be honored to mentor you through your next funding round. I have experience with Series A and B rounds and can provide introductions to VCs in my network.',
            type: 'mentorship_request',
            attachments: [
              {
                id: '1',
                name: 'Mentorship_Proposal.pdf',
                type: 'application/pdf',
                url: '/files/mentorship-proposal.pdf'
              }
            ]
          },
          metadata: {
            sentAt: '2024-01-14T16:45:00Z',
            priority: 'high',
            source: 'mentor',
            tags: ['mentorship', 'funding', 'series-a'],
            autoResponseAvailable: false
          },
          status: 'pending',
          responseDeadline: '2024-01-17T16:45:00Z'
        },
        {
          id: '3',
          sender: {
            id: '3',
            name: 'Emily Johnson',
            avatar: '',
            headline: 'UX Designer & Product Designer',
            location: 'Austin, TX',
            skills: ['UI/UX Design', 'Figma', 'User Research', 'Prototyping'],
            compatibilityScore: 85,
            mutualConnections: 2,
            verified: false,
            responseRate: 70,
            averageResponseTime: '4 hours'
          },
          message: {
            content: 'Hey! I noticed we both have experience in B2B SaaS and I\'m looking for a design collaborator for my startup. Would love to chat about potential collaboration!',
            type: 'collaboration_request'
          },
          metadata: {
            sentAt: '2024-01-13T11:20:00Z',
            expiresAt: '2024-01-20T11:20:00Z',
            priority: 'normal',
            source: 'community',
            tags: ['collaboration', 'design', 'startup'],
            autoResponseAvailable: true
          },
          status: 'pending',
          responseDeadline: '2024-01-16T11:20:00Z'
        },
        {
          id: '4',
          sender: {
            id: '4',
            name: 'David Kim',
            avatar: '',
            headline: 'Marketing Specialist',
            location: 'Los Angeles, CA',
            skills: ['Digital Marketing', 'SEO', 'Content Marketing', 'Social Media'],
            compatibilityScore: 65,
            mutualConnections: 0,
            verified: false,
            responseRate: 45,
            averageResponseTime: '1 day'
          },
          message: {
            content: 'Hi! Want to collaborate on a marketing project?',
            type: 'text'
          },
          metadata: {
            sentAt: '2024-01-12T09:15:00Z',
            priority: 'low',
            source: 'direct',
            tags: ['marketing', 'collaboration'],
            isSpam: true
          },
          status: 'pending'
        }
      ];
      setRequests(mockRequests);
    } catch (error) {
      toast({
        title: "Error loading requests",
        description: "Failed to load message requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'accept' | 'decline' | 'archive' | 'spam') => {
    try {
      // API call to handle request action
      // await api.messageRequests.handleAction(requestId, action);
      
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === 'accept' ? 'accepted' : action === 'decline' ? 'declined' : action === 'archive' ? 'archived' : 'pending' }
            : req
        )
      );

      onRequestAction(requestId, action);
      
      toast({
        title: `Request ${action}ed`,
        description: `The message request has been ${action}ed successfully.`
      });
    } catch (error) {
      toast({
        title: "Error handling request",
        description: `Failed to ${action} the request. Please try again.`,
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (requestId: string, message: string) => {
    if (!message.trim()) return;

    try {
      // API call to send message
      // await api.messageRequests.sendMessage(requestId, message);
      
      onSendMessage(requestId, message);
      setReplyMessage('');
      
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully."
      });
    } catch (error) {
      toast({
        title: "Error sending message",
        description: "Failed to send your message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' || 
      request.sender.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.sender.headline?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.message.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTab = activeTab === 'all' ||
      (activeTab === 'pending' && request.status === 'pending') ||
      (activeTab === 'accepted' && request.status === 'accepted') ||
      (activeTab === 'declined' && request.status === 'declined') ||
      (activeTab === 'archived' && request.status === 'archived') ||
      (activeTab === 'spam' && request.metadata.isSpam);
    
    const matchesFilters = 
      (filters.source === 'all' || request.metadata.source === filters.source) &&
      (filters.priority === 'all' || request.metadata.priority === filters.priority) &&
      (!filters.hasAttachments || (request.message.attachments && request.message.attachments.length > 0)) &&
      (!filters.isVerified || request.sender.verified) &&
      (request.sender.compatibilityScore && request.sender.compatibilityScore >= filters.minCompatibility);
    
    return matchesSearch && matchesTab && matchesFilters;
  });

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'connection_request': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mentorship_request': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'collaboration_request': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'match': return 'bg-blue-100 text-blue-800';
      case 'mentor': return 'bg-purple-100 text-purple-800';
      case 'community': return 'bg-green-100 text-green-800';
      case 'direct': return 'bg-orange-100 text-orange-800';
      case 'referral': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'normal': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffInHours = (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 0) return 'Expired';
    if (diffInHours < 1) return 'Less than 1 hour';
    if (diffInHours < 24) return `${Math.floor(diffInHours)} hours`;
    return `${Math.floor(diffInHours / 24)} days`;
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    declined: requests.filter(r => r.status === 'declined').length,
    spam: requests.filter(r => r.metadata.isSpam).length,
    highPriority: requests.filter(r => r.metadata.priority === 'high' && r.status === 'pending').length,
    expiringSoon: requests.filter(r => {
      if (!r.responseDeadline) return false;
      const now = new Date();
      const deadline = new Date(r.responseDeadline);
      const diffInHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
      return diffInHours > 0 && diffInHours < 24;
    }).length
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-96 border-r p-4 space-y-4">
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
      {/* Sidebar - Requests List */}
      <div className="w-96 border-r flex flex-col">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Message Requests</h2>
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
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-sm">{stats.pending}</div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-sm text-red-600">{stats.highPriority}</div>
              <div className="text-xs text-muted-foreground">High Priority</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-sm text-orange-600">{stats.expiringSoon}</div>
              <div className="text-xs text-muted-foreground">Expiring Soon</div>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg mb-4">
              <div>
                <label className="text-xs font-medium mb-1 block">Source</label>
                <select 
                  value={filters.source} 
                  onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
                  className="w-full text-xs p-1 border rounded"
                >
                  <option value="all">All Sources</option>
                  <option value="match">Matches</option>
                  <option value="mentor">Mentors</option>
                  <option value="community">Communities</option>
                  <option value="direct">Direct</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Priority</label>
                <select 
                  value={filters.priority} 
                  onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full text-xs p-1 border rounded"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
              <TabsTrigger value="accepted" className="text-xs">Accepted</TabsTrigger>
              <TabsTrigger value="declined" className="text-xs">Declined</TabsTrigger>
              <TabsTrigger value="spam" className="text-xs">Spam</TabsTrigger>
            </TabsList>
          </div>

          {/* Requests List */}
          <ScrollArea className="flex-1 p-2">
            <div className="space-y-2">
              {filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedRequest?.id === request.id ? 'bg-muted' : ''
                  } ${request.metadata.isSpam ? 'border border-red-200' : ''}`}
                  onClick={() => setSelectedRequest(request)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={request.sender.avatar} />
                        <AvatarFallback>
                          {request.sender.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      {request.sender.verified && (
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background"></div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">{request.sender.name}</h3>
                        <div className="flex items-center space-x-1">
                          {request.metadata.priority === 'high' && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                          {request.responseDeadline && (
                            <Badge variant="outline" className="text-xs">
                              {formatTimeRemaining(request.responseDeadline)}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-1 truncate">
                        {request.sender.headline}
                      </p>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {request.message.content}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Badge className={getRequestTypeColor(request.message.type)} variant="outline">
                            {request.message.type.replace('_', ' ')}
                          </Badge>
                          <Badge className={getSourceColor(request.metadata.source)} variant="secondary">
                            {request.metadata.source}
                          </Badge>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(request.metadata.sentAt).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {/* Compatibility Score */}
                      {request.sender.compatibilityScore && (
                        <div className="mt-2 flex items-center space-x-2">
                          <div className="flex-1 bg-muted rounded-full h-1">
                            <div 
                              className="bg-green-500 h-1 rounded-full"
                              style={{ width: `${request.sender.compatibilityScore}%` }}
                            />
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {request.sender.compatibilityScore}% match
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </div>

      {/* Main Content - Request Detail */}
      <div className="flex-1 flex flex-col">
        {selectedRequest ? (
          <div className="flex-1 flex flex-col">
            {/* Request Header */}
            <div className="p-6 border-b bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={selectedRequest.sender.avatar} />
                    <AvatarFallback>
                      {selectedRequest.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedRequest.sender.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedRequest.sender.headline}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span>{selectedRequest.sender.location}</span>
                      </div>
                      {selectedRequest.sender.verified && (
                        <Badge variant="outline" className="text-xs">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                      {selectedRequest.sender.responseRate && (
                        <Badge variant="outline" className="text-xs">
                          {selectedRequest.sender.responseRate}% response rate
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {selectedRequest.status === 'pending' && (
                    <>
                      <Button 
                        onClick={() => handleRequestAction(selectedRequest.id, 'accept')}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Accept
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleRequestAction(selectedRequest.id, 'decline')}
                        className="gap-2"
                      >
                        <XCircle className="w-4 h-4" />
                        Decline
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Request Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Request Metadata */}
                <div className="flex items-center space-x-4 text-sm">
                  <Badge className={getRequestTypeColor(selectedRequest.message.type)}>
                    {selectedRequest.message.type.replace('_', ' ')}
                  </Badge>
                  <Badge className={getSourceColor(selectedRequest.metadata.source)}>
                    {selectedRequest.metadata.source}
                  </Badge>
                  <Badge className={getPriorityColor(selectedRequest.metadata.priority)}>
                    {selectedRequest.metadata.priority} priority
                  </Badge>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>

                {/* Message Content */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap">{selectedRequest.message.content}</p>
                    </div>
                    
                    {/* Attachments */}
                    {selectedRequest.message.attachments && selectedRequest.message.attachments.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="font-medium text-sm">Attachments</h4>
                        {selectedRequest.message.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center space-x-2 p-2 bg-muted rounded">
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">{attachment.name}</span>
                            <Button variant="ghost" size="sm">
                              <Download className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sender Profile */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">About {selectedRequest.sender.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Skills */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-1">
                          {selectedRequest.sender.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4">
                        {selectedRequest.sender.compatibilityScore && (
                          <div className="text-center p-3 bg-muted/50 rounded">
                            <div className="text-2xl font-bold text-green-600">
                              {selectedRequest.sender.compatibilityScore}%
                            </div>
                            <div className="text-xs text-muted-foreground">Compatibility</div>
                          </div>
                        )}
                        {selectedRequest.sender.mutualConnections && (
                          <div className="text-center p-3 bg-muted/50 rounded">
                            <div className="text-2xl font-bold">
                              {selectedRequest.sender.mutualConnections}
                            </div>
                            <div className="text-xs text-muted-foreground">Mutual Connections</div>
                          </div>
                        )}
                      </div>
                      
                      {/* Response Info */}
                      <div className="space-y-2">
                        {selectedRequest.sender.responseRate && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Response Rate</span>
                            <span>{selectedRequest.sender.responseRate}%</span>
                          </div>
                        )}
                        {selectedRequest.sender.averageResponseTime && (
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Avg Response Time</span>
                            <span>{selectedRequest.sender.averageResponseTime}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Response Deadline */}
                {selectedRequest.responseDeadline && (
                  <Card className={selectedRequest.status === 'pending' ? 'border-yellow-200 bg-yellow-50/30' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Timer className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm">
                          {selectedRequest.status === 'pending' 
                            ? `Respond by ${new Date(selectedRequest.responseDeadline).toLocaleDateString()} (${formatTimeRemaining(selectedRequest.responseDeadline)} remaining)`
                            : `Response deadline was ${new Date(selectedRequest.responseDeadline).toLocaleDateString()}`
                          }
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </ScrollArea>

            {/* Response Actions */}
            {selectedRequest.status === 'pending' && (
              <div className="p-6 border-t bg-background/95 backdrop-blur-sm">
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-end space-x-4">
                    <div className="flex-1">
                      <Input
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        placeholder="Type your response..."
                        className="resize-none"
                      />
                    </div>
                    <Button 
                      onClick={() => handleSendMessage(selectedRequest.id, replyMessage)}
                      disabled={!replyMessage.trim()}
                      className="gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Response
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span>Quick responses:</span>
                      <Button variant="ghost" size="sm" className="text-xs">
                        I'm interested, let's chat!
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Thanks for reaching out
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs">
                        Not a good fit right now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Select a message request</h3>
              <p className="text-muted-foreground">
                Choose a request from the sidebar to view details and respond
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
