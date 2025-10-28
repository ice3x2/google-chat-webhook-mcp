import { markdownToCardsV2 } from './markdownToCards';
import { sendCardsV2Message } from './sendCardsV2Message';
import { sendTextMessage } from './sendTextMessage';
import { validateCardsV2 } from '../utils/cardsV2Validator';
import type { SendMarkdownOptions, SendMarkdownResult } from '../types/markdown';

export async function sendMarkdownMessage(webhookUrl: string, options: SendMarkdownOptions): Promise<SendMarkdownResult> {
  const { markdown, cardTitle, fallbackToText = true } = options;

  // Phase0: 시도형 스텁 - 변환 후 바로 sendCardsV2Message 호출
  try {
    const cardsV2 = await markdownToCardsV2(markdown, cardTitle);
    // validate before sending
    try {
      validateCardsV2(cardsV2);
    } catch (valErr) {
      throw new Error(`Cards V2 validation failed: ${valErr}`);
    }

    const response = await sendCardsV2Message({ text: cardTitle || 'Markdown Message', cardsV2 }, webhookUrl);
    return { success: true, messageId: (response && response.name) || undefined, usedFallback: false };
  } catch (err: any) {
    if (fallbackToText) {
      // 폴백: 원본 Markdown 그대로 텍스트 전송
      try {
  const r = await sendTextMessage({ text: markdown }, webhookUrl);
  return { success: true, messageId: r && r.name, usedFallback: true, fallbackReason: String(err) };
      } catch (sendErr: any) {
        return { success: false, error: String(sendErr) };
      }
    }

    return { success: false, error: String(err) };
  }
}
