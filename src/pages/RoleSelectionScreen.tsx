import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users,
  User,
  Briefcase,
  GraduationCap,
  Target,
  Rocket,
  Heart,
  Star,
  Building,
  DollarSign,
  Code,
  Palette,
  BarChart3,
  Megaphone,
  Lightbulb,
  Shield,
  Award,
  TrendingUp,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Circle,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Zap,
  Crown,
  Gem,
  Flag,
  Compass,
  Navigation,
  MapPin,
  Calendar,
  Clock,
  Eye,
  EyeOff,
  Settings,
  HelpCircle,
  Video,
  Play,
  Pause,
  SkipForward,
  Save,
  RefreshCw,
  Filter,
  Search,
  Plus,
  X,
  MoreHorizontal,
  ThumbsUp,
  MessageSquare,
  Handshake,
  FileText,
  BookOpen,
  Trophy,
  Gift,
  Diamond,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Role {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'founder' | 'mentor' | 'investor' | 'collaborator' | 'team-member';
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  characteristics: string[];
  benefits: string[];
  requirements: string[];
  typicalGoals: string[];
  skills: string[];
  timeCommitment: string;
  popularity: number;
  matchCompatibility: Record<string, number>;
  isPremium?: boolean;
  isRecommended?: boolean;
}

interface RoleSelectionProps {
  onRoleSelect: (role: Role, additionalRoles?: Role[]) => void;
  onSkip: () => void;
  userData?: {
    name: string;
    email: string;
    experience?: string;
    interests?: string[];
  };
}

