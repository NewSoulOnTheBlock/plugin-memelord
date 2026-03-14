import type { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { MemelordService } from '../services/memelordService.js';

export const generateMemeAction: Action = {
  name: 'GENERATE_MEME',

  similes: [
    'CREATE_MEME',
    'MAKE_MEME',
    'MEME_IT',
    'MAKE_A_MEME',
    'GENERATE_A_MEME',
  ],

  description:
    'Generates AI memes from a text prompt using the Memelord API. The user describes a topic or concept and receives meme images.',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const service = runtime.getService<MemelordService>('memelord');
    if (!service) return false;

    const text = message.content?.text?.toLowerCase() ?? '';
    return (
      text.includes('meme') ||
      text.includes('make a meme') ||
      text.includes('create a meme') ||
      text.includes('generate a meme') ||
      text.includes('meme about') ||
      text.includes('meme of')
    );
  },

  handler: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
    _options?: Record<string, unknown>,
    callback?: HandlerCallback,
  ): Promise<ActionResult> => {
    const service = runtime.getService<MemelordService>('memelord');
    if (!service) {
      return {
        success: false,
        error: new Error('Memelord service is not available. Check MEMELORD_API_KEY configuration.'),
      };
    }

    const text = message.content?.text ?? '';

    // Extract prompt - strip common prefixes
    let prompt = text
      .replace(/^(make|create|generate)\s+(a\s+)?meme\s+(about|of|for)?\s*/i, '')
      .replace(/^meme\s+(about|of|for)?\s*/i, '')
      .trim();

    if (!prompt) {
      prompt = text;
    }

    // Extract optional count (e.g. "3 memes about cats")
    const countMatch = text.match(/(\d+)\s+memes?\b/i);
    const count = countMatch ? Math.min(parseInt(countMatch[1], 10), 10) : 1;

    // Extract category
    let category: 'trending' | 'classic' | undefined;
    if (text.includes('trending')) category = 'trending';
    if (text.includes('classic')) category = 'classic';

    try {
      const response = await service.generateMeme({
        prompt,
        count,
        category,
        includeNsfw: false,
      });

      if (!response.success || !response.results?.length) {
        if (callback) {
          await callback({
            text: `I couldn't generate a meme for "${prompt}". Try a different topic.`,
          });
        }
        return {
          success: false,
          error: new Error('Memelord API returned no results'),
        };
      }

      const memes = response.results;
      const memeLines = memes.map(
        (m, i) => `${count > 1 ? `**Meme ${i + 1}:** ` : ''}${m.template_name}\n${m.url}`,
      );

      const responseText = [
        `Here ${count > 1 ? 'are your memes' : 'is your meme'} about "${prompt}":`,
        '',
        ...memeLines,
      ].join('\n');

      if (callback) {
        await callback({
          text: responseText,
          actions: ['GENERATE_MEME'],
          source: message.content.source,
        });
      }

      return {
        success: true,
        text: responseText,
        data: {
          actionName: 'GENERATE_MEME',
          prompt,
          memes: memes.map((m) => ({
            url: m.url,
            templateName: m.template_name,
            templateId: m.template_id,
            expiresAt: m.expires_at,
          })),
        },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({
          text: `Failed to generate meme: ${errorMsg}`,
        });
      }
      return {
        success: false,
        error: err instanceof Error ? err : new Error(errorMsg),
      };
    }
  },

  examples: [
    [
      {
        name: '{{userName}}',
        content: { text: 'make a meme about programming bugs' },
      },
      {
        name: '{{agentName}}',
        content: {
          text: 'Here is your meme about "programming bugs":\n\nDistracted Boyfriend\nhttps://memelord.com/download/abc123',
          actions: ['GENERATE_MEME'],
        },
      },
    ],
    [
      {
        name: '{{userName}}',
        content: { text: 'generate 3 memes about crypto trading' },
      },
      {
        name: '{{agentName}}',
        content: {
          text: 'Here are your memes about "crypto trading":\n\n**Meme 1:** Drake Hotline Bling\nhttps://memelord.com/download/xyz789\n\n**Meme 2:** Expanding Brain\nhttps://memelord.com/download/def456',
          actions: ['GENERATE_MEME'],
        },
      },
    ],
  ],
};
