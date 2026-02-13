/**
 * Mapping from file extensions to Prism language identifiers
 */
export const extensionToLanguage: Record<string, string> = {
  '.js': 'javascript',
  '.jsx': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.ts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.pyi': 'python',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.hpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.rs': 'rust',
  '.cs': 'csharp',
  '.java': 'java',
  '.sh': 'bash',
  '.bash': 'bash',
  '.json': 'json',
  '.xml': 'xml',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.md': 'markdown',
  '.txt': 'text',
  '.log': 'text',
};

/**
 * Detects the Prism language identifier from a file path
 *
 * @param filePath - Path to the file
 * @returns Prism language identifier (defaults to 'text' if unknown)
 */
export function detectLanguage(filePath: string): string {
  const extension = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  return extensionToLanguage[extension] || 'text';
}

/**
 * Gets a human-readable label for output type based on language and tool category
 *
 * @param language - Prism language identifier
 * @param toolCategory - Category of the tool that generated the output
 * @returns Human-readable label for the output type
 */
export function getOutputTypeLabel(
  language: string,
  toolCategory?: 'transpiler' | 'verification' | 'linter'
): string {
  // Code languages from transpiler tools
  const codeLanguages = ['c', 'cpp', 'rust', 'csharp', 'java', 'javascript', 'typescript'];

  if (toolCategory === 'transpiler' && codeLanguages.includes(language)) {
    return 'Transpiled Source';
  }

  if (
    (toolCategory === 'verification' || toolCategory === 'linter') &&
    (language === 'text' || language === 'markdown')
  ) {
    return 'Verification Report';
  }

  if (language === 'text' || language === 'markdown') {
    return 'Report / Log';
  }

  // Default: capitalize language name
  return language.charAt(0).toUpperCase() + language.slice(1);
}
