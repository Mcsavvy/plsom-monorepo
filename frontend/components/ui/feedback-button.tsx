"use client";

import { useState, useEffect } from "react";
import { Bug, MessageSquare } from "lucide-react";
import { showFeedbackWidget } from "../../instrumentation-client";

interface FeedbackButtonProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function FeedbackButton({
  variant = "default",
  size = "md",
  className = "",
  showIcon = true,
  children
}: FeedbackButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if Sentry feedback is available
    const checkFeedbackAvailability = () => {
      // Small delay to ensure Sentry is initialized
      setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    };

    checkFeedbackAvailability();
  }, []);

  const handleClick = () => {
    showFeedbackWidget();
    setIsVisible(false)
  };

  if (!isVisible) {
    return null;
  }

  const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };

  const sizeClasses = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 py-2",
    lg: "h-11 px-8"
  };

  const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label="Report an issue or provide feedback"
      title="Report an issue or provide feedback"
    >
      {showIcon && (
        <Bug className="mr-2 h-4 w-4" size={iconSize} />
      )}
      {children || "Report Issue"}
    </button>
  );
}

// Alternative feedback button with message icon
export function FeedbackMessageButton({
  variant = "ghost",
  size = "sm",
  className = "",
  children
}: FeedbackButtonProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 1000);
  }, []);

  const handleClick = () => {
    showFeedbackWidget();
  };

  if (!isVisible) {
    return null;
  }

  const baseClasses = "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground"
  };

  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-12 w-12"
  };

  const iconSize = size === "sm" ? 16 : size === "lg" ? 20 : 18;

  return (
    <button
      onClick={handleClick}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      aria-label="Report an issue or provide feedback"
      title="Report an issue or provide feedback"
    >
      <MessageSquare size={iconSize} />
      {children}
    </button>
  );
}

// Floating feedback button that can be positioned anywhere
export function FloatingFeedbackButton({
  position = "bottom-right",
  className = ""
}: {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsVisible(true);
    }, 1000);
  }, []);

  const handleClick = () => {
    showFeedbackWidget();
  };

  if (!isVisible) {
    return null;
  }

  const positionClasses = {
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
    "bottom-left": "bottom-20 left-4",
    "bottom-right": "bottom-20 right-4"
  };

  return (
    <button
      onClick={handleClick}
      className={`fixed ${positionClasses[position]} z-50 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${className}`}
      aria-label="Report an issue or provide feedback"
      title="Report an issue or provide feedback"
    >
      <Bug className="h-5 w-5" />
    </button>
  );
}
