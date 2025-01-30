import { Ollama } from "ollama";
import { DeepSeekAI } from "./deepseek";
import { OllamaAI } from "./ollama";

export function createAIClient() {
  if (process.env.USE_OLLAMA === 'true') {
    const ollamaUrl = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'codellama';
    const ollama = new Ollama({ host: ollamaUrl })

    return new OllamaAI(ollama, ollamaModel);
  } else {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      throw new Error('DEEPSEEK_API_KEY is required when USE_OLLAMA is false');
    }
    return new DeepSeekAI(deepseekApiKey);
  }
}