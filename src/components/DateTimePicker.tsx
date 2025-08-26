import React, { useState, useEffect } from 'react';
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
    selectedDate ? selectedDate.toISOString().slice(0, 10) : ''
  );
  const [timeValue, setTimeValue] = useState(
    selectedDate ? selectedDate.toTimeString().slice(0, 5) : '09:00'
  );

  // Generate time options (every 30 minutes)
  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const displayTime = `${hour === 0 ? 12 : hour > 12 ? hour - 12 : hour}:${minute.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
        options.push({ value: timeString, label: displayTime });
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  useEffect(() => {
    // Update combined date/time when either value changes
    if (dateValue && timeValue) {
      const combinedDateTime = new Date(`${dateValue}T${timeValue}`);
      if (!isNaN(combinedDateTime.getTime())) {
        onDateTimeChange(combinedDateTime);
      }
    }
  }, [dateValue, timeValue, onDateTimeChange]);

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDateValue(event.target.value);
  };

  const handleTimeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setTimeValue(event.target.value);
  };

  const minDateString = minDate ? minDate.toISOString().slice(0, 10) : undefined;

  return (
    <div className={`${className}`}>
      {/* Date and Time Picker Side by Side */}
      <div className="grid grid-cols-2 gap-4">
        {/* Date Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-600">Date</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <input
              type="date"
              value={dateValue}
              onChange={handleDateChange}
              min={minDateString}
              className="w-full h-10 pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm font-inter"
            />
          </div>
        </div>

        {/* Time Picker */}
        <div className="space-y-2">
          <label className="block text-xs font-medium text-neutral-600">Time</label>
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none z-10" />
            <select
              value={timeValue}
              onChange={handleTimeChange}
              className="w-full h-10 pl-10 pr-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white appearance-none font-inter"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                backgroundPosition: 'right 0.5rem center',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '1.5em 1.5em'
              }}
            >
              {timeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
