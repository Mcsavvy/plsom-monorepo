import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://9648fe5f94db4ed047c819d9b837f39b@o4506900881670144.ingest.us.sentry.io/4507866272628736",

  // Adds request headers and IP for users, for more info visit:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for tracing.
  // We recommend adjusting this value in production
  // Learn more at
  // https://docs.sentry.io/platforms/javascript/configuration/options/#traces-sample-rate
  tracesSampleRate: 1.0,
  integrations: [
    Sentry.feedbackIntegration({
      // Disable auto-injection to prevent obstruction
      autoInject: false,
      
      // Customize appearance and behavior
      colorScheme: "system",
      showBranding: false, // Remove Sentry logo
      id: "plsom-feedback-widget", // Custom ID for styling
      
      // Customize form fields
      showName: true,
      showEmail: true,
      enableScreenshot: true,
      isNameRequired: false,
      isEmailRequired: false,
      
      // Customize text labels to be more user-friendly
      triggerLabel: "Report Issue",
      triggerAriaLabel: "Report an issue or provide feedback",
      formTitle: "Help Us Improve",
      submitButtonLabel: "Submit Feedback",
      cancelButtonLabel: "Cancel",
      confirmButtonLabel: "Confirm",
      addScreenshotButtonLabel: "Add Screenshot",
      removeScreenshotButtonLabel: "Remove Screenshot",
      nameLabel: "Name (Optional)",
      namePlaceholder: "Your Name",
      emailLabel: "Email (Optional)",
      emailPlaceholder: "your.email@example.com",
      
      // Add event callbacks for better control
      onFormOpen: () => {
        console.log("Feedback form opened");
      },
      onFormClose: () => {
        console.log("Feedback form closed");
      },
      onSubmitSuccess: (data: any, eventID: string) => {
        console.log("Feedback submitted successfully", { data, eventID });
      },
      onSubmitError: (error: Error) => {
        console.error("Feedback submission failed", error);
      },
      
      // Add custom tags for better organization
      tags: {
        source: "frontend",
        component: "feedback-widget"
      }
    }),
  ],
  // Note: if you want to override the automatic release value, do not set a
  // `release` value here - use the environment variable `SENTRY_RELEASE`, so
  // that it will also get attached to your source maps
});

// This export will instrument router navigations, and is only relevant if you enable tracing.
// `captureRouterTransitionStart` is available from SDK version 9.12.0 onwards
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// Export a function to manually show the feedback widget when needed
export const showFeedbackWidget = () => {
  const feedback = Sentry.getFeedback();
  if (feedback) {
    // Create and show the widget
    const widget = feedback.createWidget();
    widget.appendToDom();
    // The widget should be visible after appending to DOM
  }
};

// Export a function to attach feedback to a custom button
export const attachFeedbackToButton = (buttonElement: HTMLElement) => {
  const feedback = Sentry.getFeedback();
  if (feedback) {
    feedback.attachTo(buttonElement, {
      formTitle: "Help Us Improve",
      triggerLabel: "Report Issue"
    });
  }
};
