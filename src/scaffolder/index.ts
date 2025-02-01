// import { execSync } from 'child_process';
import { exec, spawn } from 'child_process';
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
    
    if (!existsSync(projectDir)) {
      mkdirSync(projectDir, { recursive: true });
    }

    for (const command of commands) {
      try {
        console.log(`Executing: ${command.command} in directory: ${projectDir}`);

        const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';

        // Parse command string into command and arguments
        const parts = command.command.split(' ');
        const cmd = parts[0];
        const args = parts.slice(1);

        await new Promise((resolve, reject) => {
          // const child = exec(command.command, { 
          //   cwd: projectDir,
          //   shell,
          //   env: { ...process.env, PATH: process.env.PATH },
          //   // Set stdio to inherit to allow interactive prompts
          //   stdio: 'inherit',
          // });
          const child = spawn(cmd, args, {
            cwd: projectDir,
            stdio: 'inherit',  // This is valid in SpawnOptions
            shell: true,       // This can be boolean in SpawnOptions
            env: { ...process.env }
          });

          // Handle stdout
          child.stdout?.on('data', (data) => {
            console.log(`[stdout] ${data.toString().trim()}`);
          });

          // Handle stderr
          child.stderr?.on('data', (data) => {
            console.error(`[stderr] ${data.toString().trim()}`);
          });

          // Handle completion
          child.on('error', reject);
          child.on('close', (code) => {
            if (code === 0) {
              console.log(`Command succeeded: ${command.command}`);
              resolve(void 0);
            } else {
              reject(new Error(`Command failed with exit code ${code}: ${command.command}`));
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