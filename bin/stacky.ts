#!/usr/bin/env node
import { CLI } from "../src/cli";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.DEEPSEEK_API_KEY;

if (!apiKey) {
  console.error("DEEPSEEK_API_KEY environment variable is required");
  process.exit(1);
}

console.log('Environment config:', {
  useOllama: process.env.USE_OLLAMA,
  ollamaUrl: process.env.OLLAMA_HOST,
  ollamaModel: process.env.OLLAMA_MODEL
});

const cli = new CLI(apiKey);
cli.run().catch(console.error);
