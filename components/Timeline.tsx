import React, { useRef, useState } from 'react';
import { Play, SkipBack, SkipForward, Scissors, Plus, Flag, Trash2 } from 'lucide-react';
import { TimelineClip, TimelineMarker, MediaAsset, MediaType } from '../types';

interface TimelineProps {
  clips: TimelineClip[];
  markers: TimelineMarker[];
  assets: MediaAsset[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  onDropAsset: (asset: MediaAsset, time: number, trackIndex: number) => void;
  onDeleteClip: (id: string) => void;
  onAddMarker: (time: number) => void;
  onDeleteMarker: (id: string) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
}

const Timeline: React.FC<TimelineProps> = ({
  clips,
  markers,
  assets,
  currentTime,
  duration,
  onSeek,
  onDropAsset,
  onDeleteClip,
  onAddMarker,
  onDeleteMarker,
  isPlaying,
  onTogglePlay
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const [zoom] = useState(20); // Pixels per second

  const handleRulerClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scrollLeft = timelineRef.current.scrollLeft;
    const time = (x + scrollLeft) / zoom;
    
    // If clicking top area (ruler), add marker. Otherwise just seek.
    // Simple heuristic: top 24px is ruler
    const relativeY = e.clientY - rect.top;
    if (relativeY < 24) {
      onAddMarker(time);
    } else {
      onSeek(Math.max(0, time));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent, trackIndex: number) => {
    e.preventDefault();
    if (!timelineRef.current) return;
    
    const rawData = e.dataTransfer.getData('application/json');
    if (!rawData) return;

    try {
      const asset = JSON.parse(rawData) as MediaAsset;
      const rect = timelineRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const scrollLeft = timelineRef.current.scrollLeft;
      const time = Math.max(0, (x + scrollLeft) / zoom);
      
      onDropAsset(asset, time, trackIndex);
    } catch (err) {
      console.error("Invalid drop data", err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full h-64 bg-[#09090b] border-t border-zinc-800 flex flex-col select-none">
      {/* Timeline Toolbar */}
      <div className="h-10 border-b border-zinc-800 flex items-center px-4 justify-between bg-zinc-900/50">
        <div className="flex items-center gap-4 text-zinc-400">
          <button onClick={() => onSeek(0)} className="hover:text-white"><SkipBack size={16} /></button>
          <button onClick={onTogglePlay} className="hover:text-white">
            {isPlaying ? <span className="w-4 h-4 block bg-current rounded-sm" /> : <Play size={16} className="fill-current" />}
          </button>
          <button onClick={() => onSeek(duration)} className="hover:text-white"><SkipForward size={16} /></button>
          <span className="text-xs font-mono ml-2 text-zinc-500">{formatTime(currentTime)}</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" title="Split (Coming Soon)">
            <Scissors size={14} />
          </button>
          <button 
             onClick={() => onAddMarker(currentTime)}
             className="p-1.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white" 
             title="Add Marker"
          >
            <Flag size={14} />
          </button>
        </div>
      </div>

      {/* Tracks Area */}
      <div 
        ref={timelineRef}
        className="flex-1 overflow-x-auto overflow-y-hidden relative bg-[#09090b]"
        onClick={handleRulerClick}
      >
        <div style={{ width: `${Math.max(duration + 10, 60) * zoom}px` }} className="h-full relative">
          
          {/* Time Ruler */}
          <div className="absolute top-0 left-0 right-0 h-6 border-b border-zinc-800 flex items-end pointer-events-none">
            {Array.from({ length: Math.ceil(Math.max(duration + 10, 60)) }).map((_, i) => (
              <div key={i} className="absolute bottom-0 h-2 border-l border-zinc-800 text-[10px] text-zinc-600 pl-1" style={{ left: i * zoom }}>
                {i % 5 === 0 ? `${i}s` : ''}
              </div>
            ))}
          </div>

          {/* Markers */}
          {markers.map(m => (
             <div 
                key={m.id}
                className="absolute top-0 w-3 h-3 -translate-x-1/2 cursor-pointer hover:scale-110 z-20 group"
                style={{ left: m.time * zoom }}
                onClick={(e) => { e.stopPropagation(); onDeleteMarker(m.id); }}
             >
                <Flag size={12} className="fill-indigo-500 text-indigo-500" />
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-zinc-800 text-[10px] px-1 rounded text-white opacity-0 group-hover:opacity-100 whitespace-nowrap border border-zinc-700">
                    {m.label}
                </div>
             </div>
          ))}

          {/* Track 1 (Video/Image) */}
          <div 
            className="absolute top-10 left-0 right-0 h-16 bg-zinc-900/30 border-y border-zinc-800/30"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, 0)}
          >
             <div className="absolute left-2 top-2 text-[10px] text-zinc-600 font-mono pointer-events-none">VIDEO TRACK</div>
             {clips.filter(c => c.trackIndex === 0).map(clip => {
                const asset = assets.find(a => a.id === clip.assetId);
                return (
                  <div
                    key={clip.id}
                    className="absolute top-1 bottom-1 bg-indigo-900/40 border border-indigo-500/30 rounded overflow-hidden group cursor-pointer"
                    style={{ left: clip.startOffset * zoom, width: clip.duration * zoom }}
                    onClick={(e) => { e.stopPropagation(); /* Select clip */ }}
                  >
                    {asset?.type === MediaType.VIDEO && (
                        <div className="w-full h-full flex items-center justify-center opacity-30">
                           <Play size={12} className="text-white" />
                        </div>
                    )}
                    {asset?.type === MediaType.IMAGE && (
                        <img src={asset.url} className="w-full h-full object-cover opacity-50 grayscale group-hover:grayscale-0 transition-all" alt="" />
                    )}
                    <button 
                        className="absolute top-1 right-1 p-0.5 bg-black/50 rounded hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onDeleteClip(clip.id); }}
                    >
                        <Trash2 size={10} />
                    </button>
                    <div className="absolute bottom-1 left-1 text-[10px] text-indigo-200 truncate px-1 w-full">
                       {clip.type}
                    </div>
                  </div>
                );
             })}
          </div>

          {/* Track 2 (Overlay/Text) */}
          <div 
             className="absolute top-28 left-0 right-0 h-12 bg-zinc-900/30 border-b border-zinc-800/30"
             onDragOver={handleDragOver}
             onDrop={(e) => handleDrop(e, 1)}
          >
             <div className="absolute left-2 top-2 text-[10px] text-zinc-600 font-mono pointer-events-none">OVERLAY TRACK</div>
             {clips.filter(c => c.trackIndex === 1).map(clip => (
                <div
                    key={clip.id}
                    className="absolute top-1 bottom-1 bg-purple-900/40 border border-purple-500/30 rounded overflow-hidden group cursor-pointer"
                    style={{ left: clip.startOffset * zoom, width: clip.duration * zoom }}
                >
                    <div className="w-full h-full flex items-center px-2 text-[10px] text-purple-200 truncate">
                        {clip.content || 'Overlay'}
                    </div>
                    <button 
                        className="absolute top-1 right-1 p-0.5 bg-black/50 rounded hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); onDeleteClip(clip.id); }}
                    >
                        <Trash2 size={10} />
                    </button>
                </div>
             ))}
          </div>

          {/* Playhead */}
          <div 
             className="absolute top-0 bottom-0 w-px bg-white z-30 pointer-events-none shadow-[0_0_10px_rgba(255,255,255,0.5)]"
             style={{ left: currentTime * zoom }}
          >
             <div className="absolute -top-0 -translate-x-1/2 text-white">
                <svg width="11" height="12" viewBox="0 0 11 12" fill="currentColor">
                    <path d="M0.5 0H10.5V2L5.5 12L0.5 2V0Z" />
                </svg>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Timeline;