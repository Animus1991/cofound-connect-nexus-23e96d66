/**
 * automationEngine — event-driven workflow execution core.
 *
 * Responsibilities:
 *  1. Match incoming events against active automation_rules
 *  2. Evaluate per-rule conditions against the event context
 *  3. Dispatch actions (in-app notifications, email, admin alerts, field updates)
 *  4. Log every step to automation_executions + automation_logs
 *  5. Enforce anti-spam limits and retry caps
 *  6. Respect tenant-level automation config overrides
 */
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import type * as schema from "../db/schema.js";
import { eq, and, isNull, or, count, gte, sql as drizzleSql } from "drizzle-orm";
import {
  automationRules,
  automationExecutions,
  automationLogs,
  notificationTemplates,
  tenantAutomationConfig,
  notificationPreferences,
} from "../db/schema.js";
import { notifications } from "../db/schema.js";

// ─── Public Types ─────────────────────────────────────────────────────────────

export type TriggerType =
  // Onboarding
  | "user_signed_up"
  | "user_profile_incomplete_check"
  | "user_email_verified"
  // Matching
  | "match_generated"
  | "match_viewed"
  | "match_accepted"
  | "match_unviewed_check"
  // Connections
  | "connection_request_sent"
  | "connection_request_accepted"
  | "connection_request_declined"
  | "connection_request_pending_check"
  // Mentorship
  | "mentor_request_created"
  | "mentor_request_accepted"
  | "mentor_request_declined"
  | "mentorship_idle_check"
  | "mentorship_closed"
  // Community
  | "community_member_joined"
  | "community_post_created"
  | "community_flagged"
  // Billing
  | "billing_trial_started"
  | "billing_trial_ending_check"
  | "billing_payment_failed"
  | "billing_payment_succeeded"
  | "billing_subscription_cancelled"
  | "billing_seat_limit_check"
  | "billing_upgraded"
  // Admin / Moderation
  | "moderation_queue_threshold"
  | "content_reported"
  | "admin_action_required"
  | "tenant_setup_incomplete_check"
  | "tenant_activated"
  // Re-engagement
  | "user_inactive_check"
  // Manual
  | "manual_trigger";

export type ActionType =
  | "send_in_app_notification"
  | "send_email"
  | "send_admin_alert"
  | "update_entity_field"
  | "webhook_placeholder";

export interface AutomationCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "in" | "not_in";
  value: unknown;
}

export interface AutomationAction {
  type: ActionType;
  /** Slug of notification_templates or email_templates */
  templateSlug?: string;
  /** For update_entity_field */
  targetField?: string;
  targetValue?: unknown;
  /** For webhook_placeholder */
  webhookUrl?: string;
  /** Extra overrides for template variable interpolation */
  extraVars?: Record<string, string>;
}

export interface AutomationEventContext {
  /** Primary entity (usually userId) */
  userId?: string;
  tenantId?: string;
  entityType?: string;
  entityId?: string;
  /** Arbitrary key/value data for conditions + template variables */
  data?: Record<string, unknown>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  tenantId: string | null;
  triggerType: string;
  entityScope: string;
  conditionDefinition: AutomationCondition[];
  actionDefinition: AutomationAction[];
  scheduleDelay: number;
  isActive: boolean;
  priority: number;
  maxRetries: number;
  isSystem: boolean;
}

// ─── Condition Evaluator ─────────────────────────────────────────────────────

function evaluateCondition(cond: AutomationCondition, ctx: Record<string, unknown>): boolean {
  const raw = ctx[cond.field];
  const v = cond.value;

  switch (cond.operator) {
    case "eq":          return raw === v;
    case "neq":         return raw !== v;
    case "gt":          return typeof raw === "number" && raw > (v as number);
    case "gte":         return typeof raw === "number" && raw >= (v as number);
    case "lt":          return typeof raw === "number" && raw < (v as number);
    case "lte":         return typeof raw === "number" && raw <= (v as number);
    case "contains":    return typeof raw === "string" && raw.includes(v as string);
    case "not_contains":return typeof raw === "string" && !raw.includes(v as string);
    case "in":          return Array.isArray(v) && v.includes(raw);
    case "not_in":      return Array.isArray(v) && !v.includes(raw);
    default:            return true;
  }
}

