import { execSync } from "child_process";
import { Command, CommandValidation } from "../types.js";

const defaultShellBuiltins = [
  "cd",
  "pwd",
  "mkdir",
  "rm",
  "cp",
  "mv",
  "ls",
  "echo",
];

export class CommandValidator {
  private static shellBuiltins: Set<string> | null = null;

  static async validateCommand(command: Command): Promise<boolean> {
    try {
      const baseCommand = command.command.split(" ")[0];
      // Check if it's a shell builtin
      if (this.getShellBuiltins().has(baseCommand)) {
        console.log(`found ${baseCommand} in shell builtins`);
        return true;
      } else {
        console.log(`didnt find ${baseCommand} in shell builtins`);
      }

      // For npm commands starting with npx, validate npm instead
      if (baseCommand === "npx") {
        execSync("which npm", { stdio: "ignore" });
        return true;
      }

      // Check if command exists in PATH
      execSync(`which ${baseCommand}`, { stdio: "ignore" });
      return true;
    } catch (error) {
      console.error(error);
      console.log(`Command not found: ${JSON.stringify(command)}`);
      // console.log(`Command not found: ${command.command.split(" ")[0]}`);
      return false;
    }
  }

  static async validateCommands(
    commands: Command[]
  ): Promise<CommandValidation[]> {
    const validations = await Promise.all(
      commands.map(async (command) => ({
        command,
        exists: await this.validateCommand(command),
      }))
    );
    return validations;
  }

  private static getShellBuiltins(): Set<string> {
    if (this.shellBuiltins) {
      return this.shellBuiltins;
    }

    try {
      // More reliable way to get bash builtins
      const bashBuiltins = execSync('bash -c "enable -n"', { encoding: "utf8" })
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.startsWith("enable "))
        .map((line) => line.split(" ")[1])
        .filter(Boolean);

      this.shellBuiltins = new Set([...defaultShellBuiltins, ...bashBuiltins]);
      return this.shellBuiltins;
    } catch (error) {
      // Fallback to a minimal set of essential builtins if shell commands fail
      console.warn("Failed to detect shell builtins, falling back to defaults");
      return new Set(["cd", "pwd", "mkdir", "rm", "cp", "mv", "ls", "echo"]);
    }
  }
}
