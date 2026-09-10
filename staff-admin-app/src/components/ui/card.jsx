import * as React from "react";
import { cn } from "@/lib/utils";

const Card           = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />);
const CardHeader     = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />);
const CardTitle      = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("text-lg font-bold leading-none tracking-tight", className)} {...props} />);
const CardDescription= React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />);
const CardContent    = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />);
const CardFooter     = React.forwardRef(({ className, ...props }, ref) => <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />);

Card.displayName = "Card"; CardHeader.displayName = "CardHeader";
CardTitle.displayName = "CardTitle"; CardDescription.displayName = "CardDescription";
CardContent.displayName = "CardContent"; CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
