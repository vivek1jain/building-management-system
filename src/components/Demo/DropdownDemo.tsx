import { 
  Building, 
  User, 
  Settings, 
  Clock,
  Star,
  MapPin,
  Calendar,
  DollarSign
} from 'lucide-react';
import React, { useState } from 'react';
import { Dropdown, DropdownOption } from '../UI';

export const DropdownDemo: React.FC = () => {
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Building options with descriptions
  const buildingOptions: DropdownOption[] = [
    {
      value: 'sunset-towers',
      label: 'Sunset Towers',
      icon: <Building className="h-4 w-4" />,
      description: '120 units • Los Angeles, CA'
    },
    {
      value: 'marina-heights',
      label: 'Marina Heights',
      icon: <Building className="h-4 w-4" />,
      description: '180 units • Miami, FL'
    },
    {
      value: 'park-view',
      label: 'Park View Residence',
      icon: <Building className="h-4 w-4" />,
      description: '95 units • New York, NY'
    }
  ];

  // Supplier options with ratings
  const supplierOptions: DropdownOption[] = [
    {
      value: 'acme-plumbing',
      label: 'ACME Plumbing Services',
      icon: <User className="h-4 w-4" />,
      description: '⭐⭐⭐⭐⭐ 4.9 rating • Plumbing, HVAC'
    },
    {
      value: 'elite-electric',
      label: 'Elite Electrical Co.',
      icon: <User className="h-4 w-4" />,
      description: '⭐⭐⭐⭐ 4.7 rating • Electrical, Security'
    },
    {
      value: 'quick-maintenance',
      label: 'Quick Maintenance LLC',
      icon: <User className="h-4 w-4" />,
      description: '⭐⭐⭐⭐ 4.5 rating • General maintenance'
    },
    {
      value: 'pro-clean',
      label: 'Pro Clean Services',
      icon: <User className="h-4 w-4" />,
      description: '⭐⭐⭐⭐⭐ 4.8 rating • Cleaning, Janitorial'
    }
  ];

  // Time slot options
  const timeOptions: DropdownOption[] = [
    { value: '09:00', label: '9:00 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '10:00', label: '10:00 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '11:00', label: '11:00 AM', icon: <Clock className="h-4 w-4" /> },
    { value: '14:00', label: '2:00 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '15:00', label: '3:00 PM', icon: <Clock className="h-4 w-4" /> },
    { value: '16:00', label: '4:00 PM', icon: <Clock className="h-4 w-4" /> },
  ];

  // Status options with colors
  const statusOptions: DropdownOption[] = [
    { value: 'new', label: 'New', icon: <div className="h-2 w-2 rounded-full bg-blue-500" /> },
    { value: 'in-progress', label: 'In Progress', icon: <div className="h-2 w-2 rounded-full bg-yellow-500" /> },
    { value: 'completed', label: 'Completed', icon: <div className="h-2 w-2 rounded-full bg-green-500" /> },
    { value: 'cancelled', label: 'Cancelled', icon: <div className="h-2 w-2 rounded-full bg-red-500" /> },
  ];

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Modern Dropdown Component</h1>
        <p className="text-neutral-600 mb-8">
          Clean, consistent dropdown components that match your app's design system.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Building Selector - With Search */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Building Selection (with search)
            </label>
            <Dropdown
              options={buildingOptions}
              value={selectedBuilding}
              onChange={setSelectedBuilding}
              placeholder="Select a building..."
              icon={<Building className="h-4 w-4" />}
              size="md"
              showSearch={true}
              className="w-full"
            />
            {selectedBuilding && (
              <p className="text-xs text-neutral-500">Selected: {selectedBuilding}</p>
            )}
          </div>

          {/* Supplier Selector - Large */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Supplier Selection (large)
            </label>
            <Dropdown
              options={supplierOptions}
              value={selectedSupplier}
              onChange={setSelectedSupplier}
              placeholder="Choose supplier..."
              icon={<User className="h-4 w-4" />}
              size="lg"
              showSearch={true}
              className="w-full"
            />
          </div>

          {/* Time Selector - Small */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Time Selection (small, no search)
            </label>
            <Dropdown
              options={timeOptions}
              value={selectedTime}
              onChange={setSelectedTime}
              placeholder="Pick time..."
              size="sm"
              className="w-full"
            />
          </div>

          {/* Status Selector - Ghost variant */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-neutral-700">
              Status (ghost variant)
            </label>
            <Dropdown
              options={statusOptions}
              value={selectedStatus}
              onChange={setSelectedStatus}
              placeholder="Select status..."
              variant="ghost"
              size="md"
              className="w-full"
            />
          </div>

        </div>

        {/* Feature showcase */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="text-primary-600 mb-2">
              <Star className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Consistent Design</h3>
            <p className="text-sm text-neutral-600">
              Matches your existing button and input components perfectly.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="text-primary-600 mb-2">
              <Settings className="h-6 w-6" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Highly Configurable</h3>
            <p className="text-sm text-neutral-600">
              Multiple sizes, variants, icons, descriptions, and search functionality.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
            <div className="text-primary-600 mb-2">
              <MapPin className="h-6 w-4" />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-2">Keyboard Accessible</h3>
            <p className="text-sm text-neutral-600">
              Full keyboard navigation support with proper ARIA attributes.
            </p>
          </div>
        </div>

        {/* Usage Examples */}
        <div className="mt-12 bg-white p-6 rounded-lg shadow-sm border border-neutral-200">
          <h3 className="font-semibold text-neutral-900 mb-4">Usage Examples</h3>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-neutral-800">Basic Usage:</h4>
              <pre className="bg-neutral-100 p-3 rounded mt-1 overflow-x-auto">
{`<Dropdown
  options={options}
  value={value}
  onChange={setValue}
  placeholder="Select an option..."
/>`}
              </pre>
            </div>
            
            <div>
              <h4 className="font-medium text-neutral-800">With Icons and Search:</h4>
              <pre className="bg-neutral-100 p-3 rounded mt-1 overflow-x-auto">
{`<Dropdown
  options={supplierOptions}
  value={selectedSupplier}
  onChange={setSelectedSupplier}
  icon={<User className="h-4 w-4" />}
  showSearch={true}
  size="lg"
/>`}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