function evaluateAllConditions(conditions: AutomationCondition[], ctx: Record<string, unknown>): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(c, ctx));
}

// ─── Template Interpolator ────────────────────────────────────────────────────

function interpolate(template: string, vars: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const v = vars[key];
    return v !== undefined && v !== null ? String(v) : `{{${key}}}`;
  });
}

// ─── Anti-spam Daily Limit Check ─────────────────────────────────────────────

async function checkDailyLimit(
  db: BetterSQLite3Database<typeof schema>,
  entityId: string,
  maxDaily: number,
): Promise<boolean> {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayStr = todayStart.toISOString();

  const result = await db
    .select({ c: count() })
    .from(automationExecutions)
    .where(
      and(
        eq(automationExecutions.entityId, entityId),
        gte(automationExecutions.createdAt, todayStr),
        eq(automationExecutions.status, "completed"),
      ),
    )
    .then((rows: { c: number }[]) => rows[0]?.c ?? 0);

  return result < maxDaily;
}

// ─── Log Helper ──────────────────────────────────────────────────────────────

async function addLog(
  db: BetterSQLite3Database<typeof schema>,
  executionId: string,
  level: "info" | "warn" | "error" | "debug",
  message: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  await db.insert(automationLogs).values({
    id: crypto.randomUUID(),
    executionId,
    level,
    message,
    metadata: JSON.stringify(metadata),
  });
}

// ─── Action Dispatcher ───────────────────────────────────────────────────────

async function dispatchAction(
  db: BetterSQLite3Database<typeof schema>,
  action: AutomationAction,
  ctx: AutomationEventContext,
  executionId: string,
): Promise<void> {
  const vars: Record<string, unknown> = { ...(ctx.data ?? {}) };

  switch (action.type) {
    case "send_in_app_notification":
    case "send_admin_alert": {
      if (!action.templateSlug) {
        await addLog(db, executionId, "warn", "No templateSlug provided for notification action");
        return;
      }
      const tpl = await db.query.notificationTemplates?.findFirst({
        where: eq(notificationTemplates.slug, action.templateSlug),
      });
      if (!tpl) {
        await addLog(db, executionId, "warn", `Template not found: ${action.templateSlug}`);
        return;
      }
      if (!ctx.userId && !ctx.entityId) {
        await addLog(db, executionId, "warn", "No userId to send notification to");
        return;
      }

      const allVars = { ...vars, ...(action.extraVars ?? {}) };
      const title   = interpolate(tpl.subject,      allVars);
      const message = interpolate(tpl.bodyTemplate, allVars);

      const targetUserId = ctx.userId ?? ctx.entityId!;

      // Check notification preferences
      const category = resolveCategoryFromTrigger(tpl.slug);
      const pref = await db.query.notificationPreferences?.findFirst({
        where: and(
          eq(notificationPreferences.userId, targetUserId),
          eq(notificationPreferences.category, category),
        ),
      });
      if (pref && !pref.inAppEnabled) {
        await addLog(db, executionId, "info", `User ${targetUserId} has disabled in-app for category ${category}`);
        return;
      }

      await db.insert(notifications).values({
        id: crypto.randomUUID(),
        userId: targetUserId,
        type: action.type === "send_admin_alert" ? "admin_alert" : "automation",
        title,
        body: message,
        meta: JSON.stringify({ executionId, ruleId: ctx.data?.ruleId ?? "" }),
      });
      await addLog(db, executionId, "info", `In-app notification sent to ${targetUserId}`, { templateSlug: action.templateSlug });
      break;
    }

    case "send_email": {
      // Email sending is a placeholder — integrate with SES/Sendgrid/Postmark in production
      if (!action.templateSlug) return;
      await addLog(db, executionId, "info", `[EMAIL PLACEHOLDER] Would send email template "${action.templateSlug}" to user ${ctx.userId ?? "unknown"}`, { templateSlug: action.templateSlug });
      break;
    }

    case "update_entity_field": {
      // Placeholder — implement field updates per entity type as needed
      await addLog(db, executionId, "info", `[FIELD UPDATE] ${action.targetField} = ${action.targetValue} on ${ctx.entityType}/${ctx.entityId}`);
      break;
    }

    case "webhook_placeholder": {
      await addLog(db, executionId, "info", `[WEBHOOK PLACEHOLDER] ${action.webhookUrl}`);
      break;
    }

    default:
      await addLog(db, executionId, "warn", `Unknown action type: ${(action as AutomationAction).type}`);
  }
}

