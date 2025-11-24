import { X, FileText } from 'lucide-react';

interface BulkActionBarProps {
  selectedCount: number;
  onGenerateStatements: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onGenerateStatements,
  onClearSelection,
  isLoading = false
}: BulkActionBarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 shadow-lg z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="text-sm font-medium text-neutral-700 font-inter">
          {selectedCount} resident{selectedCount !== 1 ? 's' : ''} selected
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={onClearSelection}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-50 hover:bg-neutral-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter"
          >
            Clear Selection
          </button>
          
          <button
            onClick={onGenerateStatements}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Generate Statements
          </button>
        </div>
      </div>
    </div>
  );
}
