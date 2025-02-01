// import { execSync } from 'child_process';
import { exec } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { Command, CommandValidation } from '../types';
import { CommandValidator } from '../utils/command-validator';
` `
export class ProjectScaffolder {
  private baseDir: string;

  constructor(baseDir: string = 'test-projects') {
    // Ensure the base directory is an absolute path
    this.baseDir = path.resolve(process.cwd(), baseDir);
    
    if (!existsSync(this.baseDir)) {
      mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async validateEnvironment(commands: Command[]): Promise<CommandValidation[]> {
    return CommandValidator.validateCommands(commands);
  }

  async executeCommands(projectName: string, commands: Command[]): Promise<void> {
    const projectDir = path.join(this.baseDir, projectName);
    
    // Create project directory if it doesn't exist
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    for (const command of commands) {
      try {
        console.log(`Executing: ${command.command} in directory: ${projectDir}`);

        // const child = execSync(command.command, { 
        const child = exec(command.command, { 
          // stdio: 'inherit',
          cwd: projectDir,
          shell: 'true', // Explicitly specify shell usage
          env: { ...process.env, PATH: process.env.PATH } // Pass through PATH
        });

        child.stdout?.on('data', (data) => {
          console.log(`[stdout] ${data.toString().trim()}`);
        });

        child.stderr?.on('data', (data) => {
          console.error(`[stderr] ${data.toString().trim()}`);
        });

        await new Promise((resolve, reject) => {
          child.on('close', (code) => {
            if (code !== 0) {
              reject(new Error(`Command failed with exit code ${code}: ${command.command}`));
            } else {
              console.log(`Command succeeded: ${command.command}`);
              resolve(void 0);
            }
          });
        });
      } catch (error) {
        console.error(`Failed to execute command: ${command.command}`);
        throw error;
      }
    }
  }
}