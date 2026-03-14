import type { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { MemelordService } from '../services/memelordService.js';

export const checkVideoStatusAction: Action = {
  name: 'CHECK_VIDEO_STATUS',

  similes: [
    'VIDEO_STATUS',
    'CHECK_MEME_VIDEO',
    'MEME_VIDEO_STATUS',
  ],

  description:
    'Checks the render status of a video meme job. Returns the download URL when completed.',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const service = runtime.getService<MemelordService>('memelord');
    if (!service) return false;

    const text = message.content?.text?.toLowerCase() ?? '';
    return (
      (text.includes('status') && (text.includes('video') || text.includes('job'))) ||
      text.includes('check video') ||
      text.includes('video ready')
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
        error: new Error('Memelord service is not available.'),
      };
    }

    const text = message.content?.text ?? '';

    // Extract job ID - look for common patterns
    const jobIdMatch =
      text.match(/job[_\s]?(?:id)?[:\s]*[`"']?([a-zA-Z0-9_-]+)[`"']?/i) ||
      text.match(/status\s+(?:of\s+)?[`"']?([a-zA-Z0-9_-]+)[`"']?/i) ||
      text.match(/check\s+(?:video\s+)?[`"']?([a-zA-Z0-9_-]+)[`"']?/i);

    if (!jobIdMatch) {
      if (callback) {
        await callback({
          text: 'Please provide a job ID to check. Example: "check video status job_abc123"',
        });
      }
      return {
        success: false,
        error: new Error('No job ID found in message'),
      };
    }

    const jobId = jobIdMatch[1];

    try {
      const status = await service.getVideoJobStatus(jobId);

      let responseText: string;
      if (status.status === 'completed' && status.mp4Url) {
        responseText = `Your video meme is ready!\n\nDownload: ${status.mp4Url}\n\n(Link expires in 7 days)`;
      } else if (status.status === 'pending') {
        responseText = `Your video meme (job \`${jobId}\`) is still rendering. Check back in a moment.`;
      } else {
        responseText = `Video meme job \`${jobId}\` failed: ${status.error || 'Unknown error'}`;
      }

      if (callback) {
        await callback({
          text: responseText,
          actions: ['CHECK_VIDEO_STATUS'],
          source: message.content.source,
        });
      }

      return {
        success: true,
        text: responseText,
        data: {
          actionName: 'CHECK_VIDEO_STATUS',
          jobId,
          status,
        },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({
          text: `Failed to check video status: ${errorMsg}`,
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
        content: { text: 'check video status job_abc123' },
      },
      {
        name: '{{agentName}}',
        content: {
          text: 'Your video meme is ready!\n\nDownload: https://memelord.com/video/abc123.mp4\n\n(Link expires in 7 days)',
          actions: ['CHECK_VIDEO_STATUS'],
        },
      },
    ],
  ],
};
