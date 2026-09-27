import { unified } from 'unified'
import remarkParse from 'remark-parse'
import type { Root, Heading, List, ListItem, BlockContent } from 'mdast'
import type { FeatureNode } from '@/models/feature'

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
]

function isMetadataLine(line: string): boolean {
  const trimmed = line.trim().replace(/^[-*+]\s+/, '')
  if (/^\*\*[a-zA-Z0-9_\s-]+:\*\*/.test(trimmed)) return true
  if (/^\*\*[a-zA-Z0-9_\s-]+\*\*:\s*/.test(trimmed)) return true
  const plainMatch = trimmed.match(/^([a-zA-Z0-9_\s-]+):\s*(.*)$/)
  if (plainMatch) {
    const potentialKey = plainMatch[1].trim().toLowerCase()
    if (COMMON_METADATA_KEYS.includes(potentialKey)) return true
  }
  return false
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
      const val = boldMatch[2].trim()
      if (key && val) metadata[key] = val
      continue
    }

    // Pattern 2: **Key**: Value
    const boldMatch2 = trimmed.match(/^\*\*([a-zA-Z0-9_\s-]+)\*\*:\s*(.*)$/)
    if (boldMatch2) {
      const key = boldMatch2[1].trim().toLowerCase()
      const val = boldMatch2[2].trim()
      if (key && val) metadata[key] = val
      continue
    }

    // Pattern 3: Key: Value (for common keys like status, priority, type, pic, deadline, owner, version, image, link)
    const plainMatch = trimmed.match(/^([a-zA-Z0-9_\s-]+):\s*(.*)$/)
    if (plainMatch) {
      const potentialKey = plainMatch[1].trim().toLowerCase()
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
    } else if (current) {
      if (node.type === 'paragraph') {
        const raw = extractText(node)
        const meta = parseMetadataFromText(raw)
        if (Object.keys(meta).length > 0) {
          Object.assign(current.metadata, meta)
          // Filter out lines that were metadata from description
          const nonMetaLines = raw
            .split('\n')
            .filter((l) => !isMetadataLine(l))
            .join('\n')
            .trim()
          if (nonMetaLines) current.description.push(nonMetaLines)
        } else {
          if (raw.trim()) current.description.push(raw.trim())
        }
      } else if (node.type === 'list') {
        const list = node as List
        for (const item of list.children as ListItem[]) {
          const itemText = extractText(item).trim()
          const meta = parseMetadataFromText(itemText)
          if (Object.keys(meta).length > 0) {
            Object.assign(current.metadata, meta)
            const nonMeta = itemText
              .split('\n')
              .filter((l) => !isMetadataLine(l))
              .join('\n')
              .trim()
            if (nonMeta) current.description.push(`- ${nonMeta}`)
          } else if (itemText) {
            current.description.push(`- ${itemText}`)
          }
        }
      } else if (node.type === 'blockquote') {
        const quoteText = extractText(node).trim()
        if (quoteText) {
          const meta = parseMetadataFromText(quoteText)
          if (Object.keys(meta).length > 0) {
            Object.assign(current.metadata, meta)
            const nonMeta = quoteText
              .split('\n')
              .filter((l) => !isMetadataLine(l))
              .join('\n')
              .trim()
            if (nonMeta) current.description.push(`> ${nonMeta}`)
          } else {
            current.description.push(`> ${quoteText}`)
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
