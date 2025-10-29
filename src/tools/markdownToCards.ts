import { marked } from 'marked';
import { validateImageUrl } from '../utils/imageValidator.js';

// Convert markdown string into Cards V2 compatible card array
export async function markdownToCardsV2(markdown: string, cardTitle?: string): Promise<any[]> {
  if (!markdown || markdown.trim() === '') throw new Error('Markdown content is empty');

  const tokens = marked.lexer(markdown);
  const widgets: any[] = [];

  for (const token of tokens) {
    switch (token.type) {
      case 'heading':
        widgets.push(headingToWidget(token));
        break;
      case 'paragraph': {
        const res = await paragraphToWidget(token);
        if (Array.isArray(res)) widgets.push(...res);
        else widgets.push(res);
        break;
      }
      case 'image':
        widgets.push(await imageToWidget(token));
        break;
      case 'list':
        widgets.push(listToWidget(token));
        break;
      case 'code':
        widgets.push(codeToWidget(token));
        break;
      case 'table':
        widgets.push(tableToWidget(token));
        break;
      case 'space':
        break;
      default:
        widgets.push({ textParagraph: { text: token.raw || String(token) } });
    }
  }

  const cardContent: any = { sections: [{ widgets }] };
  if (cardTitle) cardContent.header = { title: cardTitle };
  return [{ cardId: `md-card-${Date.now()}`, card: cardContent }];
}

function headingToWidget(token: any) {
  const text = token.text || '';
  const depth = token.depth || 1;
  const prefix = '#'.repeat(depth);
  return { textParagraph: { text: `\n<b>${prefix} ${text}</b>\n` } };
}

async function paragraphToWidget(token: any) {
  // Output widgets for this paragraph (may be 1 or multiple)
  const out: any[] = [];

  // If marked provided inline tokens, use them to split images inline
  if (token.tokens && Array.isArray(token.tokens) && token.tokens.length > 0) {
    let buffer = '';
    for (const t of token.tokens) {
      if (t.type === 'text' || t.type === 'strong' || t.type === 'em' || t.type === 'codespan') {
        let txt = t.raw || t.text || '';
        txt = txt.replace(/<\/?[^>]+(>|$)/g, '');
        txt = processLinks(txt);
        txt = cleanMarkdownFormatting(txt);
        buffer += txt;
      } else if (t.type === 'link') {
        let txt = (t.raw || t.text || '') + '';
        txt = processLinks(txt);
        txt = cleanMarkdownFormatting(txt);
        buffer += txt;
      } else if (t.type === 'image') {
        if (buffer.trim() !== '') {
          out.push({ textParagraph: { text: buffer } });
          buffer = '';
        }
        out.push(await imageToWidget(t));
      } else {
        const txt = (t.raw || t.text || '') + '';
        buffer += txt;
      }
    }

    if (buffer.trim() !== '') out.push({ textParagraph: { text: buffer } });
    return out.length === 1 ? out[0] : out;
  }

  // Fallback: raw text in paragraph. Detect markdown inline image syntax and split
  let text = token.text || '';
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(text)) !== null) {
    const idx = match.index;
    if (idx > lastIndex) {
      let part = text.slice(lastIndex, idx);
      part = part.replace(/<\/?[^>]+(>|$)/g, '');
      part = processLinks(part);
      part = cleanMarkdownFormatting(part);
      out.push({ textParagraph: { text: part } });
    }
    const alt = (match[1] || '').replace(/<\/?[^>]+(>|$)/g, '').trim();
    const url = (match[2] || '').trim();
    out.push(await imageToWidget({ href: url, text: alt }));
    lastIndex = imgRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    let tail = text.slice(lastIndex);
    tail = tail.replace(/<\/?[^>]+(>|$)/g, '');
    tail = processLinks(tail);
    tail = cleanMarkdownFormatting(tail);
    out.push({ textParagraph: { text: tail } });
  }

  if (out.length === 0) {
    text = text.replace(/<\/?[^>]+(>|$)/g, '');
    text = processLinks(text);
    text = cleanMarkdownFormatting(text);
    return { textParagraph: { text } };
  }
  return out.length === 1 ? out[0] : out;
}

