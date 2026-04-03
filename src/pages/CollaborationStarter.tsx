import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  MessageSquare,
  Search,
  Send,
  Users,
  Star,
  Heart,
  Zap,
  Lightbulb,
  Rocket,
  Award,
  TrendingUp,
  Calendar,
  MapPin,
  Clock,
  CheckCircle,
  Copy,
  Edit,
  Save,
  RefreshCw,
  Sparkles,
  Brain,
  FileText,
  Code,
  Palette,
  BarChart3,
  Megaphone,
  Handshake,
  Building,
  DollarSign,
  Users2,
  BookOpen,
  GraduationCap,
  Briefcase,
  Target,
  Flag,
  Compass,
  Navigation,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  MoreHorizontal,
  Settings,
  Filter,
  SortAsc,
  SortDesc,
  Eye,
  EyeOff,
  HeartHandshake,
  ArrowRight,
  ArrowUpRight,
  Circle,
  CheckSquare
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CollaborationPrompt {
  id: string;
  title: string;
  description: string;
  category: 'introduction' | 'collaboration' | 'mentorship' | 'partnership' | 'funding' | 'technical' | 'business';
  type: 'icebreaker' | 'deep-dive' | 'proposal' | 'question' | 'template';
  content: {
    message: string;
    variables?: Array<{
      name: string;
      placeholder: string;
      type: 'text' | 'select' | 'textarea';
      options?: string[];
    }>;
  };
  context: {
    stage: 'initial' | 'follow-up' | 'proposal' | 'negotiation';
    relationship: 'co-founder' | 'mentor' | 'investor' | 'collaborator' | 'team-member';
    industry?: string;
    experience?: 'junior' | 'mid' | 'senior' | 'executive';
  };
  metadata: {
    createdAt: string;
    createdBy: {
      id: string;
      name: string;
      avatar?: string;
    };
    usageCount: number;
    successRate: number;
    averageResponseTime: string;
    tags: string[];
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: string;
    isPremium: boolean;
    isVerified: boolean;
  };
  customization: {
    canEdit: boolean;
    canSave: boolean;
    canShare: boolean;
    variables: Record<string, any>;
  };
}

interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  variables: Array<{
    name: string;
    placeholder: string;
    type: 'text' | 'select' | 'textarea';
    options?: string[];
    required?: boolean;
  }>;
  usage: {
    totalUses: number;
    successRate: number;
    lastUsed: string;
  };
}

interface CollaborationStarterProps {
  recipient?: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    skills: string[];
    experience?: string;
    interests?: string[];
  };
  onSendMessage: (message: string) => void;
  onSaveTemplate: (template: PromptTemplate) => void;
}

