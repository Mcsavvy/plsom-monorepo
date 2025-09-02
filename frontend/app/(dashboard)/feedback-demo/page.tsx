"use client";

import { FeedbackExample } from "@/components/ui/feedback-example";

export default function FeedbackDemoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Feedback System Demo</h1>
          <p className="text-muted-foreground mt-2">
            This page demonstrates all the different ways to integrate the feedback system into your application.
            The feedback widget will only appear when explicitly triggered by the user.
          </p>
        </div>
        
        <FeedbackExample />
      </div>
    </div>
  );
}
