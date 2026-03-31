// AI Service — mock-first, ready for Lovable AI Gateway integration

export interface AIAgent {
  id: string;
  name: string;
  avatar: string;
  description: string;
  specialization: string;
  suggestedPrompts: string[];
  color: string;
}

export const AI_AGENTS: AIAgent[] = [
  {
    id: "cofounder-matcher",
    name: "CoFounder Matcher",
    avatar: "🎯",
    description: "AI-powered co-founder compatibility analysis",
    specialization: "Profile analysis, skill gaps, compatibility scoring",
    suggestedPrompts: [
      "Analyze my top match compatibility",
      "What skills should I look for in a co-founder?",
      "Compare my profile with Alex Chen",
    ],
    color: "hsl(var(--primary))",
  },
  {
    id: "pitch-reviewer",
    name: "Pitch Deck Reviewer",
    avatar: "📊",
    description: "AI-driven pitch feedback & strategy",
    specialization: "Pitch structure, market analysis, investor readiness",
    suggestedPrompts: [
      "Review my one-liner pitch",
      "What should my pitch deck include?",
      "How do I position my startup for investors?",
    ],
    color: "hsl(var(--accent))",
  },
  {
    id: "startup-advisor",
    name: "Startup Advisor",
    avatar: "🚀",
    description: "Strategic guidance for early-stage founders",
    specialization: "Business model, GTM strategy, fundraising",
    suggestedPrompts: [
      "Help me refine my startup idea",
      "What's the best GTM strategy for SaaS?",
      "How should I approach my first fundraise?",
    ],
    color: "hsl(var(--primary))",
  },
  {
    id: "community-guide",
    name: "Community Guide",
    avatar: "🌐",
    description: "Navigate the CoFounderBay ecosystem",
    specialization: "Platform features, community discovery, networking tips",
    suggestedPrompts: [
      "How do I find the right community?",
      "Tips for effective networking on the platform",
      "What features should I explore first?",
    ],
    color: "hsl(var(--accent))",
  },
];

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  agentId?: string;
  isTyping?: boolean;
}

// Simulated AI responses (mock — replace with Lovable AI Gateway calls)
const MOCK_RESPONSES: Record<string, string[]> = {
  "cofounder-matcher": [
    "Based on your profile analysis, I see strong compatibility in the **AI/ML space**. Your technical depth pairs well with founders who have GTM and business development experience.\n\n**Key insights:**\n- Your top match (Alex Chen, 92%) shares your AI focus but complements with product vision\n- Skills gap: Consider partners with fundraising or sales experience\n- Your commitment level (full-time) aligns with 60% of active founders on the platform",
    "Looking at your compatibility dimensions:\n\n📊 **Skills Complementarity**: 95% — Your technical stack fills a critical gap\n🎯 **Values Alignment**: 88% — Similar work ethic and startup philosophy\n🔄 **Role Fit**: 92% — Clear division of responsibilities\n⏱️ **Commitment Match**: 90% — Both seeking full-time engagement\n\nI recommend reaching out to your top 3 matches this week.",
  ],
  "pitch-reviewer": [
    "Here's my analysis of your pitch approach:\n\n**Strengths:**\n✅ Clear problem statement\n✅ Defined target market\n\n**Areas to improve:**\n⚠️ Quantify your TAM/SAM/SOM with data sources\n⚠️ Add a competitive landscape slide with clear differentiation\n⚠️ Include early traction metrics (even pre-revenue signals)\n\n**Recommended structure:**\n1. Problem → 2. Solution → 3. Market → 4. Business Model → 5. Traction → 6. Team → 7. Ask",
    "Your one-liner needs work. A strong pitch one-liner follows the formula:\n\n**\"We help [target audience] [solve problem] by [unique approach]\"**\n\nExample: *\"We help early-stage founders find compatible co-founders through AI-driven personality and skill matching.\"*\n\nKeep it under 15 words if possible. Want me to help craft yours?",
  ],
  "startup-advisor": [
    "For an early-stage SaaS startup, here's my recommended GTM framework:\n\n**Phase 1 (0-3 months): Validate**\n- 20 customer discovery interviews\n- Landing page with waitlist\n- Define ICP (Ideal Customer Profile)\n\n**Phase 2 (3-6 months): Launch**\n- Beta with 10-20 design partners\n- Content marketing (blog, LinkedIn)\n- Community-led growth via CoFounderBay\n\n**Phase 3 (6-12 months): Scale**\n- Paid acquisition channels\n- Partnership development\n- Product-led growth features\n\nWhich phase are you currently in?",
    "For your first fundraise, consider this approach:\n\n💰 **Pre-seed (€100K-€500K)**:\n- Angel investors + micro-VCs\n- Show problem validation + early product\n- SAFE notes preferred\n\n📋 **What investors want to see:**\n1. Team strength and complementarity\n2. Market size and timing\n3. Early signals (waitlist, LOIs, pilots)\n4. Clear use of funds\n\n**CoFounderBay tip:** Connect with investor profiles on the platform — Maria Santos and 3 others are actively seeking deal flow in your sector.",
  ],
  "community-guide": [
    "Welcome to CoFounderBay! Here's how to get the most out of the platform:\n\n🏠 **Dashboard** — Your command center for matches, activity, and progress\n🔍 **Discover** — Browse and filter potential co-founders, mentors, and investors\n💬 **Messages** — Connect via structured intro requests (no cold DMs)\n🎯 **Milestones** — Track your startup journey\n👥 **Communities** — Join curated groups by industry or stage\n\n**Pro tips:**\n- Complete your profile to 100% for better match quality\n- Join at least 2 communities in your first week\n- Send 3 intro requests to high-compatibility matches",
  ],
};

export async function getAIResponse(agentId: string, message: string): Promise<string> {
  // Simulate thinking delay
  await new Promise((r) => setTimeout(r, 1500 + Math.random() * 1500));

  const responses = MOCK_RESPONSES[agentId] || MOCK_RESPONSES["community-guide"];
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * Streaming version — calls onDelta with small chunks, simulating token-by-token delivery.
 * When a real backend is connected, replace the internals with SSE fetch.
 */
export async function streamAIResponse(
  agentId: string,
  _message: string,
  onDelta: (token: string) => void,
  onDone: () => void,
  signal?: AbortSignal,
): Promise<void> {
  // Small initial "thinking" pause
  await new Promise((r) => setTimeout(r, 400 + Math.random() * 400));

  if (signal?.aborted) { onDone(); return; }

  const responses = MOCK_RESPONSES[agentId] || MOCK_RESPONSES["community-guide"];
  const fullText = responses[Math.floor(Math.random() * responses.length)];

  // Stream word-by-word with natural cadence
  const words = fullText.split(/(\s+)/); // keep whitespace tokens
  for (const word of words) {
    if (signal?.aborted) break;
    onDelta(word);
    // Variable delay: short for whitespace, longer for content words
    const delay = word.trim() ? 18 + Math.random() * 32 : 5;
    await new Promise((r) => setTimeout(r, delay));
  }

  onDone();
}

export function getAgent(agentId: string): AIAgent | undefined {
  return AI_AGENTS.find((a) => a.id === agentId);
}
