#!/usr/bin/env node
import { CLI } from "cli/index.js";
import dotenv from "dotenv";

dotenv.config();

const apiKey = String(process.env.DEEPSEEK_API_KEY);
const useOllama = process.env.USE_OLLAMA === "true";

if (!useOllama && !apiKey) {
  console.error("DEEPSEEK_API_KEY environment variable is required");
  process.exit(1);
}

console.log("Environment config:", {
  useOllama,
  ollamaUrl: process.env.OLLAMA_HOST,
  ollamaModel: process.env.OLLAMA_MODEL,
});

const cli = new CLI();
cli.run().catch(console.error);
