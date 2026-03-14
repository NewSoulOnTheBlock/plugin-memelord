import type { IAgentRuntime, Memory, Provider, ProviderResult, State } from '@elizaos/core';
import { CREDIT_COSTS } from '../types/index.js';

export const memelordProvider: Provider = {
  name: 'MEMELORD_PROVIDER',
  description: 'Provides context about Memelord meme generation capabilities and credit costs',

  get: async (
    _runtime: IAgentRuntime,
    _message: Memory,
    _state?: State,
  ): Promise<ProviderResult> => {
    return {
      text: [
        'Memelord meme generation is available.',
        `Image meme: ${CREDIT_COSTS.GENERATE_MEME} credit per meme (up to 10 per request).`,
        `Video meme: ${CREDIT_COSTS.GENERATE_VIDEO} credits per video (up to 5 per request).`,
        `Edit meme: ${CREDIT_COSTS.EDIT_MEME} credit. Edit video: ${CREDIT_COSTS.EDIT_VIDEO} credits.`,
        'Supported categories: trending, classic.',
      ].join(' '),
      values: {
        memelordAvailable: 'true',
      },
      data: {
        creditCosts: CREDIT_COSTS,
      },
    };
  },
};
