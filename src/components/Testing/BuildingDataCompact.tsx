import { Database, Users, Home, Truck, Package, Download, Upload, FileText, HelpCircle } from 'lucide-react';
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

interface BuildingDataCompactProps {
  addNotification: (notification: any) => void;
  currentUser: any;
}

const BuildingDataCompact: React.FC<BuildingDataCompactProps> = ({ addNotification, currentUser }) => {
  const { selectedBuildingId, selectedBuilding } = useBuilding();
  const [people, setPeople] = useState<Person[]>([]);
  const [flats, setFlats] = useState<Flat[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

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
    }
  };

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

  const handleExportSuppliers = () => {
    // Suppliers export implementation
  };

  const handleImportSuppliers = (csvText: string, buildingId: string): ImportValidationResult<any> => {
    return { valid: [], errors: [{ row: 0, field: 'general', message: 'Suppliers CSV import not yet implemented', data: {} }], warnings: [] };
  };

  const handleImportSuppliersConfirm = async (validSuppliers: Supplier[]) => {
    setSuppliers(prev => [...prev, ...validSuppliers]);
  };

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

  const dataItems = [
    {
      icon: Users,
      color: 'blue',
      title: 'People',
      count: people.length,
      dataType: 'people' as const,
      onExport: handleExportPeople,
      onImport: handleImportPeople,
      onImportConfirm: handleImportConfirm
    },
    {
      icon: Home,
      color: 'green',
      title: 'Flats',
      count: flats.length,
      dataType: 'flats' as const,
      onExport: handleExportFlats,
      onImport: handleImportFlats,
      onImportConfirm: handleImportFlatsConfirm
    },
    {
      icon: Truck,
      color: 'orange',
      title: 'Suppliers',
      count: suppliers.length,
      dataType: 'suppliers' as const,
      onExport: handleExportSuppliers,
      onImport: handleImportSuppliers,
      onImportConfirm: handleImportSuppliersConfirm
    },
    {
      icon: Package,
      color: 'purple',
      title: 'Assets',
      count: assets.length,
      dataType: 'assets' as const,
      onExport: handleExportAssets,
      onImport: handleImportAssets,
      onImportConfirm: handleImportAssetsConfirm
    }
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Tile Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Database className="h-4 w-4 text-indigo-700" />
          </div>
          <h3 className="text-base font-semibold">Building Data</h3>
        </div>
      </div>

      {/* Data Sections */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {dataItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className="border-b border-neutral-200 pb-2 last:border-b-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <Icon className={`h-3 w-3 text-${item.color}-700`} />
                  <h4 className="text-xs font-semibold">{item.title}</h4>
                </div>
                <span className="text-xs text-neutral-600">{item.count}</span>
              </div>
              <BulkImportExport
                dataType={item.dataType}
                buildings={[]}
                selectedBuildingId={selectedBuildingId || ''}
                onExport={item.onExport}
                onImport={item.onImport}
                onImportConfirm={item.onImportConfirm}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BuildingDataCompact;
