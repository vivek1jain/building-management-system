import React, { useState } from 'react'
import { Plus, Edit, Trash2, Eye } from 'lucide-react'
import { Button, Input, Modal, ModalFooter, DataTable, Card, CardHeader, CardTitle, CardContent } from '../UI'
import type { Column, TableAction } from '../UI'

// Example of how to refactor existing components using the new UI system
interface ExampleData {
  id: string
  name: string
  status: 'active' | 'inactive'
  created: Date
}

export const RefactoredExample: React.FC = () => {
  const [data, setData] = useState<ExampleData[]>([
    { id: '1', name: 'Example Item 1', status: 'active', created: new Date() },
    { id: '2', name: 'Example Item 2', status: 'inactive', created: new Date() },
  ])
  const [showModal, setShowModal] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ExampleData | null>(null)

  // BEFORE: Old approach with hardcoded styles
  // <button className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700">
  
  // AFTER: New approach with standardized Button component
  // <Button variant="primary">Add Item</Button>

  // Define table columns using the new DataTable component
  const columns: Column<ExampleData>[] = [
    {
      key: 'name',
      title: 'Name',
      dataIndex: 'name',
      sortable: true,
    },
    {
      key: 'status',
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            status === 'active'
              ? 'bg-success-100 text-success-800'
              : 'bg-neutral-100 text-neutral-800'
          }`}
        >
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      ),
    },
    {
      key: 'created',
      title: 'Created',
      dataIndex: 'created',
      render: (date: Date) => date.toLocaleDateString(),
    },
  ]

  // Define table actions
  const actions: TableAction<ExampleData>[] = [
    {
      key: 'view',
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: (record) => {
        setSelectedItem(record)
        setShowModal(true)
      },
      variant: 'outline',
    },
    {
      key: 'edit',
      label: 'Edit',
      icon: <Edit className="h-4 w-4" />,
      onClick: (record) => {
        console.log('Edit:', record)
      },
      variant: 'outline',
    },
    {
      key: 'delete',
      label: 'Delete',
      icon: <Trash2 className="h-4 w-4" />,
      onClick: (record) => {
        setData(prev => prev.filter(item => item.id !== record.id))
      },
      variant: 'danger',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header using new Card component */}
      <Card>
        <CardHeader>
          <CardTitle>Refactored Component Example</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-600">
            This demonstrates how to use the new UI components instead of hardcoded styles.
          </p>
        </CardContent>
      </Card>

      {/* Data table with standardized styling */}
      <DataTable
        data={data}
        columns={columns}
        actions={actions}
        title="Example Data"
        description="Showing how the new DataTable component works"
        searchable
        searchKeys={['name']}
        headerActions={
          <Button
            variant="primary"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setShowModal(true)}
          >
            Add Item
          </Button>
        }
      />

      {/* Modal with standardized styling */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false)
          setSelectedItem(null)
        }}
        title={selectedItem ? `View ${selectedItem.name}` : 'Add New Item'}
        size="md"
      >
        <div className="space-y-4">
          {selectedItem ? (
            // View mode
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Name</label>
                <p className="mt-1 text-sm text-neutral-900">{selectedItem.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Status</label>
                <p className="mt-1 text-sm text-neutral-900">{selectedItem.status}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Created</label>
                <p className="mt-1 text-sm text-neutral-900">{selectedItem.created.toLocaleDateString()}</p>
              </div>
            </div>
          ) : (
            // Create mode
            <div className="space-y-4">
              <Input
                label="Name"
                placeholder="Enter item name"
                required
              />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Status</label>
                <select className="w-full p-2 border border-neutral-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button
            variant="outline"
            onClick={() => {
              setShowModal(false)
              setSelectedItem(null)
            }}
          >
            {selectedItem ? 'Close' : 'Cancel'}
          </Button>
          {!selectedItem && (
            <Button variant="primary">
              Create Item
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default RefactoredExample
