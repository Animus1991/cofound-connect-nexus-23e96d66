import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Rocket, Lock, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.svg";
import { resetPasswordSchema, type ResetPasswordFormValues } from "@/lib/validations";
import { api } from "@/lib/api";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const clearRootError = () => form.clearErrors("root");

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) return;
    setIsSubmitting(true);
    try {
      await api.auth.resetPassword(token, data.password);
      setSubmitted(true);
    } catch (err) {
      const msg = (err as { error?: string })?.error ?? "Something went wrong. Please try again.";
      form.setError("root", { message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <h1 className="font-display text-2xl font-bold text-foreground">Invalid reset link</h1>
          <p className="mt-2 text-muted-foreground">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <Link to="/forgot-password">
            <Button variant="hero" className="mt-6 w-full gap-2" size="lg">
              Request new link
            </Button>
          </Link>
          <p className="mt-4 text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex w-full flex-col justify-center px-6 sm:px-8 lg:w-1/2 lg:px-20 relative z-10">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-10 lg:hidden"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-background/90 lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm relative z-10"
        >
          <Link to="/" className="mb-10 flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary transition-transform duration-300 group-hover:scale-110">
              <Rocket className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              CoFounder Connect
            </span>
          </Link>

          {submitted ? (
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Password reset
              </h1>
              <p className="text-muted-foreground">
                Your password has been updated. You can now log in with your new password.
              </p>
              <Link to="/login">
                <Button variant="hero" className="w-full gap-2" size="lg">
                  <ArrowLeft className="h-4 w-4" /> Back to login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Set new password
              </h1>
              <p className="mt-2 text-muted-foreground">
                Enter your new password below. Use at least 8 characters with uppercase, lowercase, and a number.
              </p>

              <Form {...form}>
                <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="••••••••"
                              type="password"
                              autoComplete="new-password"
                              className="pl-10"
                              disabled={isSubmitting}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                clearRootError();
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm password</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="••••••••"
                              type="password"
                              autoComplete="new-password"
                              className="pl-10"
                              disabled={isSubmitting}
                              {...field}
                              onChange={(e) => {
                                field.onChange(e);
                                clearRootError();
                              }}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.formState.errors.root && (
                    <p className="text-sm font-medium text-destructive">
                      {form.formState.errors.root.message}
                    </p>
                  )}

                  <Button
                    variant="hero"
                    className="w-full gap-2"
                    size="lg"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Reset password"
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link to="/login" className="font-medium text-primary hover:underline flex items-center justify-center gap-1">
              <ArrowLeft className="h-3 w-3" /> Back to login
            </Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/50 to-primary/20" />
      </div>
    </div>
  );
}
