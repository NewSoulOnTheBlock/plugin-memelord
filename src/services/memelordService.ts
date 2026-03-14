import type { IAgentRuntime } from '@elizaos/core';
import { Service, logger } from '@elizaos/core';
import type {
  MemelordConfig,
  GenerateMemeParams,
  GenerateMemeResponse,
  EditMemeParams,
  EditMemeResponse,
  GenerateVideoMemeParams,
  GenerateVideoMemeResponse,
  EditVideoMemeParams,
  VideoJobStatus,
} from '../types/index.js';
import { MEMELORD_BASE_URL } from '../types/index.js';

export class MemelordService extends Service {
  static serviceType = 'memelord';
  capabilityDescription = 'Generates AI memes and video memes via the Memelord API';

  private config!: MemelordConfig;

  static async start(runtime: IAgentRuntime): Promise<MemelordService> {
    const service = new MemelordService(runtime);
    await service.initialize();
    return service;
  }

  async stop(): Promise<void> {
    logger.info('Stopping MemelordService');
  }

  private async initialize(): Promise<void> {
    const apiKey = this.runtime.getSetting('MEMELORD_API_KEY');
    if (!apiKey) {
      throw new Error('MEMELORD_API_KEY is required for the Memelord plugin');
    }

    this.config = {
      apiKey,
      baseUrl: MEMELORD_BASE_URL,
    };

    logger.info('MemelordService initialized');
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Memelord API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /** Generate AI memes from a text prompt. Costs 1 credit per meme. */
  async generateMeme(params: GenerateMemeParams): Promise<GenerateMemeResponse> {
    return this.request<GenerateMemeResponse>('POST', '/api/v1/ai-meme', {
      prompt: params.prompt,
      count: params.count ?? 1,
      ...(params.category && { category: params.category }),
      include_nsfw: params.includeNsfw ?? false,
    });
  }

  /** Edit an existing meme's text. Costs 1 credit. */
  async editMeme(params: EditMemeParams): Promise<EditMemeResponse> {
    return this.request<EditMemeResponse>('POST', '/api/v1/ai-meme/edit', {
      instruction: params.instruction,
      template_id: params.templateId,
      template_data: params.templateData,
      ...(params.targetIndex !== undefined && { target_index: params.targetIndex }),
    });
  }

  /** Generate AI video memes. Costs 5 credits per video. */
  async generateVideoMeme(params: GenerateVideoMemeParams): Promise<GenerateVideoMemeResponse> {
    return this.request<GenerateVideoMemeResponse>('POST', '/api/v1/ai-video-meme', {
      prompt: params.prompt,
      count: params.count ?? 1,
      ...(params.category && { category: params.category }),
      ...(params.templateId && { template_id: params.templateId }),
      ...(params.webhookUrl && { webhookUrl: params.webhookUrl }),
      ...(params.webhookSecret && { webhookSecret: params.webhookSecret }),
    });
  }

  /** Edit video meme captions. Costs 5 credits. */
  async editVideoMeme(params: EditVideoMemeParams): Promise<GenerateVideoMemeResponse> {
    return this.request<GenerateVideoMemeResponse>('POST', '/api/v1/ai-video-meme/edit', {
      instruction: params.instruction,
      template_id: params.templateId,
      caption: params.caption,
      ...(params.audioOverlayUrl && { audio_overlay_url: params.audioOverlayUrl }),
      ...(params.webhookUrl && { webhookUrl: params.webhookUrl }),
    });
  }

  /** Poll a video render job status. */
  async getVideoJobStatus(jobId: string): Promise<VideoJobStatus> {
    return this.request<VideoJobStatus>(
      'GET',
      `/api/video/render/remote?jobId=${encodeURIComponent(jobId)}`,
    );
  }
}
