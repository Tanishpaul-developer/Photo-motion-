import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  EditorTool, 
  AspectRatio, 
  ImageSize, 
  VideoResolution,
  MediaType,
  MediaAsset,
  ProjectState,
  TimelineClip
} from './types';
import * as geminiService from './services/geminiService';
import ToolsPanel from './components/ToolsPanel';
import Timeline from './components/Timeline';
import AssetLibrary from './components/AssetLibrary';
import LoadingOverlay from './components/LoadingOverlay';
import { Download, LayoutTemplate, Layers, Undo2, Redo2 } from 'lucide-react';
import { useHistory } from './hooks/useHistory';

const INITIAL_PROJECT: ProjectState = {
  clips: [],
  markers: [],
  duration: 10,
};

export default function App() {
  const [activeTool, setActiveTool] = useState<EditorTool>(EditorTool.LIBRARY);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Undo/Redo Project State
  const { state: project, set: setProject, undo, redo, canUndo, canRedo } = useHistory(INITIAL_PROJECT);
  
  // Global Assets
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  
  // Playback State
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  // Keyboard Shortcuts for Undo/Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // Playback Loop
  useEffect(() => {
    let animationFrame: number;
    if (isPlaying) {
      let lastTime = performance.now();
      const loop = (time: number) => {
        const delta = (time - lastTime) / 1000;
        lastTime = time;
        setCurrentTime(t => {
          if (t >= project.duration) {
            setIsPlaying(false);
            return 0;
          }
          return Math.min(t + delta, project.duration);
        });
        animationFrame = requestAnimationFrame(loop);
      };
      animationFrame = requestAnimationFrame(loop);
    }
    return () => cancelAnimationFrame(animationFrame);
  }, [isPlaying, project.duration]);

  const addAsset = (asset: MediaAsset) => {
    setAssets(prev => [asset, ...prev]);
  };

  const handleGenerateImage = async (prompt: string, ar: AspectRatio, size: ImageSize) => {
    setIsProcessing(true);
    setLoadingMessage("Dreaming up your image with Gemini 3 Pro...");
    try {
      const base64 = await geminiService.generateImage(prompt, ar, size);
      const newAsset = {
        id: Date.now().toString(),
        type: MediaType.IMAGE,
        url: base64,
        prompt: prompt,
        createdAt: Date.now()
      };
      addAsset(newAsset);
      setActiveTool(EditorTool.LIBRARY); // Switch to library to show result
    } catch (error) {
      console.error(error);
      alert("Failed to generate image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditImage = async (image: string, prompt: string) => {
    setIsProcessing(true);
    setLoadingMessage("Applying magic edits...");
    try {
      const base64 = await geminiService.editImage(image, prompt);
      addAsset({
        id: Date.now().toString(),
        type: MediaType.IMAGE,
        url: base64,
        prompt: `Edit: ${prompt}`,
        createdAt: Date.now()
      });
      setActiveTool(EditorTool.LIBRARY);
    } catch (error) {
      console.error(error);
      alert("Failed to edit image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnimateImage = async (image: string, ar: AspectRatio, res: VideoResolution, prompt: string) => {
    setIsProcessing(true);
    setLoadingMessage("Animating with Veo...");
    try {
      const videoUrl = await geminiService.animateImage(image, res, ar, prompt);
      addAsset({
        id: Date.now().toString(),
        type: MediaType.VIDEO,
        url: videoUrl,
        prompt: `Animate: ${prompt}`,
        createdAt: Date.now()
      });
      setActiveTool(EditorTool.LIBRARY);
    } catch (error) {
      console.error(error);
      alert("Failed to animate image.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVideo = async (prompt: string, ar: AspectRatio, res: VideoResolution) => {
    setIsProcessing(true);
    setLoadingMessage("Directing scene with Veo 3...");
    try {
      const videoUrl = await geminiService.generateVideo(prompt, res, ar);
      addAsset({
        id: Date.now().toString(),
        type: MediaType.VIDEO,
        url: videoUrl,
        prompt: prompt,
        createdAt: Date.now()
      });
      setActiveTool(EditorTool.LIBRARY);
    } catch (error) {
      console.error(error);
      alert("Failed to generate video.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeImage = async (image: string) => {
    setIsProcessing(true);
    setLoadingMessage("Analyzing visual data...");
    try {
      const text = await geminiService.analyzeImage(image);
      setAnalysisResult(text);
    } catch (error) {
      console.error(error);
      alert("Failed to analyze image.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Timeline Operations
  const handleDropAsset = (asset: MediaAsset, time: number, trackIndex: number) => {
    const newClip: TimelineClip = {
      id: Date.now().toString(),
      assetId: asset.id,
      type: asset.type === MediaType.VIDEO ? 'VIDEO' : 'IMAGE',
      startOffset: time,
      duration: asset.type === MediaType.VIDEO ? 5 : 3, // Default durations
      trackIndex,
      content: ''
    };
    
    // Update Project State
    const newClips = [...project.clips, newClip];
    const newDuration = Math.max(project.duration, time + newClip.duration);
    
    setProject({ ...project, clips: newClips, duration: newDuration });
  };

  const handleAddText = (text: string, color: string, bg: string) => {
     const newClip: TimelineClip = {
        id: Date.now().toString(),
        type: 'TEXT',
        startOffset: currentTime,
        duration: 3,
        trackIndex: 1, // Overlay track
        content: text,
        style: {
           color,
           backgroundColor: bg,
           fontSize: 24,
           fontFamily: 'Inter',
           x: 50,
           y: 50
        }
     };
     setProject({ ...project, clips: [...project.clips, newClip] });
  };

  const handleDeleteClip = (id: string) => {
    setProject({ ...project, clips: project.clips.filter(c => c.id !== id) });
  };

  const handleAddMarker = (time: number) => {
     const newMarker = {
        id: Date.now().toString(),
        time,
        label: `Marker ${project.markers.length + 1}`,
        color: '#6366f1'
     };
     setProject({ ...project, markers: [...project.markers, newMarker] });
  };

  const handleDeleteMarker = (id: string) => {
    setProject({ ...project, markers: project.markers.filter(m => m.id !== id) });
  };

  // Canvas Rendering Logic
  const getActiveClip = (trackIndex: number) => {
    return project.clips.find(
       c => c.trackIndex === trackIndex && 
       currentTime >= c.startOffset && 
       currentTime < c.startOffset + c.duration
    );
  };

  const activeMainClip = getActiveClip(0);
  const activeOverlayClip = getActiveClip(1);
  const activeMainAsset = activeMainClip?.assetId ? assets.find(a => a.id === activeMainClip.assetId) : null;

  return (
    <div className="flex flex-col h-screen w-full bg-[#09090b] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      
      {/* Header */}
      <header className="h-14 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900 z-20">
        <div className="flex items-center gap-2">
           <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
             <LayoutTemplate size={18} className="text-white" />
           </div>
           <h1 className="font-bold text-lg tracking-tight">PhotoMotion</h1>
           <span className="bg-zinc-800 text-[10px] px-2 py-0.5 rounded text-zinc-400 border border-zinc-700">PRO</span>
        </div>

        <div className="flex items-center gap-4">
           {/* Undo/Redo Controls */}
           <div className="flex items-center gap-1 bg-zinc-800/50 rounded-lg p-1 border border-zinc-800 mr-2">
              <button 
                 onClick={undo} 
                 disabled={!canUndo}
                 className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                 title="Undo (Ctrl+Z)"
              >
                 <Undo2 size={16} />
              </button>
              <button 
                 onClick={redo}
                 disabled={!canRedo}
                 className="p-1.5 hover:bg-zinc-700 rounded text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                 title="Redo (Ctrl+Shift+Z)"
              >
                 <Redo2 size={16} />
              </button>
           </div>

           <button className="text-xs font-medium text-zinc-400 hover:text-white transition-colors">Help</button>
           <button className="bg-white text-black px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-zinc-200 transition-colors flex items-center gap-2">
             <Download size={14} /> Export Project
           </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Panel */}
        <ToolsPanel 
          activeTool={activeTool} 
          onToolChange={setActiveTool}
          onGenerateImage={handleGenerateImage}
          onEditImage={handleEditImage}
          onAnimateImage={handleAnimateImage}
          onGenerateVideo={handleGenerateVideo}
          onAnalyzeImage={handleAnalyzeImage}
          onAddText={handleAddText}
          isProcessing={isProcessing}
          libraryComponent={
            <AssetLibrary 
              assets={assets} 
              onUpload={(file) => {
                 const reader = new FileReader();
                 reader.onload = () => addAsset({
                   id: Date.now().toString(),
                   type: file.type.startsWith('video') ? MediaType.VIDEO : MediaType.IMAGE,
                   url: reader.result as string,
                   createdAt: Date.now()
                 });
                 reader.readAsDataURL(file);
              }}
              onDelete={(id) => setAssets(prev => prev.filter(a => a.id !== id))}
            />
          }
        />

        {/* Center: Canvas / Preview */}
        <div className="flex-1 flex flex-col relative bg-[#09090b]">
           <LoadingOverlay isProcessing={isProcessing} message={loadingMessage} />

           <div className="flex-1 flex items-center justify-center p-8 bg-[radial-gradient(#1f1f23_1px,transparent_1px)] [background-size:16px_16px]">
              
              {/* Canvas Compositor */}
              <div className="relative shadow-2xl shadow-black/50 rounded-lg overflow-hidden border border-zinc-800/50 bg-black aspect-video max-h-[60vh]">
                 
                 {/* Main Track Layer */}
                 {activeMainClip ? (
                    activeMainAsset ? (
                       activeMainAsset.type === MediaType.VIDEO ? (
                         <video 
                           src={activeMainAsset.url} 
                           className="w-full h-full object-contain"
                           // Note: Real syncing requires more complex ref management
                           // This is a simple visual approximation for the current active clip
                           ref={el => {
                              if (el && isPlaying && Math.abs(el.currentTime - (currentTime - activeMainClip.startOffset)) > 0.5) {
                                 el.currentTime = currentTime - activeMainClip.startOffset;
                                 el.play().catch(() => {});
                              } else if (el && !isPlaying) {
                                 el.pause();
                                 el.currentTime = currentTime - activeMainClip.startOffset;
                              }
                           }}
                           muted
                         />
                       ) : (
                         <img src={activeMainAsset.url} className="w-full h-full object-contain" alt="" />
                       )
                    ) : <div className="text-white">Missing Asset</div>
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-700">
                       <p>No media at {currentTime.toFixed(1)}s</p>
                    </div>
                 )}

                 {/* Overlay Track Layer (Text) */}
                 {activeOverlayClip && activeOverlayClip.type === 'TEXT' && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                       <span 
                          style={{
                             color: activeOverlayClip.style?.color,
                             backgroundColor: activeOverlayClip.style?.backgroundColor === 'transparent' ? undefined : activeOverlayClip.style?.backgroundColor,
                             padding: '0.2em 0.5em',
                             borderRadius: '4px'
                          }}
                          className="text-4xl font-bold shadow-sm"
                       >
                          {activeOverlayClip.content}
                       </span>
                    </div>
                 )}

                 {/* Analysis Overlay */}
                 {analysisResult && (
                    <div className="absolute right-4 top-4 bottom-4 w-80 bg-zinc-900/95 backdrop-blur-lg border border-zinc-700 rounded-lg p-6 overflow-y-auto shadow-2xl z-20">
                      <h3 className="text-indigo-400 font-bold mb-4 flex items-center gap-2">
                        <LayoutTemplate size={16} /> Analysis
                      </h3>
                      <p className="text-zinc-300 whitespace-pre-wrap text-sm">{analysisResult}</p>
                      <button 
                        onClick={() => setAnalysisResult(null)} 
                        className="mt-4 text-xs text-zinc-500 hover:text-zinc-300 underline"
                      >
                        Close Analysis
                      </button>
                    </div>
                 )}
              </div>

           </div>

           {/* Bottom: Timeline */}
           <Timeline 
             clips={project.clips}
             markers={project.markers}
             assets={assets}
             currentTime={currentTime}
             duration={project.duration}
             onSeek={setCurrentTime}
             onDropAsset={handleDropAsset}
             onDeleteClip={handleDeleteClip}
             onAddMarker={handleAddMarker}
             onDeleteMarker={handleDeleteMarker}
             isPlaying={isPlaying}
             onTogglePlay={() => setIsPlaying(!isPlaying)}
           />
        </div>
      </div>
    </div>
  );
}