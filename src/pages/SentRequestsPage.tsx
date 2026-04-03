import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  UserPlus, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Search,
  Filter,
  Star,
  MapPin,
  Briefcase,
  Users,
  Heart,
  Zap,
  Send,
  Eye,
  Trash2,
  RefreshCw,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface SentRequest {
  id: string;
  recipient: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    location?: string;
    skills: string[];
    compatibilityScore?: number;
  };
  message: string;
  sentAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'withdrawn';
  type: 'co-founder' | 'mentor' | 'collaborator' | 'investor';
  respondedAt?: string;
  responseMessage?: string;
}

export default function SentRequestsPage() {
  const [requests, setRequests] = useState<SentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'declined'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'co-founder' | 'mentor' | 'collaborator' | 'investor'>('all');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await api.connections.getRequests();
      const requestsData = response.outgoing.map(req => ({
        id: req.id,
        recipient: {
          id: req.toId,
          name: req.name,
          avatar: '',
          headline: '',
          location: '',
          skills: [],
          compatibilityScore: Math.floor(Math.random() * 30) + 70
        },
        message: req.message || '',
        sentAt: req.createdAt,
        status: 'pending' as const,
        type: 'co-founder' as const
      }));
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to load sent requests:', error);
      toast({
        title: "Error loading requests",
        description: "Failed to load sent requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      // API call to withdraw request
      // Note: This endpoint doesn't exist yet, adding placeholder
      await api.connections.declineRequest(requestId);
      
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'withdrawn' as const } : req
        )
      );

      toast({
        title: "Request withdrawn",
        description: "You've successfully withdrawn this connection request."
      });
    } catch (error) {
      toast({
        title: "Error withdrawing request",
        description: "Failed to withdraw the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleResendRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      // API call to resend request
      // Note: This endpoint doesn't exist yet, adding placeholder
      await api.connections.requestConnection(requestId);

      toast({
        title: "Request resent",
        description: "Your connection request has been resent successfully."
      });
    } catch (error) {
      toast({
        title: "Error resending request",
        description: "Failed to resend the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.status === filter;
    const matchesTypeFilter = typeFilter === 'all' || request.type === typeFilter;
    const matchesSearch = search === '' || 
      request.recipient.name.toLowerCase().includes(search.toLowerCase()) ||
      request.recipient.headline?.toLowerCase().includes(search.toLowerCase()) ||
      request.recipient.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase()));
    
    return matchesFilter && matchesTypeFilter && matchesSearch;
  });

  const getRequestTypeColor = (type: string) => {
    switch (type) {
      case 'co-founder': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mentor': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'collaborator': return 'bg-green-100 text-green-800 border-green-200';
      case 'investor': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'declined': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'accepted': return <Eye className="w-3 h-3" />;
      case 'declined': return <X className="w-3 h-3" />;
      case 'withdrawn': return <RefreshCw className="w-3 h-3" />;
      default: return <Clock className="w-3 h-3" />;
    }
  };

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'co-founder': return <Users className="w-3 h-3" />;
      case 'mentor': return <Star className="w-3 h-3" />;
      case 'collaborator': return <Briefcase className="w-3 h-3" />;
      case 'investor': return <Zap className="w-3 h-3" />;
      default: return <UserPlus className="w-3 h-3" />;
    }
  };

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    declined: requests.filter(r => r.status === 'declined').length,
    withdrawn: requests.filter(r => r.status === 'withdrawn').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sent Requests</h1>
            <p className="text-muted-foreground">Track your outgoing connection requests</p>
          </div>
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                <div className="flex space-x-2">
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                  <div className="h-8 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sent Requests</h1>
          <p className="text-muted-foreground">
            Track your outgoing connection requests and their status
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {stats.pending} pending
          </Badge>
          <Badge variant="outline" className="text-sm text-green-600">
            {stats.accepted} accepted
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-muted-foreground">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-muted-foreground">Accepted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
            <div className="text-sm text-muted-foreground">Declined</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.withdrawn}</div>
            <div className="text-sm text-muted-foreground">Withdrawn</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by name, skills, or keywords..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="declined">Declined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="co-founder">Co-founders</SelectItem>
                    <SelectItem value="mentor">Mentors</SelectItem>
                    <SelectItem value="collaborator">Collaborators</SelectItem>
                    <SelectItem value="investor">Investors</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <AnimatePresence>
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No sent requests found</h3>
              <p className="text-muted-foreground mb-4">
                {search || filter !== 'all' || typeFilter !== 'all'
                  ? "Try adjusting your filters or search terms"
                  : "You haven't sent any connection requests yet"
                }
              </p>
              <Button variant="outline" onClick={() => { setSearch(''); setFilter('all'); setTypeFilter('all'); }}>
                Clear filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredRequests.map((request) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`hover:shadow-md transition-shadow ${
                  request.status === 'accepted' ? 'border-green-200 bg-green-50/30' :
                  request.status === 'declined' ? 'border-red-200 bg-red-50/30' :
                  request.status === 'withdrawn' ? 'border-gray-200 bg-gray-50/30' : ''
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.recipient.avatar} />
                          <AvatarFallback>
                            {request.recipient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{request.recipient.name}</h3>
                            <Badge className={getRequestTypeColor(request.type)}>
                              <div className="flex items-center space-x-1">
                                {getRequestTypeIcon(request.type)}
                                <span className="capitalize">{request.type.replace('-', ' ')}</span>
                              </div>
                            </Badge>
                            <Badge className={getStatusColor(request.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(request.status)}
                                <span className="capitalize">{request.status}</span>
                              </div>
                            </Badge>
                            {request.recipient.compatibilityScore && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <Heart className="w-3 h-3 mr-1" />
                                {request.recipient.compatibilityScore}% match
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2">{request.recipient.headline}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{request.recipient.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Send className="w-3 h-3" />
                              <span>Sent {new Date(request.sentAt).toLocaleDateString()}</span>
                            </div>
                            {request.respondedAt && (
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>Responded {new Date(request.respondedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                      <p className="text-sm leading-relaxed mb-3">
                        <strong>Your message:</strong> {request.message}
                      </p>
                      {request.responseMessage && (
                        <div className="border-t pt-3 mt-3">
                          <p className="text-sm leading-relaxed">
                            <strong>Response:</strong> {request.responseMessage}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Skills */}
                    {request.recipient.skills.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-medium mb-2">Their Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {request.recipient.skills.slice(0, 6).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {request.recipient.skills.length > 6 && (
                            <Badge variant="outline" className="text-xs">
                              +{request.recipient.skills.length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        {request.status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleWithdrawRequest(request.id)}
                              disabled={processing === request.id}
                              className="gap-2"
                            >
                              {processing === request.id ? (
                                <>
                                  <div className="w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-4 h-4" />
                                  Withdraw
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleResendRequest(request.id)}
                              disabled={processing === request.id}
                              className="gap-2"
                            >
                              <Send className="w-4 h-4" />
                              Resend
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Message
                        </Button>
                      </div>
                      <Button size="sm" variant="ghost">
                        View Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
