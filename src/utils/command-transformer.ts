import { Command } from "../types.js";

export class CommandTransformer {
  static transformCommand(rawCommand: Command | string): Command {
    const command = this.normalizeCommand(rawCommand);
    // If it's a create-react-app command and doesn't already have --yes
    console.log(`command: ${JSON.stringify(command)}`);
    // debugger;
    if (
      command.command.includes("npx create-react-app") &&
      !command.command.includes("--yes")
    ) {
      return {
        ...command,
        command: `${command.command} --yes`,
      };
    }
    return command;
  }

  static transformCommands(commands: Command[]): Command[] {
    return commands.map((command) => this.transformCommand(command));
  }

  static normalizeCommand(rawCommand: Command | string): Command {
    // If it's already a Command object, return a copy
    if (typeof rawCommand !== "string" && "command" in rawCommand) {
      return {
        name: String(rawCommand.name),
        command: rawCommand.command.trim(),
      };
    }

    // If it's a string, convert to Command object
    const commandStr = rawCommand.toString().trim();

    // Try to generate a descriptive name from the command
    const firstWord = commandStr.split(" ")[0];
    let name = firstWord.charAt(0).toUpperCase() + firstWord.slice(1);

    // Add more context if it's a common command
    if (firstWord === "npm") {
      const secondWord = commandStr.split(" ")[1];
      name = `NPM ${secondWord || "Command"}`;
    } else if (firstWord === "npx") {
      const secondWord = commandStr.split(" ")[1];
      name = `Execute ${secondWord || "Package"}`;
    }

    return {
      name,
      command: commandStr,
    };
  }
}
