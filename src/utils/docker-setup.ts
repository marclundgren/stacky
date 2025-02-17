import fs from "fs";
import path from "path";
import { log } from "./log.js";

interface DockerConfig {
  baseImage: string;
  port?: number;
}

export class DockerSetup {
  static async setupDocker(
    projectPath: string,
    config: DockerConfig
  ): Promise<string[]> {
    const commands: string[] = [];

    // Create a basic Dockerfile
    const dockerfile = `FROM ${config.baseImage}

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

${config.port ? `EXPOSE ${config.port}` : ""}

CMD ["npm", "start"]`;

    // Create a basic docker-compose.yml
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

    // Create .dockerignore
    const dockerignore = `node_modules
npm-debug.log
build
.dockerignore
Dockerfile
docker-compose.yml`;

    try {
      await fs.promises.writeFile(
        path.join(projectPath, "Dockerfile"),
        dockerfile
      );
      commands.push("Created Dockerfile");

      await fs.promises.writeFile(
        path.join(projectPath, "docker-compose.yml"),
        dockerCompose
      );
      commands.push("Created docker-compose.yml");

      await fs.promises.writeFile(
        path.join(projectPath, ".dockerignore"),
        dockerignore
      );
      commands.push("Created .dockerignore");

      log("verbose", `Docker files created in ${projectPath}`);
      return commands;
    } catch (error) {
      log("verbose", `Error creating Docker files: ${error}`);
      throw error;
    }
  }
}
