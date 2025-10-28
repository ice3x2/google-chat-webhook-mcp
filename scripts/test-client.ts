import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function run() {
  const client = new Client({ name: 'test-client', version: '0.1.0' });

  // Spawn the server process using node dist/index.js
  // Ensure the spawned server process gets the GOOGLE_CHAT_WEBHOOK_URL env var
  const spawnEnv = Object.assign({}, process.env, { GOOGLE_CHAT_WEBHOOK_URL: process.env.GOOGLE_CHAT_WEBHOOK_URL });
  const transport = new StdioClientTransport({ command: 'node', args: ['dist/index.js'], spawnOptions: { env: spawnEnv } as any });
  await client.connect(transport);

  console.log('Connected to MCP server via stdio transport');

  // Call the tool
  const result = await client.callTool({ name: 'send_google_chat_text', arguments: { text: 'Hello from test-client' } });
  console.log('Tool call result:', result);

  // Close (sdk client does not expose disconnect in this version)
  process.exit(0);
}

run().catch((err) => {
  console.error('Test client error:', err);
  process.exit(1);
});
