/**
 * Tool status types for the Hapyy languages web portal
 */
export type ToolStatus = "available" | "in-development" | "coming-soon";

/**
 * Tool category types
 */
export type ToolCategory = "transpiler" | "verification" | "linter";

/**
 * Supported programming languages
 */
export type ToolLanguage =
  | "cpp"
  | "c"
  | "rust"
  | "csharp"
  | "java"
  | "python"
  | "typescript"
  | "bash";

/**
 * Tool definition interface
 */
export interface Tool {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  category: ToolCategory;
  sourceLanguage: ToolLanguage;
  targetLanguage?: ToolLanguage;
}
