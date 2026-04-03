import { Hono } from "hono";
import { db } from "../db/index.js";
import { skills, industries, userSkills, userIndustries } from "../db/schema.js";
import { eq, and } from "drizzle-orm";
import { authMiddleware } from "../middleware/auth.js";
import type { AppEnv } from "../types.js";

const app = new Hono<AppEnv>();

// ══════════════════════════════════════════════════════════════════════════════
// SKILLS TAXONOMY
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/taxonomy/skills - List all skills (public)
app.get("/skills", async (c) => {
  const rows = await db.select().from(skills).where(eq(skills.isActive, true));
  
  // Group by category
  const grouped: Record<string, typeof rows> = {};
  for (const skill of rows) {
    const cat = skill.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(skill);
  }
  
  return c.json({ skills: rows, byCategory: grouped });
});

// GET /api/taxonomy/skills/categories - List skill categories
app.get("/skills/categories", async (c) => {
  const categories = [
    { id: "technical", name: "Technical", description: "Software, engineering, data, AI/ML" },
    { id: "business", name: "Business", description: "Strategy, finance, operations, sales" },
    { id: "design", name: "Design", description: "UI/UX, product design, branding" },
    { id: "marketing", name: "Marketing", description: "Growth, content, social, SEO" },
    { id: "operations", name: "Operations", description: "HR, legal, admin, logistics" },
    { id: "leadership", name: "Leadership", description: "Management, team building, coaching" },
    { id: "domain", name: "Domain Expertise", description: "Industry-specific knowledge" },
  ];
  return c.json({ categories });
});

// ══════════════════════════════════════════════════════════════════════════════
// INDUSTRIES TAXONOMY
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/taxonomy/industries - List all industries (public)
app.get("/industries", async (c) => {
  const rows = await db.select().from(industries).where(eq(industries.isActive, true));
  return c.json({ industries: rows });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER SKILLS (requires auth)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/taxonomy/me/skills - Get current user's skills
app.get("/me/skills", authMiddleware, async (c) => {
  const userId = c.get("userId");
  
  const rows = await db
    .select({
      id: userSkills.id,
      skillId: userSkills.skillId,
      proficiency: userSkills.proficiency,
      yearsExperience: userSkills.yearsExperience,
      priority: userSkills.priority,
      isActive: userSkills.isActive,
      skillName: skills.name,
      skillCategory: skills.category,
    })
    .from(userSkills)
    .innerJoin(skills, eq(userSkills.skillId, skills.id))
    .where(eq(userSkills.userId, userId));
  
  return c.json({ skills: rows });
});

// PUT /api/taxonomy/me/skills - Update current user's skills (bulk replace)
app.put("/me/skills", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    skills: Array<{
      skillId: string;
      proficiency?: string;
      yearsExperience?: number;
      priority?: string;
    }>;
  }>();
  
  // Delete existing skills
  await db.delete(userSkills).where(eq(userSkills.userId, userId));
  
  // Insert new skills
  if (body.skills && body.skills.length > 0) {
    const toInsert = body.skills.map((s) => ({
      userId,
      skillId: s.skillId,
      proficiency: s.proficiency ?? "intermediate",
      yearsExperience: s.yearsExperience ?? null,
      priority: s.priority ?? "secondary",
      isActive: true,
    }));
    await db.insert(userSkills).values(toInsert);
  }
  
  return c.json({ success: true });
});

// POST /api/taxonomy/me/skills - Add a single skill
app.post("/me/skills", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    skillId: string;
    proficiency?: string;
    yearsExperience?: number;
    priority?: string;
  }>();
  
  // Check if already exists
  const existing = await db
    .select()
    .from(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, body.skillId)))
    .limit(1);
  
  if (existing.length > 0) {
    // Update existing
    await db
      .update(userSkills)
      .set({
        proficiency: body.proficiency ?? existing[0].proficiency,
        yearsExperience: body.yearsExperience ?? existing[0].yearsExperience,
        priority: body.priority ?? existing[0].priority,
      })
      .where(eq(userSkills.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(userSkills).values({
      userId,
      skillId: body.skillId,
      proficiency: body.proficiency ?? "intermediate",
      yearsExperience: body.yearsExperience ?? null,
      priority: body.priority ?? "secondary",
      isActive: true,
    });
  }
  
  return c.json({ success: true });
});

