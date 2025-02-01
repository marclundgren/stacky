import ora from 'ora';
import dotenv from "dotenv";
import { Command } from "commander";
import { ProjectConfig } from "../types";
import { DeepSeekAI } from "../ai/deepseek";
import { ProjectScaffolder } from "../scaffolder";
import inquirer from "inquirer";
import { OllamaAI } from '../ai/ollama';
import { createAIClient } from '../ai/factory';
import { Ollama } from 'ollama';

dotenv.config();

export class CLI {
  private ai: DeepSeekAI | OllamaAI;
  private scaffolder: ProjectScaffolder;

  constructor(apiKey: string) {
    this.ai = createAIClient();
    this.scaffolder = new ProjectScaffolder();
  }

  async run() {
    const program = new Command();

    console.log(-1)

    program
      .name("stacky")
      .description("AI-powered project scaffolding tool")
      .version("0.1.0");

    program
      .command("create")
      .description("Create a new project")
      .action(async () => {
        const passCheck = !Boolean(process.env.DO_SANITY_CHECK) || await this.runSanityCheck();

        if (!passCheck) {
          throw new Error("sanity check failed");
        }

        // const projectName = await this.promptProjectName();
        const userPreferences = await this.promptPreferences();

        let shouldExecute = false;
        let plan;
        const spinner = ora('thinking...\n')
        spinner.start();
        try {
          // Get AI recommendation and commands
          plan = await this.ai.getScaffoldingPlan(userPreferences);
          spinner.succeed('got it!');

          console.log('plan', plan)

          if (!plan) {
            throw new Error("could not find plan");
          }

          // Validate commands
          const validations = await this.scaffolder.validateEnvironment(
            plan.commands,
          );

          // Check if all commands are available
          const missingCommands = validations.filter((v) => !v.exists);

          if (missingCommands.length > 0) {
            console.log(
              "The following required commands are not available in your environment:",
            );
            missingCommands.forEach((cmd) => console.log(`- ${cmd.command}`));
            console.log("Please install the missing dependencies and try again.");
            return;
          }

          // Show commands and ask for confirmation
          console.log("\nProposed commands:");
          plan.commands.forEach((cmd) => console.log(`- ${cmd.command}`));

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
          spinner.fail('Failed to fetch AI response');
          console.error(error);
        }

        if (shouldExecute && plan) {
          try {
            await this.scaffolder.executeCommands('.', plan.commands);
            console.log("✨ Project successfully scaffolded!");
          } catch (error) {
            console.error("Failed to scaffold project:", error);
          }
        } else {
          console.log("Commands were not executed. You can run them manually.");
        }
      });

    program
      .name("sanity")
      .description("sanity check")
      // .version("0.0.1")
      .action(async () => {
        console.log(1)
        const ollama = new Ollama({ host: 'http://localhost:11435' })
        console.log(2)
        try {
          const response = await ollama.chat({
            model: 'qwen2.5-coder:latest',
            messages: [{ role: 'user', content: 'Why is the sky blue?' }],
          })
  
          console.log(response.message);
          console.log('✅ sanity check')
        } catch(err) {
          console.error(err)
          console.error('❌ sanity check')
        }
      })

    program.parse();
  }

  // private async promptProjectName(): Promise<string> {
  //   const { projectName } = await inquirer.prompt([
  //     {
  //       type: "input",
  //       name: "projectName",
  //       message: "What is your project name?",
  //       validate: (input: string) => {
  //         if (/^[a-z0-9-]+$/.test(input)) return true;
  //         return "Project name can only contain lowercase letters, numbers, and hyphens";
  //       },
  //       default: 'my-test-app'
  //     },
  //   ]);
  //   return projectName;
  // }

  private async promptPreferences(): Promise<Partial<ProjectConfig>> {
    // todo use type checking for these choices
    return inquirer.prompt([
      {
        type: "list",
        name: "framework",
        message: "Which framework would you like to use?",
        choices: ["react", "vue", "svelte"],
      },
      {
        type: "list",
        name: "language",
        message: "Which language would you like to use?",
        choices: ["typescript", "javascript"],
      },
      {
        type: "list",
        name: "bundler",
        message: "Which bundler would you like to use?",
        choices: ["vite", "webpack"],
      },
      {
        type: "list",
        name: "cssFramework",
        message: "Would you like to use Tailwind CSS?",
        choices: ["tailwind", "none"],
      },
      {
        type: "confirm",
        name: "linting",
        message: "Would you like to add linting?",
      },
      {
        type: "list",
        name: "testing",
        message: "Would you like to add testing?",
        choices: ["jest", "vitest", "none"],
      },
      {
        type: "list",
        name: "code formatting",
        message: "Would you like to add a code formatter?",
        choices: ["prettier", "eslint", "none"],
      }
    ]);
  }

  private async runSanityCheck() {
    console.log(1)
    const ollama = new Ollama({ host: String(process.env.OLLAMA_HOST) })
    console.log(2)
    try {
      const { models } = await ollama.ps();
      console.log(2.1)
      process.stdout.write('\nmodels: \n');
      console.log(2.2)
      models.forEach((model) => {
        process.stdout.write(`${model.name}\n`);
      })
      console.log(2.3)

      if (!models.length) {
        throw (new Error('no running models on this host'));
      }
      console.log(2.4)
      const response = await ollama.chat({
        model: String(process.env.OLLAMA_MODEL),
        messages: [{ role: 'user', content: 'Why is the sky blue?' }],
      })
      console.log(2.5)

      console.log(response.message);
      console.log('✅ sanity check')

      return models;
    } catch(err) {
      console.error(err)
      console.error('❌ sanity check')
    }
    console.log(2.6)
    return false;
  }
}
