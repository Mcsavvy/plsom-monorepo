# PWA Installation Features

This document describes the Progressive Web App (PWA) installation features implemented in the PLSOM frontend.

## Overview

The PWA installation system provides users with multiple ways to install the PLSOM LMS app on their devices, with device-specific instructions and browser detection.

## Components

### 1. Install Page (`/install`)

A comprehensive installation page accessible at `/install` that provides:

- **Device Detection**: Automatically detects mobile, tablet, or desktop devices
- **Browser Detection**: Identifies Chrome, Safari, Firefox, Edge, and other browsers
- **Platform-Specific Instructions**: Tailored installation steps for iOS Safari, Android Chrome, desktop browsers, etc.
- **Visual Status Indicators**: Shows device type, browser, and connection status
- **Interactive Installation**: Direct install buttons when supported by the browser

### 2. PWA Install Button (`PWAInstallButton`)

A reusable component with multiple variants:

- **Button Variant**: Simple install button for toolbars/navigation
- **Banner Variant**: Top banner with install prompt
- **Card Variant**: Card-style install prompt
- **Link Variant**: Link that redirects to the install page

### 3. PWA Install Prompt (`PWAInstallPrompt`)

An automatic installation prompt with variants:

- **Banner Variant**: Fixed top banner
- **Modal Variant**: Centered modal dialog
- **Card Variant**: Card-style prompt

Features:
- Auto-shows after a configurable delay
- Respects user dismissal (7-day cooldown)
- Device and browser-specific instructions
- Smart visibility logic

### 4. Enhanced PWA Hook (`usePWA`)

The `usePWA` hook provides:

- Installation state management
- Device detection (iOS, Android, desktop)
- Browser detection
- Installation methods
- Installation instructions generator

## Installation Methods

### iOS Safari
1. Tap the Share button (⬆️) in Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm

### Android Chrome
1. Chrome will show an install banner
2. Or use Chrome menu (⋮) → "Install app"
3. The app will appear on the home screen

### Desktop Browsers
1. Look for install icon in address bar
2. Or use browser menu → "Install PLSOM LMS"
3. App will open in its own window

## Usage Examples

### Basic Install Button
```tsx
import { PWAInstallButton } from "@/components/pwa";

<PWAInstallButton variant="button" />
```

### Install Prompt with Custom Delay
```tsx
import { PWAInstallPrompt } from "@/components/pwa";

<PWAInstallPrompt 
  variant="card" 
  autoShow={true} 
  delay={5000} 
/>
```

### Link to Install Page
```tsx
import { PWAInstallButton } from "@/components/pwa";

<PWAInstallButton variant="link" />
```

## Navigation Integration

The install page is accessible through:

1. **Desktop Navigation**: Added to sidebar and user dropdown menu
2. **Mobile Navigation**: Available in user profile popover
3. **Direct URL**: `/install`

## Features

### Device Detection
- Mobile devices (phones)
- Tablets (iPad, Android tablets)
- Desktop computers

### Browser Support
- Chrome (Android, Desktop)
- Safari (iOS, macOS)
- Firefox (Mobile, Desktop)
- Edge (Desktop, Mobile)
- Other browsers with fallback instructions

### Smart Behavior
- Only shows when app is installable
- Respects user preferences (dismissal)
- Platform-specific instructions
- Automatic detection of installation state

### Accessibility
- Clear visual indicators
- Step-by-step instructions
- Multiple installation methods
- Fallback options for unsupported browsers

## Benefits

1. **Improved User Experience**: Native app-like experience
2. **Offline Access**: Works without internet connection
3. **Faster Loading**: Cached resources and optimized performance
4. **Push Notifications**: Support for notifications
5. **Home Screen Access**: Quick access from device home screen
6. **Cross-Platform**: Works on iOS, Android, and desktop

## Technical Implementation

- Uses the `beforeinstallprompt` event for Chrome/Edge
- Detects iOS devices for Safari-specific instructions
- Implements service worker for offline functionality
- Provides fallback instructions for unsupported browsers
- Manages installation state with localStorage persistence

## Future Enhancements

- Push notification setup
- Offline content synchronization
- App update notifications
- Installation analytics
- Custom app icons and splash screens
