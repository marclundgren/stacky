import ora from "ora";
import dotenv from "dotenv";
import { Command as CommanderCommand } from "commander";
import { Plan, ProjectConfig } from "../types.js";
import { DeepSeekAI } from "../ai/deepseek.js";
import { ProjectScaffolder } from "../scaffolder/index.js";
import inquirer from "inquirer";
import { OllamaAI } from "../ai/ollama.js";
import { createAIClient } from "../ai/factory.js";
import { Ollama } from "ollama";
import { CommandTransformer } from "../utils/command-transformer.js";
import { log } from "utils/log.js";

dotenv.config();

export class CLI {
  private ai: DeepSeekAI | OllamaAI;
  private scaffolder: ProjectScaffolder;

  constructor() {
    this.ai = createAIClient();
    this.scaffolder = new ProjectScaffolder();
  }

  async run() {
    const program = new CommanderCommand();

    program
      .name("stacky")
      .description("AI-powered project scaffolding tool")
      .version("0.1.0");

    program
      .command("create")
      .description("Create a new project")
      .action(async () => {
        const passCheck =
          !process.env.DO_SANITY_CHECK || (await this.runSanityCheck());

        if (!passCheck) {
          throw new Error("sanity check failed");
        }

        const userPreferences = await this.promptPreferences();

        let shouldExecute = false;
        let plan;
        const spinner = ora("thinking...\n");
        spinner.start();

        try {
          // Get AI recommendation and commands
          plan = await this.ai.getScaffoldingPlan(userPreferences);

          // Transform commands after receiving them from AI
          if (plan && plan.commands) {
            plan.commands = CommandTransformer.transformCommands(plan.commands);
          }

          spinner.succeed("got it!");

          log("verbose", "plan", plan);

          if (!plan) {
            throw new Error("could not find plan");
          }

          // Validate commands
          const validations = await this.scaffolder.validateEnvironment(
            plan.commands
          );

          // Check if all commands are available
          const missingCommands = validations.filter((v) => !v.exists);

          if (missingCommands.length > 0) {
            log(
              "info",
              "The following required commands are not available in your environment:"
            );
            missingCommands.forEach((validation) =>
              log("verbose", `- ${validation.command.command}`)
            );
            log(
              "info",
              "Please install the missing dependencies and try again."
            );
            return;
          }

          // Show commands and ask for confirmation
          log("info", "Proposed commands:");
          plan.commands.forEach((cmd) => log("none", `${cmd.command}\n`));

          const { shouldExecute: _shouldExecute } = await inquirer.prompt([
            {
              type: "confirm",
              name: "shouldExecute",
              message: "Would you like me to run these commands for you?",
              default: true,
            },
          ]);
          shouldExecute = _shouldExecute;
        } catch (error) {
          spinner.fail("Failed to fetch AI response");
          console.error(error);
          return;
        }

        if (shouldExecute && plan) {
          try {
            await this.scaffolder.executeCommands(".", plan.commands);
            log("verbose", "✨ Project successfully scaffolded!");
          } catch (error) {
            console.error("Failed to scaffold project:", error);
          }
        } else {
          log(
            "verbose",
            "Commands were not executed. You can run them manually."
          );
        }
      });

    program.parse();
  }

