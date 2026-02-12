export type ToolStatus = 'available' | 'in-development' | 'coming-soon';

export type ToolCategory = 'transpiler' | 'verification' | 'linter';

export type ToolLanguage =
  | 'cpp'
  | 'c'
  | 'rust'
  | 'csharp'
  | 'java'
  | 'python'
  | 'typescript'
  | 'bash';

export interface Tool {
  id: string;
  name: string;
  description: string;
  status: ToolStatus;
  category: ToolCategory;
  sourceLanguage: ToolLanguage;
  targetLanguage?: ToolLanguage;
}
