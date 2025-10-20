import React from 'react'
import { useTheme } from '../contexts/ThemeContext'
import Button from './UI/Button'
import Input from './UI/Input'
import DataTable from './UI/DataTable'
import { Column, TableAction } from './UI/DataTable'

interface TestData {
  id: string
  name: string
  value: string
}

const testData: TestData[] = [
  { id: '1', name: 'Test Item 1', value: 'Value A' },
  { id: '2', name: 'Test Item 2', value: 'Value B' },
  { id: '3', name: 'Test Item 3', value: 'Value C' },
]

const columns: Column<TestData>[] = [
  {
    key: 'name',
    title: 'Name',
    dataIndex: 'name',
    sortable: true,
  },
  {
    key: 'value',
    title: 'Value',
    dataIndex: 'value',
    sortable: true,
  },
]

const actions: TableAction<TestData>[] = [
  {
    key: 'edit',
    label: 'Edit',
    variant: 'outline',
    onClick: (record) => console.log('Edit', record),
  },
]

const DensityTest: React.FC = () => {
  const { preferences, updatePreferences } = useTheme()

  const handleDensityChange = (density: 'compact' | 'comfortable' | 'spacious') => {
    updatePreferences({ density })
  }

  return (
    <div className="p-density-xl space-y-6">
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">Density Test Page</h2>
        <p className="text-neutral-600 mb-6">
          Test the density settings to see how spacing changes throughout the UI.
        </p>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Current Density: {preferences.density}</h3>
          <div className="flex space-density-md">
            <Button
              variant={preferences.density === 'compact' ? 'primary' : 'outline'}
              onClick={() => handleDensityChange('compact')}
            >
              Compact
            </Button>
            <Button
              variant={preferences.density === 'comfortable' ? 'primary' : 'outline'}
              onClick={() => handleDensityChange('comfortable')}
            >
              Comfortable
            </Button>
            <Button
              variant={preferences.density === 'spacious' ? 'primary' : 'outline'}
              onClick={() => handleDensityChange('spacious')}
            >
              Spacious
            </Button>
          </div>
        </div>
        
        <div className="section-spacing">
          <h3 className="text-lg font-semibold mb-3">Form Elements</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Test Input"
              placeholder="Enter something..."
            />
            <Input
              label="Another Input"
              placeholder="Type here..."
            />
          </div>
          
          <div className="flex space-density-md mt-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
          </div>
        </div>
        
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Data Table</h3>
          <DataTable
            data={testData}
            columns={columns}
            actions={actions}
            searchable
            paginated={false}
          />
        </div>
      </div>
    </div>
  )
}

export default DensityTest
