import { TOOLS } from '@repo/shared';
import type { ToolExecutionConfig } from '@repo/shared';

// Tool execution configurations for all Hupyy tools
const toolExecutionConfigs: ToolExecutionConfig[] = [
  {
    id: 'cpp-to-c-transpiler',
    command: '/usr/local/bin/hupyy-cpp2c',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
  {
    id: 'cpp-to-rust-transpiler',
    command: '/usr/local/bin/hupyy-cpp2rust',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
  {
    id: 'csharp-verification',
    command: '/usr/local/bin/hupyy-csharp-verify',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
  {
    id: 'java-verification',
    command: '/usr/local/bin/hupyy-java-verify',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
  {
    id: 'rust-verification',
    command: '/usr/local/bin/hupyy-rust-verify',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
  {
    id: 'python-linter',
    command: '/usr/local/bin/hupyy-python-lint',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
  {
    id: 'typescript-linter',
    command: '/usr/local/bin/hupyy-typescript-lint',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
  {
    id: 'bash-verification',
    command: '/usr/local/bin/hupyy-bash-verify',
    defaultArgs: ['--input'],
    maxExecutionTimeMs: 60000,
    available: false,
  },
];

// Map for efficient lookup
const TOOL_EXECUTION_CONFIGS = new Map<string, ToolExecutionConfig>(
  toolExecutionConfigs.map((config) => [config.id, config])
);

/**
 * Get tool execution configuration by tool ID
 */
export function getToolConfig(toolId: string): ToolExecutionConfig | undefined {
  return TOOL_EXECUTION_CONFIGS.get(toolId);
}

/**
 * Get all available tool execution configurations
 */
export function getAvailableTools(): ToolExecutionConfig[] {
  return toolExecutionConfigs.filter((config) => config.available);
}

// Verify all TOOLS have corresponding execution configs
if (TOOLS.length !== toolExecutionConfigs.length) {
  throw new Error(
    `Tool registry mismatch: ${TOOLS.length} tools defined but ${toolExecutionConfigs.length} execution configs provided`
  );
}
