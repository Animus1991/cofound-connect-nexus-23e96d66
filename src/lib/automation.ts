/**
 * automation.ts — typed API client for the automation framework.
 * Covers rules, executions, logs, templates, stats, notification preferences,
 * and tenant automation config.
 */

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TriggerType =
  | "user_signed_up" | "user_profile_incomplete_check" | "user_email_verified"
  | "match_generated" | "match_viewed" | "match_accepted" | "match_unviewed_check"
  | "connection_request_sent" | "connection_request_accepted" | "connection_request_declined"
  | "connection_request_pending_check"
  | "mentor_request_created" | "mentor_request_accepted" | "mentor_request_declined"
  | "mentorship_idle_check" | "mentorship_closed"
  | "community_member_joined" | "community_post_created" | "community_flagged"
  | "billing_trial_started" | "billing_trial_ending_check" | "billing_payment_failed"
  | "billing_payment_succeeded" | "billing_subscription_cancelled"
  | "billing_seat_limit_check" | "billing_upgraded"
  | "moderation_queue_threshold" | "content_reported" | "admin_action_required"
  | "tenant_setup_incomplete_check" | "tenant_activated"
  | "user_inactive_check" | "manual_trigger";

export type ActionType =
  | "send_in_app_notification" | "send_email" | "send_admin_alert"
  | "update_entity_field" | "webhook_placeholder";

export type ExecutionStatus = "queued" | "running" | "completed" | "failed" | "skipped" | "cancelled";

export interface AutomationCondition {
  field:    string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "in" | "not_in";
  value:    unknown;
}

export interface AutomationAction {
  type:          ActionType;
  templateSlug?: string;
  targetField?:  string;
  targetValue?:  unknown;
  webhookUrl?:   string;
  extraVars?:    Record<string, string>;
}

export interface AutomationRule {
  id:                  string;
  name:                string;
  description:         string | null;
  tenantId:            string | null;
  triggerType:         TriggerType | string;
  entityScope:         string;
  conditionDefinition: string; // JSON string
  actionDefinition:    string; // JSON string
  scheduleDelay:       number;
  isActive:            boolean;
  priority:            number;
  failureCount:        number;
  maxRetries:          number;
  isSystem:            boolean;
  lastRunAt:           string | null;
  nextRunAt:           string | null;
  createdAt:           string;
  updatedAt:           string;
}

export interface AutomationExecution {
  id:              string;
  ruleId:          string;
  triggerEvent:    string;
  entityType:      string | null;
  entityId:        string | null;
  status:          ExecutionStatus;
  retryCount:      number;
  errorMessage:    string | null;
  startedAt:       string | null;
  completedAt:     string | null;
  scheduledFor:    string | null;
  createdAt:       string;
}

export interface AutomationLog {
  id:          string;
  executionId: string;
  level:       "info" | "warn" | "error" | "debug";
  message:     string;
  metadata:    string; // JSON
  createdAt:   string;
}

export interface NotificationTemplate {
  id:              string;
  name:            string;
  slug:            string;
  channel:         "in_app" | "email" | "push" | "admin_alert";
  subject:         string;
  bodyTemplate:    string;
  variablesSchema: string; // JSON string[]
  isActive:        boolean;
  createdAt:       string;
  updatedAt:       string;
}

export interface EmailTemplate {
  id:              string;
  name:            string;
  slug:            string;
  subjectTemplate: string;
  htmlTemplate:    string;
  textTemplate:    string;
  variablesSchema: string;
  fromName:        string | null;
  fromEmail:       string | null;
  isActive:        boolean;
  createdAt:       string;
  updatedAt:       string;
}

export interface AutomationStats {
  rules: { total: number; active: number; inactive: number };
  execs: { total: number; completed: number; failed: number; queued: number; last7d: number };
}

export interface NotificationPreference {
  id:                   string | null;
  userId:               string;
  category:             string;
  inAppEnabled:         boolean;
  emailEnabled:         boolean;
  pushEnabled:          boolean;
  emailDigestFrequency: "realtime" | "daily" | "weekly" | "none";
}

export interface TenantAutomationConfig {
  id:                      string;
  tenantId:                string;
  isAutomationEnabled:     boolean;
  notificationSensitivity: "all" | "important_only" | "none";
  emailDigestFrequency:    "realtime" | "daily" | "weekly" | "none";
  disabledTriggers:        string; // JSON string[]
  maxDailyPerUser:         number;
  updatedAt:               string;
}

