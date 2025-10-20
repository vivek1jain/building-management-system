import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  description?: string;
  disabled?: boolean;
}

export interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showSearch?: boolean;
  maxHeight?: string;
}

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

const variantClasses = {
  default: 'bg-white border border-neutral-200 hover:bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
  ghost: 'bg-transparent border border-transparent hover:bg-neutral-50 focus:bg-white focus:border-neutral-200',
  outline: 'bg-transparent border border-neutral-300 hover:bg-neutral-50 focus:ring-2 focus:ring-primary-500 focus:border-primary-500'
};

export const Dropdown: React.FC<DropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  disabled = false,
  className,
  buttonClassName,
  dropdownClassName,
  icon,
  size = 'md',
  variant = 'default',
  showSearch = false,
  maxHeight = 'max-h-60'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search term
  const filteredOptions = showSearch && searchTerm
    ? options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && showSearch && searchRef.current) {
      searchRef.current.focus();
    }
  }, [isOpen, showSearch]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      if (!isOpen) {
        setSearchTerm('');
      }
    }
  };

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
      buttonRef.current?.focus();
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isOpen) {
        handleToggle();
      }
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) {
        handleToggle();
      }
    }
  };

  return (
    <div ref={dropdownRef} className={cn("relative inline-block", className)}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "relative w-full flex items-center justify-between rounded-lg font-medium transition-colors duration-200 focus:outline-none",
          sizeClasses[size],
          variantClasses[variant],
          disabled && "opacity-50 cursor-not-allowed",
          buttonClassName
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && (
            <span className="flex-shrink-0 text-neutral-500">
              {icon}
            </span>
          )}
          {selectedOption?.icon && (
            <span className="flex-shrink-0">
              {selectedOption.icon}
            </span>
          )}
          <span className={cn(
            "truncate text-left",
            selectedOption ? "text-neutral-900" : "text-neutral-500"
          )}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        
        <ChevronDown 
          className={cn(
            "h-4 w-4 text-neutral-400 transition-transform duration-200 flex-shrink-0 ml-2",
            isOpen && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={cn(
          "absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-200 overflow-hidden",
          dropdownClassName
        )}>
          {/* Search Input */}
          {showSearch && (
            <div className="p-2 border-b border-neutral-100">
              <input
                ref={searchRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search options..."
                className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          {/* Options List */}
          <div className={cn("overflow-y-auto", maxHeight)}>
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-neutral-500 text-center">
                {showSearch && searchTerm ? 'No options found' : 'No options available'}
              </div>
            ) : (
              <div role="listbox">
                {filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    disabled={option.disabled}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150",
                      "hover:bg-neutral-50 focus:bg-neutral-50 focus:outline-none",
                      option.disabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                      value === option.value && "bg-primary-50 text-primary-700"
                    )}
                    aria-selected={value === option.value}
                  >
                    {/* Option Icon */}
                    {option.icon && (
                      <span className="flex-shrink-0 text-neutral-500">
                        {option.icon}
                      </span>
                    )}

                    {/* Option Content */}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-neutral-900 truncate">
                        {option.label}
                      </div>
                      {option.description && (
                        <div className="text-xs text-neutral-500 mt-0.5 truncate">
                          {option.description}
                        </div>
                      )}
                    </div>

                    {/* Selected Indicator */}
                    {value === option.value && (
                      <Check className="h-4 w-4 text-primary-600 flex-shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;
