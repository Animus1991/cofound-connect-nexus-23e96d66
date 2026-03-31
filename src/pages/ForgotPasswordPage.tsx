import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Rocket, Mail, ArrowLeft, Loader2, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.svg";
import { forgotPasswordSchema, type ForgotPasswordFormValues } from "@/lib/validations";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const clearRootError = () => form.clearErrors("root");

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsSubmitting(true);
    try {
      await api.auth.forgotPassword(data.email);
      setSubmitted(true);
    } catch (err) {
      const msg = (err as { error?: string })?.error ?? "Something went wrong. Please try again.";
      form.setError("root", { message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              CoFounderBay
            </span>
          </Link>

          {submitted ? (
            <div className="space-y-6">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20">
                <CheckCircle className="h-8 w-8 text-primary" />
              </div>
              <h1 className="font-display text-2xl font-bold text-foreground">
                Check your email
              </h1>
              <p className="text-muted-foreground">
                If an account exists for {form.getValues("email")}, you will receive a password reset link shortly.
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
                Forgot password?
              </h1>
              <p className="mt-2 text-muted-foreground">
                Enter your email and we&apos;ll send you a link to reset your password.
              </p>

              <Form {...form}>
                <form className="mt-8 space-y-5" onSubmit={form.handleSubmit(onSubmit)}>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="you@startup.com"
                              type="email"
                              autoComplete="email"
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
                      "Send reset link"
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