// ─── HTTP Helper ──────────────────────────────────────────────────────────────

async function autoApi<T>(
  method: string,
  path: string,
  token: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API_BASE}/api/automation${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization:  `Bearer ${token}`,
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" })) as { error?: string };
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Rules ────────────────────────────────────────────────────────────────────

export async function listRules(
  token: string,
  params?: { search?: string; triggerType?: string; isActive?: boolean; tenantId?: string; limit?: number; offset?: number },
): Promise<{ rules: AutomationRule[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.search)      q.set("search",      params.search);
  if (params?.triggerType) q.set("triggerType",  params.triggerType);
  if (params?.tenantId)    q.set("tenantId",     params.tenantId);
  if (params?.isActive !== undefined) q.set("isActive", String(params.isActive));
  if (params?.limit)       q.set("limit",        String(params.limit));
  if (params?.offset)      q.set("offset",       String(params.offset));
  const qs = q.toString();
  return autoApi(`GET`, `/rules${qs ? `?${qs}` : ""}`, token);
}

export async function createRule(
  token: string,
  data: Partial<AutomationRule> & Pick<AutomationRule, "name" | "triggerType">,
): Promise<{ rule: AutomationRule }> {
  return autoApi("POST", "/rules", token, data);
}

export async function updateRule(
  token: string,
  id: string,
  data: Partial<AutomationRule>,
): Promise<{ rule: AutomationRule }> {
  return autoApi("PUT", `/rules/${id}`, token, data);
}

export async function deleteRule(token: string, id: string): Promise<{ ok: boolean }> {
  return autoApi("DELETE", `/rules/${id}`, token);
}

export async function pauseRule(token: string, id: string): Promise<{ ok: boolean }> {
  return autoApi("POST", `/rules/${id}/pause`, token);
}

export async function resumeRule(token: string, id: string): Promise<{ ok: boolean }> {
  return autoApi("POST", `/rules/${id}/resume`, token);
}

export async function manuallyTrigger(
  token: string,
  id: string,
  ctx?: { userId?: string; tenantId?: string; data?: Record<string, unknown> },
): Promise<{ executionId: string; success: boolean }> {
  return autoApi("POST", `/rules/${id}/trigger`, token, ctx ?? {});
}

// ─── Executions ───────────────────────────────────────────────────────────────

export async function listExecutions(
  token: string,
  params?: { ruleId?: string; status?: ExecutionStatus; entityId?: string; limit?: number; offset?: number },
): Promise<{ executions: AutomationExecution[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.ruleId)   q.set("ruleId",   params.ruleId);
  if (params?.status)   q.set("status",   params.status);
  if (params?.entityId) q.set("entityId", params.entityId);
  if (params?.limit)    q.set("limit",    String(params.limit));
  if (params?.offset)   q.set("offset",   String(params.offset));
  const qs = q.toString();
  return autoApi(`GET`, `/executions${qs ? `?${qs}` : ""}`, token);
}

export async function getExecutionLogs(
  token: string,
  executionId: string,
): Promise<{ logs: AutomationLog[] }> {
  return autoApi("GET", `/executions/${executionId}/logs`, token);
}

// ─── Templates ────────────────────────────────────────────────────────────────

export async function listNotificationTemplates(token: string): Promise<{ templates: NotificationTemplate[] }> {
  return autoApi("GET", "/templates/notifications", token);
}

export async function createNotificationTemplate(
  token: string,
  data: Partial<NotificationTemplate>,
): Promise<{ template: NotificationTemplate }> {
  return autoApi("POST", "/templates/notifications", token, data);
}

export async function updateNotificationTemplate(
  token: string,
  id: string,
  data: Partial<NotificationTemplate>,
): Promise<{ template: NotificationTemplate }> {
  return autoApi("PUT", `/templates/notifications/${id}`, token, data);
}

export async function deleteNotificationTemplate(token: string, id: string): Promise<{ ok: boolean }> {
  return autoApi("DELETE", `/templates/notifications/${id}`, token);
}

export async function listEmailTemplates(token: string): Promise<{ templates: EmailTemplate[] }> {
  return autoApi("GET", "/templates/emails", token);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getAutomationStats(token: string): Promise<AutomationStats> {
  return autoApi("GET", "/stats", token);
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export async function getNotificationPreferences(token: string): Promise<{ preferences: NotificationPreference[] }> {
  return autoApi("GET", "/notification-preferences", token);
}

export async function saveNotificationPreferences(
  token: string,
  preferences: Array<Omit<NotificationPreference, "id" | "userId">>,
): Promise<{ ok: boolean }> {
  return autoApi("PUT", "/notification-preferences", token, { preferences });
}

// ─── Tenant Config ────────────────────────────────────────────────────────────

export async function getTenantAutomationConfig(
  token: string,
  tenantId: string,
): Promise<{ config: TenantAutomationConfig | null }> {
  return autoApi("GET", `/tenant-config/${tenantId}`, token);
}

export async function saveTenantAutomationConfig(
  token: string,
  tenantId: string,
  data: Partial<TenantAutomationConfig>,
): Promise<{ config: TenantAutomationConfig }> {
  return autoApi("PUT", `/tenant-config/${tenantId}`, token, data);
}

// ─── Formatters / Helpers ─────────────────────────────────────────────────────

export const TRIGGER_LABELS: Record<string, string> = {
  user_signed_up:                  "User signed up",
  user_profile_incomplete_check:   "Profile incomplete (check)",
  user_email_verified:             "Email verified",
  match_generated:                 "Match generated",
  match_viewed:                    "Match viewed",
  match_accepted:                  "Match accepted",
  match_unviewed_check:            "Unviewed matches (check)",
  connection_request_sent:         "Connection request sent",
  connection_request_accepted:     "Connection request accepted",
  connection_request_declined:     "Connection request declined",
  connection_request_pending_check:"Pending connection (check)",
  mentor_request_created:          "Mentor request created",
  mentor_request_accepted:         "Mentor request accepted",
  mentor_request_declined:         "Mentor request declined",
  mentorship_idle_check:           "Mentorship idle (check)",
  mentorship_closed:               "Mentorship closed",
  community_member_joined:         "Community member joined",
  community_post_created:          "Community post created",
  community_flagged:               "Community flagged",
  billing_trial_started:           "Trial started",
  billing_trial_ending_check:      "Trial ending (check)",
  billing_payment_failed:          "Payment failed",
  billing_payment_succeeded:       "Payment succeeded",
  billing_subscription_cancelled:  "Subscription cancelled",
  billing_seat_limit_check:        "Seat limit (check)",
  billing_upgraded:                "Plan upgraded",
  moderation_queue_threshold:      "Moderation queue threshold",
  content_reported:                "Content reported",
  admin_action_required:           "Admin action required",
  tenant_setup_incomplete_check:   "Tenant setup incomplete (check)",
  tenant_activated:                "Tenant activated",
  user_inactive_check:             "User inactive (check)",
  manual_trigger:                  "Manual trigger",
};

export const TRIGGER_CATEGORIES: Record<string, string[]> = {
  "Onboarding":   ["user_signed_up","user_profile_incomplete_check","user_email_verified"],
  "Matching":     ["match_generated","match_viewed","match_accepted","match_unviewed_check"],
  "Connections":  ["connection_request_sent","connection_request_accepted","connection_request_declined","connection_request_pending_check"],
  "Mentorship":   ["mentor_request_created","mentor_request_accepted","mentor_request_declined","mentorship_idle_check","mentorship_closed"],
  "Community":    ["community_member_joined","community_post_created","community_flagged"],
  "Billing":      ["billing_trial_started","billing_trial_ending_check","billing_payment_failed","billing_payment_succeeded","billing_subscription_cancelled","billing_seat_limit_check","billing_upgraded"],
  "Admin":        ["moderation_queue_threshold","content_reported","admin_action_required","tenant_setup_incomplete_check","tenant_activated"],
  "Re-engagement":["user_inactive_check"],
  "Manual":       ["manual_trigger"],
};

export const STATUS_COLORS: Record<string, string> = {
  queued:    "text-amber-500   bg-amber-500/10   border-amber-500/20",
  running:   "text-blue-500    bg-blue-500/10    border-blue-500/20",
  completed: "text-green-600   bg-green-500/10   border-green-500/20",
  failed:    "text-destructive bg-destructive/10 border-destructive/20",
  skipped:   "text-muted-foreground bg-secondary border-border",
  cancelled: "text-muted-foreground bg-secondary border-border",
};

export const CATEGORY_LABELS: Record<string, string> = {
  matches:     "Matches",
  connections: "Connections",
  mentorship:  "Mentorship",
  community:   "Community",
  billing:     "Billing",
  admin_alerts:"Admin Alerts",
  platform:    "Platform",
  digest:      "Digest",
};
