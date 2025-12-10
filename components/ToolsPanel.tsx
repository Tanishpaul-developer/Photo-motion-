import React, { useState } from 'react';
import { 
  Wand2, Image as ImageIcon, Video, ScanEye, MousePointer2, 
  Upload, Sparkles, FolderOpen, Type, Palette
} from 'lucide-react';
import { EditorTool, AspectRatio, ImageSize, VideoResolution } from '../types';

interface ToolsPanelProps {
  activeTool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  onGenerateImage: (prompt: string, ar: AspectRatio, size: ImageSize) => void;
  onEditImage: (image: string, prompt: string) => void;
  onAnimateImage: (image: string, ar: AspectRatio, res: VideoResolution, prompt: string) => void;
  onGenerateVideo: (prompt: string, ar: AspectRatio, res: VideoResolution) => void;
  onAnalyzeImage: (image: string) => void;
  onAddText: (text: string, color: string, bg: string) => void;
  isProcessing: boolean;
  libraryComponent?: React.ReactNode;
}

const ToolsPanel: React.FC<ToolsPanelProps> = ({
  activeTool,
  onToolChange,
  onGenerateImage,
  onEditImage,
  onAnimateImage,
  onGenerateVideo,
  onAnalyzeImage,
  onAddText,
  isProcessing,
  libraryComponent
}) => {
  const [prompt, setPrompt] = useState('');
  const [selectedAR, setSelectedAR] = useState<AspectRatio>(AspectRatio.SQUARE);
  const [selectedSize, setSelectedSize] = useState<ImageSize>(ImageSize.SIZE_1K);
  const [selectedRes, setSelectedRes] = useState<VideoResolution>(VideoResolution.RES_720P);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  // Text Tool State
  const [textValue, setTextValue] = useState('New Text');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textBgColor, setTextBgColor] = useState('transparent');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (isProcessing) return;

    switch (activeTool) {
      case EditorTool.GENERATE_IMAGE:
        if (!prompt) return;
        onGenerateImage(prompt, selectedAR, selectedSize);
        break;
      case EditorTool.EDIT_IMAGE:
        if (!uploadedImage || !prompt) return;
        onEditImage(uploadedImage, prompt);
        break;
      case EditorTool.ANIMATE_IMAGE:
        if (!uploadedImage) return;
        onAnimateImage(uploadedImage, selectedAR, selectedRes, prompt);
        break;
      case EditorTool.GENERATE_VIDEO:
        if (!prompt) return;
        onGenerateVideo(prompt, selectedAR, selectedRes);
        break;
      case EditorTool.ANALYZE:
        if (!uploadedImage) return;
        onAnalyzeImage(uploadedImage);
        break;
      case EditorTool.TEXT:
        if (!textValue) return;
        onAddText(textValue, textColor, textBgColor);
        break;
    }
  };

  // Main Tabs
  const tools = [
    { id: EditorTool.LIBRARY, icon: FolderOpen, label: 'Library' },
    { id: EditorTool.GENERATE_IMAGE, icon: ImageIcon, label: 'Text to Image' },
    { id: EditorTool.TEXT, icon: Type, label: 'Text Overlay' },
    { id: EditorTool.GENERATE_VIDEO, icon: Video, label: 'Text to Video' },
    { id: EditorTool.ANIMATE_IMAGE, icon: Sparkles, label: 'Image to Video' },
    { id: EditorTool.EDIT_IMAGE, icon: MousePointer2, label: 'Magic Edit' },
    { id: EditorTool.ANALYZE, icon: ScanEye, label: 'Analyze' },
  ];

  return (
    <div className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full overflow-hidden">
      {/* Tool Selector Sidebar */}
      <div className="flex border-b border-zinc-800 bg-black/20 overflow-x-auto no-scrollbar">
        {tools.map((t) => (
          <button
            key={t.id}
            onClick={() => onToolChange(t.id)}
            className={`flex-none p-3.5 flex justify-center items-center transition-colors min-w-[50px] ${
              activeTool === t.id 
                ? 'text-indigo-400 border-b-2 border-indigo-500 bg-zinc-800/50' 
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={t.label}
          >
            <t.icon size={20} />
          </button>
        ))}
      </div>

      {activeTool === EditorTool.LIBRARY ? (
        <div className="flex-1 overflow-hidden">
          {libraryComponent}
        </div>
      ) : (
        <div className="p-5 flex-1 overflow-y-auto">
          <h2 className="text-xl font-bold text-white mb-1">
            {tools.find(t => t.id === activeTool)?.label}
          </h2>
          <p className="text-xs text-zinc-500 mb-6">
            {activeTool === EditorTool.GENERATE_IMAGE && "Create stunning images with Gemini 3 Pro."}
            {activeTool === EditorTool.EDIT_IMAGE && "Modify specific parts of an image with natural language."}
            {activeTool === EditorTool.GENERATE_VIDEO && "Create cinematic videos using Veo 3."}
            {activeTool === EditorTool.ANIMATE_IMAGE && "Bring still photos to life with Veo."}
            {activeTool === EditorTool.ANALYZE && "Get detailed insights about any image."}
            {activeTool === EditorTool.TEXT && "Add and style text overlays for your video."}
          </p>

          <div className="space-y-6">
            
            {/* Image Uploader */}
            {[EditorTool.EDIT_IMAGE, EditorTool.ANIMATE_IMAGE, EditorTool.ANALYZE].includes(activeTool) && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Source Image</label>
                <div 
                  className="border-2 border-dashed border-zinc-700 rounded-lg p-4 hover:border-zinc-500 transition-colors cursor-pointer relative group bg-zinc-900/50"
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {uploadedImage ? (
                    <div className="relative aspect-video bg-zinc-800 rounded overflow-hidden">
                      <img src={uploadedImage} alt="Upload" className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-sm">Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-6 text-zinc-500">
                      <Upload size={24} className="mb-2" />
                      <span className="text-sm">Click to upload image</span>
                    </div>
                  )}
                  <input 
                    id="file-upload" 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleFileUpload} 
                  />
                </div>
              </div>
            )}

            {/* Prompt Input */}
            {activeTool !== EditorTool.ANALYZE && activeTool !== EditorTool.TEXT && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  {activeTool === EditorTool.EDIT_IMAGE ? 'Instruction' : 'Prompt'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    activeTool === EditorTool.EDIT_IMAGE ? "e.g., Make the sky purple" :
                    activeTool === EditorTool.GENERATE_VIDEO ? "e.g., A neon hologram of a cat driving" :
                    "Describe what you want to create..."
                  }
                  className="w-full h-28 bg-zinc-800 border border-zinc-700 rounded-md p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none placeholder-zinc-500"
                />
              </div>
            )}

            {/* Text Tools */}
            {activeTool === EditorTool.TEXT && (
               <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Content</label>
                    <input 
                      type="text" 
                      value={textValue} 
                      onChange={(e) => setTextValue(e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Text Color</label>
                        <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded border border-zinc-700">
                           <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-6 h-6 bg-transparent border-0 cursor-pointer" />
                           <span className="text-xs text-zinc-300 font-mono">{textColor}</span>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Background</label>
                        <div className="flex items-center gap-2 bg-zinc-800 p-2 rounded border border-zinc-700">
                           <input type="color" value={textBgColor === 'transparent' ? '#000000' : textBgColor} onChange={(e) => setTextBgColor(e.target.value)} className="w-6 h-6 bg-transparent border-0 cursor-pointer" />
                           <div className="flex-1 flex justify-end">
                              <button onClick={() => setTextBgColor('transparent')} className="text-[10px] text-zinc-500 hover:text-white px-1">Clear</button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* Configuration Options */}
            <div className="grid grid-cols-2 gap-4">
               {[EditorTool.GENERATE_IMAGE, EditorTool.GENERATE_VIDEO, EditorTool.ANIMATE_IMAGE].includes(activeTool) && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Aspect Ratio</label>
                  <select 
                    value={selectedAR} 
                    onChange={(e) => setSelectedAR(e.target.value as AspectRatio)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={AspectRatio.SQUARE}>1:1 Square</option>
                    <option value={AspectRatio.LANDSCAPE}>16:9 Landscape</option>
                    <option value={AspectRatio.PORTRAIT}>9:16 Portrait</option>
                    <option value={AspectRatio.STANDARD}>4:3 Standard</option>
                  </select>
                </div>
              )}

              {activeTool === EditorTool.GENERATE_IMAGE && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Resolution</label>
                  <select 
                    value={selectedSize} 
                    onChange={(e) => setSelectedSize(e.target.value as ImageSize)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={ImageSize.SIZE_1K}>1K</option>
                    <option value={ImageSize.SIZE_2K}>2K (HD)</option>
                    <option value={ImageSize.SIZE_4K}>4K (UHD)</option>
                  </select>
                </div>
              )}

               {[EditorTool.GENERATE_VIDEO, EditorTool.ANIMATE_IMAGE].includes(activeTool) && (
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Quality</label>
                  <select 
                    value={selectedRes} 
                    onChange={(e) => setSelectedRes(e.target.value as VideoResolution)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value={VideoResolution.RES_720P}>720p</option>
                    <option value={VideoResolution.RES_1080P}>1080p</option>
                  </select>
                </div>
              )}
            </div>

            {/* Action Button */}
            <button
              onClick={handleSubmit}
              disabled={isProcessing || (activeTool !== EditorTool.ANALYZE && activeTool !== EditorTool.TEXT && !prompt && !uploadedImage)}
              className={`w-full py-3 rounded-md font-medium text-sm flex items-center justify-center gap-2 transition-all ${
                isProcessing 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
              }`}
            >
              {isProcessing ? 'Processing...' : (
                <>
                  {activeTool === EditorTool.TEXT ? <Plus size={16} /> : <Wand2 size={16} />}
                  {activeTool === EditorTool.TEXT ? 'Add Layer' : 'Generate'}
                </>
              )}
            </button>
             {/* Special Veo Note */}
           {[EditorTool.GENERATE_VIDEO, EditorTool.ANIMATE_IMAGE].includes(activeTool) && (
            <p className="text-[10px] text-zinc-500 text-center">
               Veo video generation requires a paid API key and may take a few minutes.
            </p>
          )}

          </div>
        </div>
      )}
    </div>
  );
};

export default ToolsPanel;
import { Plus } from 'lucide-react';