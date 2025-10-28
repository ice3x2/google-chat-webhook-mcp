import axios from 'axios';
import { logger } from '../utils/logger';

export type SendCardsV2Params = {
  text?: string;
  cardsV2: any[];
};

export async function sendCardsV2Message(params: SendCardsV2Params, webhookUrl?: string) {
  if (!params || !Array.isArray(params.cardsV2)) {
    const error = 'Invalid params for sendCardsV2Message';
    logger.error('sendCardsV2Message', 'send_failed', { error });
    throw new Error(error);
  }

  if (!webhookUrl) {
    logger.warn('sendCardsV2Message', 'send_failed' as any, {
      message: 'No webhook configured — skipping HTTP send',
    });
    console.log('[sendCardsV2Message] no webhook configured — skipping HTTP send. payload:', params);
    return { mock: true };
  }

  const payload: any = { cardsV2: params.cardsV2 };
  if (params.text) payload.text = params.text;

  try {
    console.log(`[sendCardsV2Message] Sending to: ${webhookUrl}`);
    const res = await axios.post(webhookUrl, payload, { timeout: 5000 });
    return res.data;
  } catch (error: any) {
    logger.error('sendCardsV2Message', 'send_failed', {
      error: error.message || String(error),
      text: params.text,
    });
    throw error;
  }
}
