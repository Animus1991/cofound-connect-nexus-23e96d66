import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Rocket,
  Users,
  Star,
  Heart,
  Zap,
  ArrowRight,
  Play,
  CheckCircle,
  Circle,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Sparkles,
  Target,
  TrendingUp,
  Award,
  BookOpen,
  MessageSquare,
  Briefcase,
  Building,
  MapPin,
  Calendar,
  Clock,
  Shield,
  Lock,
  Eye,
  EyeOff,
  ChevronRight,
  ChevronLeft,
  SkipForward,
  Settings,
  HelpCircle,
  Video,
  FileText,
  Download,
  Share2,
  ThumbsUp,
  UserPlus,
  Handshake,
  Lightbulb,
  Compass,
  Navigation,
  Flag,
  Trophy,
  Gift,
  Diamond,
  Crown,
  Gem
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  type: 'welcome' | 'video' | 'interactive' | 'assessment' | 'setup';
  component?: React.ReactNode;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
    icon?: React.ReactNode;
  }>;
  progress: number;
  isRequired: boolean;
  isCompleted: boolean;
}

interface WelcomeOnboardingProps {
  onComplete: () => void;
  onSkip: () => void;
  userData?: {
    name: string;
    email: string;
    avatar?: string;
  };
}

export default function DesktopOnboardingWelcome({ 
  onComplete, 
  onSkip, 
  userData 
}: WelcomeOnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [showVideo, setShowVideo] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [userGoals, setUserGoals] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState('');
  const { toast } = useToast();

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to CoFounderBay',
      description: 'Your journey to building meaningful connections starts here',
      type: 'welcome',
      progress: 0,
      isRequired: true,
      isCompleted: false
    },
    {
      id: 'platform-tour',
      title: 'Platform Overview',
      description: 'Discover how CoFounderBay helps you find the perfect co-founders',
      type: 'video',
      progress: 12.5,
      isRequired: true,
      isCompleted: false
    },
    {
      id: 'success-stories',
      title: 'Success Stories',
      description: 'See how others have found their perfect matches',
      type: 'interactive',
      progress: 25,
      isRequired: false,
      isCompleted: false
    },
    {
      id: 'interests-selection',
      title: 'What Interests You?',
      description: 'Help us personalize your experience',
      type: 'interactive',
      progress: 37.5,
      isRequired: true,
      isCompleted: false
    },
    {
      id: 'goals-assessment',
      title: 'Your Goals',
      description: 'What are you looking to achieve?',
      type: 'assessment',
      progress: 50,
      isRequired: true,
      isCompleted: false
    },
    {
      id: 'experience-level',
      title: 'Experience Level',
      description: 'Tell us about your background',
      type: 'assessment',
      progress: 62.5,
      isRequired: true,
      isCompleted: false
    },
    {
      id: 'next-steps',
      title: 'What\'s Next',
      description: 'Your personalized journey begins',
      type: 'setup',
      progress: 75,
      isRequired: true,
      isCompleted: false
    },
    {
      id: 'completion',
      title: 'Ready to Start!',
      description: 'You\'re all set to begin your CoFounderBay journey',
      type: 'setup',
      progress: 100,
      isRequired: true,
      isCompleted: false
    }
  ];

  const interests = [
    { id: 'tech-startups', label: 'Tech Startups', icon: Rocket, description: 'Build the next big thing' },
    { id: 'social-impact', label: 'Social Impact', icon: Heart, description: 'Make a difference' },
    { id: 'sustainability', label: 'Sustainability', icon: Target, description: 'Green solutions' },
    { id: 'fintech', label: 'FinTech', icon: TrendingUp, description: 'Revolutionize finance' },
    { id: 'healthcare', label: 'Healthcare', icon: Shield, description: 'Improve lives' },
    { id: 'education', label: 'Education', icon: BookOpen, description: 'Transform learning' },
    { id: 'creativity', label: 'Creativity', icon: Sparkles, description: 'Artistic ventures' },
    { id: 'consulting', label: 'Consulting', icon: Briefcase, description: 'Expert services' }
  ];

  const goals = [
    { id: 'co-founder', label: 'Find Co-founder', icon: Users, description: 'Build your dream team' },
    { id: 'mentor', label: 'Find Mentor', icon: Star, description: 'Get expert guidance' },
    { id: 'collaborator', label: 'Find Collaborator', icon: Handshake, description: 'Work on projects' },
    { id: 'investor', label: 'Find Investor', icon: Building, description: 'Secure funding' },
    { id: 'network', label: 'Expand Network', icon: MessageSquare, description: 'Connect with peers' },
    { id: 'learn', label: 'Learn & Grow', icon: BookOpen, description: 'Develop skills' }
  ];

  const experienceLevels = [
    { id: 'beginner', label: 'Beginner', description: 'New to startups', icon: Compass },
    { id: 'intermediate', label: 'Intermediate', description: 'Some experience', icon: Navigation },
    { id: 'experienced', label: 'Experienced', description: 'Startup veteran', icon: Trophy },
    { id: 'expert', label: 'Expert', description: 'Industry leader', icon: Crown }
  ];

  const successStories = [
    {
      name: 'Sarah & Mike',
      story: 'Found their technical co-founder and launched their SaaS platform',
      timeline: '3 months',
      outcome: 'Launched Product',
      avatar: 'SM'
    },
    {
      name: 'Alex Chen',
      story: 'Connected with mentors who helped secure Series A funding',
      timeline: '6 months',
      outcome: 'Series A Funded',
      avatar: 'AC'
    },
    {
      name: 'DevTeam Hub',
      story: 'Group of developers who built successful open-source projects',
      timeline: '1 year',
      outcome: 'Active Community',
      avatar: 'DH'
    }
  ];

  const handleStepComplete = (stepId: string) => {
    setCompletedSteps(prev => new Set([...prev, stepId]));
  };

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const currentStepData = onboardingSteps[currentStep];
  const overallProgress = (completedSteps.size / onboardingSteps.filter(s => s.isRequired).length) * 100;

  const renderStepContent = () => {
    switch (currentStepData.id) {
      case 'welcome':
        return (
          <div className="text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-16 h-16 text-white" />
              </div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
              </div>
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Welcome to CoFounderBay
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {userData ? `Hi ${userData.name}! ` : ''}Your journey to building meaningful connections starts here. Let us guide you through the platform and help you find your perfect match.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">10,000+ Founders</h3>
                  <p className="text-sm text-muted-foreground">Active community of entrepreneurs</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Handshake className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">85% Success Rate</h3>
                  <p className="text-sm text-muted-foreground">Connections that lead to collaboration</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">AI-Powered Matching</h3>
                  <p className="text-sm text-muted-foreground">Smart compatibility algorithms</p>
                </CardContent>
              </Card>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handleSkip}>
                Skip Tour
              </Button>
              <Button size="lg" onClick={handleNext} className="gap-2">
                Start Tour
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'platform-tour':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Platform Overview</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Get a quick overview of how CoFounderBay works and what you can achieve
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Key Features</h3>
                <div className="space-y-4">
                  {[
                    { icon: Users, title: 'Smart Matching', description: 'AI-powered compatibility scoring' },
                    { icon: MessageSquare, title: 'Advanced Messaging', description: 'Rich conversations with file sharing' },
                    { icon: Star, title: 'Mentor Network', description: 'Connect with experienced entrepreneurs' },
                    { icon: Target, title: 'Goal Tracking', description: 'Monitor your progress and milestones' }
                  ].map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        <feature.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-medium">{feature.title}</h4>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold">Watch Introduction</h3>
                <div className="bg-muted rounded-lg p-8 text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Video className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-muted-foreground mb-4">2-minute platform overview</p>
                  <Button onClick={() => setShowVideo(true)} className="gap-2">
                    <Play className="w-4 h-4" />
                    Watch Video
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'success-stories':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Success Stories</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See how others have found their perfect matches and built amazing things together
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {successStories.map((story, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="text-center hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <Avatar className="w-16 h-16 mx-auto mb-4">
                        <AvatarFallback>{story.avatar}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold mb-2">{story.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{story.story}</p>
                      <div className="space-y-2">
                        <Badge variant="secondary">{story.outcome}</Badge>
                        <div className="flex items-center justify-center text-xs text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {story.timeline}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext} className="gap-2">
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'interests-selection':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">What Interests You?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Select the areas that interest you most. This helps us personalize your experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {interests.map((interest) => (
                <motion.div
                  key={interest.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setSelectedInterests(prev => 
                      prev.includes(interest.id)
                        ? prev.filter(id => id !== interest.id)
                        : [...prev, interest.id]
                    );
                  }}
                >
                  <Card className={`cursor-pointer transition-all ${
                    selectedInterests.includes(interest.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}>
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        selectedInterests.includes(interest.id) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <interest.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{interest.label}</h3>
                      <p className="text-xs text-muted-foreground">{interest.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Selected {selectedInterests.length} of {interests.length} interests
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={() => {
                  if (selectedInterests.length > 0) {
                    handleStepComplete('interests-selection');
                    handleNext();
                  } else {
                    toast({
                      title: "Please select interests",
                      description: "Select at least one interest to continue.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={selectedInterests.length === 0}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'goals-assessment':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">What Are Your Goals?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                What are you looking to achieve on CoFounderBay? Select all that apply.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
              {goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => {
                    setUserGoals(prev => 
                      prev.includes(goal.id)
                        ? prev.filter(id => id !== goal.id)
                        : [...prev, goal.id]
                    );
                  }}
                >
                  <Card className={`cursor-pointer transition-all ${
                    userGoals.includes(goal.id) 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}>
                    <CardContent className="p-4 text-center">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                        userGoals.includes(goal.id) 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <goal.icon className="w-6 h-6" />
                      </div>
                      <h3 className="font-semibold text-sm mb-1">{goal.label}</h3>
                      <p className="text-xs text-muted-foreground">{goal.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Selected {userGoals.length} of {goals.length} goals
              </p>
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={() => {
                  if (userGoals.length > 0) {
                    handleStepComplete('goals-assessment');
                    handleNext();
                  } else {
                    toast({
                      title: "Please select goals",
                      description: "Select at least one goal to continue.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={userGoals.length === 0}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'experience-level':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">Your Experience Level</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tell us about your experience level to help us find the best matches for you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-6xl mx-auto">
              {experienceLevels.map((level) => (
                <motion.div
                  key={level.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setExperienceLevel(level.id)}
                >
                  <Card className={`cursor-pointer transition-all ${
                    experienceLevel === level.id 
                      ? 'border-primary bg-primary/5' 
                      : 'hover:border-primary/50'
                  }`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                        experienceLevel === level.id 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        <level.icon className="w-8 h-8" />
                      </div>
                      <h3 className="font-semibold mb-2">{level.label}</h3>
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button 
                onClick={() => {
                  if (experienceLevel) {
                    handleStepComplete('experience-level');
                    handleNext();
                  } else {
                    toast({
                      title: "Please select experience level",
                      description: "Select your experience level to continue.",
                      variant: "destructive"
                    });
                  }
                }}
                disabled={!experienceLevel}
                className="gap-2"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'next-steps':
        return (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h2 className="text-3xl font-bold">What\'s Next?</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Based on your preferences, here are your personalized next steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  title: 'Complete Your Profile',
                  description: 'Add your skills, experience, and goals',
                  icon: UserPlus,
                  priority: 'high',
                  time: '5 minutes'
                },
                {
                  title: 'Explore Matches',
                  description: 'See your compatibility scores with potential co-founders',
                  icon: Users,
                  priority: 'high',
                  time: '10 minutes'
                },
                {
                  title: 'Join Communities',
                  description: 'Connect with founders in your areas of interest',
                  icon: MessageSquare,
                  priority: 'medium',
                  time: '15 minutes'
                },
                {
                  title: 'Find Mentors',
                  description: 'Get guidance from experienced entrepreneurs',
                  icon: Star,
                  priority: 'medium',
                  time: '20 minutes'
                },
                {
                  title: 'Set Preferences',
                  description: 'Customize your matching criteria',
                  icon: Settings,
                  priority: 'low',
                  time: '10 minutes'
                },
                {
                  title: 'Browse Resources',
                  description: 'Access tools and templates for founders',
                  icon: BookOpen,
                  priority: 'low',
                  time: '30 minutes'
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          step.priority === 'high' ? 'bg-red-100' :
                          step.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                        }`}>
                          <step.icon className={`w-5 h-5 ${
                            step.priority === 'high' ? 'text-red-600' :
                            step.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{step.title}</h3>
                          <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {step.priority} priority
                            </Badge>
                            <span className="text-xs text-muted-foreground">{step.time}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center justify-center space-x-4">
              <Button variant="outline" onClick={handlePrevious}>
                <ChevronLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              <Button onClick={handleNext} className="gap-2">
                Complete Setup
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        );

      case 'completion':
        return (
          <div className="text-center space-y-8">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-32 h-32 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </motion.div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold text-green-600">You're All Set!</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Congratulations! You've completed the onboarding process. Your CoFounderBay journey begins now.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Personalized Matches</h3>
                  <p className="text-sm text-muted-foreground">Based on your interests and goals</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Expert Guidance</h3>
                  <p className="text-sm text-muted-foreground">Access to mentor network</p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold mb-2">Goal Tracking</h3>
                  <p className="text-sm text-muted-foreground">Monitor your progress</p>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-4">
              <Button size="lg" onClick={onComplete} className="gap-2">
                <Rocket className="w-5 h-5" />
                Start Your Journey
              </Button>
              <p className="text-sm text-muted-foreground">
                You can always update your preferences in Settings
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex">
      {/* Sidebar Progress */}
      <div className="w-80 bg-white border-r p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Onboarding Progress</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>
          </div>

          <div className="space-y-3">
            {onboardingSteps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
                  index === currentStep ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                }`}
                onClick={() => setCurrentStep(index)}
              >
                <div className="flex-shrink-0">
                  {completedSteps.has(step.id) ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : index === currentStep ? (
                    <div className="w-5 h-5 border-2 border-primary rounded-full" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{step.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{step.description}</p>
                </div>
                {step.isRequired && (
                  <Badge variant="outline" className="text-xs">Required</Badge>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Button variant="outline" onClick={handleSkip} className="w-full gap-2">
              <SkipForward className="w-4 h-4" />
              Skip Onboarding
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowVideo(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-xl shadow-xl max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Platform Overview</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowVideo(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="p-8">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center">
                    <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">Video placeholder</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      2-minute platform overview video would play here
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
