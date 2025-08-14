# Generic Pagination System

This project includes a generic pagination system that works with both Refine's `useTable` hook and any other data source. The system consists of three main parts:

## Components and Hooks

### 1. `usePagination` Hook
A generic hook that provides pagination logic for any data source.

### 2. `useTablePagination` Hook
A specialized hook that bridges the generic `usePagination` with Refine's `useTable`.

### 3. `DataTablePagination` Component
A reusable pagination component built with shadcn/ui components.

## Usage Examples

### With Refine's useTable (Recommended)

```tsx
import { useTable } from '@refinedev/core';
import { useTablePagination } from '@/hooks/useTablePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export const MyListPage = () => {
  const tableResult = useTable({
    resource: 'my-resource',
    pagination: {
      pageSize: 10,
    },
  });

  const {
    tableQuery: { data, isLoading },
  } = tableResult;

  const pagination = useTablePagination({
    table: tableResult,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 30, 40, 50],
  });

  return (
    <div>
      {/* Your table content */}
      <DataTablePagination
        pagination={pagination}
        isLoading={isLoading}
      />
    </div>
  );
};
```

### With Custom Data Source

```tsx
import { usePagination } from '@/hooks/usePagination';
import { DataTablePagination } from '@/components/ui/data-table-pagination';

export const CustomListPage = () => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const pagination = usePagination({
    current: 1,
    pageSize: 20,
    total: data.length,
    showSizeChanger: true,
    pageSizeOptions: [10, 20, 50, 100],
    onPageChange: (page) => {
      // Handle page change
      fetchData(page);
    },
    onPageSizeChange: (size, page) => {
      // Handle page size change
      fetchData(page, size);
    },
  });

  return (
    <div>
      {/* Your content */}
      <DataTablePagination
        pagination={pagination}
        isLoading={isLoading}
      />
    </div>
  );
};
```

## Configuration Options

### `useTablePagination` Props

- `table`: Refine's useTable result
- `showSizeChanger`: Whether to show the page size selector (default: true)
- `pageSizeOptions`: Array of page size options (default: [10, 20, 30, 40, 50])

### `usePagination` Props

- `current`: Current page number (default: 1)
- `pageSize`: Items per page (default: 10)
- `total`: Total number of items (default: 0)
- `showSizeChanger`: Whether to show page size selector (default: true)
- `pageSizeOptions`: Array of page size options (default: [10, 20, 30, 40, 50])
- `onPageChange`: Callback when page changes
- `onPageSizeChange`: Callback when page size changes

### `DataTablePagination` Props

- `pagination`: Pagination controls from `usePagination` or `useTablePagination`
- `isLoading`: Whether data is loading (default: false)
- `className`: Additional CSS classes

## Features

- **Shadcn/ui Integration**: Uses shadcn pagination components for consistent styling
- **Page Size Selection**: Configurable dropdown for changing items per page
- **Smart Page Numbers**: Shows page numbers with ellipsis for long lists
- **First/Last Navigation**: Jump to first and last pages
- **Loading States**: Disabled controls when loading
- **Responsive Design**: Works well on different screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation

## Migration from Old Pagination

Replace your existing pagination code:

```tsx
// Old way ❌
<div className='flex items-center justify-between space-x-2 py-4'>
  <div className='text-sm text-muted-foreground'>
    Showing {startIndex} to {endIndex} of {total} entries
  </div>
  <div className='flex items-center space-x-2'>
    <Button onClick={() => setCurrent(current - 1)} disabled={current === 1}>
      Previous
    </Button>
    <Button onClick={() => setCurrent(current + 1)} disabled={current === pageCount}>
      Next
    </Button>
  </div>
</div>

// New way ✅
<DataTablePagination
  pagination={pagination}
  isLoading={isLoading}
/>
```

This provides:
- Better UX with page numbers and ellipsis
- Consistent styling across all tables
- Page size selection
- First/last page navigation
- Loading states
- Better accessibility 