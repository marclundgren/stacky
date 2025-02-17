import { type Ollama } from "ollama";
import fs from "fs";
import { Plan, ProjectConfig } from "../types.js";
import { Cache } from "../utils/cache.js";
import { delay } from "../utils/delay.js";
import { log } from "../utils/log.js";

// Map framework selections to documentation directory names
const frameworkMap: Record<string, string> = {
  next: "Next.js",
  "react-router": "ReactRouter",
  expo: "Expo",
};

export class OllamaAI {
  private ollama: Ollama;
  private model: string;
  private cache: Cache;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(ollama: Ollama, model: string) {
    this.ollama = ollama;
    this.model = model;
    this.cache = new Cache();
  }

  private async getFrameworkContext(framework: string): Promise<string> {
    try {
      const readmePath = `src/docs/frameworks/${framework}/README.md`;
      log("verbose", `Reading docs from: ${readmePath}`);

      const content = await fs.promises.readFile(readmePath, "utf-8");
      log("verbose", `Successfully read framework docs for ${framework}`);
      return `Here is the current official setup guide for ${framework}:\n\n${content}\n\nPlease use this information to generate appropriate setup commands.`;
    } catch (error) {
      log("verbose", `Error reading framework docs: ${error}`);
      return "";
    }
  }

  private validateCommandFormat(commands: any[]): boolean {
    return commands.every(
      (cmd) =>
        typeof cmd === "object" &&
        typeof cmd.command === "string" &&
        typeof cmd.name === "string" &&
        !cmd.command.includes("[object Object]")
    );
  }

  private transformDockerCommands(commands: any[]): any[] {
    const { escapeBashCommand } = require("../utils/string-escaping.js");

    return commands.map((cmd) => {
      // If we see a content field instead of command, it's probably a Docker file creation command
      if (cmd.content && !cmd.command) {
        return {
          name: cmd.name,
          command: escapeBashCommand(
            cmd.content,
            cmd.name.toLowerCase().replace(/\s+/g, "-")
          ),
        };
      }

      // Handle echo commands that need safer escaping
      if (
        cmd.command?.includes("echo") &&
        (cmd.command.includes("Dockerfile") ||
          cmd.command.includes("docker-compose.yml") ||
          cmd.command.includes(".dockerignore"))
      ) {
        const content = cmd.command
          .split(/echo\s+['"]/)
          .slice(1)
          .join("")
          .replace(/['"]\s*>\s*[^'"\s]+$/, "");
        const filename = cmd.command.split(">").pop().trim();
        return {
          name: cmd.name,
          command: escapeBashCommand(content, filename),
        };
      }

      return cmd;
    });
  }

  async getScaffoldingPlan(
    userPreferences: Partial<ProjectConfig>
  ): Promise<Plan> {
    const cached = this.cache.get(userPreferences);
    if (cached) return cached;

    let frameworkContext = "";
    if (
      userPreferences.metaFramework &&
      frameworkMap[userPreferences.metaFramework]
    ) {
      frameworkContext = await this.getFrameworkContext(
        frameworkMap[userPreferences.metaFramework]
      );
    }
    log("verbose", `Framework context: ${frameworkContext}`);

    // Add Docker-specific instructions to the system prompt when Docker is enabled
    const dockerInstructions = userPreferences.docker
      ? `
When generating commands, please include Docker setup commands. The user has requested:
- Base image: ${userPreferences.dockerConfig?.baseImage}
- Port: ${userPreferences.dockerConfig?.port}

Please include commands for Docker setup using heredoc syntax (cat << 'EOF') to create files:
1. Create a Dockerfile with echo command
2. Create a docker-compose.yml with echo command
3. Create a .dockerignore with echo command
4. Add any necessary Docker-related dependencies
`
      : "";

    const messages = [
      {
        role: "system",
        content:
          "You are a web development expert. Generate project configurations and necessary CLI commands based on user preferences for installing and setting up a project. All commands must be executable shell commands. For file creation, use 'echo' commands. Return ONLY valid JSON without any markdown formatting." +
          (frameworkContext ? `\n\n${frameworkContext}` : "") +
          dockerInstructions,
      },
      {
        role: "user",
        content: `Generate a configuration JSON with 'config' and 'commands' arrays. Each command must have 'name' and 'command' fields. The 'command' field must be an executable shell command. Config: ${JSON.stringify(userPreferences)}`,
      },
    ];

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.ollama.chat({
          model: this.model,
          messages,
        });

        log("info", `response: ${JSON.stringify(response)}`);
        const { content } = response.message;
        try {
          const cleanContent = content.replace(/```json\n|\n```/g, "");
          const result = JSON.parse(cleanContent);

          // Transform any Docker file content commands into proper shell commands
          if (result.commands) {
            result.commands = this.transformDockerCommands(result.commands);
          }

          // Validate the command format
          if (!this.validateCommandFormat(result.commands)) {
            log(
              "verbose",
              `Invalid command format detected on attempt ${attempt}, retrying...`
            );
            throw new Error("Invalid command format");
          }

          this.cache.set(userPreferences, result);
          return result;
        } catch (error) {
          log(
            "verbose",
            `Failed to parse or validate AI response on attempt ${attempt}: ${content}`
          );
          if (attempt < this.maxRetries) {
            continue;
          }
          throw error;
        }
      } catch (error) {
        lastError = error as Error;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        log("verbose", `Attempt ${attempt} failed: ${errorMessage}`);

        if (attempt < this.maxRetries) {
          const waitTime = this.retryDelay * attempt;
          log("info", `Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        } else {
          console.error(
            "All attempts to reach Ollama failed. Is Ollama running?"
          );
          console.error("Try running: ollama serve");
          throw new Error(
            `Failed to fetch Ollama response after ${this.maxRetries} attempts: ${lastError?.message}`
          );
        }
      }
    }

    throw lastError || new Error("Failed to get scaffolding plan");
  }
}