export default function CollaborationStarter({ 
  recipient, 
  onSendMessage, 
  onSaveTemplate 
}: CollaborationStarterProps) {
  const [prompts, setPrompts] = useState<CollaborationPrompt[]>([]);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prompts');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPrompt, setSelectedPrompt] = useState<CollaborationPrompt | null>(null);
  const [customizedMessage, setCustomizedMessage] = useState('');
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [savedCustomizations, setSavedCustomizations] = useState<PromptTemplate[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadPrompts();
    loadTemplates();
  }, []);

  const loadPrompts = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockPrompts: CollaborationPrompt[] = [
        {
          id: '1',
          title: 'Co-founder Introduction',
          description: 'Break the ice with a potential co-founder and explore compatibility',
          category: 'introduction',
          type: 'icebreaker',
          content: {
            message: 'Hi {{name}}! I came across your profile and was really impressed by your background in {{skill}}. I\'m currently working on {{project}} and noticed we share similar interests in {{interest}}. Would you be interested in exploring a potential co-founder collaboration?',
            variables: [
              { name: 'name', placeholder: 'Recipient name', type: 'text' },
              { name: 'skill', placeholder: 'Their key skill', type: 'text' },
              { name: 'project', placeholder: 'Your project description', type: 'textarea' },
              { name: 'interest', placeholder: 'Shared interest', type: 'text' }
            ]
          },
          context: {
            stage: 'initial',
            relationship: 'co-founder',
            industry: 'tech',
            experience: 'mid'
          },
          metadata: {
            createdAt: '2024-01-10T10:00:00Z',
            createdBy: {
              id: '1',
              name: 'Sarah Chen',
              avatar: ''
            },
            usageCount: 245,
            successRate: 78,
            averageResponseTime: '2 hours',
            tags: ['co-founder', 'introduction', 'tech'],
            difficulty: 'easy',
            estimatedTime: '2 minutes',
            isPremium: false,
            isVerified: true
          },
          customization: {
            canEdit: true,
            canSave: true,
            canShare: true,
            variables: {}
          }
        },
        {
          id: '2',
          title: 'Mentorship Request',
          description: 'Reach out to a potential mentor with specific guidance needs',
          category: 'mentorship',
          type: 'proposal',
          content: {
            message: 'Dear {{name}}, I\'ve been following your work in {{field}} and deeply admire your expertise, particularly in {{achievement}}. I\'m currently {{current_stage}} and would be honored to learn from your experience. Specifically, I\'m hoping to get guidance on {{guidance_area}}. Would you be open to a brief mentorship conversation?',
            variables: [
              { name: 'name', placeholder: 'Mentor name', type: 'text' },
              { name: 'field', placeholder: 'Their field of expertise', type: 'text' },
              { name: 'achievement', placeholder: 'Specific achievement', type: 'text' },
              { name: 'current_stage', placeholder: 'Your current stage', type: 'text' },
              { name: 'guidance_area', placeholder: 'Area needing guidance', type: 'textarea' }
            ]
          },
          context: {
            stage: 'initial',
            relationship: 'mentor',
            industry: 'general',
            experience: 'junior'
          },
          metadata: {
            createdAt: '2024-01-08T14:30:00Z',
            createdBy: {
              id: '2',
              name: 'Michael Rodriguez',
              avatar: ''
            },
            usageCount: 189,
            successRate: 65,
            averageResponseTime: '1 day',
            tags: ['mentorship', 'guidance', 'learning'],
            difficulty: 'medium',
            estimatedTime: '5 minutes',
            isPremium: false,
            isVerified: true
          },
          customization: {
            canEdit: true,
            canSave: true,
            canShare: true,
            variables: {}
          }
        },
        {
          id: '3',
          title: 'Technical Collaboration Proposal',
          description: 'Propose a specific technical collaboration or project',
          category: 'technical',
          type: 'proposal',
          content: {
            message: 'Hi {{name}}! I noticed your expertise in {{technical_skill}} and I\'m working on an interesting {{project_type}} that could benefit from your insights. The project involves {{project_description}} and I think your experience with {{their_experience}} would be invaluable. Would you be interested in discussing a potential collaboration? I\'m thinking we could {{collaboration_type}}.',
            variables: [
              { name: 'name', placeholder: 'Recipient name', type: 'text' },
              { name: 'technical_skill', placeholder: 'Their technical skill', type: 'text' },
              { name: 'project_type', placeholder: 'Type of project', type: 'text' },
              { name: 'project_description', placeholder: 'Project description', type: 'textarea' },
              { name: 'their_experience', placeholder: 'Their relevant experience', type: 'text' },
              { name: 'collaboration_type', placeholder: 'Type of collaboration', type: 'text' }
            ]
          },
          context: {
            stage: 'proposal',
            relationship: 'collaborator',
            industry: 'tech',
            experience: 'senior'
          },
          metadata: {
            createdAt: '2024-01-12T09:15:00Z',
            createdBy: {
              id: '3',
              name: 'Emily Johnson',
              avatar: ''
            },
            usageCount: 156,
            successRate: 72,
            averageResponseTime: '4 hours',
            tags: ['technical', 'collaboration', 'project'],
            difficulty: 'medium',
            estimatedTime: '8 minutes',
            isPremium: true,
            isVerified: true
          },
          customization: {
            canEdit: true,
            canSave: true,
            canShare: true,
            variables: {}
          }
        },
        {
          id: '4',
          title: 'Investment Pitch Introduction',
          description: 'Introduce your startup to potential investors',
          category: 'funding',
          type: 'proposal',
          content: {
            message: 'Dear {{name}}, I hope this message finds you well. I\'m reaching out about {{startup_name}}, a {{startup_category}} company that\'s {{traction_milestone}}. We\'ve developed {{solution_description}} that addresses {{problem_statement}}. Given your experience investing in {{investment_focus}}, I thought you might be interested in our {{unique_value}}. We\'re currently {{funding_stage}} and would love to share our deck and discuss the opportunity.',
            variables: [
              { name: 'name', placeholder: 'Investor name', type: 'text' },
              { name: 'startup_name', placeholder: 'Your startup name', type: 'text' },
              { name: 'startup_category', placeholder: 'Startup category', type: 'text' },
              { name: 'traction_milestone', placeholder: 'Current traction', type: 'text' },
              { name: 'solution_description', placeholder: 'Solution description', type: 'textarea' },
              { name: 'problem_statement', placeholder: 'Problem being solved', type: 'text' },
              { name: 'investment_focus', placeholder: 'Their investment focus', type: 'text' },
              { name: 'unique_value', placeholder: 'Unique value proposition', type: 'text' },
              { name: 'funding_stage', placeholder: 'Current funding stage', type: 'text' }
            ]
          },
          context: {
            stage: 'proposal',
            relationship: 'investor',
            industry: 'startup',
            experience: 'executive'
          },
          metadata: {
            createdAt: '2024-01-11T16:45:00Z',
            createdBy: {
              id: '4',
              name: 'David Kim',
              avatar: ''
            },
            usageCount: 98,
            successRate: 45,
            averageResponseTime: '3 days',
            tags: ['funding', 'investment', 'pitch'],
            difficulty: 'hard',
            estimatedTime: '15 minutes',
            isPremium: true,
            isVerified: true
          },
          customization: {
            canEdit: true,
            canSave: true,
            canShare: true,
            variables: {}
          }
        }
      ];
      setPrompts(mockPrompts);
    } catch (error) {
      toast({
        title: "Error loading prompts",
        description: "Failed to load collaboration prompts. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockTemplates: PromptTemplate[] = [
        {
          id: '1',
          name: 'My Co-founder Intro',
          description: 'Personalized co-founder introduction template',
          category: 'co-founder',
          content: 'Hi {{name}}! Excited to connect...',
          variables: [
            { name: 'name', placeholder: 'Name', type: 'text', required: true }
          ],
          usage: {
            totalUses: 12,
            successRate: 83,
            lastUsed: '2024-01-14T10:30:00Z'
          }
        }
      ];
      setTemplates(mockTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const handlePromptSelect = (prompt: CollaborationPrompt) => {
    setSelectedPrompt(prompt);
    setCustomizedMessage(prompt.content.message);
    
    // Initialize variables with defaults if recipient is available
    if (recipient) {
      const initialVariables: Record<string, string> = {};
      prompt.content.variables?.forEach(variable => {
        if (variable.name === 'name') {
          initialVariables[variable.name] = recipient.name;
        } else if (variable.name === 'skill' && recipient.skills.length > 0) {
          initialVariables[variable.name] = recipient.skills[0];
        }
      });
      setVariables(initialVariables);
    }
  };

  const handleVariableChange = (variableName: string, value: string) => {
    setVariables(prev => ({ ...prev, [variableName]: value }));
    
    // Update the customized message
    if (selectedPrompt) {
      let updatedMessage = selectedPrompt.content.message;
      Object.entries({ ...variables, [variableName]: value }).forEach(([key, val]) => {
        updatedMessage = updatedMessage.replace(new RegExp(`{{${key}}}`, 'g'), val);
      });
      setCustomizedMessage(updatedMessage);
    }
  };

  const handleSendMessage = () => {
    if (customizedMessage.trim()) {
      onSendMessage(customizedMessage);
      toast({
        title: "Message sent",
        description: "Your collaboration message has been sent successfully."
      });
      
      // Update usage stats
      if (selectedPrompt) {
        setPrompts(prev => 
          prev.map(prompt => 
            prompt.id === selectedPrompt.id
              ? { ...prompt, metadata: { ...prompt.metadata, usageCount: prompt.metadata.usageCount + 1 } }
              : prompt
          )
        );
      }
    }
  };

  const handleSaveTemplate = () => {
    if (selectedPrompt && customizedMessage) {
      const newTemplate: PromptTemplate = {
        id: Date.now().toString(),
        name: `Custom ${selectedPrompt.title}`,
        description: `Customized version of ${selectedPrompt.title}`,
        category: selectedPrompt.category,
        content: customizedMessage,
        variables: (selectedPrompt.content.variables || []).map(v => ({ ...v, required: false })),
        usage: {
          totalUses: 0,
          successRate: 0,
          lastUsed: new Date().toISOString()
        }
      };
      
      setSavedCustomizations(prev => [...prev, newTemplate]);
      onSaveTemplate(newTemplate);
      
      toast({
        title: "Template saved",
        description: "Your customized template has been saved."
      });
    }
  };

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = searchQuery === '' || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory;
    const matchesType = selectedType === 'all' || prompt.type === selectedType;
    
    return matchesSearch && matchesCategory && matchesType;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'introduction': return Users;
      case 'collaboration': return Handshake;
      case 'mentorship': return GraduationCap;
      case 'partnership': return HeartHandshake;
      case 'funding': return DollarSign;
      case 'technical': return Code;
      case 'business': return Briefcase;
      default: return MessageSquare;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'icebreaker': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'deep-dive': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'proposal': return 'bg-green-100 text-green-800 border-green-200';
      case 'question': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'template': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const stats = {
    totalPrompts: prompts.length,
    totalUsage: prompts.reduce((sum, prompt) => sum + prompt.metadata.usageCount, 0),
    averageSuccess: prompts.length > 0 ? Math.round(prompts.reduce((sum, prompt) => sum + prompt.metadata.successRate, 0) / prompts.length) : 0,
    premiumPrompts: prompts.filter(p => p.metadata.isPremium).length
  };

  if (loading) {
    return (
      <div className="flex h-screen">
        <div className="w-96 border-r p-4 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Prompts List */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold mb-4">Collaboration Starters</h2>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-sm">{stats.totalPrompts}</div>
              <div className="text-xs text-muted-foreground">Prompts</div>
            </div>
            <div className="text-center p-2 bg-muted/50 rounded">
              <div className="font-semibold text-sm">{stats.totalUsage}</div>
              <div className="text-xs text-muted-foreground">Uses</div>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium mb-1 block">Category</label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="introduction">Introduction</SelectItem>
                  <SelectItem value="collaboration">Collaboration</SelectItem>
                  <SelectItem value="mentorship">Mentorship</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                  <SelectItem value="funding">Funding</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="business">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium mb-1 block">Type</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="icebreaker">Icebreaker</SelectItem>
                  <SelectItem value="deep-dive">Deep Dive</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="template">Template</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Prompts List */}
        <ScrollArea className="flex-1 p-2">
          <div className="space-y-2">
            {filteredPrompts.map((prompt) => {
              const CategoryIcon = getCategoryIcon(prompt.category);
              return (
                <motion.div
                  key={prompt.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    selectedPrompt?.id === prompt.id ? 'bg-muted' : ''
                  }`}
                  onClick={() => handlePromptSelect(prompt)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                      <CategoryIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-semibold text-sm truncate">{prompt.title}</h3>
                        {prompt.metadata.isPremium && (
                          <Badge variant="secondary" className="text-xs">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Premium
                          </Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                        {prompt.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1">
                          <Badge className={getTypeColor(prompt.type)} variant="outline">
                            {prompt.type}
                          </Badge>
                          <Badge className={getDifficultyColor(prompt.metadata.difficulty)} variant="secondary">
                            {prompt.metadata.difficulty}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{prompt.metadata.usageCount}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>{prompt.metadata.successRate}%</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {prompt.metadata.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {prompt.metadata.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{prompt.metadata.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content - Prompt Customization */}
      <div className="flex-1 flex flex-col">
        {selectedPrompt ? (
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-background/95 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                    {(() => {
                      const CategoryIcon = getCategoryIcon(selectedPrompt.category);
                      return <CategoryIcon className="w-6 h-6 text-muted-foreground" />;
                    })()}
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold">{selectedPrompt.title}</h1>
                    <p className="text-sm text-muted-foreground">{selectedPrompt.description}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getTypeColor(selectedPrompt.type)} variant="outline">
                        {selectedPrompt.type}
                      </Badge>
                      <Badge className={getDifficultyColor(selectedPrompt.metadata.difficulty)} variant="secondary">
                        {selectedPrompt.metadata.difficulty}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {selectedPrompt.metadata.estimatedTime}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="w-4 h-4" />
                    {showPreview ? 'Hide' : 'Show'} Preview
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSaveTemplate}>
                    <Save className="w-4 h-4" />
                    Save Template
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="max-w-4xl mx-auto space-y-6">
                {/* Recipient Info */}
                {recipient && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={recipient.avatar} />
                          <AvatarFallback>
                            {recipient.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">{recipient.name}</h3>
                          <p className="text-sm text-muted-foreground">{recipient.headline}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Variables */}
                {selectedPrompt.content.variables && selectedPrompt.content.variables.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Customize Your Message</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {selectedPrompt.content.variables.map((variable) => (
                        <div key={variable.name}>
                          <label className="text-sm font-medium mb-1 block">
                            {variable.placeholder}
                            {variable.type === 'text' && (
                              <Input
                                value={variables[variable.name] || ''}
                                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                                placeholder={variable.placeholder}
                                className="mt-1"
                              />
                            )}
                            {variable.type === 'textarea' && (
                              <Textarea
                                value={variables[variable.name] || ''}
                                onChange={(e) => handleVariableChange(variable.name, e.target.value)}
                                placeholder={variable.placeholder}
                                className="mt-1"
                                rows={3}
                              />
                            )}
                            {variable.type === 'select' && variable.options && (
                              <Select
                                value={variables[variable.name] || ''}
                                onValueChange={(value) => handleVariableChange(variable.name, value)}
                              >
                                <SelectTrigger className="mt-1">
                                  <SelectValue placeholder={variable.placeholder} />
                                </SelectTrigger>
                                <SelectContent>
                                  {variable.options.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                          </label>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {/* Message Preview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Your Message</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={customizedMessage}
                      onChange={(e) => setCustomizedMessage(e.target.value)}
                      placeholder="Your customized message will appear here..."
                      className="min-h-[200px]"
                    />
                  </CardContent>
                </Card>

                {/* Prompt Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Prompt Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-2xl font-bold">{selectedPrompt.metadata.usageCount}</div>
                        <div className="text-sm text-muted-foreground">Total Uses</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-2xl font-bold text-green-600">{selectedPrompt.metadata.successRate}%</div>
                        <div className="text-sm text-muted-foreground">Success Rate</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-2xl font-bold">{selectedPrompt.metadata.averageResponseTime}</div>
                        <div className="text-sm text-muted-foreground">Avg Response</div>
                      </div>
                      <div className="text-center p-3 bg-muted/50 rounded">
                        <div className="text-2xl font-bold">{selectedPrompt.metadata.estimatedTime}</div>
                        <div className="text-sm text-muted-foreground">Est. Time</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>

            {/* Actions */}
            <div className="p-6 border-t bg-background/95 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>Created by {selectedPrompt.metadata.createdBy.name}</span>
                    <span>•</span>
                    <span>Used {selectedPrompt.metadata.usageCount} times</span>
                    <span>•</span>
                    <span>{selectedPrompt.metadata.successRate}% success rate</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
                      <Eye className="w-4 h-4 mr-2" />
                      {showPreview ? 'Hide' : 'Show'} Preview
                    </Button>
                    <Button onClick={handleSendMessage} disabled={!customizedMessage.trim()}>
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4">
              <Lightbulb className="w-16 h-16 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">Choose a Collaboration Starter</h3>
              <p className="text-muted-foreground">
                Select a prompt from the sidebar to customize and send your message
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && selectedPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPreview(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-background rounded-xl shadow-xl max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="text-lg font-semibold">Message Preview</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="p-6">
                {recipient && (
                  <div className="flex items-center space-x-3 mb-4">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={recipient.avatar} />
                      <AvatarFallback>
                        {recipient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">To: {recipient.name}</p>
                      <p className="text-xs text-muted-foreground">{recipient.headline}</p>
                    </div>
                  </div>
                )}
                
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{customizedMessage}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
