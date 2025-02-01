import { execSync } from "child_process";
import { Command, CommandValidation } from "../types";

export class CommandValidator {
  static async validateCommand(command: Command): Promise<boolean> {
    try {
      // Extract the base command (e.g., 'npm' from 'npm install')
      const baseCommand = command.command.split(" ")[0];

      // Check if command exists in PATH
      execSync(`which ${baseCommand}`, { stdio: "ignore" });
      return true;
    } catch {
      // console.log(`command: ${command}, ${JSON.stringify(command)}`)
      console.log(`didn't find base command: \`${command.command.split(" ")[0]}\``)
      return false;
    }
  }

  static async validateCommands(
    commands: Command[],
  ): Promise<CommandValidation[]> {
    const validations = await Promise.all(
      commands.map(async (command) => ({
        command,
        exists: await this.validateCommand(command),
      })),
    );
    return validations;
  }
}
