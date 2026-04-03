import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  MessageSquare,
  Search,
  Send,
  Users,
  Star,
  Clock,
  Plus,
  Settings,
  UserPlus,
  Briefcase,
  Heart,
  Zap,
  ArrowRight,
  Sparkles,
  Target,
  Rocket,
  Lightbulb,
  TrendingUp,
  Award,
  BookOpen,
  Video,
  Phone,
  Mail,
  Calendar,
  MapPin,
  CheckCircle,
  Circle,
  ChevronRight,
  HelpCircle,
  FileText,
  Image,
  Mic,
  Smile,
  Paperclip
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmptyMessagingStateProps {
  onStartNewConversation: () => void;
  onExploreMatches: () => void;
  onFindMentors: () => void;
  onJoinCommunities: () => void;
}

export default function EmptyMessagingState({ 
  onStartNewConversation, 
  onExploreMatches, 
  onFindMentors, 
  onJoinCommunities 
}: EmptyMessagingStateProps) {
  const [activeTab, setActiveTab] = useState('welcome');
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const suggestedActions = [
    {
      id: 'explore-matches',
      title: 'Explore Co-founder Matches',
      description: 'Find compatible co-founders based on skills, goals, and values',
      icon: Users,
      color: 'bg-blue-500',
      action: onExploreMatches,
      badge: 'Recommended'
    },
    {
      id: 'find-mentors',
      title: 'Connect with Mentors',
      description: 'Get guidance from experienced entrepreneurs and industry experts',
      icon: Star,
      color: 'bg-purple-500',
      action: onFindMentors,
      badge: 'Popular'
    },
    {
      id: 'join-communities',
      title: 'Join Communities',
      description: 'Participate in discussions with like-minded founders',
      icon: Heart,
      color: 'bg-green-500',
      action: onJoinCommunities,
      badge: null
    },
    {
      id: 'start-conversation',
      title: 'Start a Conversation',
      description: 'Reach out to someone specific or create a group discussion',
      icon: MessageSquare,
      color: 'bg-orange-500',
      action: onStartNewConversation,
      badge: null
    }
  ];

  const quickStartGuides = [
    {
      title: 'Complete Your Profile',
      description: 'Add skills, experience, and goals to get better matches',
      icon: UserPlus,
      steps: ['Add your skills', 'Set your goals', 'Upload a photo'],
      completed: 2
    },
    {
      title: 'Set Your Preferences',
      description: 'Configure what kind of connections you\'re looking for',
      icon: Settings,
      steps: ['Choose co-founder type', 'Set availability', 'Define goals'],
      completed: 1
    },
    {
      title: 'Explore the Platform',
      description: 'Discover all features and tools available to you',
      icon: Lightbulb,
      steps: ['Browse matches', 'Join communities', 'Check opportunities'],
      completed: 0
    }
  ];

  const messagingTips = [
    {
      title: 'Craft a Great Introduction',
      description: 'Personalize your first message and mention shared interests',
      icon: MessageSquare,
      example: 'Hi Sarah! I noticed we both have experience in React and are interested in building SaaS products...'
    },
    {
      title: 'Ask Meaningful Questions',
      description: 'Go beyond small talk to understand compatibility',
      icon: HelpCircle,
      example: 'What\'s your vision for the product in the next 6 months? What challenges do you foresee?'
    },
    {
      title: 'Share Your Value',
      description: 'Clearly communicate what you bring to the partnership',
      icon: Award,
      example: 'I have 5 years of full-stack experience and have built two MVPs from scratch...'
    }
  ];

  const upcomingFeatures = [
    {
      title: 'Voice & Video Messages',
      description: 'Send voice notes and start video calls directly from messages',
      icon: Video,
      status: 'Coming Soon'
    },
    {
      title: 'File Sharing',
      description: 'Share documents, images, and other files with your connections',
      icon: FileText,
      status: 'In Development'
    },
    {
      title: 'Message Reactions',
      description: 'React to messages with emojis and quick responses',
      icon: Smile,
      status: 'In Development'
    },
    {
      title: 'Scheduled Messages',
      description: 'Schedule messages to be sent at the perfect time',
      icon: Calendar,
      status: 'Planned'
    }
  ];

  const successStories = [
    {
      name: 'Alex & Jordan',
      story: 'Met through CoFounderBay and launched their SaaS platform 3 months later',
      avatar: 'AJ',
      outcome: 'Launched Product',
      time: '3 months'
    },
    {
      name: 'Maria Chen',
      story: 'Found her technical co-founder and secured seed funding',
      avatar: 'MC',
      outcome: 'Seed Funded',
      time: '6 months'
    },
    {
      name: 'DevTeam Hub',
      story: 'Group of 5 developers who collaborate on open-source projects',
      avatar: 'DH',
      outcome: 'Active Community',
      time: '1 year'
    }
  ];

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Empty State */}
      <div className="w-80 border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Messages</h2>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm">
                <Search className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
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

        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-6">
            <div className="relative">
              <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto" />
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
              <p className="text-sm text-muted-foreground">
                Start connecting with co-founders, mentors, and community members
              </p>
            </div>

            <Button onClick={onStartNewConversation} className="w-full gap-2">
              <Plus className="w-4 h-4" />
              Start Your First Conversation
            </Button>
          </div>
        </div>

        <div className="p-4 border-t">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Quick Stats</span>
              <Button variant="ghost" size="sm" className="text-xs">
                View All
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="font-semibold">0</div>
                <div className="text-muted-foreground">Conversations</div>
              </div>
              <div className="bg-muted/50 rounded p-2 text-center">
                <div className="font-semibold">0</div>
                <div className="text-muted-foreground">Unread</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Empty State with Guidance */}
      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <div className="border-b bg-background/95 backdrop-blur-sm">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">Welcome to Your Message Center</h1>
                    <p className="text-muted-foreground">
                      Connect, collaborate, and build meaningful relationships
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      New to Messaging
                    </Badge>
                  </div>
                </div>
                
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="welcome">Welcome</TabsTrigger>
                  <TabsTrigger value="actions">Get Started</TabsTrigger>
                  <TabsTrigger value="guides">Quick Guides</TabsTrigger>
                  <TabsTrigger value="tips">Messaging Tips</TabsTrigger>
                  <TabsTrigger value="success">Success Stories</TabsTrigger>
                </TabsList>
              </div>
            </div>

            {/* Welcome Tab */}
            <TabsContent value="welcome" className="p-6">
              <div className="max-w-4xl mx-auto space-y-8">
                {/* Hero Section */}
                <div className="text-center space-y-4 py-8">
                  <div className="relative inline-block">
                    <MessageSquare className="w-20 h-20 text-primary mx-auto" />
                    <div className="absolute -top-2 -right-2">
                      <Sparkles className="w-6 h-6 text-yellow-500" />
                    </div>
                  </div>
                  
                  <h2 className="text-3xl font-bold">Start Building Your Network</h2>
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Your messaging hub is ready. Connect with co-founders, learn from mentors, 
                    and join communities of like-minded entrepreneurs.
                  </p>
                  
                  <div className="flex items-center justify-center space-x-4">
                    <Button size="lg" onClick={onExploreMatches} className="gap-2">
                      <Users className="w-5 h-5" />
                      Explore Matches
                    </Button>
                    <Button size="lg" variant="outline" onClick={onStartNewConversation} className="gap-2">
                      <MessageSquare className="w-5 h-5" />
                      Start Conversation
                    </Button>
                  </div>
                </div>

                {/* Feature Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="text-center">
                    <CardHeader>
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <CardTitle>Smart Matching</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        AI-powered compatibility matching based on skills, goals, and values
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center">
                    <CardHeader>
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-6 h-6 text-purple-600" />
                      </div>
                      <CardTitle>Expert Mentors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Connect with experienced entrepreneurs and industry experts
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="text-center">
                    <CardHeader>
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-6 h-6 text-green-600" />
                      </div>
                      <CardTitle>Active Communities</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        Join discussions and share experiences with fellow founders
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Get Started Tab */}
            <TabsContent value="actions" className="p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Take Your First Step</h2>
                  <p className="text-muted-foreground">
                    Choose how you'd like to start building your network
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {suggestedActions.map((action, index) => (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={action.action}>
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-4">
                            <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <action.icon className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-semibold">{action.title}</h3>
                                {action.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {action.badge}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mb-3">
                                {action.description}
                              </p>
                              <Button variant="outline" size="sm" className="gap-1">
                                Get Started
                                <ArrowRight className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Quick Guides Tab */}
            <TabsContent value="guides" className="p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Quick Start Guides</h2>
                  <p className="text-muted-foreground">
                    Complete these steps to get the most out of CoFounderBay
                  </p>
                </div>

                <div className="space-y-4">
                  {quickStartGuides.map((guide, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                            <guide.icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2">{guide.title}</h3>
                            <p className="text-sm text-muted-foreground mb-4">{guide.description}</p>
                            
                            <div className="space-y-2">
                              {guide.steps.map((step, stepIndex) => (
                                <div key={stepIndex} className="flex items-center space-x-2">
                                  {stepIndex < guide.completed ? (
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className={`text-sm ${stepIndex < guide.completed ? 'text-muted-foreground line-through' : ''}`}>
                                    {step}
                                  </span>
                                </div>
                              ))}
                            </div>
                            
                            <div className="mt-4">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{guide.completed}/{guide.steps.length} completed</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${(guide.completed / guide.steps.length) * 100}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Messaging Tips Tab */}
            <TabsContent value="tips" className="p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Messaging Best Practices</h2>
                  <p className="text-muted-foreground">
                    Learn how to write effective messages that get responses
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {messagingTips.map((tip, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center mb-4">
                          <tip.icon className="w-5 h-5" />
                        </div>
                        <CardTitle className="text-lg">{tip.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">{tip.description}</p>
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-xs font-medium mb-1">Example:</p>
                          <p className="text-xs italic">{tip.example}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Upcoming Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Coming Soon</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {upcomingFeatures.map((feature, index) => (
                      <Card key={index} className="text-center">
                        <CardContent className="p-4">
                          <feature.icon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                          <h4 className="font-medium text-sm mb-1">{feature.title}</h4>
                          <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                          <Badge variant="outline" className="text-xs">
                            {feature.status}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Success Stories Tab */}
            <TabsContent value="success" className="p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-bold">Success Stories</h2>
                  <p className="text-muted-foreground">
                    See how others have found success through CoFounderBay
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {successStories.map((story, index) => (
                    <Card key={index}>
                      <CardContent className="p-6 text-center">
                        <Avatar className="w-16 h-16 mx-auto mb-4">
                          <AvatarFallback>{story.avatar}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold mb-2">{story.name}</h3>
                        <p className="text-sm text-muted-foreground mb-4">{story.story}</p>
                        <div className="space-y-2">
                          <Badge variant="secondary" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {story.outcome}
                          </Badge>
                          <div className="flex items-center justify-center space-x-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            <span>{story.time}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="text-center">
                  <Card className="max-w-2xl mx-auto">
                    <CardContent className="p-8">
                      <Rocket className="w-12 h-12 text-primary mx-auto mb-4" />
                      <h3 className="text-xl font-semibold mb-4">Ready to Write Your Success Story?</h3>
                      <p className="text-muted-foreground mb-6">
                        Join thousands of founders who have built meaningful connections and launched successful ventures through CoFounderBay.
                      </p>
                      <div className="flex items-center justify-center space-x-4">
                        <Button onClick={onExploreMatches} className="gap-2">
                          <Users className="w-4 h-4" />
                          Find Matches
                        </Button>
                        <Button variant="outline" onClick={onFindMentors} className="gap-2">
                          <Star className="w-4 h-4" />
                          Find Mentors
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
