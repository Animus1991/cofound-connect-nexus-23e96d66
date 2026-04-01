/**
 * Fire-and-forget activity log writer.
 * Import and call logActivity() from any route to record user actions.
 * Never throws — errors are swallowed so the caller is never affected.
 */

import { db } from "../db/index.js";
import { activityLog } from "../db/schema.js";
import { logger } from "./logger.js";

type Action =
  | "profile_updated"
  | "connection_made"
  | "intro_sent"
  | "opportunity_posted"
  | "application_sent"
  | "message_sent"
  | "startup_created"
  | "startup_updated"
  | "milestone_created"
  | "community_created"
  | "community_joined"
  | "post_created"
  | "mentorship_requested"
  | "match_accepted";

export function logActivity(
  userId: string,
  action: Action,
  context: Record<string, unknown> = {}
): void {
  try {
    db.insert(activityLog)
      .values({ userId, action, context: JSON.stringify(context) })
      .run();
  } catch (err) {
    logger.warn({ err, userId, action }, "logActivity failed (non-fatal)");
  }
}
