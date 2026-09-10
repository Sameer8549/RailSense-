import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:     "border-transparent bg-primary text-primary-foreground",
        secondary:   "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline:     "text-foreground",
        high:        "border-red-200 bg-red-50 text-red-600 dark:border-red-900 dark:bg-red-950 ",
        medium:      "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-900 dark:bg-amber-950 ",
        low:         "border-green-200 bg-green-50 text-green-600 dark:border-green-900 dark:bg-green-950 ",
        recur:       "border-purple-200 bg-purple-50 text-primary dark:border-purple-900 dark:bg-purple-950 dark:text-primary",
        info:        "border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-900 dark:bg-blue-950 ",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
