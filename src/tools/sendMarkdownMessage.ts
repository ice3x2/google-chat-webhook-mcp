import { markdownToCardsV2 } from './markdownToCards';
import { sendCardsV2Message } from './sendCardsV2Message';
import { sendTextMessage } from './sendTextMessage';
import { validateCardsV2 } from '../utils/cardsV2Validator';
import { logger } from '../utils/logger';
import type { SendMarkdownOptions, SendMarkdownResult } from '../types/markdown';

export async function sendMarkdownMessage(webhookUrl: string, options: SendMarkdownOptions): Promise<SendMarkdownResult> {
  const { markdown, cardTitle, fallbackToText = true } = options;
  const startTime = Date.now();

  // Phase0: 시도형 스텁 - 변환 후 바로 sendCardsV2Message 호출
  try {
    const cardsV2 = await markdownToCardsV2(markdown, cardTitle);
    // validate before sending
    try {
      validateCardsV2(cardsV2);
    } catch (valErr) {
      logger.warn('sendMarkdownMessage', 'validation_failed', {
        error: String(valErr),
        cardTitle,
      });
      throw new Error(`Cards V2 validation failed: ${valErr}`);
    }

    const response = await sendCardsV2Message({ text: cardTitle || 'Markdown Message', cardsV2 }, webhookUrl);
    const elapsed = Date.now() - startTime;
    
    logger.info('sendMarkdownMessage', 'message_sent', {
      messageId: (response && response.name) || 'unknown',
      elapsed,
      usedFallback: false,
      cardTitle,
    });

    return { success: true, messageId: (response && response.name) || undefined, usedFallback: false };
  } catch (err: any) {
    if (fallbackToText) {
      // 폴백: 원본 Markdown 그대로 텍스트 전송
      try {
        const r = await sendTextMessage({ text: markdown }, webhookUrl);
        const elapsed = Date.now() - startTime;
        
        logger.warn('sendMarkdownMessage', 'fallback_used', {
          messageId: (r && r.name) || 'unknown',
          reason: String(err),
          elapsed,
        });

        return { success: true, messageId: r && r.name, usedFallback: true, fallbackReason: String(err) };
      } catch (sendErr: any) {
        logger.error('sendMarkdownMessage', 'send_failed', {
          error: String(sendErr),
          cardTitle,
          markdown: markdown.substring(0, 100), // 처음 100자만 로깅
        });
        return { success: false, error: String(sendErr) };
      }
    }

    logger.error('sendMarkdownMessage', 'send_failed', {
      error: String(err),
      cardTitle,
      markdown: markdown.substring(0, 100), // 처음 100자만 로깅
    });

    return { success: false, error: String(err) };
  }
}
