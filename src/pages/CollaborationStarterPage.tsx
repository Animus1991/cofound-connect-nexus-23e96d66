import { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import {
  Rocket,
  Target,
  Users,
  MessageSquare,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Lightbulb,
  Zap,
  Flag,
  Clock,
  Loader2,
  Sparkles,
  HandshakeIcon,
} from "lucide-react";
import { motion } from "framer-motion";

const COLLABORATION_TYPES = [
  {
    id: "cofounder",
    label: "Co-Founder Partnership",
    description: "Full commitment to building a startup together",
    icon: Rocket,
    color: "text-primary",
  },
  {
    id: "advisor",
    label: "Advisory Relationship",
    description: "Periodic guidance and strategic advice",
    icon: Lightbulb,
    color: "text-amber-600",
  },
  {
    id: "project",
    label: "Project Collaboration",
    description: "Work together on a specific project or initiative",
    icon: Target,
    color: "text-blue-600",
  },
  {
    id: "mentorship",
    label: "Mentorship",
    description: "Learning and growth-focused relationship",
    icon: Users,
    color: "text-green-600",
  },
  {
    id: "explore",
    label: "Exploring Options",
    description: "Get to know each other before committing",
    icon: Sparkles,
    color: "text-purple-600",
  },
];

const SUGGESTED_FIRST_STEPS = [
  { id: "intro_call", label: "Schedule an intro call", icon: Calendar },
  { id: "share_deck", label: "Share pitch deck or project brief", icon: Flag },
  { id: "define_roles", label: "Define roles and responsibilities", icon: Users },
  { id: "set_milestone", label: "Set first milestone together", icon: Target },
  { id: "trial_project", label: "Start with a trial project", icon: Zap },
];

const MESSAGE_TEMPLATES = [
  {
    type: "cofounder",
    template: "Hi! I'm excited to explore a co-founder partnership with you. I think our skills complement each other well. Would you be open to a call this week to discuss our vision and how we might work together?",
  },
  {
    type: "advisor",
    template: "Thanks for connecting! I'd love to learn from your experience. Would you be open to a brief advisory relationship? I'm particularly interested in your insights on [specific area].",
  },
  {
    type: "project",
    template: "Great to connect! I have a project idea I think you'd be perfect for. It involves [brief description]. Would you be interested in collaborating on this?",
  },
  {
    type: "mentorship",
    template: "I really admire your journey and would love to learn from you. Would you be open to occasional mentorship conversations? I'm particularly interested in [specific topics].",
  },
  {
    type: "explore",
    template: "Thanks for accepting my connection request! I'd love to learn more about what you're working on. Would you be up for a casual chat to explore potential synergies?",
  },
];

export default function CollaborationStarterPage() {
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const location = useLocation();
  const { toast } = useToast();

  // Get connection info from location state if available
  const connectionName = (location.state as { name?: string })?.name || "your connection";

  const [step, setStep] = useState(1);
  const [collaborationType, setCollaborationType] = useState<string>("");
  const [selectedSteps, setSelectedSteps] = useState<string[]>([]);
  const [customMessage, setCustomMessage] = useState("");
  const [milestoneTitle, setMilestoneTitle] = useState("");
  const [milestoneNotes, setMilestoneNotes] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleTypeSelect = (typeId: string) => {
    setCollaborationType(typeId);
    const template = MESSAGE_TEMPLATES.find((t) => t.type === typeId);
    if (template) {
      setCustomMessage(template.template);
    }
  };

  const toggleStep = (stepId: string) => {
    setSelectedSteps((prev) =>
      prev.includes(stepId) ? prev.filter((s) => s !== stepId) : [...prev, stepId]
    );
  };

  const handleSendMessage = async () => {
    if (!userId || !customMessage.trim()) return;

    setIsSending(true);
    try {
      // Create or get conversation with this user
      const convoRes = await api.messages.createConversation(userId);
      const conversationId = convoRes.conversation.id;

      // Send the message
      await api.messages.sendMessage(conversationId, customMessage);

      // If milestone is set, create it
      if (milestoneTitle.trim()) {
        await api.milestones.create({
          title: milestoneTitle,
          category: "Business",
          status: "upcoming",
          notes: milestoneNotes || `Collaboration milestone with ${connectionName}`,
        });
      }

      toast({ title: "Message sent successfully!" });
      navigate("/messages");
    } catch (err) {
      toast({ title: "Failed to send message", variant: "destructive" });
    } finally {
      setIsSending(false);
    }
  };

  const handleSkip = () => {
    navigate("/network");
  };

  return (
    <AppLayout title="Start Collaboration">
      <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <HandshakeIcon className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Start Your Collaboration</h1>
          <p className="text-muted-foreground mt-2">
            Define how you'd like to work with {connectionName} and take the first step
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-12 h-0.5 ${step > s ? "bg-primary" : "bg-muted"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Collaboration Type */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>What type of collaboration are you looking for?</CardTitle>
                <CardDescription>
                  This helps set expectations and suggests relevant next steps
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={collaborationType} onValueChange={handleTypeSelect}>
                  <div className="grid gap-3">
                    {COLLABORATION_TYPES.map((type) => {
                      const Icon = type.icon;
                      return (
                        <Label
                          key={type.id}
                          className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                            collaborationType === type.id
                              ? "border-primary bg-primary/5"
                              : "hover:bg-muted/50"
                          }`}
                        >
                          <RadioGroupItem value={type.id} className="mt-1" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Icon className={`h-5 w-5 ${type.color}`} />
                              <span className="font-medium">{type.label}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {type.description}
                            </p>
                          </div>
                        </Label>
                      );
                    })}
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="ghost" onClick={handleSkip}>
                Skip for now
              </Button>
              <Button onClick={() => setStep(2)} disabled={!collaborationType}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 2: First Steps */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>Suggested First Steps</CardTitle>
                <CardDescription>
                  Select the actions you'd like to take to kick off this collaboration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {SUGGESTED_FIRST_STEPS.map((item) => {
                    const Icon = item.icon;
                    const isSelected = selectedSteps.includes(item.id);
                    return (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                        }`}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStep(item.id)}
                        />
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </label>
                    );
                  })}
                </div>

                {selectedSteps.includes("set_milestone") && (
                  <div className="mt-6 p-4 rounded-lg border bg-muted/30 space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Create First Milestone
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="milestone-title">Milestone Title</Label>
                        <Input
                          id="milestone-title"
                          placeholder="e.g., Complete initial discovery call"
                          value={milestoneTitle}
                          onChange={(e) => setMilestoneTitle(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="milestone-notes">Notes (optional)</Label>
                        <Textarea
                          id="milestone-notes"
                          placeholder="Add any context or details..."
                          value={milestoneNotes}
                          onChange={(e) => setMilestoneNotes(e.target.value)}
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)}>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Send Message */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  Send Your First Message
                </CardTitle>
                <CardDescription>
                  Start the conversation with a personalized message
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="message">Your Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Write your message..."
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={6}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    Tip: Be specific about what you're looking for and why you think this collaboration could work.
                  </p>
                </div>

                {/* Summary */}
                {(selectedSteps.length > 0 || milestoneTitle) && (
                  <div className="p-4 rounded-lg bg-muted/30 space-y-3">
                    <h4 className="text-sm font-medium">Collaboration Summary</h4>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary">
                        {COLLABORATION_TYPES.find((t) => t.id === collaborationType)?.label}
                      </Badge>
                      {selectedSteps.map((stepId) => {
                        const stepInfo = SUGGESTED_FIRST_STEPS.find((s) => s.id === stepId);
                        return (
                          <Badge key={stepId} variant="outline">
                            {stepInfo?.label}
                          </Badge>
                        );
                      })}
                    </div>
                    {milestoneTitle && (
                      <div className="flex items-center gap-2 text-sm">
                        <Target className="h-4 w-4 text-primary" />
                        <span>First milestone: {milestoneTitle}</span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleSkip}>
                  Skip
                </Button>
                <Button onClick={handleSendMessage} disabled={!customMessage.trim() || isSending}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}
