import ollama, { type Ollama } from "ollama";
import { Plan, ProjectConfig } from "../types.js";
import { Cache } from "../utils/cache.js";
import { delay } from "../utils/delay.js";
import { log } from "console";

export class OllamaAI {
  private ollama: Ollama;
  private model: string;
  private cache: Cache;
  private maxRetries: number = 3;
  private retryDelay: number = 1000;

  constructor(ollama: Ollama, model: string) {
    this.ollama = ollama;
    this.model = model;
    this.cache = new Cache();
  }

  async getScaffoldingPlan(
    userPreferences: Partial<ProjectConfig>
  ): Promise<Plan> {
    const cached = this.cache.get(userPreferences);
    if (cached) return cached;

    const messages = [
      {
        role: "system",
        content:
          "You are a web development expert. Generate project configurations and necessary CLI commands based on user preferences for installing and setting up a project. Omit any CLI commands for starting development services. Return ONLY valid JSON without any markdown formatting.",
      },
      {
        role: "user",
        content: `Generate a configuration JSON with 'config' and 'commands' arrays for: ${JSON.stringify(userPreferences)}`,
      },
    ];

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await this.ollama.chat({
          model: this.model,
          messages,
        });

        log('info', `response: ${JSON.stringify(response)}`);
        const { content } = response.message;
        try {
          const cleanContent = content.replace(/```json\n|\n```/g, "");
          const result = JSON.parse(cleanContent);
          this.cache.set(userPreferences, result);
          return result;
        } catch (error) {
          console.error("Failed to parse AI response:", content);
          throw error;
        }
      } catch (error) {
        lastError = error as Error;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Attempt ${attempt} failed:`, errorMessage);

        if (attempt < this.maxRetries) {
          const waitTime = this.retryDelay * attempt;
          log('info', `Waiting ${waitTime}ms before retry...`);
          await delay(waitTime);
        }
      }
    }

    console.error("All attempts to reach Ollama failed. Is Ollama running?");
    console.error("Try running: ollama serve");
    throw new Error(
      `Failed to fetch Ollama response after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }
}
