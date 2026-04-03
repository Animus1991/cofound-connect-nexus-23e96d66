import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  ArrowLeft,
  Check,
  X,
  Clock,
  UserPlus,
  Users,
  Send,
  Inbox,
  MessageSquare,
  MapPin,
  Briefcase,
} from "lucide-react";

interface ConnectionRequest {
  id: string;
  fromId: string;
  toId: string;
  message: string | null;
  status: string;
  createdAt: string;
  fromUser?: {
    id: string;
    name: string | null;
    email: string;
    headline?: string;
    location?: string;
    skills?: string[];
  };
  toUser?: {
    id: string;
    name: string | null;
    email: string;
    headline?: string;
    location?: string;
  };
}

export default function RequestsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("incoming");
  const [incomingRequests, setIncomingRequests] = useState<ConnectionRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<ConnectionRequest[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.connections.getRequests();
      // Separate incoming and sent
      const incoming = res.incoming.map(req => ({
        ...req,
        fromUser: {
          id: req.fromId,
          name: req.name,
          email: '',
          headline: '',
          location: '',
          skills: []
        }
      }));
      const sent = res.outgoing.map(req => ({
        ...req,
        toUser: {
          id: req.toId,
          name: req.name,
          email: '',
          headline: '',
          location: '',
          skills: []
        }
      }));
      setIncomingRequests(incoming);
      setSentRequests(sent);
    } catch (error) {
      console.error('Failed to load requests:', error);
      toast({ title: "Failed to load requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleAccept = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await api.connections.acceptRequest(requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast({ title: "Connection accepted!" });
    } catch (error) {
      console.error('Failed to accept request:', error);
      toast({ title: "Failed to accept", variant: "destructive" });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const handleDecline = async (requestId: string) => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await api.connections.declineRequest(requestId);
      setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
      toast({ title: "Request declined" });
    } catch (error) {
      console.error('Failed to decline request:', error);
      toast({ title: "Failed to decline", variant: "destructive" });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/network")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Connection Requests</h1>
            <p className="text-muted-foreground">Manage your incoming and sent requests</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="incoming" className="gap-2">
              <Inbox className="h-4 w-4" />
              Incoming
              {incomingRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {incomingRequests.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              Sent
              {sentRequests.length > 0 && (
                <Badge variant="outline" className="ml-1">
                  {sentRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Incoming Requests */}
          <TabsContent value="incoming" className="mt-6">
            {incomingRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <UserPlus className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No pending requests</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    When someone wants to connect with you, their request will appear here.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate("/discover")}>
                    Discover People
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request) => {
                  const user = request.fromUser;
                  const isProcessing = processingIds.has(request.id);
                  const initials = user?.name
                    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                    : "?";

                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar
                            className="h-14 w-14 cursor-pointer"
                            onClick={() => navigate(`/profile/${user?.id}`)}
                          >
                            <AvatarImage src="" />
                            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3
                                  className="font-semibold hover:text-primary cursor-pointer"
                                  onClick={() => navigate(`/profile/${user?.id}`)}
                                >
                                  {user?.name || "Unknown User"}
                                </h3>
                                {user?.headline && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {user.headline}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                  {user?.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {user.location}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDate(request.createdAt)}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDecline(request.id)}
                                  disabled={isProcessing}
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Decline
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => handleAccept(request.id)}
                                  disabled={isProcessing}
                                >
                                  <Check className="h-4 w-4 mr-1" />
                                  Accept
                                </Button>
                              </div>
                            </div>

                            {request.message && (
                              <div className="mt-3 p-3 rounded-lg bg-muted/50 text-sm">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Message
                                </div>
                                <p className="text-foreground">{request.message}</p>
                              </div>
                            )}

                            {user?.skills && user.skills.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-3">
                                {(JSON.parse(user.skills as unknown as string) as string[])
                                  .slice(0, 5)
                                  .map((skill, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Sent Requests */}
          <TabsContent value="sent" className="mt-6">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Send className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No sent requests</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    Requests you send to other users will appear here until they respond.
                  </p>
                  <Button variant="outline" className="mt-4" onClick={() => navigate("/discover")}>
                    Find People to Connect
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request) => {
                  const user = request.toUser;
                  const initials = user?.name
                    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
                    : "?";

                  return (
                    <Card key={request.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <Avatar
                            className="h-12 w-12 cursor-pointer"
                            onClick={() => navigate(`/profile/${user?.id}`)}
                          >
                            <AvatarImage src="" />
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3
                                  className="font-semibold hover:text-primary cursor-pointer"
                                  onClick={() => navigate(`/profile/${user?.id}`)}
                                >
                                  {user?.name || "Unknown User"}
                                </h3>
                                {user?.headline && (
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {user.headline}
                                  </p>
                                )}
                              </div>

                              <Badge
                                variant={
                                  request.status === "pending"
                                    ? "secondary"
                                    : request.status === "accepted"
                                    ? "default"
                                    : "destructive"
                                }
                              >
                                {request.status === "pending" && (
                                  <Clock className="h-3 w-3 mr-1" />
                                )}
                                {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Sent {formatDate(request.createdAt)}
                              </span>
                            </div>

                            {request.message && (
                              <div className="mt-2 text-sm text-muted-foreground italic">
                                "{request.message}"
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