// DELETE /api/taxonomy/me/skills/:skillId - Remove a skill
app.delete("/me/skills/:skillId", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const skillId = c.req.param("skillId");
  
  await db
    .delete(userSkills)
    .where(and(eq(userSkills.userId, userId), eq(userSkills.skillId, skillId)));
  
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// USER INDUSTRIES (requires auth)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/taxonomy/me/industries - Get current user's industries
app.get("/me/industries", authMiddleware, async (c) => {
  const userId = c.get("userId");
  
  const rows = await db
    .select({
      id: userIndustries.id,
      industryId: userIndustries.industryId,
      relationshipType: userIndustries.relationshipType,
      industryName: industries.name,
    })
    .from(userIndustries)
    .innerJoin(industries, eq(userIndustries.industryId, industries.id))
    .where(eq(userIndustries.userId, userId));
  
  return c.json({ industries: rows });
});

// PUT /api/taxonomy/me/industries - Update current user's industries (bulk replace)
app.put("/me/industries", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json<{
    industries: Array<{
      industryId: string;
      relationshipType?: string;
    }>;
  }>();
  
  // Delete existing
  await db.delete(userIndustries).where(eq(userIndustries.userId, userId));
  
  // Insert new
  if (body.industries && body.industries.length > 0) {
    const toInsert = body.industries.map((i) => ({
      userId,
      industryId: i.industryId,
      relationshipType: i.relationshipType ?? "interest",
    }));
    await db.insert(userIndustries).values(toInsert);
  }
  
  return c.json({ success: true });
});

// ══════════════════════════════════════════════════════════════════════════════
// ROLES (static list)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/taxonomy/roles - List available user roles
app.get("/roles", async (c) => {
  const roles = [
    { id: "founder", name: "Founder", description: "Building or planning to build a startup" },
    { id: "cofounder", name: "Co-Founder Candidate", description: "Looking to join a founding team" },
    { id: "mentor", name: "Mentor", description: "Experienced professional offering guidance" },
    { id: "advisor", name: "Advisor", description: "Providing strategic advice to startups" },
    { id: "investor", name: "Investor", description: "Angel investor or VC" },
    { id: "operator", name: "Operator", description: "Experienced startup operator" },
  ];
  return c.json({ roles });
});

// ══════════════════════════════════════════════════════════════════════════════
// ADMIN: Manage taxonomies
// ══════════════════════════════════════════════════════════════════════════════

// POST /api/taxonomy/admin/skills - Create a new skill (admin only)
app.post("/admin/skills", authMiddleware, async (c) => {
  // TODO: Add admin role check
  const body = await c.req.json<{
    name: string;
    slug: string;
    category: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }>();
  
  const [skill] = await db
    .insert(skills)
    .values({
      name: body.name,
      slug: body.slug,
      category: body.category,
      description: body.description ?? null,
      parentId: body.parentId ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: true,
    })
    .returning();
  
  return c.json({ skill });
});

// POST /api/taxonomy/admin/industries - Create a new industry (admin only)
app.post("/admin/industries", authMiddleware, async (c) => {
  // TODO: Add admin role check
  const body = await c.req.json<{
    name: string;
    slug: string;
    description?: string;
    parentId?: string;
    sortOrder?: number;
  }>();
  
  const [industry] = await db
    .insert(industries)
    .values({
      name: body.name,
      slug: body.slug,
      description: body.description ?? null,
      parentId: body.parentId ?? null,
      sortOrder: body.sortOrder ?? 0,
      isActive: true,
    })
    .returning();
  
  return c.json({ industry });
});