export default function RoleSelection({ 
  onRoleSelect, 
  onSkip, 
  userData 
}: RoleSelectionProps) {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedAdditionalRoles, setSelectedAdditionalRoles] = useState<Role[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizResults, setQuizResults] = useState<Role[]>([]);
  const { toast } = useToast();

  const roles: Role[] = [
    {
      id: 'technical-cofounder',
      name: 'Technical Co-founder',
      title: 'Build the Product',
      description: 'Lead the technical development and engineering vision',
      icon: <Code className="w-6 h-6" />,
      category: 'founder',
      level: 'intermediate',
      characteristics: [
        'Strong technical background',
        'Problem-solving mindset',
        'Leadership skills',
        'Product vision'
      ],
      benefits: [
        'Equity ownership',
        'Technical leadership',
        'Product influence',
        'Team building'
      ],
      requirements: [
        '3+ years development experience',
        'Technical architecture knowledge',
        'Team management skills'
      ],
      typicalGoals: [
        'Build scalable products',
        'Lead engineering teams',
        'Innovate with technology',
        'Achieve product-market fit'
      ],
      skills: ['Programming', 'Architecture', 'Leadership', 'Product Management'],
      timeCommitment: 'Full-time',
      popularity: 85,
      matchCompatibility: {
        'business-cofounder': 95,
        'mentor': 75,
        'investor': 65,
        'collaborator': 80
      },
      isRecommended: true
    },
    {
      id: 'business-cofounder',
      name: 'Business Co-founder',
      title: 'Drive the Business',
      description: 'Lead business strategy, growth, and market expansion',
      icon: <Briefcase className="w-6 h-6" />,
      category: 'founder',
      level: 'intermediate',
      characteristics: [
        'Business acumen',
        'Strategic thinking',
        'Sales skills',
        'Market understanding'
      ],
      benefits: [
        'Equity ownership',
        'Business leadership',
        'Growth opportunities',
        'Network expansion'
      ],
      requirements: [
        'Business experience',
        'Sales/marketing background',
        'Strategic planning skills'
      ],
      typicalGoals: [
        'Scale business operations',
        'Secure funding',
        'Build customer base',
        'Achieve profitability'
      ],
      skills: ['Business Strategy', 'Sales', 'Marketing', 'Finance'],
      timeCommitment: 'Full-time',
      popularity: 82,
      matchCompatibility: {
        'technical-cofounder': 95,
        'mentor': 80,
        'investor': 85,
        'collaborator': 75
      },
      isRecommended: true
    },
    {
      id: 'mentor',
      name: 'Mentor',
      title: 'Guide & Advise',
      description: 'Share your experience and guide the next generation of founders',
      icon: <GraduationCap className="w-6 h-6" />,
      category: 'mentor',
      level: 'expert',
      characteristics: [
        'Extensive experience',
        'Teaching ability',
        'Patience',
        'Industry knowledge'
      ],
      benefits: [
        'Give back to community',
        'Stay connected',
        'Equity opportunities',
        'Network expansion'
      ],
      requirements: [
        '10+ years experience',
        'Successful exits',
        'Industry recognition'
      ],
      typicalGoals: [
        'Mentor startups',
        'Share knowledge',
        'Find investment opportunities',
        'Build legacy'
      ],
      skills: ['Mentoring', 'Strategy', 'Leadership', 'Networking'],
      timeCommitment: 'Part-time',
      popularity: 65,
      matchCompatibility: {
        'founder': 85,
        'investor': 70,
        'collaborator': 60
      }
    },
    {
      id: 'investor',
      name: 'Investor',
      title: 'Fund & Support',
      description: 'Provide capital and strategic support to promising startups',
      icon: <DollarSign className="w-6 h-6" />,
      category: 'investor',
      level: 'expert',
      characteristics: [
        'Financial resources',
        'Investment experience',
        'Due diligence skills',
        'Network access'
      ],
      benefits: [
        'Investment returns',
        'Portfolio diversification',
        'Early access to deals',
        'Influence in ecosystem'
      ],
      requirements: [
        'Investment capital',
        'Experience in investing',
        'Due diligence process'
      ],
      typicalGoals: [
        'Find investment opportunities',
        'Build portfolio',
        'Support innovation',
        'Generate returns'
      ],
      skills: ['Investment Analysis', 'Due Diligence', 'Networking', 'Strategy'],
      timeCommitment: 'Variable',
      popularity: 45,
      matchCompatibility: {
        'founder': 85,
        'mentor': 70,
        'collaborator': 55
      },
      isPremium: true
    },
    {
      id: 'collaborator',
      name: 'Collaborator',
      title: 'Work Together',
      description: 'Contribute skills to specific projects and initiatives',
      icon: <Users className="w-6 h-6" />,
      category: 'collaborator',
      level: 'intermediate',
      characteristics: [
        'Specialized skills',
        'Flexibility',
        'Team player',
        'Project focus'
      ],
      benefits: [
        'Project variety',
        'Skill development',
        'Network building',
        'Portfolio growth'
      ],
      requirements: [
        'Specific expertise',
        'Time availability',
        'Collaboration skills'
      ],
      typicalGoals: [
        'Work on interesting projects',
        'Build portfolio',
        'Learn new skills',
        'Network with peers'
      ],
      skills: ['Domain Expertise', 'Communication', 'Project Management', 'Adaptability'],
      timeCommitment: 'Part-time',
      popularity: 70,
      matchCompatibility: {
        'founder': 80,
        'mentor': 60,
        'investor': 55
      }
    },
    {
      id: 'team-member',
      name: 'Team Member',
      title: 'Join a Team',
      description: 'Become an early employee of a promising startup',
      icon: <UserPlus className="w-6 h-6" />,
      category: 'team-member',
      level: 'beginner',
      characteristics: [
        'Specialized skills',
        'Growth mindset',
        'Adaptability',
        'Commitment'
      ],
      benefits: [
        'Career growth',
        'Equity opportunities',
        'Learning experience',
        'Startup culture'
      ],
      requirements: [
        'Relevant skills',
        'Time commitment',
        'Team fit'
      ],
      typicalGoals: [
        'Join promising startup',
        'Gain experience',
        'Build career',
        'Earn equity'
      ],
      skills: ['Technical Skills', 'Communication', 'Problem Solving', 'Adaptability'],
      timeCommitment: 'Full-time',
      popularity: 60,
      matchCompatibility: {
        'founder': 70,
        'collaborator': 85,
        'mentor': 50
      }
    },
    {
      id: 'design-cofounder',
      name: 'Design Co-founder',
      title: 'Shape the Experience',
      description: 'Lead design vision and user experience strategy',
      icon: <Palette className="w-6 h-6" />,
      category: 'founder',
      level: 'intermediate',
      characteristics: [
        'Design expertise',
        'User empathy',
        'Creative vision',
        'Product thinking'
      ],
      benefits: [
        'Creative leadership',
        'Product influence',
        'Design ownership',
        'Team building'
      ],
      requirements: [
        'Design portfolio',
        'UX/UI expertise',
        'Product understanding'
      ],
      typicalGoals: [
        'Build beautiful products',
        'Lead design teams',
        'Innovate user experience',
        'Achieve design excellence'
      ],
      skills: ['UI/UX Design', 'Product Design', 'User Research', 'Leadership'],
      timeCommitment: 'Full-time',
      popularity: 55,
      matchCompatibility: {
        'technical-cofounder': 90,
        'business-cofounder': 85,
        'mentor': 70,
        'collaborator': 80
      }
    },
    {
      id: 'marketing-cofounder',
      name: 'Marketing Co-founder',
      title: 'Drive Growth',
      description: 'Lead marketing strategy and customer acquisition',
      icon: <Megaphone className="w-6 h-6" />,
      category: 'founder',
      level: 'intermediate',
      characteristics: [
        'Marketing expertise',
        'Growth mindset',
        'Data analysis',
        'Creative thinking'
      ],
      benefits: [
        'Marketing leadership',
        'Growth ownership',
        'Brand building',
        'Team leadership'
      ],
      requirements: [
        'Marketing experience',
        'Growth track record',
        'Analytics skills'
      ],
      typicalGoals: [
        'Build brand awareness',
        'Drive customer acquisition',
        'Scale marketing efforts',
        'Achieve growth targets'
      ],
      skills: ['Marketing', 'Growth Hacking', 'Analytics', 'Branding'],
      timeCommitment: 'Full-time',
      popularity: 48,
      matchCompatibility: {
        'technical-cofounder': 80,
        'business-cofounder': 90,
        'mentor': 70,
        'collaborator': 75
      }
    }
  ];

  const quizQuestions = [
    {
      id: 'primary_goal',
      question: 'What is your primary goal?',
      options: [
        { value: 'build_company', text: 'Build a company from scratch' },
        { value: 'join_startup', text: 'Join an existing startup' },
        { value: 'mentor_others', text: 'Mentor and guide others' },
        { value: 'invest_startups', text: 'Invest in promising startups' },
        { value: 'collaborate_projects', text: 'Collaborate on specific projects' }
      ]
    },
    {
      id: 'experience_level',
      question: 'What is your experience level?',
      options: [
        { value: 'beginner', text: 'Just starting out' },
        { value: 'intermediate', text: 'Some experience' },
        { value: 'advanced', text: 'Experienced professional' },
        { value: 'expert', text: 'Industry expert' }
      ]
    },
    {
      id: 'time_commitment',
      question: 'How much time can you commit?',
      options: [
        { value: 'full_time', text: 'Full-time (40+ hours/week)' },
        { value: 'part_time', text: 'Part-time (10-20 hours/week)' },
        { value: 'flexible', text: 'Flexible/as needed' },
        { value: 'minimal', text: 'Minimal (few hours/month)' }
      ]
    },
    {
      id: 'primary_skill',
      question: 'What is your primary skill area?',
      options: [
        { value: 'technical', text: 'Technical/Engineering' },
        { value: 'business', text: 'Business/Strategy' },
        { value: 'design', text: 'Design/UX' },
        { value: 'marketing', text: 'Marketing/Growth' },
        { value: 'finance', text: 'Finance/Investment' }
      ]
    }
  ];

  useEffect(() => {
    // Auto-select role based on user data if available
    if (userData?.interests) {
      const hasBusinessInterests = userData.interests.some(i => 
        ['business', 'strategy', 'marketing'].includes(i.toLowerCase())
      );
      const hasTechInterests = userData.interests.some(i => 
        ['tech', 'programming', 'development'].includes(i.toLowerCase())
      );
      
      if (hasBusinessInterests) {
        const businessRole = roles.find(r => r.id === 'business-cofounder');
        if (businessRole) setSelectedRole(businessRole);
      } else if (hasTechInterests) {
        const techRole = roles.find(r => r.id === 'technical-cofounder');
        if (techRole) setSelectedRole(techRole);
      }
    }
  }, [userData]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setShowDetails(true);
  };

  const handleAdditionalRoleToggle = (role: Role) => {
    setSelectedAdditionalRoles(prev => 
      prev.some(r => r.id === role.id)
        ? prev.filter(r => r.id !== role.id)
        : [...prev, role]
    );
  };

  const handleQuizSubmit = () => {
    // Calculate quiz results
    const results: Role[] = [];
    
    if (quizAnswers.primary_goal === 'build_company') {
      if (quizAnswers.primary_skill === 'technical') {
        results.push(roles.find(r => r.id === 'technical-cofounder')!);
      } else if (quizAnswers.primary_skill === 'business') {
        results.push(roles.find(r => r.id === 'business-cofounder')!);
      } else if (quizAnswers.primary_skill === 'design') {
        results.push(roles.find(r => r.id === 'design-cofounder')!);
      } else if (quizAnswers.primary_skill === 'marketing') {
        results.push(roles.find(r => r.id === 'marketing-cofounder')!);
      }
    } else if (quizAnswers.primary_goal === 'mentor_others') {
      results.push(roles.find(r => r.id === 'mentor')!);
    } else if (quizAnswers.primary_goal === 'invest_startups') {
      results.push(roles.find(r => r.id === 'investor')!);
    } else if (quizAnswers.primary_goal === 'collaborate_projects') {
      results.push(roles.find(r => r.id === 'collaborator')!);
    } else if (quizAnswers.primary_goal === 'join_startup') {
      results.push(roles.find(r => r.id === 'team-member')!);
    }
    
    setQuizResults(results);
    setShowQuiz(false);
    
    if (results.length > 0) {
      setSelectedRole(results[0]);
      setShowDetails(true);
    }
  };

  const handleConfirmSelection = () => {
    if (selectedRole) {
      onRoleSelect(selectedRole, selectedAdditionalRoles);
    }
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = searchQuery === '' || 
      role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      role.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = filterCategory === 'all' || role.category === filterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'founder': return <Rocket className="w-4 h-4" />;
      case 'mentor': return <GraduationCap className="w-4 h-4" />;
      case 'investor': return <DollarSign className="w-4 h-4" />;
      case 'collaborator': return <Users className="w-4 h-4" />;
      case 'team-member': return <UserPlus className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-blue-100 text-blue-800';
      case 'advanced': return 'bg-purple-100 text-purple-800';
      case 'expert': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'founder': return 'bg-blue-100 text-blue-800';
      case 'mentor': return 'bg-purple-100 text-purple-800';
      case 'investor': return 'bg-green-100 text-green-800';
      case 'collaborator': return 'bg-orange-100 text-orange-800';
      case 'team-member': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (showQuiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-2xl"
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Find Your Perfect Role</CardTitle>
              <p className="text-muted-foreground text-center">
                Answer a few questions to get personalized role recommendations
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              {quizQuestions.map((question, qIndex) => (
                <div key={question.id} className="space-y-3">
                  <h3 className="font-semibold">{question.question}</h3>
                  <div className="space-y-2">
                    {question.options.map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                      >
                        <input
                          type="radio"
                          name={question.id}
                          value={option.value}
                          checked={quizAnswers[question.id] === option.value}
                          onChange={(e) => setQuizAnswers(prev => ({
                            ...prev,
                            [question.id]: e.target.value
                          }))}
                          className="w-4 h-4"
                        />
                        <span>{option.text}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              
              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={() => setShowQuiz(false)}>
                  Back to Selection
                </Button>
                <Button 
                  onClick={handleQuizSubmit}
                  disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                >
                  Get Recommendations
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold">Choose Your Role</h1>
                <p className="text-sm text-muted-foreground">
                  Select the role that best describes what you're looking for
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => setShowQuiz(true)} className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Find My Role
              </Button>
              <Button variant="outline" onClick={onSkip}>
                Skip
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Quiz Results */}
        {quizResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div>
                    <h3 className="font-semibold text-green-800">Recommended Roles</h3>
                    <p className="text-sm text-green-600">
                      Based on your quiz answers, we recommend these roles for you
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {quizResults.map((role) => (
                    <Badge key={role.id} variant="secondary" className="cursor-pointer">
                      {role.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Filters and Search */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterCategory === 'founder' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('founder')}
                >
                  Founders
                </Button>
                <Button
                  variant={filterCategory === 'mentor' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('mentor')}
                >
                  Mentors
                </Button>
                <Button
                  variant={filterCategory === 'investor' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('investor')}
                >
                  Investors
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
        </div>

        {/* Roles Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredRoles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedRole?.id === role.id ? 'border-primary ring-2 ring-primary/20' : ''
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        role.category === 'founder' ? 'bg-blue-100' :
                        role.category === 'mentor' ? 'bg-purple-100' :
                        role.category === 'investor' ? 'bg-green-100' :
                        role.category === 'collaborator' ? 'bg-orange-100' :
                        'bg-yellow-100'
                      }`}>
                        {role.icon}
                      </div>
                      <div>
                        <h3 className="font-semibold">{role.name}</h3>
                        <p className="text-sm text-muted-foreground">{role.title}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {role.isRecommended && (
                        <Badge variant="secondary" className="gap-1">
                          <Sparkles className="w-3 h-3" />
                          Recommended
                        </Badge>
                      )}
                      {role.isPremium && (
                        <Badge variant="outline" className="gap-1">
                          <Crown className="w-3 h-3" />
                          Premium
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {role.description}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Experience Level</span>
                      <Badge className={getLevelColor(role.level)}>
                        {role.level}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Time Commitment</span>
                      <span>{role.timeCommitment}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Popularity</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full"
                            style={{ width: `${role.popularity}%` }}
                          />
                        </div>
                        <span>{role.popularity}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center space-x-2">
                      <Badge className={getCategoryColor(role.category)} variant="outline">
                        <div className="flex items-center space-x-1">
                          {getCategoryIcon(role.category)}
                          <span className="capitalize">{role.category}</span>
                        </div>
                      </Badge>
                    </div>
                    
                    <Button 
                      size="sm"
                      onClick={() => handleRoleSelect(role)}
                      className="gap-2"
                    >
                      Select
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Role Details Modal */}
      <AnimatePresence>
        {showDetails && selectedRole && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-xl shadow-xl max-w-4xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${
                      selectedRole.category === 'founder' ? 'bg-blue-100' :
                      selectedRole.category === 'mentor' ? 'bg-purple-100' :
                      selectedRole.category === 'investor' ? 'bg-green-100' :
                      selectedRole.category === 'collaborator' ? 'bg-orange-100' :
                      'bg-yellow-100'
                    }`}>
                      {selectedRole.icon}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedRole.name}</h2>
                      <p className="text-muted-foreground">{selectedRole.title}</p>
                    </div>
                  </div>
                  
                  <Button variant="ghost" size="sm" onClick={() => setShowDetails(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-muted-foreground">{selectedRole.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Characteristics</h3>
                      <ul className="space-y-2">
                        {selectedRole.characteristics.map((char, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span>{char}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-3">Benefits</h3>
                      <ul className="space-y-2">
                        {selectedRole.benefits.map((benefit, index) => (
                          <li key={index} className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Requirements</h3>
                    <ul className="space-y-2">
                      {selectedRole.requirements.map((req, index) => (
                        <li key={index} className="flex items-center space-x-2">
                          <Target className="w-4 h-4 text-blue-500" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Typical Goals</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.typicalGoals.map((goal, index) => (
                        <Badge key={index} variant="outline">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRole.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Compatibility with Other Roles</h3>
                    <div className="space-y-2">
                      {Object.entries(selectedRole.matchCompatibility).map(([role, compatibility]) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className="capitalize">{role.replace('-', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full"
                                style={{ width: `${compatibility}%` }}
                              />
                            </div>
                            <span>{compatibility}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollArea>
              
              <div className="p-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge className={getCategoryColor(selectedRole.category)} variant="outline">
                      <div className="flex items-center space-x-1">
                        {getCategoryIcon(selectedRole.category)}
                        <span className="capitalize">{selectedRole.category}</span>
                      </div>
                    </Badge>
                    <Badge className={getLevelColor(selectedRole.level)}>
                      {selectedRole.level}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setShowDetails(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleConfirmSelection} className="gap-2">
                      Select This Role
                      <CheckCircle className="w-4 h-4" />
                    </Button>
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
