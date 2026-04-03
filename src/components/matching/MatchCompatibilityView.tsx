import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Heart,
  Brain,
  Target,
  Users,
  Star,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Zap,
  Award,
  Lightbulb,
  MessageSquare,
  UserPlus,
  ChevronRight,
  BarChart3,
  PieChart,
  Activity,
  MapPin,
  Briefcase,
  Clock,
  Eye,
  X
} from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface CompatibilityBreakdown {
  overall: {
    score: number;
    grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D' | 'F';
    confidence: number;
  };
  dimensions: {
    skills: {
      score: number;
      weight: number;
      details: {
        shared: string[];
        complementary: string[];
        missing: string[];
      };
    };
    experience: {
      score: number;
      weight: number;
      details: {
        level: string;
        relevance: string;
        growth: string;
      };
    };
    goals: {
      score: number;
      weight: number;
      details: {
        alignment: string[];
        timeline: string;
        priorities: string[];
      };
    };
    personality: {
      score: number;
      weight: number;
      details: {
        workStyle: string;
        communication: string;
        values: string[];
      };
    };
    background: {
      score: number;
      weight: number;
      details: {
        industry: string;
        education: string;
        location: string;
      };
    };
  };
  strengths: string[];
  concerns: string[];
  recommendations: string[];
  riskFactors: string[];
}

interface MatchCompatibilityViewProps {
  matchId: string;
  matchData: {
    id: string;
    name: string;
    avatar?: string;
    headline?: string;
    location?: string;
    skills: string[];
  };
  onClose: () => void;
}

