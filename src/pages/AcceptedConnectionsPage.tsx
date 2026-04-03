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
  MapPin, 
  Search,
  Filter,
  Star,
  Briefcase,
  Heart,
  Zap,
  Video,
  Phone,
  Mail,
  MoreHorizontal,
  UserMinus,
  Clock,
  TrendingUp,
  Award,
  Target
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface Connection {
  id: string;
  user: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    location?: string;
    skills: string[];
    compatibilityScore?: number;
    lastActive?: string;
  };
  connectedAt: string;
  type: 'co-founder' | 'mentor' | 'collaborator' | 'investor';
  interactionCount: number;
  lastInteraction?: string;
  sharedProjects?: number;
  mutualGoals?: string[];
  status: 'active' | 'inactive' | 'archived';
}

export default function AcceptedConnectionsPage() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'co-founder' | 'mentor' | 'collaborator' | 'investor'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'compatibility' | 'activity'>('recent');
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadConnections();
  }, []);

  const loadConnections = async () => {
    try {
      setLoading(true);
      const response = await api.connections.list();
      const connectionsData = response.connections.map(conn => ({
        id: conn.id,
        user: {
          id: conn.userId,
          name: conn.name,
          avatar: '',
          headline: '',
          location: conn.location,
          skills: conn.skills,
          compatibilityScore: Math.floor(Math.random() * 30) + 70, // Mock compatibility score
          lastActive: conn.connectedSince
        },
        connectedAt: conn.connectedSince,
        type: 'co-founder' as const, // Default type - could be enhanced with backend data
        interactionCount: Math.floor(Math.random() * 50) + 1,
        lastInteraction: conn.connectedSince,
        sharedProjects: Math.floor(Math.random() * 3),
        mutualGoals: [],
        status: 'active' as const
      }));
      setConnections(connectionsData);
    } catch (error) {
      console.error('Failed to load connections:', error);
      toast({
        title: "Error",
        description: "Failed to load connections. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveConnection = async (connectionId: string) => {
    try {
      setProcessing(connectionId);
      // API call to remove connection would go here
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      toast({
        title: "Connection removed",
        description: "The connection has been removed successfully."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove connection. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleMessage = async (userId: string) => {
    try {
      const response = await api.messages.createConversation(userId);
      // Navigate to conversation or open messaging modal
      toast({
        title: "Conversation started",
        description: "You can now message this connection."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start conversation. Please try again.",
        variant: "destructive"
      });
    }
  };

  const filteredConnections = connections.filter(conn => {
    const matchesFilter = filter === 'all' || conn.type === filter;
    const matchesStatus = statusFilter === 'all' || conn.status === statusFilter;
    const matchesSearch = search === '' || 
      conn.user.name.toLowerCase().includes(search.toLowerCase()) ||
      conn.user.headline?.toLowerCase().includes(search.toLowerCase()) ||
      conn.user.skills.some(skill => skill.toLowerCase().includes(search.toLowerCase()));
    
    return matchesFilter && matchesStatus && matchesSearch;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.user.name.localeCompare(b.user.name);
      case 'compatibility':
        return (b.user.compatibilityScore || 0) - (a.user.compatibilityScore || 0);
      case 'activity':
        return new Date(b.lastInteraction || '').getTime() - new Date(a.lastInteraction || '').getTime();
      case 'recent':
      default:
        return new Date(b.connectedAt).getTime() - new Date(a.connectedAt).getTime();
    }
  });

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Accepted Connections</h1>
          <p className="text-gray-600">Manage your active connections and collaborations</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Connections</p>
                  <p className="text-2xl font-bold text-gray-900">{connections.length}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {connections.filter(c => c.status === 'active').length}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Co-founders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {connections.filter(c => c.type === 'co-founder').length}
                  </p>
                </div>
                <Target className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Mentors</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {connections.filter(c => c.type === 'mentor').length}
                  </p>
                </div>
                <Award className="w-8 h-8 text-orange-500" />
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
                  placeholder="Search connections..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
                  <SelectTrigger className="w-40">
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

                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="compatibility">Compatibility</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connections Grid */}
        {filteredConnections.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No connections found</h3>
              <p className="text-gray-600">
                {search || filter !== 'all' || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start connecting with other founders and mentors'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredConnections.map((connection) => (
              <Card key={connection.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={connection.user.avatar} />
                        <AvatarFallback>
                          {connection.user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium text-gray-900">{connection.user.name}</h3>
                        <p className="text-sm text-gray-600">{connection.user.headline}</p>
                      </div>
                    </div>
                    <Badge variant={connection.status === 'active' ? 'default' : 'secondary'}>
                      {connection.status}
                    </Badge>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {connection.user.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      Connected {new Date(connection.connectedAt).toLocaleDateString()}
                    </div>
                    {connection.user.compatibilityScore && (
                      <div className="flex items-center text-sm">
                        <Star className="w-4 h-4 mr-2 text-yellow-500" />
                        <span className="font-medium">{connection.user.compatibilityScore}% Compatible</span>
                      </div>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {connection.user.skills.slice(0, 3).map((skill, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {connection.user.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{connection.user.skills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="capitalize">
                      {connection.type.replace('-', ' ')}
                    </Badge>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMessage(connection.user.id)}
                      >
                        <MessageSquare className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRemoveConnection(connection.id)}
                        disabled={processing === connection.id}
                      >
                        <UserMinus className="w-4 h-4" />
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
