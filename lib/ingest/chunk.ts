// ~4 chars per token for Portuguese
const CHARS_PER_TOKEN = 4
const TARGET_TOKENS = 500
const OVERLAP_TOKENS = 60

const TARGET_CHARS = TARGET_TOKENS * CHARS_PER_TOKEN
const OVERLAP_CHARS = OVERLAP_TOKENS * CHARS_PER_TOKEN

export function chunkText(text: string): string[] {
  if (text.length <= TARGET_CHARS) return [text]

  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    let end = start + TARGET_CHARS

    if (end < text.length) {
      const lastSpace = text.lastIndexOf(' ', end)
      if (lastSpace > start + TARGET_CHARS / 2) {
        end = lastSpace
      }
    } else {
      end = text.length
    }

    const chunk = text.slice(start, end).trim()
    if (chunk.length > 50) chunks.push(chunk)

    start = Math.max(start + 1, end - OVERLAP_CHARS)
  }

  return chunks
}
