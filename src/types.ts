export interface ProjectConfig {
  metaFramework?: "next" | "react-router" | "expo" | "none";
  framework?: "react" | "vue" | "svelte";
  language: "typescript" | "javascript";
  bundler?: "vite" | "webpack";
  cssFramework?: "tailwind" | "none";
  testing?: "jest" | "vitest" | "none";
  linting?: "eslint" | "none";
  packageManager?: "npm" | "yarn" | "pnpm";
  stateManagement?: "redux" | "zustand" | "jotai" | "none";
  tooling?: string[];
  api?: boolean;
  apiClient?: "react-query" | "swr" | "axios" | "fetch";
  docker?: boolean;
  dockerConfig?: {
    baseImage: string;
    port?: string;
  };
  deployment?: "github-actions" | "gitlab-ci" | "circle-ci" | "none";
}

export interface CommandValidation {
  command: Command;
  exists: boolean;
}

export interface Command {
  name: string;
  command: string;
}

export interface Plan {
  description: string;
  commands: Command[];
}
