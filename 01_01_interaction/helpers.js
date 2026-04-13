export const extractResponseText = (data) => {
  // Check if data is an array (streaming response format)
  if (Array.isArray(data)) {
    let fullText = "";
    for (const chunk of data) {
      if (chunk?.candidates?.[0]?.content?.parts?.[0]?.text) {
        fullText += chunk.candidates[0].content.parts[0].text;
      }
    }
    if (fullText) return fullText;
  }

  // Handle single object responses
  if (data?.candidates?.[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  if (typeof data?.output_text === "string" && data.output_text.trim()) {
    return data.output_text;
  }

  const messages = Array.isArray(data?.output)
    ? data.output.filter((item) => item?.type === "message")
    : [];

  const textPart = messages
    .flatMap((message) => (Array.isArray(message?.content) ? message.content : []))
    .find((part) => part?.type === "output_text" && typeof part?.text === "string");

  return textPart?.text ?? "";
};

export const toMessage = (role, content) => ({ role: role === "assistant" ? "model" : role, content });
