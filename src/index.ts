import type { Plugin } from '@elizaos/core';
import { logger } from '@elizaos/core';
import { generateMemeAction } from './actions/generateMeme.js';
import { generateVideoMemeAction } from './actions/generateVideoMeme.js';
import { editMemeAction } from './actions/editMeme.js';
import { checkVideoStatusAction } from './actions/checkVideoStatus.js';
import { memelordProvider } from './providers/memelordProvider.js';
import { MemelordService } from './services/memelordService.js';

/**
 * ElizaOS Plugin: Memelord
 *
 * AI meme generation via the Memelord API (https://www.memelord.com).
 *
 * ## Required Environment Variables
 * - MEMELORD_API_KEY: Your Memelord API key (mlord_live_...)
 *
 * ## Actions
 * - GENERATE_MEME: Creates AI memes from a text prompt (1 credit each)
 * - GENERATE_VIDEO_MEME: Creates AI video memes (5 credits each)
 * - EDIT_MEME: Modifies text on an existing meme (1 credit)
 * - CHECK_VIDEO_STATUS: Polls render status of a video meme job
 *
 * ## Flow
 * 1. User asks for a meme → GENERATE_MEME creates image(s) with download URLs
 * 2. User can edit → EDIT_MEME modifies the text using template data
 * 3. User asks for video → GENERATE_VIDEO_MEME starts render jobs
 * 4. User checks status → CHECK_VIDEO_STATUS returns mp4 URL when ready
 */
export const memelordPlugin: Plugin = {
  name: 'plugin-memelord',
  description:
    'AI meme and video meme generation via the Memelord API. Generate, edit, and check status of meme content.',

  actions: [
    generateMemeAction,
    generateVideoMemeAction,
    editMemeAction,
    checkVideoStatusAction,
  ],

  providers: [memelordProvider],

  services: [MemelordService as any],

  init: async (config: Record<string, string>, runtime) => {
    const apiKey = runtime.getSetting('MEMELORD_API_KEY');
    if (!apiKey) {
      logger.warn(
        '[plugin-memelord] MEMELORD_API_KEY not set. Plugin will not function until configured.',
      );
      return;
    }
    logger.info('[plugin-memelord] Initialized');
  },
};

export default memelordPlugin;

// Re-export components
export { generateMemeAction } from './actions/generateMeme.js';
export { generateVideoMemeAction } from './actions/generateVideoMeme.js';
export { editMemeAction } from './actions/editMeme.js';
export { checkVideoStatusAction } from './actions/checkVideoStatus.js';
export { memelordProvider } from './providers/memelordProvider.js';
export { MemelordService } from './services/memelordService.js';
export * from './types/index.js';
