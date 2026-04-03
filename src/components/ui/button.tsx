import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover-shadow-lg",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-md hover-shadow-lg",
        outline: "border-2 border-border bg-background hover:bg-accent hover:text-accent-foreground hover:border-primary/20 shadow-sm hover-shadow-md",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-sm hover-shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground hover-shadow-sm",
        link: "text-primary underline-offset-4 hover:underline hover:text-primary/80",
        hero: "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground font-semibold shadow-lg hover-shadow-xl hover:from-primary/95 hover:to-primary/85",
        "hero-outline": "border-2 border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground shadow-md hover-shadow-lg",
        premium: "bg-gradient-to-r from-primary via-primary to-accent text-primary-foreground font-semibold shadow-lg hover-shadow-xl hover:from-primary/95 hover:via-primary/90 hover:to-accent/95",
        subtle: "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground shadow-sm hover-shadow-md",
        success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-md hover-shadow-lg",
        warning: "bg-amber-500 text-white hover:bg-amber-600 shadow-md hover-shadow-lg",
        danger: "bg-red-500 text-white hover:bg-red-600 shadow-md hover-shadow-lg",
      },
      size: {
        xs: "h-7 px-2 text-xs rounded-lg",
        sm: "h-8 px-3 text-xs rounded-lg",
        default: "h-10 px-4 text-sm rounded-xl",
        lg: "h-12 px-6 text-base rounded-xl",
        xl: "h-14 px-8 text-lg rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-12 w-12 rounded-xl",
      },
      fullWidth: {
        true: "w-full",
        false: "w-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, asChild = false, loading = false, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    
    // When asChild is true and we have loading state, we need to wrap children in a fragment
    // to satisfy React.Children.only requirement
    const buttonContent = loading ? (
      <>
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {children}
      </>
    ) : (
      children
    );

    return (
      <Comp 
        className={cn(buttonVariants({ variant, size, fullWidth, className }))} 
        ref={ref} 
        disabled={disabled || loading}
        {...props}
      >
        {buttonContent}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
