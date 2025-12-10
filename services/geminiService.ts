import { GoogleGenAI } from "@google/genai";
import { AspectRatio, ImageSize, VideoResolution } from "../types";

// Define strict types for the Veo operations manually since they might be in flux
interface VeoOperation {
  done: boolean;
  response?: {
    generatedVideos?: Array<{
      video: {
        uri: string;
      };
    }>;
  };
}

// Helper to check Veo Key
export const ensureVeoKey = async (): Promise<boolean> => {
  // @ts-ignore - window.aistudio is injected by the environment
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    // @ts-ignore
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey) {
        // @ts-ignore
        await window.aistudio.openSelectKey();
        // Assume success or user cancellation (app should handle retry if needed)
        // We re-check immediately or assume strict flow
        return true; 
    }
    return true;
  }
  return true; // Fallback for environments without the specific wrapper
};

const getClient = async () => {
    // If we are doing Veo, we might need to ensure the key is fresh if selected via UI
    // For standard API usage, process.env.API_KEY is sufficient
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Generate Image using Gemini 3 Pro Image Preview (Nano Banana Pro)
 */
export const generateImage = async (
  prompt: string,
  aspectRatio: AspectRatio,
  size: ImageSize
): Promise<string> => {
  const ai = await getClient();
  
  // Mapping AspectRatio enum to API expected strings if strict match needed, 
  // but enum values match strictly here.
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio,
        imageSize: size,
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

/**
 * Edit Image using Gemini 2.5 Flash Image (Nano Banana)
 */
export const editImage = async (
  base64Image: string,
  prompt: string
): Promise<string> => {
  const ai = await getClient();
  
  const mimeType = 'image/png'; // Assuming PNG for simplicity in this demo flow
  // Remove header if present for raw data
  const rawBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: rawBase64,
            mimeType: mimeType,
          },
        },
        { text: prompt },
      ],
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No edited image returned");
};

/**
 * Analyze Image using Gemini 3 Pro Preview
 */
export const analyzeImage = async (base64Image: string): Promise<string> => {
  const ai = await getClient();
  const rawBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: rawBase64,
            mimeType: 'image/png',
          },
        },
        { text: "Analyze this image in detail. Describe the style, subject, lighting, and composition." },
      ],
    },
  });

  return response.text || "No analysis provided.";
};

/**
 * Generate Video using Veo 3.1
 */
export const generateVideo = async (
  prompt: string,
  resolution: VideoResolution,
  aspectRatio: AspectRatio
): Promise<string> => {
  await ensureVeoKey(); // Mandatory step
  const ai = await getClient();

  // Filter AR for Veo (only 16:9 or 9:16)
  let safeAr = "16:9";
  if (aspectRatio === AspectRatio.PORTRAIT) safeAr = "9:16";
  
  let operation: any = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt,
    config: {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: safeAr as any,
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Video generation failed");

  // Fetch with API key appended
  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

/**
 * Animate Image to Video using Veo 3.1
 */
export const animateImage = async (
  base64Image: string,
  resolution: VideoResolution,
  aspectRatio: AspectRatio,
  prompt?: string
): Promise<string> => {
  await ensureVeoKey();
  const ai = await getClient();
  
  const rawBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
  
  // Filter AR for Veo
  let safeAr = "16:9";
  if (aspectRatio === AspectRatio.PORTRAIT) safeAr = "9:16";

  let operation: any = await ai.models.generateVideos({
    model: 'veo-3.1-fast-generate-preview',
    prompt: prompt || "Animate this image cinematically",
    image: {
      imageBytes: rawBase64,
      mimeType: 'image/png',
    },
    config: {
      numberOfVideos: 1,
      resolution: resolution,
      aspectRatio: safeAr as any,
    }
  });

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!downloadLink) throw new Error("Image animation failed");

  const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};
