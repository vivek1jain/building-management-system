import React, { useState } from 'react';
import { UserPlus, Edit, Trash2, Save, X, Eye, EyeOff } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'resident';
  status: 'active' | 'inactive';
  buildings: string[];
}

interface Building {
  id: string;
  name: string;
  address: string;
  units: number;
  status: string;
}

interface UserManagementProps {
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  buildings: Building[];
  addNotification: (notification: any) => void;
  currentUser: any;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users,
  setUsers,
  buildings,
  addNotification,
  currentUser
}) => {
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'resident' as const,
    status: 'active' as const,
    buildings: [] as string[]
  });

  const generatePassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUser(prev => ({ ...prev, password }));
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Validation Error',
        message: 'Please fill in all required user details.',
        type: 'error'
      });
      return;
    }

    if (users.some(user => user.email === newUser.email)) {
      addNotification({
        userId: currentUser?.id || '',
        title: 'Email Already Exists',
        message: 'A user with this email address already exists.',
        type: 'error'
      });
      return;
    }

    const user: User = {
      id: `user-${Date.now()}`,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: newUser.status,
      buildings: newUser.buildings
    };

    setUsers(prev => [...prev, user]);
    setNewUser({ name: '', email: '', password: '', role: 'resident', status: 'active', buildings: [] });
    setIsAddingUser(false);

    addNotification({
      userId: currentUser?.id || '',
      title: 'User Created',
      message: `${user.name} has been successfully created with temporary password.`,
      type: 'success'
    });
  };

  const handleEditUser = (userId: string, updatedUser: Partial<User>) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, ...updatedUser } : user
    ));
    setEditingUser(null);

    addNotification({
      userId: currentUser?.id || '',
      title: 'User Updated',
      message: 'User details have been successfully updated.',
      type: 'success'
    });
  };

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (window.confirm(`Are you sure you want to delete ${user?.name}? This action cannot be undone.`)) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      addNotification({
        userId: currentUser?.id || '',
        title: 'User Deleted',
        message: `${user?.name} has been successfully deleted.`,
        type: 'success'
      });
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'resident': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
          <p className="text-gray-600 mt-1">Create and manage user accounts with role-based access.</p>
        </div>
        <button
          onClick={() => setIsAddingUser(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <UserPlus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Add User Form */}
      {isAddingUser && (
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., John Smith"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., john@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newUser.password}
                  onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter password"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="px-2 py-1 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={generatePassword}
                    className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800"
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="resident">Resident</option>
                <option value="manager">Building Manager</option>
                <option value="admin">System Admin</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Assigned Buildings
              </label>
              <div className="space-y-2">
                {buildings.map(building => (
                  <label key={building.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={newUser.buildings.includes(building.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setNewUser(prev => ({ ...prev, buildings: [...prev.buildings, building.id] }));
                        } else {
                          setNewUser(prev => ({ ...prev, buildings: prev.buildings.filter(id => id !== building.id) }));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{building.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <button
              onClick={handleAddUser}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Save className="w-4 h-4" />
              Create User
            </button>
            <button
              onClick={() => {
                setIsAddingUser(false);
                setNewUser({ name: '', email: '', password: '', role: 'resident', status: 'active', buildings: [] });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Buildings
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
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.buildings.map(buildingId => {
                        const building = buildings.find(b => b.id === buildingId);
                        return building?.name;
                      }).filter(Boolean).join(', ') || 'None'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setEditingUser(user.id)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
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
