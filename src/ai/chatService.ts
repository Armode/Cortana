import { ai } from "./aiClient";
import { SYSTEM_INSTRUCTION } from "./systemPrompt";
import { executeToolCall } from "./toolExecutors";
import { StreamChatResponseArgs, StreamYield } from "../types";

export async function* streamChatResponse({
  modelName,
  formattedHistory,
  tools,
  newMessage,
  onMoodChange,
  streamMode = "buffered",
}: StreamChatResponseArgs): AsyncGenerator<StreamYield> {
  const chatOptions: any = {
    model: modelName,
    config: {
      tools,
      systemInstruction: SYSTEM_INSTRUCTION
    }
  };
  
  if (formattedHistory && formattedHistory.length > 0) {
    chatOptions.history = formattedHistory;
  }
  
  const chatInstance = ai.chats.create(chatOptions);

  let result = await chatInstance.sendMessageStream({ message: newMessage });

  while (true) {
    let hasToolCall = false;
    let textBuffer = "";
    const toolCalls: any[] = [];

    for await (const chunk of result as any) {
      const groundingChunks =
        chunk?.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

      if (groundingChunks.length) {
        yield { groundingChunks };
      }

      const parts = chunk?.candidates?.[0]?.content?.parts ?? [];

      for (const part of parts) {
        if (part.functionCall) {
          hasToolCall = true;
          toolCalls.push(part.functionCall);
        }

        if (part.text) {
          if (streamMode === "speculative") {
            yield { text: part.text };
          } else {
            textBuffer += part.text;
          }
        }
      }
    }

    if (hasToolCall) {
      const responses = await Promise.all(
        toolCalls.map(tc => executeToolCall(tc, onMoodChange))
      );

      result = await chatInstance.sendMessageStream({
        message: responses as any
      });

      continue;
    }

    if (streamMode === "buffered" && textBuffer.trim()) {
      yield { text: textBuffer };
    }

    break;
  }
}