function listToWidget(token: any) {
  const items = token.items || [];
  const lines: string[] = [];

  function processItem(item: any, depth: number = 0) {
    let raw = item.text || '';
    if (item.tokens && item.tokens.length > 0 && item.tokens[0].type === 'text') {
      raw = item.tokens[0].text || raw;
    }
    raw = processLinks(raw);
    raw = cleanMarkdownFormatting(raw);
    const indent = '\u2003'.repeat(depth * 2);
    const prefix = depth === 0 && token.ordered ? `${lines.filter(l => l.match(/^\s*\d+\./)).length + 1}. ` : '• ';
    lines.push(indent + prefix + raw.trim());

    if (item.tokens) {
      for (const subToken of item.tokens) {
        if (subToken.type === 'list') {
          const subItems = subToken.items || [];
          subItems.forEach((subItem: any) => processNestedItem(subItem, depth + 1));
        }
      }
    }
  }

  function processNestedItem(item: any, depth: number) {
    let raw = item.text || '';
    if (item.tokens && item.tokens.length > 0 && item.tokens[0].type === 'text') {
      raw = item.tokens[0].text || raw;
    }
    raw = processLinks(raw);
    raw = cleanMarkdownFormatting(raw);
    const indent = '\u2003'.repeat(depth * 2);
    const prefix = '◦ ';
    lines.push(indent + prefix + raw.trim());
    if (item.tokens) {
      for (const subToken of item.tokens) {
        if (subToken.type === 'list') {
          const subItems = subToken.items || [];
          subItems.forEach((subItem: any) => processNestedItem(subItem, depth + 1));
        }
      }
    }
  }

  items.forEach((item: any) => processItem(item, 0));
  return { textParagraph: { text: lines.join('\n') } };
}

function codeToWidget(token: any) {
  const lang = token.lang || '';
  return { textParagraph: { text: '```' + lang + '\n' + (token.text || '') + '\n```' } };
}

function tableToWidget(token: any) {
  const header = token.header || [];
  const rows = token.rows || [];
  if (header.length === 0) return { textParagraph: { text: '(empty table)' } };
  const colWidths = header.map((h: any, idx: number) => {
    const headerText = h.text || '';
    const maxRowWidth = Math.max(...rows.map((r: any) => (r[idx]?.text || '').length));
    return Math.max(headerText.length, maxRowWidth, 4);
  });
  const headerLine = header.map((h: any, idx: number) => (h.text || '').padEnd(colWidths[idx])).join(' | ');
  const separator = colWidths.map((w: number) => '-'.repeat(w)).join('-+-');
  const rowLines = rows.map((row: any[]) => row.map((cell: any, idx: number) => (cell.text || '').padEnd(colWidths[idx])).join(' | '));
  const tableText = [headerLine, separator, ...rowLines].join('\n');
  return { textParagraph: { text: '```\n' + tableText + '\n```' } };
}

async function imageToWidget(token: any) {
  let rawUrl = token.href || token.url || token.imageUrl || '';
  let alt = token.text || token.alt || '';
  rawUrl = rawUrl.replace(/%3C.*?%3E/gi, '');
  rawUrl = rawUrl.replace(/<.*?>/g, '');
  try { rawUrl = decodeURIComponent(rawUrl); } catch (e) {}
  rawUrl = rawUrl.trim();
  const match = rawUrl.match(/https?:\/\/[\w\-./?%&=+#~,:@()\[\]!]*/i);
  const url = match ? match[0] : rawUrl;
  alt = (alt || '').toString().replace(/<.*?>/g, '').trim();
  
  if (!url || !/^https:\/\//i.test(url)) {
    return { textParagraph: { text: `[IMAGE: ${alt || 'invalid url'}] ${url}` } };
  }

  // Validate image URL with HEAD request
  const validation = await validateImageUrl(url);
  if (!validation.valid) {
    return { 
      textParagraph: { 
        text: `[이미지 로드 실패: ${alt || 'image'}] <a href="${url}">${url}</a>\n❌ ${validation.error}` 
      } 
    };
  }

  return { image: { imageUrl: url, altText: alt || 'image' } };
}

function processLinks(text: string): string {
  return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function cleanMarkdownFormatting(text: string): string {
  text = text.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  text = text.replace(/\*([^*]+)\*/g, '<i>$1</i>');
  text = text.replace(/_([^_]+)_/g, '<i>$1</i>');
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  text = text.replace(/~~([^~]+)~~/g, '<s>$1</s>');
  return text;
}
