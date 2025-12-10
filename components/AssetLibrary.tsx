import React from 'react';
import { MediaAsset, MediaType } from '../types';
import { Upload, Film, Image as ImageIcon, Trash2 } from 'lucide-react';

interface AssetLibraryProps {
  assets: MediaAsset[];
  onUpload: (file: File) => void;
  onDelete: (id: string) => void;
}

const AssetLibrary: React.FC<AssetLibraryProps> = ({ assets, onUpload, onDelete }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onUpload(e.target.files[0]);
    }
  };

  const handleDragStart = (e: React.DragEvent, asset: MediaAsset) => {
    e.dataTransfer.setData('application/json', JSON.stringify(asset));
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800">
      <div className="p-4 border-b border-zinc-800">
        <h2 className="text-white font-semibold mb-2">Media Library</h2>
        <label className="flex items-center justify-center w-full py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg cursor-pointer border border-dashed border-zinc-600 hover:border-zinc-500 transition-colors">
          <Upload size={16} className="text-zinc-400 mr-2" />
          <span className="text-sm text-zinc-300">Import Media</span>
          <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
        </label>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-3 content-start">
        {assets.map((asset) => (
          <div 
            key={asset.id} 
            className="group relative aspect-square bg-black rounded-lg overflow-hidden border border-zinc-800 cursor-grab active:cursor-grabbing hover:border-indigo-500/50 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, asset)}
          >
            {asset.type === MediaType.VIDEO ? (
              <video src={asset.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            ) : (
              <img src={asset.url} alt="asset" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
            )}
            
            <div className="absolute top-1 right-1 bg-black/60 rounded px-1.5 py-0.5 text-[10px] text-white flex items-center gap-1">
              {asset.type === MediaType.VIDEO ? <Film size={10} /> : <ImageIcon size={10} />}
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(asset.id); }}
              className="absolute bottom-1 right-1 p-1.5 bg-red-500/80 rounded hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={12} className="text-white" />
            </button>
          </div>
        ))}
        {assets.length === 0 && (
          <div className="col-span-2 py-8 text-center text-zinc-600 text-xs">
            No media yet.<br/>Upload or generate some!
          </div>
        )}
      </div>
    </div>
  );
};

export default AssetLibrary;