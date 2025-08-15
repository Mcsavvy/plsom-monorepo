# Authentication & Session Management

This document describes the authentication and session management system used in the PLSOM frontend application.

## Overview

The authentication system provides a complete solution for user authentication, session management, and HTTP request handling. It includes:

- User login/logout functionality
- JWT token management (access + refresh tokens)
- Password reset capabilities
- Session persistence across browser sessions
- Automatic token refresh
- HTTP client with authentication headers

## Core Components

### 1. Authentication Hook (`hooks/auth.ts`)

The `useAuth` hook provides authentication-related functions and state management.

#### Available Functions

```typescript
const {
  login,
  logout,
  refreshLogin,
  isAuthenticated,
  refreshCurrentUser,
  requestPasswordReset,
  resetPassword
} = useAuth();
```

#### Login

```typescript
const login = async (credentials: LoginCredentials) => Promise<void>

// Example usage
await login({
  email: "user@example.com",
  password: "SecurePass123!"
});
```

**Password Requirements:**
- Minimum 8 characters
- Maximum 100 characters
- Must contain at least:
  - One uppercase letter
  - One lowercase letter
  - One number
  - One special character (@$!%*?&)

#### Logout

```typescript
const logout = async () => Promise<void>

// Example usage
await logout();
```

#### Token Refresh

```typescript
const refreshLogin = async () => Promise<void>

// Example usage
await refreshLogin();
```

#### Password Reset

**Request Password Reset:**
```typescript
const requestPasswordReset = async (data: ForgotPasswordRequest) => Promise<void>

// Example usage
await requestPasswordReset({
  email: "user@example.com"
});
```

**Reset Password:**
```typescript
const resetPassword = async (data: ChangePasswordRequest) => Promise<void>

// Example usage
await resetPassword({
  uid: "user_uid_here",
  token: "reset_token_here",
  new_password: "NewSecurePass123!",
  confirm_password: "NewSecurePass123!"
});
```

#### User Management

```typescript
const isAuthenticated: boolean
const refreshCurrentUser = async () => Promise<void>
```

### 2. Session Management (`hooks/session.ts`)

The `useSession` hook provides access to the current session state and management functions.

#### Available Properties

```typescript
const {
  session,
  loading,
  setSession,
  clearSession
} = useSession();
```

#### Session Structure

```typescript
interface Session {
  user: AuthUser;
  tokens: AuthTokens;
}

interface AuthUser {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  title?: string;
  role: string;
  whatsapp_number?: string;
  profile_picture?: string;
  is_setup_complete: boolean;
  is_active: boolean;
}

interface AuthTokens {
  access: string;
  refresh: string;
  access_expires_at: string;
  refresh_expires_at: string;
}
```

#### Session Persistence

Sessions are automatically persisted to `localStorage` and restored on page reload. The session provider includes a 2-second loading state to handle session restoration.

### 3. HTTP Client (`hooks/axios.ts`)

The HTTP client provides authenticated requests with automatic error handling and token management.

### 4. Session Refresher (`components/session-refresher.tsx`)

The `SessionRefresher` component automatically refreshes the session before the access token expires, ensuring continuous authentication without user interruption.

#### Component Usage

```tsx
import { SessionRefresher } from "@/components/session-refresher";

function App() {
  return (
    <SessionProvider>
      <SessionRefresher 
        refreshBufferMs={5 * 60 * 1000} // 5 minutes before expiration
        debug={false} // Enable debug logging
      />
      {/* Your app content */}
    </SessionProvider>
  );
}
```

#### Hook Usage

For more control over the refresh logic, use the `useSessionRefresher` hook:

```tsx
import { useSessionRefresher } from "@/hooks/use-session-refresher";

function MyComponent() {
  const { start, stop, restart, isActive } = useSessionRefresher({
    refreshBufferMs: 10 * 60 * 1000, // 10 minutes before expiration
    debug: true,
    autoStart: false // Don't start automatically
  });

  return (
    <div>
      <p>Refresher is {isActive ? 'active' : 'inactive'}</p>
      <button onClick={start}>Start Refresher</button>
      <button onClick={stop}>Stop Refresher</button>
      <button onClick={restart}>Restart Refresher</button>
    </div>
  );
}
```

#### Features

