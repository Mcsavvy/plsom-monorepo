# Progressive Web App (PWA) Features

This document describes the PWA features implemented in the PLSOM LMS frontend application, including mobile optimizations, installation capabilities, and offline functionality.

## Overview

PLSOM LMS is built as a Progressive Web App (PWA) that provides a native app-like experience on mobile devices. The PWA includes installation prompts, offline support, mobile-optimized navigation, and enhanced performance through service worker caching.

## Core PWA Features

### 1. App Installation

#### PWA Install Button (`components/pwa/install-button.tsx`)

A versatile component that detects install capability and provides installation prompts.

**Variants:**
- `button`: Simple install button
- `banner`: Top banner with install prompt
- `card`: Detailed card with installation benefits

**Usage:**
```tsx
import { PWAInstallButton } from "@/components/pwa";

// Simple button
<PWAInstallButton variant="button" />

// Banner across top of page
<PWAInstallButton variant="banner" />

// Detailed card with benefits
<PWAInstallButton 
  variant="card" 
  onInstall={() => console.log('App installed!')}
  onDismiss={() => console.log('Install dismissed')}
/>
```

**Features:**
- Automatic detection of installability
- iOS-specific instructions (Add to Home Screen)
- Dismissal tracking with localStorage
- Cross-platform compatibility

#### PWA Install Prompt (`components/pwa/pwa-prompt.tsx`)

A modal prompt that appears after a delay to encourage app installation.

**Usage:**
```tsx
import { PWAPrompt } from "@/components/pwa";

<PWAPrompt 
  delay={30000} // Show after 30 seconds
/>
```

**Features:**
- Configurable delay before showing
- Benefits showcase (faster loading, offline access, native feel)
- Dismissal with 30-day cooldown
- Responsive design

### 2. Network Status & Offline Support

#### Network Status Indicator (`components/pwa/network-status.tsx`)

Monitors and displays the current network connection status.

**Variants:**
- `minimal`: Simple icon indicator
- `banner`: Full-width status banner
- `toast`: Floating notification

**Usage:**
```tsx
import { NetworkStatus } from "@/components/pwa";

// Minimal icon in header
<NetworkStatus variant="minimal" showOnlineStatus />

// Banner for critical status
<NetworkStatus variant="banner" />

// Toast notification
<NetworkStatus variant="toast" />
```

**Features:**
- Real-time network status monitoring
- Automatic retry functionality
- Reconnection indicators
- Customizable display modes

#### Offline Page (`components/pwa/offline-page.tsx`)

A comprehensive offline experience when users lose internet connectivity.

**Features:**
- Retry connection functionality
- Available offline features showcase
- Quick navigation to cached pages
- Installation encouragement

**Automatic Fallback:**
The offline page is automatically shown when users navigate while offline (configured in `next.config.ts`).

### 3. Mobile-Optimized Layout

#### Mobile Layout (`components/layout/mobile-layout.tsx`)

A wrapper component that provides mobile-specific optimizations and PWA features.

**Usage:**
```tsx
import { MobileLayout } from "@/components/layout/mobile-layout";

<MobileLayout
  showInstallButton={true}
  installButtonVariant="banner"
  showNetworkStatus={true}
  networkStatusVariant="toast"
  showNavigation={true}
  showInstallPrompt={true}
  installPromptDelay={30000}
>
  {children}
</MobileLayout>
```

**Features:**
- Responsive install button placement
- Network status integration
- Mobile navigation inclusion
- Safe area handling for notched devices

#### Mobile Navigation (`components/layout/mobile-navigation.tsx`)

Touch-optimized navigation with bottom tab bar and collapsible menu.

**Features:**
- Bottom tab navigation for main sections
- Auto-hiding headers on scroll
- Expandable "More" menu with Sheet
- User profile integration
- Network status in menu
- Install button integration

**Navigation Items:**
- Home
- Courses (protected)
- Profile (protected)
- Settings (protected)
- More (expandable menu)

### 4. PWA Hook (`hooks/use-pwa.ts`)

A custom hook that provides comprehensive PWA state and functionality.

**Usage:**
```tsx
import { usePWA } from "@/hooks/use-pwa";

function MyComponent() {
  const {
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,
    isOnline,
    install,
    getInstallInstructions,
    canInstall
  } = usePWA();

  return (
    <div>
      {canInstall && !isInstalled && (
        <button onClick={install}>
          Install App
        </button>
      )}
    </div>
  );
}
```

**Returned Properties:**
- `isInstallable`: Can show native install prompt
- `isInstalled`: App is currently installed
- `isStandalone`: Running in standalone mode
- `isIOS`: Running on iOS device
- `isOnline`: Current network status
- `canInstall`: Can install (either native prompt or iOS)

**Returned Functions:**
- `install()`: Trigger installation flow
- `getInstallInstructions()`: Get platform-specific instructions

## Configuration

### Manifest (`public/manifest.json`)

Optimized for mobile devices with proper metadata:

```json
{
  "name": "PLSOM LMS - Perfect Love School of Ministry",
  "short_name": "PLSOM LMS",
  "description": "Learning Management System for Perfect Love School of Ministry - Empowering Ministry Leaders Through Quality Education",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#f8fafc",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",
  "categories": ["education", "productivity"],
  "lang": "en"
}
```