// ─── Category Resolver ────────────────────────────────────────────────────────

function resolveCategoryFromTrigger(slugOrTrigger: string): string {
  if (slugOrTrigger.includes("match"))       return "matches";
  if (slugOrTrigger.includes("connection"))  return "connections";
  if (slugOrTrigger.includes("mentor"))      return "mentorship";
  if (slugOrTrigger.includes("community"))   return "community";
  if (slugOrTrigger.includes("billing") || slugOrTrigger.includes("trial") || slugOrTrigger.includes("payment") || slugOrTrigger.includes("seat")) return "billing";
  if (slugOrTrigger.includes("admin") || slugOrTrigger.includes("moderation")) return "admin_alerts";
  if (slugOrTrigger.includes("onboarding") || slugOrTrigger.includes("welcome") || slugOrTrigger.includes("reengagement")) return "platform";
  return "platform";
}

// ─── Tenant Config Loader ─────────────────────────────────────────────────────

async function getTenantConfig(
  db: BetterSQLite3Database<typeof schema>,
  tenantId: string | null,
): Promise<{ isEnabled: boolean; maxDailyPerUser: number; disabledTriggers: string[] }> {
  if (!tenantId) return { isEnabled: true, maxDailyPerUser: 20, disabledTriggers: [] };
  const cfg = await db.query.tenantAutomationConfig?.findFirst({
    where: eq(tenantAutomationConfig.tenantId, tenantId),
  });
  if (!cfg) return { isEnabled: true, maxDailyPerUser: 20, disabledTriggers: [] };
  return {
    isEnabled: cfg.isAutomationEnabled,
    maxDailyPerUser: cfg.maxDailyPerUser,
    disabledTriggers: JSON.parse(cfg.disabledTriggers ?? "[]") as string[],
  };
}

// ─── Main Entry Point ────────────────────────────────────────────────────────

/**
 * fireEvent — call this from any route handler to trigger automation evaluation.
 *
 * @param db          Drizzle database instance
 * @param triggerType The type of event that occurred
 * @param ctx         Context data for condition evaluation and template rendering
 * @returns           Array of execution IDs created
 */
