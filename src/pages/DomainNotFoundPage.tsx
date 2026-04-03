/**
 * DomainNotFoundPage
 * Shown when the current hostname cannot be resolved to any tenant context.
 * This page is served for unknown/inactive custom domains.
 */
import { motion } from "framer-motion";
import { Globe, ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

const PLATFORM_DOMAIN = import.meta.env.VITE_PLATFORM_DOMAIN ?? "cofounderbay.com";
const PLATFORM_URL = `https://${PLATFORM_DOMAIN}`;
const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL ?? `support@${PLATFORM_DOMAIN}`;

export default function DomainNotFoundPage() {
  const hostname = typeof window !== "undefined" ? window.location.hostname : "this domain";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 text-center">
      {/* Globe icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-muted mb-6"
      >
        <Globe className="h-9 w-9 text-muted-foreground" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-md space-y-4"
      >
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
          Domain not configured
        </h1>

        <p className="text-muted-foreground leading-relaxed">
          <span className="font-mono text-sm text-foreground bg-secondary/60 px-1.5 py-0.5 rounded">{hostname}</span>
          {" "}is not currently mapped to any organisation on CoFounderBay.
        </p>

        <p className="text-sm text-muted-foreground">
          This could mean the domain is still being set up, the mapping has been removed,
          or the domain was entered incorrectly.
        </p>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <a href={PLATFORM_URL}>
            <Button className="gap-2 w-full sm:w-auto">
              Go to CoFounderBay
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
          <a href={`mailto:${SUPPORT_EMAIL}`}>
            <Button variant="outline" className="gap-2 w-full sm:w-auto">
              <Mail className="h-4 w-4" />
              Contact support
            </Button>
          </a>
        </div>
      </motion.div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="mt-12 text-xs text-muted-foreground"
      >
        Are you a tenant admin?{" "}
        <a href={PLATFORM_URL} className="text-primary hover:underline">
          Log in to CoFounderBay
        </a>{" "}
        to configure your domain mapping.
      </motion.p>
    </div>
  );
}
