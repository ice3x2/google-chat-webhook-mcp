import axios from 'axios';

async function run() {
  const webhook = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!webhook) {
    console.error('Set GOOGLE_CHAT_WEBHOOK_URL env var before running');
    process.exit(2);
  }

  const payload = { text: 'Test message from GoogleChatWebHook MCP server test' };
  try {
    const res = await axios.post(webhook, payload, { timeout: 5000 });
    console.log('Send response status:', res.status);
    console.log('Response data:', res.data);
  } catch (err: unknown) {
    console.error('Send error:', err);
    process.exit(1);
  }
}

run();