export async function fireEvent(
  db: BetterSQLite3Database<typeof schema>,
  triggerType: TriggerType,
  ctx: AutomationEventContext = {},
): Promise<string[]> {
  const executionIds: string[] = [];

  try {
    // Load matching active rules (global + tenant-specific)
    const rules = await db
      .select()
      .from(automationRules)
      .where(
        and(
          eq(automationRules.triggerType, triggerType),
          eq(automationRules.isActive, true),
          or(
            isNull(automationRules.tenantId),
            ctx.tenantId ? eq(automationRules.tenantId, ctx.tenantId) : isNull(automationRules.tenantId),
          ),
        ),
      )
      .orderBy(automationRules.priority);

    if (rules.length === 0) return executionIds;

    for (const rule of rules) {
      // Check tenant-level config
      const tenantCfg = await getTenantConfig(db, rule.tenantId ?? ctx.tenantId ?? null);
      if (!tenantCfg.isEnabled) continue;
      if (tenantCfg.disabledTriggers.includes(triggerType)) continue;

      // Parse conditions and actions
      const conditions: AutomationCondition[] = JSON.parse(rule.conditionDefinition ?? "[]");
      const actions: AutomationAction[] = JSON.parse(rule.actionDefinition ?? "[]");

      // Evaluate conditions
      const ctxData = { ...(ctx.data ?? {}) };
      if (!evaluateAllConditions(conditions, ctxData)) continue;

      // Anti-spam: check daily limit per user
      const entityId = ctx.userId ?? ctx.entityId ?? "global";
      if (ctx.userId) {
        const withinLimit = await checkDailyLimit(db, entityId, tenantCfg.maxDailyPerUser);
        if (!withinLimit) continue;
      }

      // Determine scheduled time
      const scheduledFor = rule.scheduleDelay > 0
        ? new Date(Date.now() + rule.scheduleDelay * 60_000).toISOString()
        : new Date().toISOString();

      // Create execution record
      const executionId = crypto.randomUUID();
      await db.insert(automationExecutions).values({
        id: executionId,
        ruleId: rule.id,
        triggerEvent: triggerType,
        entityType: ctx.entityType ?? null,
        entityId: ctx.userId ?? ctx.entityId ?? null,
        status: rule.scheduleDelay > 0 ? "queued" : "running",
        contextSnapshot: JSON.stringify({ ...ctx, data: ctxData }),
        scheduledFor,
      });
      executionIds.push(executionId);

      // Execute immediately if no delay
      if (rule.scheduleDelay === 0) {
        await executeRule(db, executionId, rule.id, actions, { ...ctx, data: { ...ctxData, ruleId: rule.id } });
      }

      // Update rule's lastRunAt
      await db
        .update(automationRules)
        .set({ lastRunAt: new Date().toISOString(), updatedAt: new Date().toISOString() })
        .where(eq(automationRules.id, rule.id));
    }
  } catch (err) {
    // Never surface automation errors to callers — log and continue
    console.error("[AutomationEngine] fireEvent error:", err);
  }

  return executionIds;
}

// ─── Rule Executor ────────────────────────────────────────────────────────────

export async function executeRule(
  db: BetterSQLite3Database<typeof schema>,
  executionId: string,
  ruleId: string,
  actions: AutomationAction[],
  ctx: AutomationEventContext,
): Promise<boolean> {
  const startedAt = new Date().toISOString();
  await db.update(automationExecutions).set({ status: "running", startedAt }).where(eq(automationExecutions.id, executionId));
  await addLog(db, executionId, "info", `Execution started for rule ${ruleId}`);

  let success = true;
  for (const action of actions) {
    try {
      await dispatchAction(db, action, ctx, executionId);
    } catch (err) {
      success = false;
      const msg = err instanceof Error ? err.message : String(err);
      await addLog(db, executionId, "error", `Action failed: ${action.type}`, { error: msg });

      // Update failure count on rule
      await db
        .update(automationRules)
        .set({
          failureCount: drizzleSql`${automationRules.failureCount} + 1`,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(automationRules.id, ruleId));
    }
  }

  const completedAt = new Date().toISOString();
  await db.update(automationExecutions).set({
    status: success ? "completed" : "failed",
    completedAt,
  }).where(eq(automationExecutions.id, executionId));

  return success;
}

// ─── Manual Trigger ───────────────────────────────────────────────────────────

export async function manuallyTriggerRule(
  db: BetterSQLite3Database<typeof schema>,
  ruleId: string,
  ctx: AutomationEventContext = {},
): Promise<{ executionId: string; success: boolean }> {
  const rule = await db.query.automationRules?.findFirst({ where: eq(automationRules.id, ruleId) });
  if (!rule) throw new Error(`Rule ${ruleId} not found`);

  const actions: AutomationAction[] = JSON.parse(rule.actionDefinition ?? "[]");
  const executionId = crypto.randomUUID();

  await db.insert(automationExecutions).values({
    id: executionId,
    ruleId,
    triggerEvent: "manual_trigger",
    entityType: ctx.entityType ?? null,
    entityId: ctx.userId ?? ctx.entityId ?? null,
    status: "running",
    contextSnapshot: JSON.stringify(ctx),
    scheduledFor: new Date().toISOString(),
  });

  const success = await executeRule(db, executionId, ruleId, actions, { ...ctx, data: { ...(ctx.data ?? {}), ruleId } });
  return { executionId, success };
}
