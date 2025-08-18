import React, { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';

interface DateTimePickerProps {
  selectedDate?: Date;
  onDateTimeChange: (date: Date) => void;
  minDate?: Date;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const DateTimePicker: React.FC<DateTimePickerProps> = ({
  selectedDate,
  onDateTimeChange,
  minDate,
  label,
  placeholder = "Select date and time",
  className = ""
}) => {
  const [dateValue, setDateValue] = useState(
    selectedDate ? selectedDate.toISOString().slice(0, 16) : ''
  );

  const handleDateTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setDateValue(value);
    
    if (value) {
      const date = new Date(value);
      onDateTimeChange(date);
    }
  };

  const minDateString = minDate ? minDate.toISOString().slice(0, 16) : undefined;

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-neutral-700">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Calendar className="h-4 w-4 text-neutral-400" />
        </div>
        <input
          type="datetime-local"
          value={dateValue}
          onChange={handleDateTimeChange}
          min={minDateString}
          placeholder={placeholder}
          className="block w-full pl-10 pr-3 py-2 border border-neutral-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <Clock className="h-4 w-4 text-neutral-400" />
        </div>
      </div>
    </div>
  );
};
