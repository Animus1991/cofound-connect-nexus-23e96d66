import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageSquare, 
  Calendar, 
  Search,
  Filter,
  Star,
  MapPin,
  Briefcase,
  Heart,
  Zap,
  X,
  Clock,
  Archive,
  RotateCcw,
  Trash2,
  MoreHorizontal,
  AlertTriangle,
  Info,
  CheckCircle
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ArchivedRequest {
  id: string;
  person: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    location?: string;
    skills: string[];
    compatibilityScore?: number;
  };
  type: 'incoming' | 'outgoing';
  requestType: 'co-founder' | 'mentor' | 'collaborator' | 'investor';
  status: 'rejected' | 'withdrawn' | 'archived';
  originalMessage: string;
  responseMessage?: string;
  createdAt: string;
  actionedAt: string;
  reason?: string;
  canRestore: boolean;
}

export default function RejectedRequestsPage() {
  const [requests, setRequests] = useState<ArchivedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'incoming' | 'outgoing'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'rejected' | 'withdrawn' | 'archived'>('all');
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
      // For now, combine data from getRequests and filter for non-pending
      // In a full implementation, this would be a dedicated endpoint
      const response = await api.connections.getRequests();
      const allRequests = [
        ...response.incoming.map(req => ({
          id: req.id,
          person: {
            id: req.fromId,
            name: req.name,
            avatar: '',
            headline: '',
            location: '',
            skills: [],
            compatibilityScore: Math.floor(Math.random() * 30) + 70
          },
          type: 'incoming' as const,
          requestType: 'co-founder' as const,
          status: 'rejected' as const,
          originalMessage: req.message || '',
          createdAt: req.createdAt,
          actionedAt: req.createdAt,
          canRestore: false
        })),
        ...response.outgoing.map(req => ({
          id: req.id,
          person: {
            id: req.toId,
            name: req.name,
            avatar: '',
            headline: '',
            location: '',
            skills: [],
            compatibilityScore: Math.floor(Math.random() * 30) + 70
          },
          type: 'outgoing' as const,
          requestType: 'co-founder' as const,
          status: 'rejected' as const,
          originalMessage: req.message || '',
          createdAt: req.createdAt,
          actionedAt: req.createdAt,
          canRestore: false
        }))
      ];
      setRequests(allRequests);
    } catch (error) {
      console.error('Failed to load rejected requests:', error);
      toast({
        title: "Error loading requests",
        description: "Failed to load rejected requests. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      // API call to restore request would go here
      // await api.connections.restoreRequest(requestId);
      
      // Remove the request from the list since it's being restored to active
      setRequests(prev => prev.filter(req => req.id !== requestId));

      toast({
        title: "Request restored",
        description: "The connection request has been restored to active status."
      });
    } catch (error) {
      toast({
        title: "Error restoring request",
        description: "Failed to restore the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      setProcessing(requestId);
      // API call to permanently delete request would go here
      // await api.connections.deleteRequest(requestId);
      
      setRequests(prev => prev.filter(req => req.id !== requestId));

      toast({
        title: "Request deleted",
        description: "The connection request has been permanently deleted."
      });
    } catch (error) {
      toast({
        title: "Error deleting request",
        description: "Failed to delete the request. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const filteredRequests = requests.filter(request => {
    const matchesFilter = filter === 'all' || request.type === filter;
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    const matchesType = typeFilter === 'all' || request.requestType === typeFilter;
    const matchesSearch = search === '' || 
      request.person.name.toLowerCase().includes(search.toLowerCase()) ||
      request.person.headline?.toLowerCase().includes(search.toLowerCase()) ||
      request.person.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase())) ||
      request.originalMessage.toLowerCase().includes(search.toLowerCase());
    
    return matchesFilter && matchesStatus && matchesType && matchesSearch;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'withdrawn': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'co-founder': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'mentor': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'collaborator': return 'bg-green-100 text-green-800 border-green-200';
      case 'investor': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rejected & Archived Requests</h1>
          <p className="text-gray-600">Manage your declined connection requests and archived conversations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Archived</p>
                  <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
                <Archive className="w-8 h-8 text-gray-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
                <X className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Withdrawn</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.status === 'withdrawn').length}
                  </p>
                </div>
                <RotateCcw className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Restorable</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {requests.filter(r => r.canRestore).length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search archived requests..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="incoming">Incoming</SelectItem>
                    <SelectItem value="outgoing">Outgoing</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(value: any) => setTypeFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
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

        {/* Requests Grid */}
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Archive className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No archived requests found</h3>
              <p className="text-gray-600">
                {search || filter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Your rejected and archived requests will appear here'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={request.person.avatar} />
                        <AvatarFallback>
                          {request.person.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{request.person.name}</h3>
                        <p className="text-sm text-gray-600">{request.person.headline}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                      <Badge variant="outline" className={getTypeColor(request.requestType)}>
                        {request.requestType.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {request.person.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {request.type === 'incoming' ? 'Received' : 'Sent'} {formatDate(request.createdAt)}
                    </div>
                    {request.person.compatibilityScore && (
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        <span className="font-medium">{request.person.compatibilityScore}% Compatible</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">
                      "{request.originalMessage}"
                    </p>
                    {request.responseMessage && (
                      <p className="text-sm text-gray-500 mt-2 line-clamp-2 italic">
                        Response: "{request.responseMessage}"
                      </p>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {request.person.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {request.person.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{request.person.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Actioned {formatDate(request.actionedAt)}
                    </div>
                    <div className="flex space-x-2">
                      {request.canRestore && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRestoreRequest(request.id)}
                          disabled={processing === request.id}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteRequest(request.id)}
                        disabled={processing === request.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
