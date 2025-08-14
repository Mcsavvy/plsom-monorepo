# Enhanced Breadcrumb and Title System

This system provides a mature breadcrumb and document title solution that fetches actual item names from the backend API, providing a much better user experience with meaningful, descriptive navigation and page titles.

## Features

- **Dynamic Item Names**: Fetches actual item names from the backend using the `/api/meta/{resource}/{id}/` endpoint
- **Automatic Caching**: Uses Refine's `useCustom` hook for intelligent caching (5-minute stale time, 10-minute cache time)
- **Loading States**: Shows skeleton loaders while fetching meta data
- **Fallback Support**: Gracefully falls back to default labels when meta data is unavailable
- **Enhanced Tooltips**: Shows item descriptions on hover when available
- **Document Title Integration**: Automatically updates page titles with actual item names

## Components and Hooks

### 1. `useMeta` Hook

Fetches meta data for a specific resource item.

```typescript
import { useMeta } from '@/hooks/use-meta';

const { meta, isLoading, name, description } = useMeta('students', studentId);
```

**Parameters:**

- `resource`: The resource name (e.g., 'students', 'cohorts')
- `id`: The item ID
- `options`: Configuration options including `enabled` flag

**Returns:**

- `meta`: The complete meta data object
- `isLoading`: Loading state
- `name`: Direct access to the item name
- `description`: Direct access to the item description

### 2. `useMultipleMeta` Hook

Fetches meta data for multiple items at once.

```typescript
import { useMultipleMeta } from '@/hooks/use-meta';

const { metaData, isLoading, getMeta } = useMultipleMeta([
  { resource: 'cohorts', id: 1 },
  { resource: 'students', id: 123 },
]);
```

### 3. Enhanced Breadcrumb Component

The breadcrumb component automatically detects resource/ID patterns in routes and fetches appropriate meta data.

```typescript
import { Breadcrumb } from '@/components/breadcrumb';

// Just use it - it automatically enhances itself
<Breadcrumb />
```

**Features:**

- Automatic route parsing to detect resource/ID patterns
- Shows loading skeletons while fetching names
- Displays tooltips with descriptions
- Falls back to default labels when needed

### 4. `useEnhancedTitle` Hook

Automatically updates the document title with meta data.

```typescript
import { useEnhancedTitle } from '@/hooks/use-enhanced-title';

export const StudentShow = () => {
  // This automatically updates the document title
  const { title, description, isLoading } = useEnhancedTitle();

  return (
    <div>
      <h1>{title || 'Loading...'}</h1>
      {description && <p>{description}</p>}
    </div>
  );
};
```

### 5. `useManualEnhancedTitle` Hook

For manual control over title updates.

```typescript
import { useManualEnhancedTitle } from '@/hooks/use-enhanced-title';

export const CustomPage = () => {
  const { updateTitle, title, isLoading } = useManualEnhancedTitle(
    'students',
    studentId,
    shouldFetch
  );

  // Call updateTitle() when you want to update the title
  useEffect(() => {
    if (someCondition) {
      updateTitle();
    }
  }, [someCondition, updateTitle]);

  return <div>{title}</div>;
};
```

## Backend API Requirements

The system expects a meta endpoint at `/api/meta/{resource}/{id}/` that returns:

```json
{
  "name": "John Doe",
  "description": "Student in Computer Science program"
}
```

**Example API responses:**

For a student (`/api/meta/students/123/`):

```json
{
  "name": "John Doe",
  "description": "Computer Science student, enrolled in 3 cohorts"
}
```

For a cohort (`/api/meta/cohorts/45/`):

```json
{
  "name": "CS101 - Fall 2024",
  "description": "Introduction to Computer Science - Fall 2024 cohort"
}
```

For staff (`/api/meta/staff/7/`):

```json
{
  "name": "Dr. Jane Smith",
  "description": "Senior Lecturer in Computer Science"
}
```

## Usage Examples

### Basic Page with Enhanced Title

```typescript
import React from 'react';
import { useEnhancedTitle } from '@/hooks/use-enhanced-title';

export const StudentShow: React.FC = () => {
  // Automatically updates document title with student name
  const { title, description, isLoading } = useEnhancedTitle();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{title}</h1>
      {description && <p className="text-muted-foreground">{description}</p>}
      {/* Rest of your component */}
    </div>
  );
};
```

### Page with Custom Meta Data

```typescript
import React from 'react';
import { useMeta } from '@/hooks/use-meta';
import { updateDocumentTitleWithMeta } from '@/utils/documentTitleHandler';

export const CustomPage: React.FC = () => {
  const { meta, isLoading } = useMeta('students', studentId);

  // Custom title update
  React.useEffect(() => {
    if (meta) {
      updateDocumentTitleWithMeta(
        { resource, action, params, pathname },
        meta.name,
        meta.description
      );
    }
  }, [meta]);

  return <div>{meta?.name}</div>;
};
```

### Breadcrumb Usage

The breadcrumb component works automatically - just include it in your layout:

```typescript
import { Breadcrumb } from '@/components/breadcrumb';

export const Layout = () => {
  return (
    <div>
      <header>
        <Breadcrumb />
      </header>
      {/* Your page content */}
    </div>
  );
};
```

## Route Pattern Detection

The system automatically detects these route patterns:

- `/students/123` → Fetches meta for student #123
- `/cohorts/45/edit` → Fetches meta for cohort #45
- `/staff/7/show` → Fetches meta for staff #7
- `/enrollments/89` → Fetches meta for enrollment #89

## Performance Optimization

- **Caching**: 5-minute stale time, 10-minute cache time
- **Conditional Fetching**: Only fetches when resource and ID are available
- **No Window Focus Refetch**: Prevents unnecessary requests
- **Retry Logic**: Automatically retries failed requests (max 2 times)
- **Skeleton Loading**: Shows loading states to improve perceived performance

## Error Handling

The system gracefully handles errors:

- Network failures → Falls back to default labels
- Invalid responses → Uses resource/ID fallback
- Missing endpoints → Continues with basic functionality
- Malformed data → Shows error-safe defaults

## Migration Guide

To migrate existing pages:

1. **Add the hook to your page component:**

   ```typescript
   import { useEnhancedTitle } from '@/hooks/use-enhanced-title';

   export const YourPage = () => {
     const { title, description } = useEnhancedTitle();
     // ... rest of component
   };
   ```

2. **Update your backend to provide the meta endpoint**

3. **The breadcrumb component automatically enhances itself** - no changes needed

## Troubleshooting

**Issue: Meta data not loading**

- Check that the backend endpoint `/api/meta/{resource}/{id}/` exists
- Verify the response format matches the expected schema
- Check browser network tab for API errors

**Issue: Titles not updating**

- Ensure `useEnhancedTitle` is called in the page component
- Verify the route parameters are being parsed correctly
- Check that the resource name matches your API expectations

**Issue: Breadcrumbs showing default labels**

- Verify route patterns match the expected format (`/resource/id`)
- Check that the resource name is correctly detected
- Ensure the API endpoint is accessible and returning valid data
