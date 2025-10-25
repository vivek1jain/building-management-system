import React, { useState, useEffect } from 'react';
import { Download, Upload, FileText, Users, Home, Truck, Package } from 'lucide-react';
import { useBuilding } from '../../contexts/BuildingContext';
import { getPeopleByBuilding } from '../../services/peopleService';
import { getFlatsByBuilding } from '../../services/flatService';
import { supplierService } from '../../services/supplierService';
import { getAssetsByBuilding } from '../../services/buildingService';
import { exportPeopleToCSV, exportFlatsToCSV, exportAssetsToCSV } from '../../utils/csvExport';
import { importPeopleFromCSV, importAssetsFromCSV, ImportValidationResult } from '../../utils/csvImport';
import BulkImportExport from '../BuildingData/BulkImportExport';
import { Person, Flat, Supplier, Asset } from '../../types';
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
    exportPeopleToCSV(buildingPeople, buildingName);
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
    exportFlatsToCSV(buildingFlats, buildingName);
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
    exportAssetsToCSV(buildingAssets, buildingName);
  };

  const handleImportAssets = (csvText: string, buildingId: string) => {
    return importAssetsFromCSV(csvText, buildingId);
  };

  const handleImportAssetsConfirm = async (validAssets: Asset[]) => {
    setAssets(prev => [...prev, ...validAssets]);
  };

  return (
    <div className="space-y-6">
      {/* People Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <CardTitle>People Data</CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Import and export resident, tenant, and owner information
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Selected Building Info */}
            {selectedBuilding ? (
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 font-inter">
                      Current Building
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {selectedBuilding.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900 font-inter">
                      {people.length}
                    </p>
                    <p className="text-xs text-neutral-600 mt-1">
                      {people.length === 1 ? 'Person' : 'People'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-inter">
                  Please select a building to manage data import/export
                </p>
              </div>
            )}

            {/* Import/Export Actions */}
            <div className="pt-2">
              <h4 className="text-sm font-medium text-neutral-700 mb-3 font-inter">
                Data Operations
              </h4>
              <BulkImportExport
                dataType="people"
                buildings={[]}
                selectedBuildingId={selectedBuildingId || ''}
                onExport={handleExportPeople}
                onImport={handleImportPeople}
                onImportConfirm={handleImportConfirm}
              />
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-2 font-inter flex items-center gap-2">
                <FileText className="h-4 w-4" />
                How to use Import/Export
              </h4>
              <ul className="text-xs text-blue-800 space-y-1 font-inter ml-6 list-disc">
                <li>
                  <strong>Export:</strong> Downloads all people data for the selected building as a CSV file
                </li>
                <li>
                  <strong>Import:</strong> Upload a CSV file to bulk add people. The system will validate the data before importing
                </li>
                <li>
                  <strong>Template:</strong> Download a pre-formatted CSV template with example data and correct column headers
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Flats Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Home className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <CardTitle>Flats Data</CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Import and export flat/unit information and details
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedBuilding ? (
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 font-inter">Current Building</p>
                    <p className="text-xs text-neutral-600 mt-1">{selectedBuilding.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900 font-inter">{flats.length}</p>
                    <p className="text-xs text-neutral-600 mt-1">{flats.length === 1 ? 'Flat' : 'Flats'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-inter">Please select a building to manage data import/export</p>
              </div>
            )}
            <div className="pt-2">
              <h4 className="text-sm font-medium text-neutral-700 mb-3 font-inter">Data Operations</h4>
              <BulkImportExport
                dataType="flats"
                buildings={[]}
                selectedBuildingId={selectedBuildingId || ''}
                onExport={handleExportFlats}
                onImport={handleImportFlats}
                onImportConfirm={handleImportFlatsConfirm}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Truck className="h-5 w-5 text-orange-700" />
            </div>
            <div>
              <CardTitle>Suppliers Data</CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Import and export supplier and contractor information
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-neutral-900 font-inter">All Suppliers</p>
                  <p className="text-xs text-neutral-600 mt-1">Organization-wide</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-neutral-900 font-inter">{suppliers.length}</p>
                  <p className="text-xs text-neutral-600 mt-1">{suppliers.length === 1 ? 'Supplier' : 'Suppliers'}</p>
                </div>
              </div>
            </div>
            <div className="pt-2">
              <h4 className="text-sm font-medium text-neutral-700 mb-3 font-inter">Data Operations</h4>
              <BulkImportExport
                dataType="suppliers"
                buildings={[]}
                selectedBuildingId={selectedBuildingId || ''}
                onExport={handleExportSuppliers}
                onImport={handleImportSuppliers}
                onImportConfirm={handleImportSuppliersConfirm}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Data Import/Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Package className="h-5 w-5 text-purple-700" />
            </div>
            <div>
              <CardTitle>Assets Data</CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                Import and export building asset and equipment information
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedBuilding ? (
              <div className="p-4 bg-neutral-50 rounded-lg border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-900 font-inter">Current Building</p>
                    <p className="text-xs text-neutral-600 mt-1">{selectedBuilding.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900 font-inter">{assets.length}</p>
                    <p className="text-xs text-neutral-600 mt-1">{assets.length === 1 ? 'Asset' : 'Assets'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800 font-inter">Please select a building to manage data import/export</p>
              </div>
            )}
            <div className="pt-2">
              <h4 className="text-sm font-medium text-neutral-700 mb-3 font-inter">Data Operations</h4>
              <BulkImportExport
                dataType="assets"
                buildings={[]}
                selectedBuildingId={selectedBuildingId || ''}
                onExport={handleExportAssets}
                onImport={handleImportAssets}
                onImportConfirm={handleImportAssetsConfirm}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
