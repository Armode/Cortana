import { Mood, ToolCall, ToolResponse } from "../types";

export async function executeToolCall(
  toolCall: ToolCall,
  onMoodChange?: (mood: Mood) => void
): Promise<ToolResponse> {
  if (toolCall.name === "set_mood") {
    const mood = toolCall.args?.mood;

    if (mood === "light" || mood === "dark") {
      onMoodChange?.(mood);

      return {
        functionResponse: {
          id: toolCall.id,
          name: toolCall.name,
          response: { result: "success", mood }
        }
      };
    }

    return {
      functionResponse: {
        id: toolCall.id,
        name: toolCall.name,
        response: { result: "error" }
      }
    };
  }

  return {
    functionResponse: {
      id: toolCall.id,
      name: toolCall.name,
      response: { result: "unsupported_tool" }
    }
  };
}
