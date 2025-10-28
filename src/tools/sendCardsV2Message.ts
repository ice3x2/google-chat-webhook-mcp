import axios from 'axios';

export type SendCardsV2Params = {
  text?: string;
  cardsV2: any[];
};

export async function sendCardsV2Message(params: SendCardsV2Params, webhookUrl?: string) {
  if (!params || !Array.isArray(params.cardsV2)) {
    throw new Error('Invalid params for sendCardsV2Message');
  }

  if (!webhookUrl) {
    console.log('[sendCardsV2Message] no webhook configured — skipping HTTP send. payload:', params);
    return { mock: true };
  }

  const payload: any = { cardsV2: params.cardsV2 };
  if (params.text) payload.text = params.text;

  const res = await axios.post(webhookUrl, payload, { timeout: 5000 });
  return res.data;
}
