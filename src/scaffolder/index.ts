import { exec } from "child_process";
import { existsSync, mkdirSync } from "fs";
import path from "path";
import { Command, CommandValidation } from "../types.js";
import { CommandValidator } from "../utils/command-validator.js";
import util from "util";

const execPromise = util.promisify(exec);

export class ProjectScaffolder {
  private baseDir: string;

  constructor(baseDir: string = String(process.env.SANDBOX_DIR)) {
    // Ensure the base directory is an absolute path
    this.baseDir = path.resolve(process.cwd(), baseDir);
    console.log(`this.baseDir: ${this.baseDir}`);
    console.log(`process.cwd(): ${process.cwd()}`);

    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async validateEnvironment(commands: Command[]): Promise<CommandValidation[]> {
    return CommandValidator.validateCommands(commands);
  }

  async executeCommands(
    projectName: string,
    commands: Command[]
  ): Promise<void> {
    const projectDir = path.join(this.baseDir, projectName);

    // Create project directory if it doesn't exist
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    for (const command of commands) {
      try {
        console.log(`\nExecuting: ${command.command}`);
        console.log(`Working directory: ${projectDir}\n`);

        // For cd commands, we'll update the working directory instead
        if (command.command.startsWith("cd ")) {
          const newDir = command.command.split(" ")[1];
          process.chdir(path.join(projectDir, newDir));
          console.log(`Changed directory to: ${process.cwd()}`);
          continue;
        }

        const { stdout, stderr } = await execPromise(command.command, {
          cwd: projectDir,
          env: { ...process.env, FORCE_COLOR: "true" },
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });

        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        // Add a small delay between commands to ensure proper sequencing
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } catch (error) {
        if (error instanceof Error) {
          console.error(`\nError executing command: ${command.command}`);
          console.error(error.message);
          throw error;
        }
      }
    }
  }
}
