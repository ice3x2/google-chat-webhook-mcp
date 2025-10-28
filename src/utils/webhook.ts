import axios from 'axios';

export async function postToWebhook(webhookUrl: string, payload: any) {
  return axios.post(webhookUrl, payload, { timeout: 5000 });
}
