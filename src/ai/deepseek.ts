import OpenAI from "openai";
import { Plan, ProjectConfig } from "../types.js";
import { Cache } from "../utils/cache.js";

const model = String(process.env.DEEPSEEK_MODEL);

export class DeepSeekAI {
  private client: OpenAI;
  private cache: Cache;

  constructor(apiKey: string) {
    this.client = new OpenAI({
      baseURL: "https://api.deepseek.com",
      apiKey: apiKey,
    });
    this.cache = new Cache();
  }

  async getScaffoldingPlan(
    userPreferences: Partial<ProjectConfig>
  ): Promise<Plan> {
    const cached = this.cache.get(userPreferences);
    if (cached) return cached;

    const response = await this.client.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a web development expert. Generate project configurations and necessary CLI commands based on user preferences. Return ONLY valid JSON without any markdown formatting. If any of the CLI commands start with npx, then append it with --yes",
        },
        {
          role: "user",
          content: `Generate a configuration JSON with 'config' and 'commands' arrays for: ${JSON.stringify(userPreferences)}`,
        },
      ],
    });

    try {
      const content = String(response.choices[0].message.content);
      const cleanContent = content.replace(/```json\n|\n```/g, "");
      const result = JSON.parse(cleanContent);
      this.cache.set(userPreferences, result);
      return result;
    } catch (error) {
      console.error(
        "Failed to parse AI response:",
        response.choices[0].message.content
      );
      throw error;
    }
  }
}
