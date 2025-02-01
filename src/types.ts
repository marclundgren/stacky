export interface ProjectConfig {
  framework: "react" | "vue" | "svelte";
  language: "typescript" | "javascript";
  bundler: "vite" | "webpack";
  cssFramework?: "tailwind" | "none";
  // platform: 'unix' | 'windows' | 'any';
  testing?: "jest" | "vitest" | "none";
  linting?: "eslint" | "none";
}

export interface CommandValidation {
  command: Command;
  exists: boolean;
}

export interface Command {
  name: string;
  command: string;
}
// export type Command = string;

export interface Plan {
  description: string;
  commands: Command[];
}
