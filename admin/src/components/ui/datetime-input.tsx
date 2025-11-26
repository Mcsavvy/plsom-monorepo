import * as React from 'react';
import { cn } from '@/lib/utils';

interface DateTimeInputProps
  extends Omit<React.ComponentProps<'input'>, 'type' | 'onChange'> {
  value?: string;
  onChange?: (value: string, timezone: string) => void;
  timezone?: string;
  onTimezoneChange?: (timezone: string) => void;
  className?: string;
}

const DateTimeInput = React.forwardRef<HTMLInputElement, DateTimeInputProps>(
  (
    { className, value, onChange, timezone, onTimezoneChange, ...props },
    ref
  ) => {
    // Get user's timezone
    const userTimezone = React.useMemo(() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        return 'UTC';
      }
    }, []);

    // Get available timezones
    const timezones = React.useMemo(() => {
      try {
        return Intl.supportedValuesOf('timeZone').sort();
      } catch {
        return ['UTC'];
      }
    }, []);

    const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const datetimeValue = e.target.value;
      const currentTimezone = timezone || userTimezone;

      if (onChange) {
        // Convert local datetime to ISO string with timezone
        if (datetimeValue) {
          const localDate = new Date(datetimeValue);
          const isoString = localDate.toISOString();
          onChange(isoString, currentTimezone);
        } else {
          onChange('', currentTimezone);
        }
      }
    };

    const handleTimezoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newTimezone = e.target.value;
      if (onTimezoneChange) {
        onTimezoneChange(newTimezone);
      }
    };

    // Convert ISO string back to local datetime for the input
    const localDateTimeValue = React.useMemo(() => {
      if (!value) return '';

      try {
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';

        // Format as YYYY-MM-DDTHH:MM for datetime-local input
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');

        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch {
        return '';
      }
    }, [value]);

    return (
      <div className='flex gap-2'>
        <input
          type='datetime-local'
          className={cn(
            'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
            className
          )}
          value={localDateTimeValue}
          onChange={handleDateTimeChange}
          ref={ref}
          {...props}
        />
        <select
          className='flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'
          value={timezone || userTimezone}
          onChange={handleTimezoneChange}
        >
          {timezones.map(tz => (
            <option key={tz} value={tz}>
              {tz}
            </option>
          ))}
        </select>
      </div>
    );
  }
);

DateTimeInput.displayName = 'DateTimeInput';

export { DateTimeInput };