  private async promptPreferences(): Promise<Partial<ProjectConfig>> {
    const { metaFramework } = await inquirer.prompt([
      {
        type: "list",
        name: "metaFramework",
        message: "Which framework would you like to use?",
        default: "none",
        choices: [
          { name: "None (Vanilla React)", value: "none" },
          { name: "Next.js (Recommended for web apps)", value: "next" },
          {
            name: "React Router (Recommended for SPAs)",
            value: "react-router",
          },
          { name: "Expo (Recommended for mobile apps)", value: "expo" },
          { name: "Create React App (Deprecated)", value: "cra" },
        ],
      },
    ]);

    // If they chose a meta framework, we can skip some questions that would be handled by the framework
    const isMetaFramework = ["next", "expo"].includes(metaFramework);

    const preferences = await inquirer.prompt([
      {
        type: "list",
        name: "language",
        message: "Which language would you like to use?",
        choices: ["typescript", "javascript"],
      },
      {
        type: "list",
        name: "packageManager",
        message: "Which package manager would you like to use?",
        choices: ["npm", "yarn", "pnpm"],
      },
      {
        type: "list",
        name: "cssFramework",
        message: "Which CSS framework would you like to use?",
        default: "none",
        choices: [
          "none",
          "tailwind",
          "sass/scss",
          "styled-components",
          "css modules",
        ],
      },
      {
        type: "list",
        name: "stateManagement",
        message: "Would you like to add state management?",
        default: "none",
        choices: [
          { name: "None", value: "none" },
          { name: "Redux (Complex state with middleware)", value: "redux" },
          { name: "Zustand (Simple state management)", value: "zustand" },
          { name: "Jotai (Atomic state management)", value: "jotai" },
        ],
      },
      {
        type: "list",
        name: "testing",
        message: "Which testing framework would you like to use?",
        default: "none",
        choices: [
          { name: "None", value: "none" },
          { name: "Jest (Unit & Integration)", value: "jest" },
          { name: "Vitest (Fast alternative to Jest)", value: "vitest" },
          { name: "Playwright (E2E testing)", value: "playwright" },
          { name: "Cypress (E2E testing)", value: "cypress" },
        ],
      },
      {
        type: "checkbox",
        name: "tooling",
        message: "Select additional development tools:",
        choices: [
          { name: "ESLint", value: "eslint" },
          { name: "Prettier", value: "prettier" },
          { name: "Husky (Git Hooks)", value: "husky" },
          { name: "Commitlint", value: "commitlint" },
        ],
      },
      {
        type: "confirm",
        name: "api",
        message: "Would you like to add API integration setup?",
        default: false,
      },
      {
        type: "list",
        name: "apiClient",
        message: "Which API client would you like to use?",
        when: (answers) => answers.api,
        choices: [
          { name: "React Query/TanStack (Recommended)", value: "react-query" },
          { name: "SWR (Lightweight alternative)", value: "swr" },
          { name: "Axios (HTTP client only)", value: "axios" },
          { name: "Fetch (Browser native)", value: "fetch" },
        ],
      },
      {
        type: "confirm",
        name: "docker",
        message: "Would you like to add Docker configuration?",
        default: false,
      },
      {
        type: "input",
        name: "dockerBaseImage",
        message: "Which Node.js base image would you like to use?",
        default: "node:18-alpine",
        when: (answers) => answers.docker,
        validate: (input: string) => {
          if (input.trim().length === 0) return "Base image is required";
          return true;
        },
      },
      {
        type: "input",
        name: "dockerPort",
        message: "Which port should the Docker container expose?",
        default: "3000",
        when: (answers) => answers.docker,
        validate: (input: string) => {
          if (input.trim().length === 0) return true;
          const port = parseInt(input);
          if (isNaN(port) || port < 1 || port > 65535) {
            return "Please enter a valid port number (1-65535)";
          }
          return true;
        },
      },
      {
        type: "list",
        name: "deployment",
        message: "Would you like to add CI/CD configuration?",
        default: "none",
        choices: [
          { name: "None", value: "none" },
          { name: "GitHub Actions", value: "github-actions" },
          { name: "GitLab CI", value: "gitlab-ci" },
          { name: "Circle CI", value: "circle-ci" },
        ],
      },
    ]);

    // Combine all preferences
    return {
      metaFramework,
      ...preferences,
      dockerConfig: preferences.docker
        ? {
            baseImage: preferences.dockerBaseImage,
            port: preferences.dockerPort,
          }
        : undefined,
    };
  }

  private async runSanityCheck() {
    const ollama = new Ollama({ host: String(process.env.OLLAMA_HOST) });
    try {
      const { models } = await ollama.ps();
      process.stdout.write("\nmodels: \n");
      models.forEach((model) => {
        process.stdout.write(`${model.name}\n`);
      });

      if (!models.length) {
        throw new Error("no running models on this host");
      }

      const response = await ollama.chat({
        model: String(process.env.OLLAMA_MODEL),
        messages: [{ role: "user", content: "Why is the sky blue?" }],
      });

      log("info", response.message);
      log("info", "✅ sanity check");

      return true;
    } catch (err) {
      console.error(err);
      console.error("❌ sanity check");
      return false;
    }
  }
}
