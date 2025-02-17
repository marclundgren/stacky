import dotenv from "dotenv";
dotenv.config();

const logLevel = process.env.LOG_LEVEL ?? "info";

type LogLevel = "verbose" | "info" | "none";

export const log = (minimumLogLevel: LogLevel, ...args: unknown[]) => {
  // TODO add test coverage that logs are printed as expected
  const levels: LogLevel[] = ["none", "info", "verbose"];
  const minimumLevelIndex = levels.indexOf(minimumLogLevel);
  const currentLevelIndex = levels.indexOf(logLevel as LogLevel);

  //   console.log(
  //     "log debug",
  //     JSON.stringify({
  //       currentLevelIndex,
  //       minimumLevelIndex,
  //       logLevel,
  //       minimumLogLevel,
  //     }),
  //     ...args
  //   );
  if (currentLevelIndex >= minimumLevelIndex) {
    console.log(...args);
  }
};
