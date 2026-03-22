#!/usr/bin/env node
/**
 * Auto-Approve Safe - PreToolUse Hook + Stop Notifications
 * Automatically approves safe tool uses and sends notifications on task completion.
 *
 * STRATEGY:
 * - Auto-approves reads, writes, edits that don't touch sensitive files
 * - Auto-approves safe bash commands (non-dangerous ones)
 * - Auto-approves git operations (commit, add, push) - user already wants these
 * - Lets dangerous operations be blocked by other hooks
 * - Notifies user only on Stop event (task completion), not on individual tool uses
 *
 * This speeds up development by reducing permission prompts and notification noise.
 */

const fs = require('fs')
const path = require('path')

// File patterns that are SAFE to touch (not secrets, not protected system files)
const SAFE_FILE_PATTERNS = [
  // Code files (always safe to edit)
  /\.(ts|tsx|js|jsx|py|java|rs|go|rb|php|swift)$/,
  // Config files (safe)
  /\.(json|yaml|yml|toml|xml|css|scss|less)$/,
  // Markdown, text
  /\.(md|txt|markdown)$/,
  // Data files
  /\.(csv|sql)$/,
  // Package files
  /(package\.json|package-lock\.json|yarn\.lock|pnpm-lock\.yaml|Gemfile|requirements\.txt|go\.mod|Cargo\.toml)$/,
  // Git files
  /^\.gitignore$|^\.gitkeep$/,
  // Env examples (not actual .env)
  /\.env\.(example|sample|template|defaults|schema)$|^env\.example$/,
  // Project files
  /\.(prettier|eslint)rc.*$|^tsconfig.*\.json$|^jest\.config.*$|^vitest.*\.config.*$/,
  // Build artifacts (safe to create)
  /^dist[/]|^build[/]|^\.next[/]|^\.turbo[/]|^node_modules[/]/,
  // Prisma
  /^prisma[/]/,
  // Docker
  /^Dockerfile|docker-compose.*\.ya?ml$/,
]

const DANGEROUS_FILE_PATTERNS = [
  /\.env(?:\.|$)/,
  /\.envrc$/,
  /\.ssh\//,
  /\.aws\//,
  /\.kube\//,
  /\.docker\/config/,
  /credentials|secrets|\.pem$|\.key$/i,
  /private[_-]?key/i,
]

const GIT_AUTO_APPROVE_OPS = [
  'git add',
  'git commit',
  'git push',
  'git reset', // Reset without --hard (protected separately)
  'git status',
  'git log',
  'git diff',
  'git branch',
  'git checkout',
  'git stash',
]

const SAFE_BASH_PATTERNS = [
  // npm/pnpm/yarn operations
  /^(pnpm|npm|yarn)\s+(install|add|remove|build|dev|test|lint|start)/,
  // Git operations (non-dangerous)
  /^git\s+(status|log|diff|branch|checkout|commit|add|push|pull|merge|rebase|tag|fetch)/,
  // Directory operations (non-dangerous)
  /^(ls|cd|pwd|mkdir|cp|mv)(?:\s|$)/,
  // File viewing & searching (safe reads)
  /^(less|head|tail|find|locate|xargs)(?:\s|$)/,
  // cat - read files (safe in project)
  /^cat\s+/,
  // grep - any usage (read-only)
  /^grep/,
  // wc - word/line count (read-only)
  /^wc/,
  // Info commands
  /^(env|which|whoami|date|echo|printf)(?:\s|$)/,
  // Process info (safe reads)
  /^(ps|top|lsof|netstat)(?:\s|$)/,
  // Docker (safe reads)
  /^docker\s+(ps|logs|inspect|exec)(?:\s|$)/,
  // Development servers
  /^(pnpm dev|npm start|yarn dev|npm run)/,
]

function isSafeFile(filePath) {
  if (!filePath) return false

  // Check dangerous patterns first
  for (const pattern of DANGEROUS_FILE_PATTERNS) {
    if (pattern.test(filePath)) return false
  }

  // Check safe patterns
  for (const pattern of SAFE_FILE_PATTERNS) {
    if (pattern.test(filePath)) return true
  }

  // Default: if no pattern matched, let user decide
  return false
}

function isSafeBashCommand(cmd) {
  if (!cmd) return false

  // Check safe patterns
  for (const pattern of SAFE_BASH_PATTERNS) {
    if (pattern.test(cmd.trim())) return true
  }

  return false
}

function shouldAutoApprove(tool, toolInput) {
  // Read safe files
  if (tool === 'Read') {
    return isSafeFile(toolInput?.file_path)
  }

  // Write/Edit safe files
  if (tool === 'Write' || tool === 'Edit') {
    return isSafeFile(toolInput?.file_path)
  }

  // Safe bash commands
  if (tool === 'Bash') {
    return isSafeBashCommand(toolInput?.command)
  }

  // Glob, Grep are generally safe
  if (tool === 'Glob' || tool === 'Grep') {
    return true
  }

  // Default: don't auto-approve unknown tools
  return false
}

function handleStop() {
  // Send notification only on Stop event (task completion)
  return console.log(JSON.stringify({
    systemMessage: '✅ Task completed. Claude Code session ended.',
    continue: true
  }))
}

async function main() {
  let input = ''
  for await (const chunk of process.stdin) input += chunk

  try {
    const data = JSON.parse(input)
    const { hook_event_name, tool_name, tool_input } = data

    // Handle Stop event - notify only when execution completes
    if (hook_event_name === 'Stop') {
      return handleStop()
    }

    // Handle PreToolUse event - auto-approve safe operations
    if (hook_event_name === 'PreToolUse' && shouldAutoApprove(tool_name, tool_input)) {
      return console.log(JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'PreToolUse',
          permissionDecision: 'approve',
          permissionDecisionReason: '✅ Auto-approved: safe operation'
        }
      }))
    }

    // Not auto-approved or not a handled event, return empty (let normal flow continue)
    console.log('{}')
  } catch (e) {
    // On error, don't interfere - let normal flow
    console.log('{}')
  }
}

if (require.main === module) {
  main()
} else {
  module.exports = { isSafeFile, isSafeBashCommand, shouldAutoApprove }
}