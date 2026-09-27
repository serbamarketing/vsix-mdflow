import type { FeatureNode } from '../../models/feature'

function repeat(char: string, n: number): string {
  return char.repeat(Math.max(1, n))
}

function serializeNode(node: FeatureNode, level: number): string {
  const chunks: string[] = []

  // Heading
  chunks.push(`${repeat('#', level)} ${node.title.trim()}`)

  // Description
  if (node.description && node.description.trim()) {
    chunks.push(node.description.trim())
  }

  // Metadata
  const metaEntries = Object.entries(node.metadata)
  if (metaEntries.length > 0) {
    const metaLines = metaEntries
      .filter(([, val]) => val && String(val).trim().length > 0)
      .map(([key, val]) => {
        const capitalKey = key.charAt(0).toUpperCase() + key.slice(1)
        return `**${capitalKey}:** ${String(val).trim()}`
      })
    if (metaLines.length > 0) {
      chunks.push(metaLines.join('\n'))
    }
  }

  let result = chunks.join('\n\n')

  // Recursively serialize children
  if (node.children && node.children.length > 0) {
    const childrenMarkdown = node.children
      .map((child) => serializeNode(child, level + 1))
      .join('\n\n')
    result += '\n\n' + childrenMarkdown
  }

  return result
}

export function serializeMarkdown(features: FeatureNode[]): string {
  if (!features || features.length === 0) return ''
  return features.map((f) => serializeNode(f, f.level || 1)).join('\n\n') + '\n'
}
