"use client";

import { FeedbackButton, FloatingFeedbackButton, FeedbackMessageButton } from "./feedback-button";
import { useFeedback } from "../../hooks/use-feedback";

export function FeedbackExample() {
  const { showFeedback, attachToElement } = useFeedback();

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Feedback System Examples</h2>
        <p className="text-gray-600">
          These are examples of how to integrate the feedback system into your application.
          The feedback widget will only appear when explicitly triggered by the user.
        </p>
      </div>

      {/* Standard Feedback Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Standard Feedback Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <FeedbackButton variant="default">
            Report Issue
          </FeedbackButton>
          
          <FeedbackButton variant="outline" size="sm">
            Bug Report
          </FeedbackButton>
          
          <FeedbackButton variant="ghost" size="lg">
            Send Feedback
          </FeedbackButton>
        </div>
      </div>

      {/* Message Icon Buttons */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Message Icon Buttons</h3>
        <div className="flex flex-wrap gap-4">
          <FeedbackMessageButton variant="default" size="sm" />
          <FeedbackMessageButton variant="outline" size="md" />
          <FeedbackMessageButton variant="ghost" size="lg" />
        </div>
      </div>

      {/* Floating Feedback Button */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Floating Feedback Button</h3>
        <p className="text-gray-600">
          This button is positioned in the bottom-right corner and won't obstruct your content.
        </p>
        <FloatingFeedbackButton position="bottom-right" />
      </div>

      {/* Custom Trigger */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Custom Trigger</h3>
        <p className="text-gray-600">
          Use the hook to trigger feedback from any custom element or event.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => showFeedback()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Custom Feedback Button
          </button>
          
          <button
            onClick={() => showFeedback()}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
          >
            Report Course Issue
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold">How It Works</h3>
        <ul className="list-disc list-inside space-y-2 text-gray-600">
          <li>The feedback widget is disabled by default to prevent obstruction</li>
          <li>Users can trigger feedback through buttons or programmatic calls</li>
          <li>The widget appears in a non-intrusive location</li>
          <li>All feedback is captured and sent to Sentry</li>
          <li>The system is mobile-responsive and accessible</li>
        </ul>
      </div>
    </div>
  );
}

// Example of integrating feedback into a dashboard header
export function DashboardHeaderWithFeedback() {
  const { showFeedback } = useFeedback();

  return (
    <div className="flex items-center justify-between p-4 bg-white border-b">
      <div className="flex items-center space-x-4">
        <h1 className="text-xl font-bold">Student Dashboard</h1>
        <span className="text-sm text-gray-500">Welcome back, Simbiat!</span>
      </div>
      
      <div className="flex items-center space-x-3">
        <FeedbackButton variant="ghost" size="sm">
          Report Issue
        </FeedbackButton>
        
        <button
          onClick={() => showFeedback()}
          className="px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 transition-colors"
        >
          Help & Feedback
        </button>
      </div>
    </div>
  );
}

// Example of mobile-friendly feedback integration
export function MobileFeedbackExample() {
  return (
    <div className="p-4 space-y-4">
      <h3 className="text-lg font-semibold">Mobile Feedback</h3>
      <p className="text-gray-600">
        On mobile devices, the feedback button is positioned above the bottom navigation
        to ensure it's easily accessible without obstructing content.
      </p>
      
      {/* This will be positioned above mobile navigation */}
      <FloatingFeedbackButton position="bottom-right" />
      
      <div className="text-sm text-gray-500">
        <p>• Positioned above bottom navigation</p>
        <p>• Responsive design for all screen sizes</p>
        <p>• Touch-friendly button sizing</p>
      </div>
    </div>
  );
}