export default function MatchCompatibilityView({ matchId, matchData, onClose }: MatchCompatibilityViewProps) {
  const [breakdown, setBreakdown] = useState<CompatibilityBreakdown | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();

  useEffect(() => {
    loadCompatibilityBreakdown();
  }, [matchId]);

  const loadCompatibilityBreakdown = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API call
      const mockBreakdown: CompatibilityBreakdown = {
        overall: {
          score: 92,
          grade: 'A+',
          confidence: 87
        },
        dimensions: {
          skills: {
            score: 95,
            weight: 30,
            details: {
              shared: ['React', 'TypeScript', 'Node.js', 'PostgreSQL'],
              complementary: ['UI/UX Design', 'Product Management', 'Marketing'],
              missing: ['DevOps', 'Cloud Architecture']
            }
          },
          experience: {
            score: 88,
            weight: 25,
            details: {
              level: 'Both have 5+ years experience in relevant domains',
              relevance: 'Strong overlap in startup experience and technical leadership',
              growth: 'Complementary learning paths and career trajectories'
            }
          },
          goals: {
            score: 90,
            weight: 20,
            details: {
              alignment: ['Build scalable SaaS product', 'Achieve product-market fit', 'Scale to 100k+ users'],
              timeline: 'Both looking for 6-12 month timeline to MVP',
              priorities: ['Focus on user experience and technical excellence over rapid growth']
            }
          },
          personality: {
            score: 85,
            weight: 15,
            details: {
              workStyle: 'Both prefer structured but flexible work environments',
              communication: 'Direct and transparent communication styles',
              values: ['Innovation', 'Quality', 'User-centricity', 'Continuous learning']
            }
          },
          background: {
            score: 93,
            weight: 10,
            details: {
              industry: 'Both in SaaS/tech industry with similar domain knowledge',
              education: 'Complementary educational backgrounds (CS vs Business)',
              location: 'Same geographic area with remote work flexibility'
            }
          }
        },
        strengths: [
          'Strong technical complementarity with full-stack coverage',
          'Aligned vision and product goals',
          'Similar work ethic and commitment levels',
          'Excellent communication and problem-solving approaches',
          'Shared industry experience and network',
          'Complementary skill sets that cover all key areas'
        ],
        concerns: [
          'Both may be too focused on technical perfection over speed',
          'Potential overlap in decision-making areas',
          'Limited experience in early-stage fundraising',
          'No prior co-founder experience between them'
        ],
        recommendations: [
          'Establish clear decision-making frameworks early',
          'Consider bringing on an advisor with fundraising experience',
          'Set up regular sync meetings to align on priorities',
          'Define clear boundaries between technical and business decisions',
          'Create a shared roadmap with measurable milestones'
        ],
        riskFactors: [
          'Technical perfectionism could slow down iteration speed',
          'Limited financial runway experience',
          'Potential conflicts in product direction decisions',
          'Both may need mentorship in scaling operations'
        ]
      };
      setBreakdown(mockBreakdown);
    } catch (error) {
      toast({
        title: "Error loading compatibility data",
        description: "Failed to load the compatibility breakdown. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+': return 'text-green-600 bg-green-100';
      case 'A': return 'text-green-600 bg-green-100';
      case 'B+': return 'text-blue-600 bg-blue-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C+': return 'text-yellow-600 bg-yellow-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'F': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="p-8">
            <div className="flex items-center space-x-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <div>
                <h3 className="text-lg font-semibold">Analyzing Compatibility</h3>
                <p className="text-muted-foreground">Running advanced compatibility analysis...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!breakdown) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-background rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-4">
            <Avatar className="w-12 h-12">
              <AvatarImage src={matchData.avatar} />
              <AvatarFallback>
                {matchData.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{matchData.name}</h2>
              <p className="text-muted-foreground">{matchData.headline}</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <span className="text-3xl font-bold {getScoreColor(breakdown.overall.score)}">
                  {breakdown.overall.score}%
                </span>
                <Badge className={getGradeColor(breakdown.overall.grade)}>
                  {breakdown.overall.grade}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {breakdown.overall.confidence}% confidence
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6 pt-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
                <TabsTrigger value="analysis">Analysis</TabsTrigger>
                <TabsTrigger value="risks">Risk Factors</TabsTrigger>
                <TabsTrigger value="actions">Actions</TabsTrigger>
              </TabsList>
            </div>

            {/* Overview Tab */}
            <TabsContent value="overview" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      Overall Compatibility
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Compatibility Score</span>
                        <span className={`text-2xl font-bold ${getScoreColor(breakdown.overall.score)}`}>
                          {breakdown.overall.score}%
                        </span>
                      </div>
                      <Progress value={breakdown.overall.score} className="h-3" />
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Confidence Level</span>
                        <span className="text-sm font-medium">{breakdown.overall.confidence}%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-yellow-500" />
                      Key Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {breakdown.strengths.map((strength, index) => (
                        <li key={index} className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-blue-500" />
                    Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {breakdown.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <ChevronRight className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Dimensions Tab */}
            <TabsContent value="dimensions" className="p-6 space-y-4">
              {Object.entries(breakdown.dimensions).map(([key, dimension]) => (
                <Card key={key}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg capitalize">{key}</CardTitle>
                      <div className="flex items-center space-x-2">
                        <span className={`text-2xl font-bold ${getScoreColor(dimension.score)}`}>
                          {dimension.score}%
                        </span>
                        <Badge variant="outline">{dimension.weight}% weight</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress value={dimension.score} className="mb-4" />
                    <div className="space-y-2">
                      {Object.entries(dimension.details).map(([detailKey, detailValue]) => (
                        <div key={detailKey}>
                          <p className="text-sm font-medium capitalize mb-1">{detailKey}</p>
                          {Array.isArray(detailValue) ? (
                            <div className="flex flex-wrap gap-1">
                              {detailValue.map((item, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">{detailValue}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-green-500" />
                      Dimension Breakdown
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(breakdown.dimensions).map(([key, dimension]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{key}</span>
                          <div className="flex items-center space-x-2">
                            <Progress value={dimension.score} className="w-24 h-2" />
                            <span className="text-sm font-medium w-12 text-right">
                              {dimension.score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-blue-500" />
                      Weight Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(breakdown.dimensions).map(([key, dimension]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">{key}</span>
                          <Badge variant="outline">{dimension.weight}%</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-purple-500" />
                    Potential Concerns
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {breakdown.concerns.map((concern, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{concern}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Risk Factors Tab */}
            <TabsContent value="risks" className="p-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                      <h4 className="font-semibold text-orange-800 mb-2">Identified Risk Factors</h4>
                      <ul className="space-y-2">
                        {breakdown.riskFactors.map((risk, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <XCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                            <span className="text-sm">{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2">Mitigation Strategies</h4>
                      <ul className="space-y-2">
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Establish clear decision-making frameworks and escalation paths</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Seek mentorship from experienced founders and investors</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">Create detailed operating agreements and role definitions</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="p-6">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-500" />
                      Next Steps
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full justify-start gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Start Conversation
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Users className="w-4 h-4" />
                        Schedule Video Call
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Eye className="w-4 h-4" />
                        View Full Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-500" />
                      Premium Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Brain className="w-4 h-4" />
                        Generate Detailed Compatibility Report
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <Target className="w-4 h-4" />
                        Create Custom Action Plan
                      </Button>
                      <Button variant="outline" className="w-full justify-start gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Track Relationship Progress
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/30">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Info className="w-4 h-4" />
            <span>Compatibility analysis updated {new Date().toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="gap-2">
              <UserPlus className="w-4 h-4" />
              Connect
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
