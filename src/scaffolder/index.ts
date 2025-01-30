import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { Command, CommandValidation } from '../types';
import { CommandValidator } from '../utils/command-validator';

export class ProjectScaffolder {
  private baseDir: string;

  constructor(baseDir: string = 'test-projects') {
    this.baseDir = baseDir;
    if (!existsSync(baseDir)) {
      mkdirSync(baseDir, { recursive: true });
    }
  }

  async validateEnvironment(commands: Command[]): Promise<CommandValidation[]> {
    return CommandValidator.validateCommands(commands);
  }

  async executeCommands(projectName: string, commands: string[]): Promise<void> {
    const projectDir = path.join(this.baseDir, projectName);
    
    // Create project directory if it doesn't exist
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    for (const command of commands) {
      try {
        console.log(`Executing: ${command}`);
        execSync(command, { 
          stdio: 'inherit',
          cwd: projectDir,
          shell: 'true', // Explicitly specify shell usage
          env: { ...process.env, PATH: process.env.PATH } // Pass through PATH
        });
      } catch (error) {
        console.error(`Failed to execute command: ${command}`);
        throw error;
      }
    }
  }
}