- **Automatic Scheduling**: Calculates the optimal time to refresh based on token expiration
- **Configurable Buffer**: Set how many minutes before expiration to refresh (default: 5 minutes)
- **Error Handling**: Retries failed refresh attempts with exponential backoff
- **Periodic Checks**: Ensures refresh scheduling remains accurate
- **Debug Logging**: Optional detailed logging for troubleshooting
- **Manual Control**: Start/stop/restart functionality via hook
- **Memory Safe**: Proper cleanup of timeouts and intervals

#### Creating Client Instances

```typescript
// For unauthenticated requests
const client = createAxiosInstance({});

// For authenticated requests
const client = createAxiosInstance({
  token: "Bearer token_here",
  onAuthFail: () => handleAuthFailure()
});
```

#### Using the Authenticated Client Hook

```typescript
const client = useClient(); // Automatically includes session token
```

#### Error Handling

The client automatically parses various error response formats:

- **DRF Standardized Format**: Handles validation errors, client errors, and server errors
- **Legacy DRF Format**: Backward compatibility for older API responses
- **Simple String Errors**: Direct error message handling

**Error Response Structure:**
```typescript
interface HttpError {
  message: string;
  statusCode: number;
  errors?: ValidationErrors;
}

interface ValidationErrors {
  [field: string]: string[];
}
```

**Example Error Handling:**
```typescript
try {
  await client.post("/api/endpoint", data);
} catch (error) {
  if (error.statusCode === 400) {
    // Handle validation errors
    console.log(error.errors);
  } else if (error.statusCode === 401) {
    // Handle authentication errors
    console.log(error.message);
  }
}
```

## Usage Examples

### Basic Authentication Flow

```typescript
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";

function LoginComponent() {
  const { login, isAuthenticated } = useAuth();
  const { session } = useSession();

  const handleLogin = async (email: string, password: string) => {
    try {
      await login({ email, password });
      // User is now logged in and session is established
    } catch (error) {
      console.error("Login failed:", error.message);
    }
  };

  if (isAuthenticated) {
    return <div>Welcome, {session?.user.first_name}!</div>;
  }

  return <LoginForm onSubmit={handleLogin} />;
}
```

### Protected Routes

```typescript
import { useAuth } from "@/hooks/auth";
import { useSession } from "@/hooks/session";

function ProtectedComponent() {
  const { isAuthenticated } = useAuth();
  const { loading } = useSession();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <div>Protected content here</div>;
}
```

### Making Authenticated API Calls

```typescript
import { useClient } from "@/hooks/axios";

function UserProfile() {
  const client = useClient();

  const updateProfile = async (data: ProfileData) => {
    try {
      const response = await client.put("/api/users/me/", data);
      // Handle success
    } catch (error) {
      // Handle errors
      console.error("Update failed:", error.message);
    }
  };

  return <ProfileForm onSubmit={updateProfile} />;
}
```

## Security Features

1. **JWT Token Management**: Secure token storage and automatic refresh
2. **Password Requirements**: Strong password validation
3. **Session Persistence**: Secure localStorage usage with validation
4. **Automatic Logout**: Session clearing on authentication failures
5. **Error Handling**: Comprehensive error parsing without exposing sensitive information

## Configuration

The authentication system uses configuration from `@/lib/config` for:
- API base URL
- Token storage keys
- Session timeout settings

## Best Practices

1. **Always use the hooks**: Don't bypass the authentication system
2. **Handle loading states**: Check `session.loading` before rendering protected content
3. **Error handling**: Implement proper error handling for all authentication operations
4. **Token refresh**: Let the system handle token refresh automatically
5. **Session cleanup**: Always call `logout()` when users sign out
6. **Session Refresher**: Place `SessionRefresher` at the root level of your app for automatic token management
7. **Refresh Buffer**: Set appropriate refresh buffer times (5-10 minutes) to balance security and user experience
8. **Debug Mode**: Enable debug logging during development to monitor refresh behavior

## Troubleshooting

### Common Issues

1. **"useSession must be used within a SessionProvider"**
   - Ensure your app is wrapped with `SessionProvider`

2. **"No session is active"**
   - User is not authenticated, redirect to login

3. **Token expiration errors**
   - The system should handle this automatically, check if refresh logic is working

4. **Session not persisting**
   - Check localStorage permissions and browser settings

### Debug Information

Enable debug logging by checking the browser console for:
- Session loading/saving operations
- Token refresh attempts
- Authentication failures
- HTTP request/response details
