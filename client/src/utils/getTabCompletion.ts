interface FileNode {
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

export function getTabCompletion(
  currentCommand: string,
  files: FileNode[]
): { type: 'none' } | { type: 'complete'; completion: string } | { type: 'suggest'; matches: string[] } {
  const tokens = currentCommand.trim().split(/\s+/);
  const lastToken = tokens[tokens.length - 1] || '';

  const matches = files
    .map(f => f.name)
    .filter(name => name.toLowerCase().startsWith(lastToken.toLowerCase()))
    .sort();

  if (matches.length === 0) {
    return { type: 'none' };
  }

  if (matches.length === 1) {
    const completion = matches[0].slice(lastToken.length);
    return { type: 'complete', completion };
  }

  return { type: 'suggest', matches };
}