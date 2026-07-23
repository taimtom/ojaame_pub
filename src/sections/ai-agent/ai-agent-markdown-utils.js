/**
 * LLMs often emit lists / bold on one line:
 * "Here's the summary: - **Product**: X - **Quantity**: 2"
 * Markdown needs real newlines for that to render.
 */
export function normalizeChatMarkdown(text) {
  let t = String(text ?? '').replace(/\r\n/g, '\n');

  // "sale: - **Product**:" → break onto a list
  t = t.replace(/:\s+-\s+/g, ':\n\n- ');

  // Mid-line bullets that look like labeled fields: " - **Qty**: 2"
  t = t.replace(
    /\s+-\s+(\*\*[^*]+\*\*|[A-Za-z][A-Za-z0-9 /&()-]{0,40}):\s*/g,
    '\n- $1: '
  );

  // Bullet character mid-line
  t = t.replace(/\s+[•·]\s+/g, '\n- ');

  // Soft break before common closing prompts after a list/field
  t = t.replace(
    /\s+(Please confirm|Would you like|Shall I|Ready to|Tap confirm)\b/gi,
    '\n\n$1'
  );

  // Collapse 3+ newlines
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}
