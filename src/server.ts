import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { sendTextMessage } from './tools/sendTextMessage';
import { sendCardsV2Message } from './tools/sendCardsV2Message';
import { sendMarkdownMessage } from './tools/sendMarkdownMessage';
import { startLogCleanupScheduler } from './utils/logCleaner';
import { logger } from './utils/logger';

export async function startServer() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL || undefined;
  if (!webhook) {
    console.warn('GOOGLE_CHAT_WEBHOOK_URL not set — send operations will be mocked/logged.');
  }

  // Start log cleanup scheduler (runs every 24 hours)
  startLogCleanupScheduler(24);

  const server = new McpServer({ name: 'google-chat-webhook', version: '0.1.0' });

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
  console.log('MCP stdio server connected. Listening on stdin/stdout.');
}
