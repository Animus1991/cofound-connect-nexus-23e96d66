/**
 * Shared Hono environment type.
 * Declares custom context variables available after auth middleware.
 */
export type AppEnv = {
  Variables: {
    userId: string;
  };
};
