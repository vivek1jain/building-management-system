import { Download, Upload, FileText, Users, Home, Truck, Package, HelpCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useBuilding } from '../../contexts/BuildingContext';
import { getAssetsByBuilding } from '../../services/buildingService';
import { getFlatsByBuilding } from '../../services/flatService';
import { getPeopleByBuilding } from '../../services/peopleService';
import { supplierService } from '../../services/supplierService';
import { Person, Flat, Supplier, Asset } from '../../types';
import { exportPeopleToCSV, exportFlatsToCSV, exportAssetsToCSV } from '../../utils/csvExport';
import { importPeopleFromCSV, importAssetsFromCSV, ImportValidationResult } from '../../utils/csvImport';
import BulkImportExport from '../BuildingData/BulkImportExport';
import { Card, CardContent, CardHeader, CardTitle } from '../UI';

interface SharingSettingsProps {
  addNotification: (notification: any) => void;
  currentUser: any;
}

export const SharingSettings: React.FC<SharingSettingsProps> = ({
  addNotification,
  currentUser
}) => {
  const { selectedBuildingId, selectedBuilding } = useBuilding();
  const [people, setPeople] = useState<Person[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedBuildingId) {
      loadPeople();
      loadFlats();
      loadSuppliers();
      loadAssets();
    }
  }, [selectedBuildingId]);

  const loadPeople = async () => {
    if (!selectedBuildingId) return;
    
    try {
      const buildingPeople = await getPeopleByBuilding(selectedBuildingId);
      setPeople(buildingPeople);
    } catch (error) {
      console.error('Error loading people:', error);
    }
  };

  const loadFlats = async () => {
    if (!selectedBuildingId) return;
    try {
      const buildingFlats = await getFlatsByBuilding(selectedBuildingId);
      setFlats(buildingFlats);
    } catch (error) {
      console.error('Error loading flats:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const allSuppliers = await supplierService.getSuppliers();
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadAssets = async () => {
    if (!selectedBuildingId) return;
    try {
      const buildingAssets = await getAssetsByBuilding(selectedBuildingId);
      setAssets(buildingAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    }
  };

  const handleExportPeople = (buildingId: string, buildingName?: string) => {
    const buildingPeople = people.filter(person => person.buildingId === buildingId);
    const peopleWithActive = buildingPeople.map(p => ({ ...p, isActive: true }));
    exportPeopleToCSV(peopleWithActive, buildingName);
  };

  const handleImportPeople = (csvText: string, buildingId: string): ImportValidationResult<Person> => {
    return importPeopleFromCSV(csvText, buildingId);
  };

  const handleImportConfirm = async (validPeople: Person[]) => {
    if (!currentUser) return;
    try {
      setPeople(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newPeople = validPeople.filter(p => !existingIds.has(p.id));
        return [...prev, ...newPeople];
      });
      addNotification({
        title: 'Success',
        message: `${validPeople.length} people imported successfully`,
        type: 'success',
        userId: currentUser.id
      });
    } catch (error) {
      console.error('Error importing people:', error);
      addNotification({
        title: 'Error',
        message: 'Failed to import people',
        type: 'error',
        userId: currentUser.id
      });
    }
  };

  // Flats handlers
  const handleExportFlats = (buildingId: string, buildingName?: string) => {
    const buildingFlats = flats.filter(flat => flat.buildingId === buildingId);
    const flatsWithActive = buildingFlats.map(f => ({ ...f, isActive: true }));
    exportFlatsToCSV(flatsWithActive, buildingName);
  };

  const handleImportFlats = (csvText: string, buildingId: string): ImportValidationResult<any> => {
    return { valid: [], errors: [{ row: 0, field: 'general', message: 'Flats CSV import not yet implemented', data: {} }], warnings: [] };
  };

  const handleImportFlatsConfirm = async (validFlats: Flat[]) => {
    setFlats(prev => [...prev, ...validFlats]);
  };

  // Suppliers handlers
  const handleExportSuppliers = () => {
    // Suppliers export implementation
  };

  const handleImportSuppliers = (csvText: string, buildingId: string): ImportValidationResult<any> => {
    return { valid: [], errors: [{ row: 0, field: 'general', message: 'Suppliers CSV import not yet implemented', data: {} }], warnings: [] };
  };

  const handleImportSuppliersConfirm = async (validSuppliers: Supplier[]) => {
    setSuppliers(prev => [...prev, ...validSuppliers]);
  };

  // Assets handlers
  const handleExportAssets = (buildingId: string, buildingName?: string) => {
    const buildingAssets = assets.filter(asset => asset.buildingId === buildingId);
    const assetsWithActive = buildingAssets.map(a => ({ ...a, isActive: true }));
    exportAssetsToCSV(assetsWithActive, buildingName);
  };

  const handleImportAssets = (csvText: string, buildingId: string) => {
    return importAssetsFromCSV(csvText, buildingId);
  };

  const handleImportAssetsConfirm = async (validAssets: Asset[]) => {
    setAssets(prev => [...prev, ...validAssets]);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {/* People Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-4 w-4 text-blue-700" />
              </div>
              <CardTitle className="text-base">People</CardTitle>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                <p className="font-medium mb-2">Import/Export People Data</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Export:</strong> Download CSV of all people</li>
                  <li><strong>Import:</strong> Bulk add people from CSV</li>
                  <li><strong>Template:</strong> Get pre-formatted CSV</li>
                </ul>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedBuilding ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{selectedBuilding.name}</span>
                <span className="font-medium">{people.length} {people.length === 1 ? 'person' : 'people'}</span>
              </div>
            ) : (
              <p className="text-sm text-yellow-600">Select a building</p>
            )}
            <BulkImportExport
              dataType="people"
              buildings={[]}
              selectedBuildingId={selectedBuildingId || ''}
              onExport={handleExportPeople}
              onImport={handleImportPeople}
              onImportConfirm={handleImportConfirm}
            />
          </div>
        </CardContent>
      </Card>

      {/* Flats Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Home className="h-4 w-4 text-green-700" />
              </div>
              <CardTitle className="text-base">Flats</CardTitle>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                <p className="font-medium mb-2">Import/Export Flats Data</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Export:</strong> Download CSV of all flats</li>
                  <li><strong>Import:</strong> Bulk add flats from CSV</li>
                  <li><strong>Template:</strong> Get pre-formatted CSV</li>
                </ul>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedBuilding ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{selectedBuilding.name}</span>
                <span className="font-medium">{flats.length} {flats.length === 1 ? 'flat' : 'flats'}</span>
              </div>
            ) : (
              <p className="text-sm text-yellow-600">Select a building</p>
            )}
            <BulkImportExport
              dataType="flats"
              buildings={[]}
              selectedBuildingId={selectedBuildingId || ''}
              onExport={handleExportFlats}
              onImport={handleImportFlats}
              onImportConfirm={handleImportFlatsConfirm}
            />
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Truck className="h-4 w-4 text-orange-700" />
              </div>
              <CardTitle className="text-base">Suppliers</CardTitle>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                <p className="font-medium mb-2">Import/Export Suppliers Data</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Export:</strong> Download CSV of all suppliers</li>
                  <li><strong>Import:</strong> Bulk add suppliers from CSV</li>
                  <li><strong>Template:</strong> Get pre-formatted CSV</li>
                </ul>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">Organization-wide</span>
              <span className="font-medium">{suppliers.length} {suppliers.length === 1 ? 'supplier' : 'suppliers'}</span>
            </div>
            <BulkImportExport
              dataType="suppliers"
              buildings={[]}
              selectedBuildingId={selectedBuildingId || ''}
              onExport={handleExportSuppliers}
              onImport={handleImportSuppliers}
              onImportConfirm={handleImportSuppliersConfirm}
            />
          </div>
        </CardContent>
      </Card>

      {/* Assets Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="h-4 w-4 text-purple-700" />
              </div>
              <CardTitle className="text-base">Assets</CardTitle>
            </div>
            <div className="group relative">
              <HelpCircle className="h-4 w-4 text-neutral-400 hover:text-neutral-600 cursor-help" />
              <div className="absolute right-0 top-6 w-64 p-3 bg-neutral-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 shadow-lg">
                <p className="font-medium mb-2">Import/Export Assets Data</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li><strong>Export:</strong> Download CSV of all assets</li>
                  <li><strong>Import:</strong> Bulk add assets from CSV</li>
                  <li><strong>Template:</strong> Get pre-formatted CSV</li>
                </ul>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {selectedBuilding ? (
              <div className="flex items-center justify-between text-sm">
                <span className="text-neutral-600">{selectedBuilding.name}</span>
                <span className="font-medium">{assets.length} {assets.length === 1 ? 'asset' : 'assets'}</span>
              </div>
            ) : (
              <p className="text-sm text-yellow-600">Select a building</p>
            )}
            <BulkImportExport
              dataType="assets"
              buildings={[]}
              selectedBuildingId={selectedBuildingId || ''}
              onExport={handleExportAssets}
              onImport={handleImportAssets}
              onImportConfirm={handleImportAssetsConfirm}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
