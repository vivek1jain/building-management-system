import { useState } from 'react';
import { MoreVertical, FileText, Eye } from 'lucide-react';

interface ResidentActionMenuProps {
  onGenerate: () => void;
  onPreview: () => void;
  isLoading?: boolean;
}

export function ResidentActionMenu({
  onGenerate,
  onPreview,
  isLoading = false
}: ResidentActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="p-1 hover:bg-neutral-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Actions"
      >
        <MoreVertical className="h-4 w-4 text-neutral-400" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute right-0 mt-1 w-40 bg-white border border-neutral-200 rounded-lg shadow-lg z-40">
            <button
              onClick={() => {
                onGenerate();
                setIsOpen(false);
              }}
              disabled={isLoading}
              className="w-full text-left px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter flex items-center gap-2 border-b border-neutral-100"
            >
              <FileText className="h-4 w-4" />
              Generate
            </button>
            
            <button
              onClick={() => {
                onPreview();
                setIsOpen(false);
              }}
              disabled={isLoading}
              className="w-full text-left px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-inter flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </button>
          </div>
        </>
      )}
    </div>
  );
}
