export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
}

export enum AspectRatio {
  SQUARE = '1:1',
  LANDSCAPE = '16:9',
  PORTRAIT = '9:16',
  STANDARD = '4:3',
}

export enum ImageSize {
  SIZE_1K = '1K',
  SIZE_2K = '2K',
  SIZE_4K = '4K',
}

export enum VideoResolution {
  RES_720P = '720p',
  RES_1080P = '1080p',
}

export interface MediaAsset {
  id: string;
  type: MediaType;
  url: string;
  thumbnail?: string; 
  prompt?: string;
  createdAt: number;
}

export enum AppMode {
  LIBRARY = 'LIBRARY',
  EDITOR = 'EDITOR',
}

export enum EditorTool {
  GENERATE_IMAGE = 'GENERATE_IMAGE',
  EDIT_IMAGE = 'EDIT_IMAGE',
  ANIMATE_IMAGE = 'ANIMATE_IMAGE',
  GENERATE_VIDEO = 'GENERATE_VIDEO',
  ANALYZE = 'ANALYZE',
  TEXT = 'TEXT',
  LIBRARY = 'LIBRARY',
}

// New Types for Timeline and Project State
export interface TextStyle {
  fontSize: number;
  color: string;
  backgroundColor?: string;
  fontFamily: string;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
}

export interface TimelineClip {
  id: string;
  assetId?: string; // Reference to MediaAsset
  type: 'VIDEO' | 'IMAGE' | 'TEXT' | 'AUDIO';
  startOffset: number; // Start time on timeline (seconds)
  duration: number; // Duration in seconds
  content?: string; // For text
  style?: TextStyle; // For text
  trackIndex: number; // 0 = main, 1 = overlay/text
}

export interface TimelineMarker {
  id: string;
  time: number;
  label: string;
  color: string;
}

export interface ProjectState {
  clips: TimelineClip[];
  markers: TimelineMarker[];
  duration: number; // Total timeline duration
}

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}