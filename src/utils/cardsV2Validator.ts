import { z } from 'zod';

const Widget = z.object({
  textParagraph: z.object({ text: z.string() }).optional(),
  image: z.object({ imageUrl: z.string().url(), altText: z.string().optional() }).optional()
}).refine((w) => !!w.textParagraph || !!w.image, { message: 'Widget must have textParagraph or image' });

const Section = z.object({ widgets: z.array(Widget).min(1) });
const Card = z.object({ header: z.object({ title: z.string() }).optional(), sections: z.array(Section).min(1) });

const CardsV2Item = z.object({ cardId: z.string(), card: Card });
const CardsV2Schema = z.array(CardsV2Item);

export function validateCardsV2(cardsV2: any) {
  return CardsV2Schema.parse(cardsV2);
}
