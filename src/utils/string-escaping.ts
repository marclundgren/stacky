export function escapeShellString(str: string): string {
  // Use heredoc syntax to avoid escaping issues
  return `cat << 'EOF' > ${str}
EOF`;
}

export function escapeBashCommand(content: string, filename: string): string {
  // First replace any existing EOFs in the content to avoid conflicts
  const safeContent = content.replace(/EOF/g, "EOF_REPLACED");

  return `cat << 'EOF' > ${filename}
${safeContent}
EOF`;
}
