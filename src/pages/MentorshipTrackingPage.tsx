import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  GraduationCap,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  Inbox,
  MessageSquare,
  Calendar,
  ArrowRight,
  User,
  Loader2,
  Star,
  Target,
} from "lucide-react";
import { motion } from "framer-motion";

interface MentorshipRequest {
  id: string;
  mentorId: string;
  menteeId: string;
  note: string | null;
  goals: string | null;
  status: "pending" | "accepted" | "declined" | "completed";
  createdAt: string;
  updatedAt: string;
  mentor?: { id: string; name: string };
  mentee?: { id: string; name: string };
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-amber-600", bg: "bg-amber-100" },
  accepted: { label: "Accepted", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100" },
  declined: { label: "Declined", icon: XCircle, color: "text-red-600", bg: "bg-red-100" },
  completed: { label: "Completed", icon: Star, color: "text-primary", bg: "bg-primary/10" },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return dateStr;
  }
}

function getInitials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

export default function MentorshipTrackingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("sent");
  const [sentRequests, setSentRequests] = useState<MentorshipRequest[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<MentorshipRequest[]>([]);
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.mentorship.getRequests();
      setSentRequests(res.sent || []);
      setReceivedRequests(res.received || []);
    } catch {
      toast({ title: "Failed to load mentorship requests", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleUpdateStatus = async (requestId: string, status: "accepted" | "declined") => {
    setProcessingIds((prev) => new Set(prev).add(requestId));
    try {
      await api.mentorship.updateRequest(requestId, status);
      setReceivedRequests((prev) =>
        prev.map((r) => (r.id === requestId ? { ...r, status } : r))
      );
      toast({ title: status === "accepted" ? "Request accepted!" : "Request declined" });
    } catch {
      toast({ title: "Failed to update request", variant: "destructive" });
    } finally {
      setProcessingIds((prev) => {
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
    }
  };

  const pendingSent = sentRequests.filter((r) => r.status === "pending");
  const acceptedSent = sentRequests.filter((r) => r.status === "accepted");
  const declinedSent = sentRequests.filter((r) => r.status === "declined");
  const completedSent = sentRequests.filter((r) => r.status === "completed");

  const pendingReceived = receivedRequests.filter((r) => r.status === "pending");
  const acceptedReceived = receivedRequests.filter((r) => r.status === "accepted");

  if (loading) {
    return (
      <AppLayout title="Mentorship Tracking">
        <div className="p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <div className="grid lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Mentorship Tracking">
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Mentorship Tracking</h1>
            <p className="text-muted-foreground">Track your mentorship requests and relationships</p>
          </div>
          <Button onClick={() => navigate("/mentors")}>
            <GraduationCap className="h-4 w-4 mr-2" />
            Find Mentors
          </Button>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingSent.length}</p>
                  <p className="text-xs text-muted-foreground">Pending Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{acceptedSent.length}</p>
                  <p className="text-xs text-muted-foreground">Active Mentorships</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Star className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{completedSent.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Inbox className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingReceived.length}</p>
                  <p className="text-xs text-muted-foreground">Requests to Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="sent" className="gap-2">
              <Send className="h-4 w-4" />
              Sent Requests
              {pendingSent.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingSent.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="received" className="gap-2">
              <Inbox className="h-4 w-4" />
              Received Requests
              {pendingReceived.length > 0 && (
                <Badge variant="destructive" className="ml-1">{pendingReceived.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Active Mentorships
            </TabsTrigger>
          </TabsList>

          {/* Sent Requests */}
          <TabsContent value="sent" className="mt-6">
            {sentRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Send className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No requests sent yet</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                    Find mentors who can help you grow and send them a mentorship request.
                  </p>
                  <Button onClick={() => navigate("/mentors")}>
                    Browse Mentors
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sentRequests.map((request, i) => {
                  const config = STATUS_CONFIG[request.status];
                  const StatusIcon = config.icon;
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-primary/15 text-primary">
                                {getInitials(request.mentor?.name || "M")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <Link
                                    to={`/mentors/${request.mentorId}`}
                                    className="font-semibold hover:text-primary transition-colors"
                                  >
                                    {request.mentor?.name || "Unknown Mentor"}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    Requested {formatDate(request.createdAt)}
                                  </div>
                                </div>
                                <Badge className={`${config.bg} ${config.color} border-0`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              {request.goals && (
                                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Target className="h-3 w-3" /> Goals
                                  </p>
                                  <p className="text-sm">{request.goals}</p>
                                </div>
                              )}
                              {request.note && (
                                <p className="mt-2 text-sm text-muted-foreground italic">
                                  "{request.note}"
                                </p>
                              )}
                              {request.status === "accepted" && (
                                <div className="mt-3 flex gap-2">
                                  <Button size="sm" variant="outline" onClick={() => navigate("/messages")}>
                                    <MessageSquare className="h-3.5 w-3.5 mr-1" />
                                    Message
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Received Requests */}
          <TabsContent value="received" className="mt-6">
            {receivedRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Inbox className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No requests received</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm">
                    When someone requests you as a mentor, their request will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {receivedRequests.map((request, i) => {
                  const config = STATUS_CONFIG[request.status];
                  const StatusIcon = config.icon;
                  const isProcessing = processingIds.has(request.id);
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className={request.status === "pending" ? "border-primary/30" : ""}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <Avatar className="h-12 w-12">
                              <AvatarFallback className="bg-accent/15 text-accent">
                                {getInitials(request.mentee?.name || "U")}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <Link
                                    to={`/profile/${request.menteeId}`}
                                    className="font-semibold hover:text-primary transition-colors"
                                  >
                                    {request.mentee?.name || "Unknown User"}
                                  </Link>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    Requested {formatDate(request.createdAt)}
                                  </div>
                                </div>
                                <Badge className={`${config.bg} ${config.color} border-0`}>
                                  <StatusIcon className="h-3 w-3 mr-1" />
                                  {config.label}
                                </Badge>
                              </div>
                              {request.goals && (
                                <div className="mt-3 p-3 rounded-lg bg-muted/50">
                                  <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                                    <Target className="h-3 w-3" /> Their Goals
                                  </p>
                                  <p className="text-sm">{request.goals}</p>
                                </div>
                              )}
                              {request.note && (
                                <p className="mt-2 text-sm text-muted-foreground italic">
                                  "{request.note}"
                                </p>
                              )}
                              {request.status === "pending" && (
                                <div className="mt-3 flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateStatus(request.id, "accepted")}
                                    disabled={isProcessing}
                                  >
                                    {isProcessing ? (
                                      <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                                    ) : (
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" />
                                    )}
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleUpdateStatus(request.id, "declined")}
                                    disabled={isProcessing}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" />
                                    Decline
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => navigate(`/profile/${request.menteeId}`)}
                                  >
                                    View Profile
                                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Active Mentorships */}
          <TabsContent value="active" className="mt-6">
            {acceptedSent.length === 0 && acceptedReceived.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                    <GraduationCap className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium mb-1">No active mentorships</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
                    Once a mentorship request is accepted, it will appear here.
                  </p>
                  <Button onClick={() => navigate("/mentors")}>
                    Find Mentors
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid lg:grid-cols-2 gap-4">
                {/* My Mentors */}
                {acceptedSent.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        My Mentors
                      </CardTitle>
                      <CardDescription>People mentoring you</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {acceptedSent.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary/15 text-primary text-sm">
                                {getInitials(request.mentor?.name || "M")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{request.mentor?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Since {formatDate(request.updatedAt || request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => navigate("/messages")}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* My Mentees */}
                {acceptedReceived.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-accent" />
                        My Mentees
                      </CardTitle>
                      <CardDescription>People you're mentoring</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {acceptedReceived.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-accent/15 text-accent text-sm">
                                {getInitials(request.mentee?.name || "U")}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{request.mentee?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Since {formatDate(request.updatedAt || request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" onClick={() => navigate("/messages")}>
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
