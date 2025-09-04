import React, { useState } from 'react'
import { Dropdown, DropdownOption } from '../UI'

const DropdownTest: React.FC = () => {
  const [selectedValue, setSelectedValue] = useState<string>('option1')

  const testOptions: DropdownOption[] = [
    { value: 'option1', label: 'Option 1', description: 'First option' },
    { value: 'option2', label: 'Option 2', description: 'Second option' },
    { value: 'option3', label: 'Option 3', description: 'Third option' },
  ]

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">Dropdown Component Test</h1>
      
      {/* Basic Dropdown Test */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Basic Dropdown:</label>
        <Dropdown
          options={testOptions}
          value={selectedValue}
          onChange={setSelectedValue}
          placeholder="Select an option..."
        />
        <p className="text-sm text-gray-600">Selected: {selectedValue}</p>
      </div>

      {/* Dropdown with Search */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Dropdown with Search:</label>
        <Dropdown
          options={testOptions}
          value={selectedValue}
          onChange={setSelectedValue}
          placeholder="Select with search..."
          showSearch={true}
        />
      </div>

      {/* Different Variants */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Ghost Variant:</label>
        <Dropdown
          options={testOptions}
          value={selectedValue}
          onChange={setSelectedValue}
          placeholder="Ghost variant..."
          variant="ghost"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium">Outline Variant:</label>
        <Dropdown
          options={testOptions}
          value={selectedValue}
          onChange={setSelectedValue}
          placeholder="Outline variant..."
          variant="outline"
        />
      </div>

      {/* Debug Info */}
      <div className="bg-gray-100 p-4 rounded">
        <h3 className="font-medium mb-2">Debug Info:</h3>
        <p>Selected Value: {selectedValue}</p>
        <p>Options Count: {testOptions.length}</p>
        <p>React Version: {React.version}</p>
      </div>
    </div>
  )
}

export default DropdownTest
