/** Memelord API configuration */
export interface MemelordConfig {
  apiKey: string;
  baseUrl: string;
}

/** Parameters for generating memes */
export interface GenerateMemeParams {
  prompt: string;
  count?: number;
  category?: 'trending' | 'classic';
  includeNsfw?: boolean;
}

/** A single generated meme result */
export interface MemeResult {
  url: string;
  expiresAt: string;
  templateName: string;
  templateId: string;
}

/** Response from the AI meme generation endpoint */
export interface GenerateMemeResponse {
  success: boolean;
  prompt: string;
  total_generated: number;
  results: Array<{
    url: string;
    expires_at: string;
    template_name: string;
    template_id: string;
  }>;
}

/** Parameters for editing an existing meme */
export interface EditMemeParams {
  instruction: string;
  templateId: string;
  templateData: Record<string, unknown>;
  targetIndex?: number;
}

/** Response from the meme edit endpoint */
export interface EditMemeResponse {
  success: boolean;
  url: string;
  expires_at: string;
  template_id: string;
}

/** Parameters for generating video memes */
export interface GenerateVideoMemeParams {
  prompt: string;
  count?: number;
  category?: 'trending' | 'classic';
  templateId?: string;
  webhookUrl?: string;
  webhookSecret?: string;
}

/** Response from the video meme generation endpoint */
export interface GenerateVideoMemeResponse {
  success: boolean;
  jobs: Array<{
    jobId: string;
    templateId: string;
    templateName: string;
  }>;
}

/** Parameters for editing video meme captions */
export interface EditVideoMemeParams {
  instruction: string;
  templateId: string;
  caption: string;
  audioOverlayUrl?: string;
  webhookUrl?: string;
}

/** Video render job status */
export interface VideoJobStatus {
  status: 'pending' | 'completed' | 'failed';
  mp4Url?: string;
  error?: string;
}

/** Credit costs per operation */
export const CREDIT_COSTS = {
  GENERATE_MEME: 1,
  EDIT_MEME: 1,
  GENERATE_VIDEO: 5,
  EDIT_VIDEO: 5,
} as const;

/** Default API base URL */
export const MEMELORD_BASE_URL = 'https://www.memelord.com';
