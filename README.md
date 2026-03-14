# @elizaos/plugin-memelord

An [ElizaOS](https://elizaos.ai) plugin that integrates the [Memelord API](https://www.memelord.com) to give your AI agent the ability to generate, edit, and manage AI-powered memes and video memes through natural conversation.

## Features

- **AI Meme Generation** — Generate memes from any text prompt using AI-selected templates
- **Video Meme Generation** — Create short video memes with AI-generated captions
- **Meme Editing** — Modify text on previously generated memes
- **Video Job Polling** — Check render status and retrieve download URLs for video memes
- **Natural Language Triggers** — Actions respond to conversational phrases like "make a meme about..." or "create a video meme of..."
- **Batch Support** — Generate up to 10 image memes or 5 video memes in a single request
- **Category Filtering** — Filter templates by "trending" or "classic" categories

## Installation

```bash
# Using bun (recommended for ElizaOS projects)
bun add @elizaos/plugin-memelord

# Or clone and build from source
git clone https://github.com/NewSoulOnTheBlock/plugin-memelord.git
cd plugin-memelord
bun install
bun run build
```

## Configuration

### 1. Get an API Key

Sign up at [memelord.com](https://www.memelord.com) and navigate to **Developer Settings** to generate your API key. Keys follow the format `mlord_live_YOUR_KEY`.

### 2. Set Environment Variable

Add your API key to the agent's `.env` file:

```env
MEMELORD_API_KEY=mlord_live_YOUR_API_KEY_HERE
```

### 3. Register the Plugin

Add the plugin to your ElizaOS agent configuration:

```json
{
  "plugins": ["@elizaos/plugin-memelord"]
}
```

Or register it programmatically:

```typescript
import { memelordPlugin } from '@elizaos/plugin-memelord';

// In your agent configuration
const agent = {
  plugins: [memelordPlugin],
  // ...other config
};
```

## Actions

### GENERATE_MEME

Generates AI memes from a text prompt. The Memelord API selects the best template and places AI-generated text.

| Property | Value |
|---|---|
| **Cost** | 1 credit per meme |
| **Max per request** | 10 |
| **Output** | Direct download URLs (temporary, with expiration) |

**Trigger phrases:**
- "make a meme about..."
- "create a meme of..."
- "generate a meme about..."
- "meme about..."

**Supported options (parsed from natural language):**
- **Count** — "generate **3** memes about cats" (1-10)
- **Category** — "make a **trending** meme about coding" (`trending` or `classic`)

**Example conversation:**

```
User: make a meme about debugging at 3am
Agent: Here is your meme about "debugging at 3am":

Distracted Boyfriend
https://memelord.com/download/abc123
```

```
User: generate 3 memes about crypto trading
Agent: Here are your memes about "crypto trading":

**Meme 1:** Drake Hotline Bling
https://memelord.com/download/xyz789

**Meme 2:** Expanding Brain
https://memelord.com/download/def456

**Meme 3:** Two Buttons
https://memelord.com/download/ghi012
```

---

### GENERATE_VIDEO_MEME

Creates AI video memes with auto-generated captions. Video rendering is asynchronous — the action returns job IDs that can be polled with `CHECK_VIDEO_STATUS`.

| Property | Value |
|---|---|
| **Cost** | 5 credits per video |
| **Max per request** | 5 |
| **Output** | Job IDs (poll for mp4 URL when rendering completes) |

**Trigger phrases:**
- "make a video meme about..."
- "create a video meme of..."
- "meme video about..."

**Example conversation:**

```
User: make a video meme about AI taking over the world
Agent: Video meme for "AI taking over the world" is being rendered!

Robot Dance
Job ID: `job_abc123`

Use "check video status `job_abc123`" to check when it is ready.
```

---

### EDIT_MEME

Modifies the text on an existing meme using its template ID and layout data from a previous generation. This allows iterative refinement of meme text without changing the template.

| Property | Value |
|---|---|
| **Cost** | 1 credit |
| **Input** | Requires `templateId` and `templateData` from a prior `GENERATE_MEME` result |

**Trigger phrases:**
- "edit meme to say..."
- "change meme text..."
- "modify meme..."

**Note:** This action requires structured data (`templateId` and `templateData`) to be passed via `message.content.data`. It works best when chained after a `GENERATE_MEME` action, where the previous result provides the necessary template metadata.

**Example conversation:**

```
User: edit meme to say "when the code compiles on first try"
Agent: Here's your edited meme:

https://memelord.com/download/edited_abc123
```

---

### CHECK_VIDEO_STATUS

Polls the render status of a video meme job. Returns the mp4 download URL when rendering is complete. Video URLs expire after 7 days.

| Property | Value |
|---|---|
| **Cost** | Free |
| **Statuses** | `pending`, `completed`, `failed` |

**Trigger phrases:**
- "check video status..."
- "video status job_..."
- "is my video ready..."

**Example conversation:**

```
User: check video status job_abc123
Agent: Your video meme is ready!

Download: https://memelord.com/video/abc123.mp4

(Link expires in 7 days)
```

```
User: check video status job_xyz789
Agent: Your video meme (job `job_xyz789`) is still rendering. Check back in a moment.
```

## Architecture

The plugin follows the standard ElizaOS component-based architecture:

```
src/
├── index.ts                         # Plugin registration and exports
├── types/
│   └── index.ts                     # TypeScript interfaces and constants
├── services/
│   └── memelordService.ts           # API client (auth, HTTP, all endpoints)
├── actions/
│   ├── generateMeme.ts              # GENERATE_MEME action
│   ├── generateVideoMeme.ts         # GENERATE_VIDEO_MEME action
│   ├── editMeme.ts                  # EDIT_MEME action
│   └── checkVideoStatus.ts          # CHECK_VIDEO_STATUS action
└── providers/
    └── memelordProvider.ts           # Read-only capability context
```

### Component Responsibilities

| Component | Role |
|---|---|
| **MemelordService** | Manages authentication and HTTP communication with the Memelord API. All API calls are routed through this service. |
| **Actions** | Parse natural language input, validate triggers, delegate to the service, and format responses for the user. |
| **memelordProvider** | Supplies read-only context about available meme capabilities and credit costs to the agent's prompt context. |

## API Coverage

The plugin wraps the following Memelord API endpoints:

| Endpoint | Method | Action | Credits |
|---|---|---|---|
| `/api/v1/ai-meme` | POST | `GENERATE_MEME` | 1 x count |
| `/api/v1/ai-meme/edit` | POST | `EDIT_MEME` | 1 |
| `/api/v1/ai-video-meme` | POST | `GENERATE_VIDEO_MEME` | 5 x count |
| `/api/v1/ai-video-meme/edit` | POST | (via `MemelordService.editVideoMeme()`) | 5 |
| `/api/video/render/remote` | GET | `CHECK_VIDEO_STATUS` | 0 |

## Credit Costs

| Operation | Cost per Unit |
|---|---|
| Generate image meme | 1 credit |
| Edit image meme | 1 credit |
| Generate video meme | 5 credits |
| Edit video meme | 5 credits |
| Check video status | Free |

The `count` parameter multiplies the cost. For example, generating 3 image memes costs 3 credits, and generating 2 video memes costs 10 credits.

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Watch mode
bun run dev

# Run tests
bun test
```

### Using with ElizaOS Dev Mode

If developing inside the ElizaOS monorepo or a standalone project:

```bash
elizaos dev
```

This will auto-load the plugin, create a test character, and start an interactive chat session with hot reloading.

## Programmatic Usage

The service and types are fully exported for direct use outside of the action system:

```typescript
import { MemelordService } from '@elizaos/plugin-memelord';

// Access the service from runtime
const memelord = runtime.getService<MemelordService>('memelord');

// Generate memes programmatically
const result = await memelord.generateMeme({
  prompt: 'when the deployment succeeds on Friday',
  count: 2,
  category: 'trending',
  includeNsfw: false,
});

// Generate video memes
const videoResult = await memelord.generateVideoMeme({
  prompt: 'Monday morning standup energy',
  count: 1,
});

// Poll video job status
const status = await memelord.getVideoJobStatus('job_abc123');
if (status.status === 'completed') {
  console.log('Download:', status.mp4Url);
}

// Edit an existing meme
const edited = await memelord.editMeme({
  instruction: 'change the top text to "me explaining microservices"',
  templateId: 'tmpl_123',
  templateData: { /* from previous generation */ },
});
```

## License

UNLICENSED
