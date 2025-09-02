# Sentry Feedback System Documentation

## Overview

This document describes the customized Sentry feedback system implemented in the PLSOM frontend. The system has been configured to be non-intrusive and user-controlled, preventing the automatic appearance of feedback widgets that could obstruct the user interface.

## Key Features

- **Non-obstructive**: Feedback widget is disabled by default and only appears when explicitly triggered
- **Customizable**: Extensive customization options for appearance, text, and behavior
- **User-controlled**: Users can choose when to provide feedback
- **Mobile-friendly**: Responsive design that works on all device sizes
- **Accessible**: Proper ARIA labels and keyboard navigation support

## Configuration

### Main Configuration (`instrumentation-client.ts`)

The Sentry feedback integration is configured with the following key settings:

```typescript
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
  
  // Customize text labels
  triggerLabel: "Report Issue",
  formTitle: "Help Us Improve",
  submitButtonLabel: "Submit Feedback",
  
  // Event callbacks
  onFormOpen: () => console.log("Feedback form opened"),
  onFormClose: () => console.log("Feedback form closed"),
  onSubmitSuccess: (data, eventID) => console.log("Feedback submitted"),
  onSubmitError: (error) => console.error("Submission failed", error)
})
```

### Styling (`globals.css`)

Custom CSS variables and styles are defined for the feedback widget:

```css
#plsom-feedback-widget {
  position: fixed;
  bottom: 80px; /* Above bottom navigation */
  right: 20px;
  z-index: 1000;
  
  /* Custom color scheme */
  --foreground: #6b7280;
  --background: #ffffff;
  --primary: #8b5cf6;
  /* ... more variables */
}
```

## Usage

### 1. Using the Feedback Button Component

Import and use the pre-built feedback button components:

```tsx
import { FeedbackButton, FloatingFeedbackButton } from "@/components/ui/feedback-button";

// Standard button
<FeedbackButton variant="outline" size="sm">
  Report Bug
</FeedbackButton>

// Floating button (positioned in corner)
<FloatingFeedbackButton position="bottom-right" />
```

### 2. Using the Feedback Hook

Use the `useFeedback` hook for programmatic control:

```tsx
import { useFeedback } from "@/hooks/use-feedback";

function MyComponent() {
  const { showFeedback, isAvailable, isLoading } = useFeedback();
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <button 
      onClick={() => showFeedback()}
      disabled={!isAvailable}
    >
      Provide Feedback
    </button>
  );
}
```

### 3. Attaching to Custom Elements

Attach feedback functionality to existing UI elements:

```tsx
import { useFeedback } from "@/hooks/use-feedback";

function MyComponent() {
  const { attachToElement } = useFeedback();
  
  useEffect(() => {
    const button = document.getElementById('my-button');
    if (button) {
      attachToElement(button);
    }
  }, [attachToElement]);
  
  return <button id="my-button">Custom Button</button>;
}
```

### 4. Programmatic Feedback Capture

Capture feedback programmatically using the `useCaptureFeedback` hook:

```tsx
import { useCaptureFeedback } from "@/hooks/use-feedback";

function MyComponent() {
  const { captureFeedback } = useCaptureFeedback();
  
  const handleSubmit = () => {
    captureFeedback({
      name: "John Doe",
      email: "john@example.com",
      message: "User feedback message"
    });
  };
  
  return <button onClick={handleSubmit}>Submit Feedback</button>;
}
```

## Available Components

### FeedbackButton
- **Props**: `variant`, `size`, `className`, `showIcon`, `children`
- **Variants**: `default`, `outline`, `ghost`
- **Sizes**: `sm`, `md`, `lg`

### FeedbackMessageButton
- Circular button with message icon
- Same props as FeedbackButton
- Ideal for minimal UI designs

### FloatingFeedbackButton
- Fixed-position floating button
- **Props**: `position`, `className`
- **Positions**: `top-left`, `top-right`, `bottom-left`, `bottom-right`

## Available Hooks

### useFeedback()
Returns:
- `showFeedback()` - Show the feedback widget
- `attachToElement()` - Attach feedback to DOM element
- `isAvailable` - Whether feedback is available
- `isLoading` - Loading state

### useCaptureFeedback()
Returns:
- `captureFeedback()` - Programmatically capture feedback
- `isAvailable` - Whether capture is available

### useCrashReport()
Returns:
- `showCrashReport()` - Show crash report dialog
- `isAvailable` - Whether crash report is available

## Customization Options

### Text Customization
All text labels can be customized in the Sentry configuration:
- Form titles
- Button labels
- Field labels
- Placeholder text
- Success/error messages

### Appearance Customization
- Color scheme (light/dark/system)
- Custom CSS variables
- Responsive positioning
- Mobile-specific adjustments

### Behavior Customization
- Form field requirements
- Screenshot attachments
- Event callbacks
- Custom tags

## Best Practices

### 1. Strategic Placement
- Place feedback buttons in logical locations (help menus, settings pages)
- Use floating buttons sparingly to avoid UI clutter
- Consider mobile navigation positioning

### 2. User Experience
- Provide clear context for feedback requests
- Use appropriate button styles and sizes
- Ensure accessibility compliance

### 3. Performance
- Lazy load feedback components when needed
- Handle loading states gracefully
- Provide fallbacks when Sentry is unavailable

## Troubleshooting

### Common Issues

1. **Widget not appearing**
   - Check if `autoInject: false` is set
   - Ensure Sentry is properly initialized
   - Verify the feedback integration is included

2. **Styling issues**
   - Check CSS variable definitions
   - Verify the custom ID is used consistently
   - Test on different screen sizes

3. **TypeScript errors**
   - Ensure proper type annotations
   - Check Sentry SDK version compatibility
   - Verify import statements

### Debug Mode

Enable console logging to debug feedback functionality:

```typescript
// In instrumentation-client.ts
onFormOpen: () => {
  console.log("Feedback form opened");
  // Add your debug logic here
},
```

## Migration from Auto-Injection

If you were previously using auto-injection:

1. **Before**: Widget appeared automatically, potentially obstructing UI
2. **After**: Widget only appears when explicitly triggered
3. **Benefits**: Better UX, no obstruction, user control
4. **Implementation**: Use provided components and hooks

## Examples

### Dashboard Integration
```tsx
// In dashboard layout
<div className="dashboard-header">
  <h1>Dashboard</h1>
  <FeedbackButton variant="ghost" size="sm">
    Report Issue
  </FeedbackButton>
</div>
```

### Mobile-First Design
```tsx
// Floating button above mobile navigation
<FloatingFeedbackButton position="bottom-right" />
```

### Contextual Feedback
```tsx
// In course view
<div className="course-actions">
  <button onClick={() => showFeedback()}>
    Report Course Issue
  </button>
</div>
```

## Support

For issues with the feedback system:
1. Check the browser console for errors
2. Verify Sentry configuration
3. Test with different user roles
4. Check mobile responsiveness

For Sentry-specific issues, refer to the [official Sentry documentation](https://docs.sentry.io/platforms/javascript/user-feedback/configuration/).
