import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface DurationInputProps {
  value?: number;
  onChange?: (minutes: number) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: {
    hours?: string;
    minutes?: string;
  };
}

const DurationInput = React.forwardRef<HTMLDivElement, DurationInputProps>(
  (
    { className, value = 0, onChange, disabled, placeholder, ...props },
    ref
  ) => {
    const [hours, setHours] = React.useState<string>(() =>
      Math.floor(value / 60).toString()
    );
    const [minutes, setMinutes] = React.useState<string>(() =>
      (value % 60).toString()
    );

    const updateDuration = React.useCallback(
      (newHours: string, newMinutes: string) => {
        const h = Math.max(0, parseInt(newHours) || 0);
        const m = Math.max(0, Math.min(59, parseInt(newMinutes) || 0));
        const totalMinutes = h * 60 + m;
        onChange?.(totalMinutes);
      },
      [onChange]
    );

    const handleHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      setHours(value);
      updateDuration(value, minutes);
    };

    const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value.replace(/[^0-9]/g, '');
      const limitedValue = Math.min(parseInt(value) || 0, 59).toString();
      setMinutes(limitedValue === '0' && value === '' ? '' : limitedValue);
      updateDuration(
        hours,
        limitedValue === '0' && value === '' ? '0' : limitedValue
      );
    };

    React.useEffect(() => {
      setHours(Math.floor(value / 60).toString());
      setMinutes((value % 60).toString());
    }, [value]);

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        <div className='flex items-center gap-1'>
          <Input
            type='text'
            value={hours}
            onChange={handleHoursChange}
            disabled={disabled}
            placeholder={placeholder?.hours || '0'}
            className='w-16 text-center'
            min='0'
          />
          <span className='text-sm text-muted-foreground'>h</span>
        </div>
        <div className='flex items-center gap-1'>
          <Input
            type='text'
            value={minutes}
            onChange={handleMinutesChange}
            disabled={disabled}
            placeholder={placeholder?.minutes || '0'}
            className='w-16 text-center'
            min='0'
            max='59'
          />
          <span className='text-sm text-muted-foreground'>m</span>
        </div>
      </div>
    );
  }
);

DurationInput.displayName = 'DurationInput';

export { DurationInput };
