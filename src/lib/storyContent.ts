export type StoryBlock = { type: 'paragraph' | 'heading'; text: string };

/** Split story body into paragraphs and optional `## Section` headings. */
export function parseStoryBlocks(content: string): StoryBlock[] {
  return content
    .split(/\n\n+/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((text) => {
      if (text.startsWith('## ')) {
        return { type: 'heading' as const, text: text.slice(3).trim() };
      }
      return { type: 'paragraph' as const, text };
    });
}