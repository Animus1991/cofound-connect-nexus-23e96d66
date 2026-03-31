import { z } from "zod";

// ── Login ──────────────────────────────────────────────────
export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required").min(8, "Password must be at least 8 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

// ── Signup ──────────────────────────────────────────────────
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

export const signupSchema = z.object({
  name: z.string().min(1, "Full name is required").min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: passwordSchema,
  roles: z.array(z.string()).min(1, "Please select at least one role"),
  acceptTerms: z.boolean().refine((val) => val === true, "You must accept the terms of service"),
});

export type SignupFormValues = z.infer<typeof signupSchema>;

// ── Onboarding Step 1 (Profile) ──────────────────────────────
export const onboardingStep1Schema = z.object({
  name: z.string().min(1, "Full name is required").min(2, "Name must be at least 2 characters"),
  headline: z.string().optional(),
  location: z.string().optional(),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  skills: z.array(z.string()),
});

// ── Onboarding Step 2 (Preferences) ──────────────────────────
export const onboardingStep2Schema = z.object({
  interests: z.array(z.string()).min(1, "Please select at least one industry"),
  stage: z.string().optional(),
  commitment: z.string().optional(),
});

export type OnboardingStep1Values = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Values = z.infer<typeof onboardingStep2Schema>;

// ── Forgot Password ───────────────────────────────────────────
export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

// ── Reset Password ───────────────────────────────────────────
export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ── Profile Edit ─────────────────────────────────────────────
export const profileEditSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  headline: z.string().max(200).optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  availability: z.string().max(50).optional(),
  stage: z.string().max(50).optional(),
  commitment: z.string().max(50).optional(),
  compensation: z.string().max(100).optional(),
  lookingFor: z.string().max(100).optional(),
  skills: z.array(z.string()),
  interests: z.array(z.string()),
  linkedin: z.string().max(200).optional(),
  github: z.string().max(200).optional(),
  website: z.string().max(200).optional(),
  email: z.string().email().optional(),
});

export type ProfileEditValues = z.infer<typeof profileEditSchema>;

// ── Settings Account ──────────────────────────────────────────
export const settingsAccountSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  language: z.enum(["en", "el", "es", "fr"]),
  timezone: z.string().min(1),
});
