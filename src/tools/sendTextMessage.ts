import axios from 'axios';

export type SendTextParams = { text: string };

export async function sendTextMessage(params: SendTextParams, webhookUrl?: string) {
  if (!params || typeof params.text !== 'string') {
    throw new Error('Invalid params for sendTextMessage');
  }

  if (!webhookUrl) {
    console.log('[sendTextMessage] no webhook configured — skipping HTTP send. payload:', { text: params.text });
    return { mock: true };
  }

  const payload = { text: params.text };
  const res = await axios.post(webhookUrl, payload, { timeout: 5000 });
  return res.data;
}
