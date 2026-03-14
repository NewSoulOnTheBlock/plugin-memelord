import type { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { MemelordService } from '../services/memelordService.js';

export const generateVideoMemeAction: Action = {
  name: 'GENERATE_VIDEO_MEME',

  similes: [
    'CREATE_VIDEO_MEME',
    'MAKE_VIDEO_MEME',
    'MEME_VIDEO',
  ],

  description:
    'Generates AI video memes from a text prompt using the Memelord API. Costs 5 credits per video. Results are delivered asynchronously.',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const service = runtime.getService<MemelordService>('memelord');
    if (!service) return false;

    const text = message.content?.text?.toLowerCase() ?? '';
    return (
      (text.includes('video') && text.includes('meme')) ||
      text.includes('video meme') ||
      text.includes('meme video')
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

    // Extract prompt
    let prompt = text
      .replace(/^(make|create|generate)\s+(a\s+)?video\s+meme\s+(about|of|for)?\s*/i, '')
      .replace(/^video\s+meme\s+(about|of|for)?\s*/i, '')
      .replace(/^meme\s+video\s+(about|of|for)?\s*/i, '')
      .trim();

    if (!prompt) {
      prompt = text;
    }

    // Extract optional count
    const countMatch = text.match(/(\d+)\s+video/i);
    const count = countMatch ? Math.min(parseInt(countMatch[1], 10), 5) : 1;

    // Extract category
    let category: 'trending' | 'classic' | undefined;
    if (text.includes('trending')) category = 'trending';
    if (text.includes('classic')) category = 'classic';

    try {
      const response = await service.generateVideoMeme({
        prompt,
        count,
        category,
      });

      if (!response.success || !response.jobs?.length) {
        if (callback) {
          await callback({
            text: `I couldn't generate a video meme for "${prompt}". Try a different topic.`,
          });
        }
        return {
          success: false,
          error: new Error('Memelord API returned no video jobs'),
        };
      }

      const jobs = response.jobs;
      const jobLines = jobs.map(
        (j, i) =>
          `${count > 1 ? `**Video ${i + 1}:** ` : ''}${j.templateName}\nJob ID: \`${j.jobId}\``,
      );

      const responseText = [
        `Video meme${count > 1 ? 's' : ''} for "${prompt}" ${count > 1 ? 'are' : 'is'} being rendered!`,
        '',
        ...jobLines,
        '',
        `Use "check video status \`<jobId>\`" to check when ${count > 1 ? 'they are' : 'it is'} ready.`,
      ].join('\n');

      if (callback) {
        await callback({
          text: responseText,
          actions: ['GENERATE_VIDEO_MEME'],
          source: message.content.source,
        });
      }

      return {
        success: true,
        text: responseText,
        data: {
          actionName: 'GENERATE_VIDEO_MEME',
          prompt,
          jobs,
        },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({
          text: `Failed to generate video meme: ${errorMsg}`,
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
        content: { text: 'make a video meme about AI taking over' },
      },
      {
        name: '{{agentName}}',
        content: {
          text: 'Video meme for "AI taking over" is being rendered!\n\nRobot Dance\nJob ID: `job_abc123`\n\nUse "check video status `job_abc123`" to check when it is ready.',
          actions: ['GENERATE_VIDEO_MEME'],
        },
      },
    ],
  ],
};
