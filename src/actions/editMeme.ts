import type { Action, ActionResult, IAgentRuntime, Memory, State, HandlerCallback } from '@elizaos/core';
import { MemelordService } from '../services/memelordService.js';

export const editMemeAction: Action = {
  name: 'EDIT_MEME',

  similes: [
    'MODIFY_MEME',
    'CHANGE_MEME_TEXT',
    'UPDATE_MEME',
  ],

  description:
    'Edits the text on an existing meme using its template ID and layout data. Costs 1 credit.',

  validate: async (
    runtime: IAgentRuntime,
    message: Memory,
    _state?: State,
  ): Promise<boolean> => {
    const service = runtime.getService<MemelordService>('memelord');
    if (!service) return false;

    const text = message.content?.text?.toLowerCase() ?? '';
    return (
      (text.includes('edit') && text.includes('meme')) ||
      text.includes('change meme text') ||
      text.includes('modify meme')
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

    // Edit requires structured data - check if passed via content.data
    const data = message.content?.data as
      | { templateId?: string; templateData?: Record<string, unknown>; instruction?: string }
      | undefined;

    const templateId = data?.templateId;
    const templateData = data?.templateData;
    const instruction = data?.instruction || message.content?.text || '';

    if (!templateId || !templateData) {
      if (callback) {
        await callback({
          text: 'To edit a meme, I need the template ID and template data from a previously generated meme. Generate a meme first, then ask me to edit it.',
        });
      }
      return {
        success: false,
        error: new Error('Missing templateId or templateData for meme edit'),
      };
    }

    try {
      const response = await service.editMeme({
        instruction,
        templateId,
        templateData,
      });

      if (!response.success) {
        if (callback) {
          await callback({ text: 'Failed to edit the meme. Please try again.' });
        }
        return {
          success: false,
          error: new Error('Memelord API edit returned unsuccessful'),
        };
      }

      const responseText = `Here's your edited meme:\n\n${response.url}`;

      if (callback) {
        await callback({
          text: responseText,
          actions: ['EDIT_MEME'],
          source: message.content.source,
        });
      }

      return {
        success: true,
        text: responseText,
        data: {
          actionName: 'EDIT_MEME',
          url: response.url,
          templateId: response.template_id,
          expiresAt: response.expires_at,
        },
      };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      if (callback) {
        await callback({ text: `Failed to edit meme: ${errorMsg}` });
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
        content: {
          text: 'edit meme to say "when the code compiles on first try"',
          data: {
            templateId: 'tmpl_123',
            templateData: { render_mode: 'standard', width: 500, height: 500 },
          },
        },
      },
      {
        name: '{{agentName}}',
        content: {
          text: "Here's your edited meme:\n\nhttps://memelord.com/download/edited_abc123",
          actions: ['EDIT_MEME'],
        },
      },
    ],
  ],
};