// POST /api/taxonomy/admin/seed - Seed default skills and industries
app.post("/admin/seed", authMiddleware, async (c) => {
  // Default skills
  const defaultSkills = [
    // Technical
    { name: "Full-Stack Development", slug: "fullstack", category: "technical" },
    { name: "Frontend Development", slug: "frontend", category: "technical" },
    { name: "Backend Development", slug: "backend", category: "technical" },
    { name: "Mobile Development", slug: "mobile", category: "technical" },
    { name: "DevOps / Infrastructure", slug: "devops", category: "technical" },
    { name: "Machine Learning / AI", slug: "ml-ai", category: "technical" },
    { name: "Data Science", slug: "data-science", category: "technical" },
    { name: "Blockchain / Web3", slug: "blockchain", category: "technical" },
    { name: "Cybersecurity", slug: "cybersecurity", category: "technical" },
    // Business
    { name: "Business Strategy", slug: "strategy", category: "business" },
    { name: "Financial Modeling", slug: "financial-modeling", category: "business" },
    { name: "Fundraising", slug: "fundraising", category: "business" },
    { name: "Sales", slug: "sales", category: "business" },
    { name: "Business Development", slug: "bizdev", category: "business" },
    { name: "Operations", slug: "operations", category: "business" },
    // Design
    { name: "UI Design", slug: "ui-design", category: "design" },
    { name: "UX Design", slug: "ux-design", category: "design" },
    { name: "Product Design", slug: "product-design", category: "design" },
    { name: "Brand Design", slug: "brand-design", category: "design" },
    // Marketing
    { name: "Growth Marketing", slug: "growth", category: "marketing" },
    { name: "Content Marketing", slug: "content", category: "marketing" },
    { name: "SEO / SEM", slug: "seo-sem", category: "marketing" },
    { name: "Social Media", slug: "social-media", category: "marketing" },
    { name: "Product Marketing", slug: "product-marketing", category: "marketing" },
    // Leadership
    { name: "Team Building", slug: "team-building", category: "leadership" },
    { name: "Product Management", slug: "product-management", category: "leadership" },
    { name: "Project Management", slug: "project-management", category: "leadership" },
    { name: "People Management", slug: "people-management", category: "leadership" },
  ];
  
  // Default industries
  const defaultIndustries = [
    { name: "SaaS / Software", slug: "saas" },
    { name: "FinTech", slug: "fintech" },
    { name: "HealthTech", slug: "healthtech" },
    { name: "EdTech", slug: "edtech" },
    { name: "E-Commerce", slug: "ecommerce" },
    { name: "Marketplace", slug: "marketplace" },
    { name: "AI / Machine Learning", slug: "ai-ml" },
    { name: "Climate / CleanTech", slug: "cleantech" },
    { name: "PropTech / Real Estate", slug: "proptech" },
    { name: "FoodTech", slug: "foodtech" },
    { name: "Logistics / Supply Chain", slug: "logistics" },
    { name: "Media / Entertainment", slug: "media" },
    { name: "Gaming", slug: "gaming" },
    { name: "Social / Community", slug: "social" },
    { name: "Developer Tools", slug: "devtools" },
    { name: "Cybersecurity", slug: "cybersecurity" },
    { name: "HR / Recruiting", slug: "hr" },
    { name: "Legal Tech", slug: "legaltech" },
    { name: "InsurTech", slug: "insurtech" },
    { name: "Travel / Hospitality", slug: "travel" },
  ];
  
  // Insert skills (ignore conflicts)
  for (const skill of defaultSkills) {
    try {
      await db.insert(skills).values({ ...skill, isActive: true });
    } catch { /* ignore duplicates */ }
  }
  
  // Insert industries (ignore conflicts)
  for (const industry of defaultIndustries) {
    try {
      await db.insert(industries).values({ ...industry, isActive: true });
    } catch { /* ignore duplicates */ }
  }
  
  return c.json({ success: true, skillsCount: defaultSkills.length, industriesCount: defaultIndustries.length });
});

export default app;
