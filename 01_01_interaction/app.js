import {
  AI_API_KEY,
  AI_PROVIDER,
  EXTRA_API_HEADERS,
  RESPONSES_API_ENDPOINT,
  resolveModelForProvider
} from "../config.js";
import { extractResponseText, toMessage } from "./helpers.js";

const MODEL = resolveModelForProvider("gpt-5.2");

async function chat(input, history = []) {
  const isGemini = AI_PROVIDER === "gemini";
  const url = isGemini 
    ? `${RESPONSES_API_ENDPOINT}?key=${AI_API_KEY}`
    : RESPONSES_API_ENDPOINT;

  const headers = isGemini 
    ? { "Content-Type": "application/json" }
    : {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${AI_API_KEY}`,
        ...EXTRA_API_HEADERS
      };

  const body = isGemini
    ? {
        contents: [...history, toMessage("user", input)].map(m => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }]
        }))
      }
    : {
        model: MODEL,
        input: [...history, toMessage("user", input)],
        reasoning: { effort: "medium" }
      };

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  const data = await response.json();
  console.log(data);

  if (!response.ok || (data.error && !isGemini)) {
    const message = data?.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  
  if (isGemini && data.error) {
      throw new Error(data.error.message);
  }

  const text = extractResponseText(data);

  if (!text) {
    throw new Error("Missing text output in API response");
  }

  return {
    text,
    reasoningTokens: data?.usage?.output_tokens_details?.reasoning_tokens ?? 0
  };
}

async function main() {
  const firstQuestion = "What is 25 * 48?";
  const firstAnswer = await chat(firstQuestion);

  const secondQuestion = "Divide that by 4.";
  const secondQuestionContext = [
    {
      type: "message",
      role: "user",
      content: firstQuestion
    },
    {
      type: "message",
      role: "assistant",
      content: firstAnswer.text
    }
  ];
  const secondAnswer = await chat(secondQuestion, secondQuestionContext);

  console.log("Q:", firstQuestion);
  console.log("A:", firstAnswer.text, `(${firstAnswer.reasoningTokens} reasoning tokens)`);
  console.log("Q:", secondQuestion);
  console.log("A:", secondAnswer.text, `(${secondAnswer.reasoningTokens} reasoning tokens)`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});