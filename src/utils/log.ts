const { DEBUG_LEVEL } = process.env;

const logLevel = String(DEBUG_LEVEL) || "info";

type LogLevel = "verbose" | "info" | "none";

export const log = (minimumLogLevel: LogLevel, ...args: unknown[]) => {
    
    const levels: LogLevel[] = ["none", "info", "verbose"];
    const minimumLevelIndex = levels.indexOf(minimumLogLevel);
    const currentLevelIndex = levels.indexOf(logLevel as LogLevel);
    
    if (currentLevelIndex >= minimumLevelIndex) {
        console.log(...args);
    }
}