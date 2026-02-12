import type { Tool } from "../types/tool.js";

/**
 * Tool definitions matching PROJECT.md
 */
export const TOOLS: Tool[] = [
  {
    id: "cpp-to-c-transpiler",
    name: "C++ to C Transpiler",
    description: "Converts C++ code to C code",
    status: "in-development",
    category: "transpiler",
    sourceLanguage: "cpp",
    targetLanguage: "c",
  },
  {
    id: "cpp-to-rust-transpiler",
    name: "C++ to Rust Transpiler",
    description: "Converts C++ code to Rust code",
    status: "coming-soon",
    category: "transpiler",
    sourceLanguage: "cpp",
    targetLanguage: "rust",
  },
  {
    id: "csharp-verification",
    name: "C# Verification",
    description: "Formal verification for C# code",
    status: "available",
    category: "verification",
    sourceLanguage: "csharp",
  },
  {
    id: "java-verification",
    name: "Java Verification",
    description: "Formal verification for Java code",
    status: "available",
    category: "verification",
    sourceLanguage: "java",
  },
  {
    id: "rust-verification",
    name: "Rust Verification",
    description: "Formal verification for Rust code",
    status: "available",
    category: "verification",
    sourceLanguage: "rust",
  },
  {
    id: "python-linter",
    name: "Python Linter",
    description: "Static analysis and linting for Python code",
    status: "available",
    category: "linter",
    sourceLanguage: "python",
  },
  {
    id: "typescript-linter",
    name: "TypeScript Linter",
    description: "Static analysis and linting for TypeScript code",
    status: "available",
    category: "linter",
    sourceLanguage: "typescript",
  },
  {
    id: "bash-verification",
    name: "Bash Verification",
    description: "Static analysis and verification for Bash scripts",
    status: "available",
    category: "verification",
    sourceLanguage: "bash",
  },
];
