import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';

interface Building {
  id: string;
  name: string;
  address: string;
  units: number;
  status: 'active' | 'inactive';
}

interface BuildingManagementProps {
  buildings: Building[];
  setBuildings: React.Dispatch<React.SetStateAction<Building[]>>;
  addNotification: (notification: any) => void;
  currentUser: any;
}

export const BuildingManagement: React.FC<BuildingManagementProps> = ({
  buildings,
  setBuildings,
  addNotification,
  currentUser
}) => {
  const [isAddingBuilding, setIsAddingBuilding] = useState(false);
  const [editingBuilding, setEditingBuilding] = useState<string | null>(null);
  const [newBuilding, setNewBuilding] = useState({
    name: '',
    address: '',
    units: 0,
    status: 'active' as const
  });

  const handleAddBuilding = () => {
    if (!newBuilding.name || !newBuilding.address || newBuilding.units <= 0) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Validation Error',
        message: 'Please fill in all building details correctly.',
        type: 'error'
      });
      return;
    }

    const building: Building = {
      id: `building-${Date.now()}`,
      ...newBuilding
    };

    setBuildings(prev => [...prev, building]);
    setNewBuilding({ name: '', address: '', units: 0, status: 'active' });
    setIsAddingBuilding(false);

    addNotification({
      userId: currentUser?.id || '',
      title: 'Building Added',
      message: `${building.name} has been successfully added.`,
      type: 'success'
    });
  };

  const handleEditBuilding = (buildingId: string, updatedBuilding: Partial<Building>) => {
    setBuildings(prev => prev.map(building => 
      building.id === buildingId ? { ...building, ...updatedBuilding } : building
    ));
    setEditingBuilding(null);

    addNotification({
      userId: currentUser?.id || '',
      title: 'Building Updated',
      message: 'Building details have been successfully updated.',
      type: 'success'
    });
  };

  const handleDeleteBuilding = (buildingId: string) => {
    const building = buildings.find(b => b.id === buildingId);
    if (window.confirm(`Are you sure you want to delete ${building?.name}? This action cannot be undone.`)) {
      setBuildings(prev => prev.filter(b => b.id !== buildingId));
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'Building Deleted',
        message: `${building?.name} has been successfully deleted.`,
        type: 'success'
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Building Management</h2>
          <p className="text-gray-600 mt-1">Add, edit, and manage your properties.</p>
        </div>
        <button
          onClick={() => setIsAddingBuilding(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <Plus className="w-4 h-4" />
          Add Building
        </button>
      </div>

      {/* Add Building Form */}
      {isAddingBuilding && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Building</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Building Name
              </label>
              <input
                type="text"
                value={newBuilding.name}
                onChange={(e) => setNewBuilding(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Riverside Gardens"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Units
              </label>
              <input
                type="number"
                value={newBuilding.units}
                onChange={(e) => setNewBuilding(prev => ({ ...prev, units: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 45"
                min="1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address
              </label>
              <input
                type="text"
                value={newBuilding.address}
                onChange={(e) => setNewBuilding(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 123 Thames Street, London"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={newBuilding.status}
                onChange={(e) => setNewBuilding(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleAddBuilding}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Save className="w-4 h-4" />
              Save Building
            </button>
            <button
              onClick={() => {
                setIsAddingBuilding(false);
                setNewBuilding({ name: '', address: '', units: 0, status: 'active' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Buildings List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Building Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Units
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {buildings.map((building) => (
                <tr key={building.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{building.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{building.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{building.units}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      building.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {building.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingBuilding(building.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBuilding(building.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
