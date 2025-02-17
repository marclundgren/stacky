import { exec } from "child_process";
import { existsSync, mkdirSync, promises as fs } from "fs";
import path from "path";
import { Command, CommandValidation, ProjectConfig } from "../types.js";
import { CommandValidator } from "../utils/command-validator.js";
import util from "util";
import { log } from "utils/log.js";

const execPromise = util.promisify(exec);

export class ProjectScaffolder {
  private baseDir: string;

  constructor(baseDir: string = String(process.env.SANDBOX_DIR)) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    log("verbose", `this.baseDir: ${this.baseDir}`);
    log("verbose", `process.cwd(): ${process.cwd()}`);

    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async validateEnvironment(commands: Command[]): Promise<CommandValidation[]> {
    return CommandValidator.validateCommands(commands);
  }

  private async setupDocker(
    projectDir: string,
    config: ProjectConfig["dockerConfig"]
  ) {
    if (!config) return;

    const dockerfile = `FROM ${config.baseImage}

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

${config.port ? `EXPOSE ${config.port}` : ""}

CMD ["npm", "start"]`;

    const dockerCompose = `version: '3'
services:
  app:
    build: .
    ${
      config.port
        ? `ports:
      - "${config.port}:${config.port}"`
        : ""
    }
    volumes:
      - .:/app
      - /app/node_modules`;

    const dockerignore = `node_modules
npm-debug.log
build
.dockerignore
Dockerfile
docker-compose.yml`;

    try {
      await fs.writeFile(path.join(projectDir, "Dockerfile"), dockerfile);
      log("info", "Created Dockerfile");

      await fs.writeFile(
        path.join(projectDir, "docker-compose.yml"),
        dockerCompose
      );
      log("info", "Created docker-compose.yml");

      await fs.writeFile(path.join(projectDir, ".dockerignore"), dockerignore);
      log("info", "Created .dockerignore");
    } catch (error) {
      console.error("Error creating Docker files:", error);
      throw error;
    }
  }

  async executeCommands(
    projectName: string,
    commands: Command[],
    config?: Partial<ProjectConfig>
  ): Promise<void> {
    const projectDir = path.join(this.baseDir, projectName);

    // Create project directory if it doesn't exist
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    for (const command of commands) {
      try {
        log("info", `Executing: ${command.command}`);
        log("verbose", `Working directory: ${projectDir}\n`);

        // For cd commands, we'll update the working directory instead
        if (command.command.startsWith("cd ")) {
          const newDir = command.command.split(" ")[1];
          process.chdir(path.join(projectDir, newDir));
          log("verbose", `Changed directory to: ${process.cwd()}`);
          continue;
        }

        const { stdout, stderr } = await execPromise(command.command, {
          cwd: projectDir,
          env: { ...process.env, FORCE_COLOR: "true" },
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        });

        if (stdout) log("info", stdout);
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

    // Setup Docker if configured
    if (config?.docker && config.dockerConfig) {
      await this.setupDocker(projectDir, config.dockerConfig);
    }
  }
}
