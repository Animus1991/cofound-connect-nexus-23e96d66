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
  Check, 
  X, 
  Clock, 
  Search,
  Filter,
  Star,
  MapPin,
  Briefcase,
  Users,
  Heart,
  Zap
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ConnectionRequest {
  id: string;
  sender: {
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
  status: 'pending' | 'accepted' | 'declined';
  type: 'co-founder' | 'mentor' | 'collaborator' | 'investor';
  mutualConnections?: number;
  sharedInterests?: string[];
}

export default function IncomingRequestsPage() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'co-founder' | 'mentor' | 'collaborator' | 'investor'>('all');
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
      const requestsData = response.incoming.map(req => ({
        id: req.id,
        sender: {
          id: req.fromId,
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
        type: 'co-founder' as const,
        mutualConnections: Math.floor(Math.random() * 10),
        sharedInterests: []
      }));
      setRequests(requestsData);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast({
        title: "Error loading requests",
        description: "Failed to load connection requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      // API call to accept request
      await api.connections.acceptRequest(requestId);
      
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'accepted' as const } : req
        )
      );

      toast({
        title: "Connection accepted!",
        description: "You've successfully accepted this connection request."
      });
    } catch (error) {
      toast({
        title: "Error accepting request",
        description: "Failed to accept the connection request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeclineRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      // API call to decline request
      await api.connections.declineRequest(requestId);
      
      setRequests(prev => 
        prev.map(req => 
          req.id === requestId ? { ...req, status: 'declined' as const } : req
        )
      );

      toast({
        title: "Request declined",
        description: "You've declined this connection request."
      });
    } catch (error) {
      toast({
        title: "Error declining request",
        description: "Failed to decline the connection request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.type === filter;
    const matchesSearch = search === '' || 
      request.sender.name.toLowerCase().includes(search.toLowerCase()) ||
      request.sender.headline?.toLowerCase().includes(search.toLowerCase()) ||
      request.sender.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase()));
    
    return matchesFilter && matchesSearch && request.status === 'pending';
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

  const getRequestTypeIcon = (type: string) => {
    switch (type) {
      case 'co-founder': return <Users className="w-3 h-3" />;
      case 'mentor': return <Star className="w-3 h-3" />;
      case 'collaborator': return <Briefcase className="w-3 h-3" />;
      case 'investor': return <Zap className="w-3 h-3" />;
      default: return <UserPlus className="w-3 h-3" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Incoming Requests</h1>
            <p className="text-muted-foreground">Manage your connection requests</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Incoming Requests</h1>
          <p className="text-muted-foreground">
            Manage your connection requests and find your perfect collaborators
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="text-sm">
            {filteredRequests.length} pending
          </Badge>
        </div>
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
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
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
        </CardContent>
      </Card>

      {/* Requests List */}
      <AnimatePresence>
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No pending requests</h3>
              <p className="text-muted-foreground mb-4">
                {search || filter !== 'all' 
                  ? "Try adjusting your filters or search terms"
                  : "You don't have any pending connection requests"
                }
              </p>
              <Button variant="outline" onClick={() => { setSearch(''); setFilter('all'); }}>
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
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-4 flex-1">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={request.sender.avatar} />
                          <AvatarFallback>
                            {request.sender.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-lg">{request.sender.name}</h3>
                            <Badge className={getRequestTypeColor(request.type)}>
                              <div className="flex items-center space-x-1">
                                {getRequestTypeIcon(request.type)}
                                <span className="capitalize">{request.type.replace('-', ' ')}</span>
                              </div>
                            </Badge>
                            {request.sender.compatibilityScore && (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                <Heart className="w-3 h-3 mr-1" />
                                {request.sender.compatibilityScore}% match
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground mb-2">{request.sender.headline}</p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-3 h-3" />
                              <span>{request.sender.location}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{request.mutualConnections} mutual connections</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(request.sentAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message */}
                    <div className="bg-secondary/30 rounded-lg p-4 mb-4">
                      <p className="text-sm leading-relaxed">{request.message}</p>
                    </div>

                    {/* Skills & Interests */}
                    <div className="space-y-3 mb-4">
                      {request.sender.skills.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Key Skills</p>
                          <div className="flex flex-wrap gap-1">
                            {request.sender.skills.slice(0, 6).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {request.sender.skills.length > 6 && (
                              <Badge variant="outline" className="text-xs">
                                +{request.sender.skills.length - 6} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                      {request.sharedInterests && request.sharedInterests.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">Shared Interests</p>
                          <div className="flex flex-wrap gap-1">
                            {request.sharedInterests.map((interest, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptRequest(request.id)}
                          disabled={processing === request.id}
                          className="gap-2"
                        >
                          {processing === request.id ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Check className="w-4 h-4" />
                              Accept
                            </>
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineRequest(request.id)}
                          disabled={processing === request.id}
                          className="gap-2"
                        >
                          <X className="w-4 h-4" />
                          Decline
                        </Button>
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
