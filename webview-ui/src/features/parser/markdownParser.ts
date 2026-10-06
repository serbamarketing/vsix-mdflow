import { unified } from 'unified'
import remarkParse from 'remark-parse'
import type { Root, Heading, List, ListItem, BlockContent } from 'mdast'
import type { FeatureNode } from '../../models/feature'

// Generate a slug from a heading title
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 40) || 'node'
}

// Extract plain text recursively from MDAST nodes
function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const n = node as { type?: string; value?: string; children?: unknown[] }
  if (n.type === 'text' || n.type === 'inlineCode') return n.value ?? ''
  if (Array.isArray(n.children)) {
    return n.children.map(extractText).join('')
  }
  return ''
}

const COMMON_METADATA_KEYS = [
  'status', 'priority', 'type', 'pic', 'deadline', 'owner', 'version',
  'tag', 'tags', 'platform', 'estimate', 'assignee', 'target', 'image',
  'img', 'thumbnail', 'cover', 'photo', 'link', 'url', 'href', 'website',
  'todo', 'task', 'is_todo',
]

function extractDescFromText(text: string): string | null {
  const match = text.match(/^\*\*(?:desc|deskripsi):\*\*\s*(.*)$/is)
  if (match) return match[1].trim()
  const match2 = text.match(/^\*\*(?:desc|deskripsi)\*\*:\s*(.*)$/is)
  if (match2) return match2[1].trim()
  const match3 = text.match(/^(?:desc|deskripsi):\s*(.*)$/is)
  if (match3) return match3[1].trim()
  return null
}


// Check if a line is a metadata line: "**Key:** Value" or "Key: Value"
function parseMetadataFromText(rawText: string): Record<string, string> {
  const metadata: Record<string, string> = {}
  const lines = rawText.split('\n')

  for (const line of lines) {
    const trimmed = line.trim().replace(/^[-*+]\s+/, '') // remove list bullet if any
    // Pattern 1: **Key:** Value
    const boldMatch = trimmed.match(/^\*\*([a-zA-Z0-9_\s-]+):\*\*\s*(.*)$/)
    if (boldMatch) {
      const key = boldMatch[1].trim().toLowerCase()
      if (key === 'desc' || key === 'deskripsi') continue
      const val = boldMatch[2].trim()
      if (key && val) metadata[key] = val
      continue
    }

    // Pattern 2: **Key**: Value
    const boldMatch2 = trimmed.match(/^\*\*([a-zA-Z0-9_\s-]+)\*\*:\s*(.*)$/)
    if (boldMatch2) {
      const key = boldMatch2[1].trim().toLowerCase()
      if (key === 'desc' || key === 'deskripsi') continue
      const val = boldMatch2[2].trim()
      if (key && val) metadata[key] = val
      continue
    }

    // Pattern 3: Key: Value
    const plainMatch = trimmed.match(/^([a-zA-Z0-9_\s-]+):\s*(.*)$/)
    if (plainMatch) {
      const potentialKey = plainMatch[1].trim().toLowerCase()
      if (potentialKey === 'desc' || potentialKey === 'deskripsi') continue
      if (COMMON_METADATA_KEYS.includes(potentialKey)) {
        metadata[potentialKey] = plainMatch[2].trim()
      }
    }
  }

  return metadata
}

interface HeadingBlock {
  level: number
  title: string
  description: string[]
  metadata: Record<string, string>
}

export function parseMarkdown(content: string): FeatureNode[] {
  if (!content || !content.trim()) return []

  const processor = unified().use(remarkParse)
  const ast = processor.parse(content) as Root

  const children = ast.children as BlockContent[]
  const blocks: HeadingBlock[] = []
  let current: HeadingBlock | null = null

  for (let i = 0; i < children.length; i++) {
    const node = children[i]

    if (node.type === 'heading') {
      const h = node as Heading
      if (current) blocks.push(current)
      current = {
        level: h.depth,
        title: extractText(h).trim(),
        description: [],
        metadata: {},
      }
    } else if (node.type === 'paragraph') {
      const raw = extractText(node)
      const lines = raw.split('\n')
      const hasHeadingLine = lines.some((l) => /^(#{1,})\s+(.*)$/.test(l.trim()))

      if (hasHeadingLine) {
        for (const rawLine of lines) {
          const trimmed = rawLine.trim()
          if (!trimmed) continue
          const hMatch = trimmed.match(/^(#{1,})\s+(.*)$/)
          if (hMatch) {
            if (current) blocks.push(current)
            current = {
              level: hMatch[1].length,
              title: hMatch[2].trim(),
              description: [],
              metadata: {},
            }
          } else if (current) {
            const desc = extractDescFromText(trimmed)
            if (desc !== null) {
              current.description.push(desc)
            } else {
              const meta = parseMetadataFromText(trimmed)
              if (Object.keys(meta).length > 0) {
                Object.assign(current.metadata, meta)
              }
            }
          }
        }
      } else if (current) {
        // Cek apakah seluruh paragraf ini adalah **Desc:**
        const desc = extractDescFromText(raw)
        if (desc !== null) {
          current.description.push(desc)
        } else {
          // Atau baris per baris jika ada campuran metadata dan desc
          let foundDescInLines = false
          for (const l of lines) {
            const trimmed = l.trim()
            const d = extractDescFromText(trimmed)
            if (d !== null) {
              current.description.push(d)
              foundDescInLines = true
            }
          }
          if (!foundDescInLines) {
            const meta = parseMetadataFromText(raw)
            if (Object.keys(meta).length > 0) {
              Object.assign(current.metadata, meta)
            }
          }
        }
      }
    } else if (current) {
      if (node.type === 'list') {
        const list = node as List
        for (const item of list.children as ListItem[]) {
          const itemText = extractText(item).trim()
          const desc = extractDescFromText(itemText)
          if (desc !== null) {
            current.description.push(desc)
            continue
          }
          const meta = parseMetadataFromText(itemText)
          if (Object.keys(meta).length > 0) {
            Object.assign(current.metadata, meta)
          }
        }
      } else if (node.type === 'blockquote') {
        const quoteText = extractText(node).trim()
        if (quoteText) {
          const desc = extractDescFromText(quoteText)
          if (desc !== null) {
            current.description.push(desc)
          } else {
            const meta = parseMetadataFromText(quoteText)
            if (Object.keys(meta).length > 0) {
              Object.assign(current.metadata, meta)
            }
          }
        }
      }
    }
  }

  if (current) blocks.push(current)

  if (blocks.length === 0) return []

  return buildHierarchy(blocks)
}

function buildHierarchy(blocks: HeadingBlock[]): FeatureNode[] {
  const roots: FeatureNode[] = []
  const stack: FeatureNode[] = []
  const idCount: Record<string, number> = {}

  for (const block of blocks) {
    const baseId = slugify(block.title)
    idCount[baseId] = (idCount[baseId] ?? 0) + 1
    const id = idCount[baseId] === 1 ? baseId : `${baseId}-${idCount[baseId]}`

    const node: FeatureNode = {
      id,
      title: block.title,
      level: block.level,
      description: block.description.join('\n\n') || undefined,
      metadata: block.metadata,
      children: [],
    }

    while (stack.length > 0 && stack[stack.length - 1].level >= block.level) {
      stack.pop()
    }

    if (stack.length === 0) {
      roots.push(node)
    } else {
      stack[stack.length - 1].children.push(node)
    }

    stack.push(node)
  }

  return roots
}