### Service Worker Configuration (`next.config.ts`)

Advanced caching strategies for optimal performance:

**Caching Strategies:**
- **Fonts**: Cache-first with 1-year expiration
- **Images**: Stale-while-revalidate with 30-day expiration
- **Static Assets**: Stale-while-revalidate with optimized expiration
- **External Requests**: Network-first with 1-day fallback
- **Offline Fallback**: Custom offline page

### Mobile CSS Optimizations (`app/mobile.css`)

**Safe Area Support:**
- Automatic handling of device notches and dynamic islands
- Gesture navigation safe areas

**iOS-Specific Optimizations:**
- Prevents zoom on input focus
- Touch callout handling
- Webkit scroll optimizations

**Android-Specific Optimizations:**
- Tap highlight removal
- Overscroll behavior control

**Accessibility Features:**
- High contrast mode support
- Reduced motion preferences
- Focus-visible styles

## Page Wrapper Components

### Protected Page Wrapper (`components/wrappers/protected-page-wrapper.tsx`)

Wraps pages that require authentication.

**Usage:**
```tsx
import { ProtectedPageWrapper } from "@/components/wrappers";

export default function DashboardPage() {
  return (
    <ProtectedPageWrapper
      redirectTo="/login"
      showLoading={true}
    >
      <div>Protected content here</div>
    </ProtectedPageWrapper>
  );
}
```

**Features:**
- Automatic authentication checking
- Loading states during session restoration
- Configurable redirect paths
- Custom loading components

### Public Page Wrapper (`components/wrappers/public-page-wrapper.tsx`)

Wraps public pages with optional authenticated user redirection.

**Usage:**
```tsx
import { PublicPageWrapper } from "@/components/wrappers";

export default function LoginPage() {
  return (
    <PublicPageWrapper
      redirectIfAuthenticated={true}
      redirectTo="/dashboard"
    >
      <div>Login form here</div>
    </PublicPageWrapper>
  );
}
```

## Installation Instructions

### For Users

#### Android/Chrome:
1. Visit the website in Chrome
2. Tap "Install" when prompted, or
3. Use browser menu → "Install app"

#### iOS/Safari:
1. Visit the website in Safari
2. Tap the Share button (⬆️)
3. Scroll down and tap "Add to Home Screen"
4. Tap "Add" to confirm

#### Desktop:
1. Visit the website in Chrome/Edge
2. Click the install icon in the address bar, or
3. Use browser menu → "Install PLSOM LMS"

### Benefits of Installation

1. **Faster Loading**: Cached resources load instantly
2. **Offline Access**: Core functionality works without internet
3. **Native Experience**: Feels like a native mobile app
4. **Push Notifications**: (Future feature)
5. **Home Screen Access**: Quick launch from device home screen

## Performance Features

### Caching Strategies

1. **Static Assets**: Cached for 30 days with background updates
2. **Fonts**: Cached for 1 year for optimal performance
3. **Images**: Stale-while-revalidate for fast loading
4. **API Requests**: Network-first with offline fallback

### Mobile Optimizations

1. **Touch-Friendly Targets**: 44px minimum touch target size
2. **Smooth Scrolling**: Hardware-accelerated scrolling
3. **Reduced Motion**: Respects user preferences
4. **Viewport Optimization**: Prevents zoom on input focus

### Loading States

1. **Skeleton Loading**: Shimmer effects for content loading
2. **Progressive Loading**: Critical content loads first
3. **Background Sync**: Updates happen in background
4. **Graceful Degradation**: Core features work offline

## Development Guidelines

### Testing PWA Features

1. **Installation Testing**:
   ```bash
   # Test in Chrome DevTools
   # Application tab → Manifest
   # Application tab → Service Workers
   ```

2. **Offline Testing**:
   ```bash
   # Chrome DevTools → Network tab → Offline
   # Test navigation and functionality
   ```

3. **Mobile Testing**:
   ```bash
   # Chrome DevTools → Device toolbar
   # Test on actual mobile devices
   ```

### Best Practices

1. **Always test offline functionality**
2. **Verify install prompts on different platforms**
3. **Check safe area handling on notched devices**
4. **Test with reduced motion preferences**
5. **Validate manifest and service worker registration**

### Debugging

1. **Service Worker Issues**:
   - Check Chrome DevTools → Application → Service Workers
   - Look for registration errors or update failures

2. **Install Issues**:
   - Verify manifest.json accessibility
   - Check install criteria (HTTPS, manifest, service worker)

3. **Offline Issues**:
   - Inspect cached resources in Application → Storage
   - Verify fallback routes configuration

## Future Enhancements

### Planned Features

1. **Push Notifications**: Course updates and announcements
2. **Background Sync**: Offline form submissions
3. **Web Share API**: Share courses and content
4. **Media Caching**: Offline video/audio content
5. **Biometric Authentication**: Fingerprint/Face ID login

### Performance Improvements

1. **Critical Resource Hints**: Preload important assets
2. **Image Optimization**: WebP/AVIF support
3. **Code Splitting**: Lazy load non-critical features
4. **Bundle Analysis**: Optimize JavaScript bundles

This PWA implementation provides a comprehensive mobile-first experience that rivals native apps while maintaining web accessibility and ease of deployment.
