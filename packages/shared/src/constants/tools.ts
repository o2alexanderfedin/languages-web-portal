import type { Tool } from "../types/tool.js";

export const TOOLS: Tool[] = [
  {
    id: "cpp-to-c-transpiler",
    name: "C++ to C Transpiler",
    description: "Transpiles C++ code to C",
    status: "available",
    category: "transpiler",
    sourceLanguage: "cpp",
    targetLanguage: "c"
  },
  {
    id: "cpp-to-rust-transpiler",
    name: "C++ to Rust Transpiler",
    description: "Transpiles C++ code to Rust",
    status: "available",
    category: "transpiler",
    sourceLanguage: "cpp",
    targetLanguage: "rust"
  },
  {
    id: "csharp-verification",
    name: "C# Verification",
    description: "Formal verification for C# code",
    status: "in-development",
    category: "verification",
    sourceLanguage: "csharp"
  },
  {
    id: "java-verification",
    name: "Java Verification",
    description: "Formal verification for Java code",
    status: "in-development",
    category: "verification",
    sourceLanguage: "java"
  },
  {
    id: "rust-verification",
    name: "Rust Verification",
    description: "Formal verification for Rust code",
    status: "in-development",
    category: "verification",
    sourceLanguage: "rust"
  },
  {
    id: "python-linter",
    name: "Python Linter",
    description: "Linting and code quality analysis for Python",
    status: "coming-soon",
    category: "linter",
    sourceLanguage: "python"
  },
  {
    id: "typescript-linter",
    name: "TypeScript Linter",
    description: "Linting and code quality analysis for TypeScript",
    status: "coming-soon",
    category: "linter",
    sourceLanguage: "typescript"
  },
  {
    id: "bash-verification",
    name: "Bash Verification",
    description: "Verification and validation for Bash scripts",
    status: "coming-soon",
    category: "verification",
    sourceLanguage: "bash"
  }
];
