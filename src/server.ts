import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sendTextMessage } from './tools/sendTextMessage.js';
import { sendCardsV2Message } from './tools/sendCardsV2Message.js';
import { sendMarkdownMessage } from './tools/sendMarkdownMessage.js';
import { startLogCleanupScheduler } from './utils/logCleaner.js';
import { logger } from './utils/logger.js';

/**
 * Validate Google Chat webhook URL format
 */
function validateWebhookUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);
    
    // Must be HTTPS
    if (parsed.protocol !== 'https:') {
      return { valid: false, error: 'Webhook URL must use HTTPS protocol' };
    }
    
    // Must be chat.googleapis.com domain
    if (parsed.hostname !== 'chat.googleapis.com') {
      return { valid: false, error: 'Webhook URL must be from chat.googleapis.com domain' };
    }
    
    // Must have /v1/spaces/ path
    if (!parsed.pathname.startsWith('/v1/spaces/')) {
      return { valid: false, error: 'Webhook URL must have /v1/spaces/ path' };
    }
    
    // Must have key parameter
    if (!parsed.searchParams.has('key') && !parsed.searchParams.has('token')) {
      return { valid: false, error: 'Webhook URL must have key or token parameter' };
    }
    
    return { valid: true };
  } catch (err) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export async function startServer() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL || undefined;
  
  if (!webhook) {
    const error = 'GOOGLE_CHAT_WEBHOOK_URL environment variable is not set';
    logger.error('server', 'server_start_failed', { error });
    console.error(`❌ Error: ${error}`);
    console.error('');
    console.error('Please set GOOGLE_CHAT_WEBHOOK_URL environment variable with a valid Google Chat webhook URL.');
    console.error('Example: https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=YOUR_KEY&token=YOUR_TOKEN');
    process.exit(1);
  }
  
  // Validate webhook URL format
  const validation = validateWebhookUrl(webhook);
  if (!validation.valid) {
    logger.error('server', 'invalid_webhook_url', { error: validation.error, url: webhook });
    console.error(`❌ Error: Invalid GOOGLE_CHAT_WEBHOOK_URL - ${validation.error}`);
    console.error('');
    console.error('Provided URL:', webhook);
    console.error('');
    console.error('Expected format:');
    console.error('https://chat.googleapis.com/v1/spaces/SPACE_ID/messages?key=YOUR_KEY&token=YOUR_TOKEN');
    process.exit(1);
  }
  
  logger.info('server', 'server_starting', { webhookDomain: new URL(webhook).hostname });

  // Start log cleanup scheduler (runs every 24 hours)
  startLogCleanupScheduler(24);

  const server = new McpServer({ name: 'google-chat-webhook', version: '0.1.2' });

  // Register tool: send_google_chat_text
  const sendTextHandler = (async ({ text }: { text: string }) => {
    try {
      await sendTextMessage({ text }, webhook);
      const out = { success: true };
      return { content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out };
    } catch (err: unknown) {
      const e = err as Error;
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }) as any;

  server.registerTool(
    'send_google_chat_text',
    {
      title: 'Send Google Chat Text',
      description: 'Send a text message to configured Google Chat webhook',
      inputSchema: ( { text: z.string() } as unknown ) as any,
      outputSchema: ( { success: z.boolean() } as unknown ) as any
    },
    sendTextHandler
  );

  // Register tool: send_google_chat_cards_v2
  const sendCardsHandler = (async ({ text, cardsV2 }: { text?: string; cardsV2: any[] }) => {
    try {
      await sendCardsV2Message({ text, cardsV2 }, webhook);
      const out = { success: true };
      return { content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out };
    } catch (err: unknown) {
      const e = err as Error;
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }) as any;

  server.registerTool(
    'send_google_chat_cards_v2',
    {
      title: 'Send Google Chat Cards V2',
      description: 'Send a Cards V2 message to configured Google Chat webhook',
      inputSchema: ( { text: z.string().optional(), cardsV2: z.array(z.any()) } as unknown ) as any,
      outputSchema: ( { success: z.boolean() } as unknown ) as any
    },
    sendCardsHandler
  );

  // Register tool: send_google_chat_markdown
  const sendMarkdownHandler = (async ({ markdown, cardTitle, fallbackToText }: { markdown: string; cardTitle?: string; fallbackToText?: boolean }) => {
    try {
      const result = await sendMarkdownMessage(webhook || '', { markdown, cardTitle, fallbackToText });
      return { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result };
    } catch (err: unknown) {
      const e = err as Error;
      return { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true };
    }
  }) as any;

  server.registerTool(
    'send_google_chat_markdown',
    {
      title: 'Send Google Chat Markdown',
      description: 'Convert Markdown to Cards V2 and send to configured Google Chat webhook. Falls back to text on failure.',
      inputSchema: ( { markdown: z.string(), cardTitle: z.string().optional(), fallbackToText: z.boolean().optional() } as unknown ) as any,
      outputSchema: ( { success: z.boolean(), usedFallback: z.boolean().optional(), messageId: z.string().optional() } as unknown ) as any
    },
    sendMarkdownHandler
  );

  // Use stdio transport for stdin/stdout integration
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Keep process alive by resuming stdin
  process.stdin.resume();
  
  console.error('MCP stdio server connected. Listening on stdin/stdout.');
}
