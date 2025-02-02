import { Ollama } from 'ollama'
import dotenv from "dotenv";

dotenv.config();

(async (host, model) => {
  const message = { role: 'user', content: 'Why is the sky blue?' }
  const ollama = new Ollama({ host });
  const response = await ollama.chat({ model, messages: [message], stream: true })
  for await (const part of response) {
    process.stdout.write(part.message.content)
  }

  const { models } = await ollama.ps();

  process.stdout.write('\nmodels: \n');

  models.forEach((model) => {
    process.stdout.write(`${model.name}\n`)
  })
})(String(process.env.OLLAMA_HOST), String(process.env.OLLAMA_MODEL))