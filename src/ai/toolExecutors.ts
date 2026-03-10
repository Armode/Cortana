import { Mood, ToolCall, ToolResponse } from "../types";

export async function executeToolCall(
  toolCall: ToolCall,
  onMoodChange?: (mood: Mood) => void,
  onTaskOperation?: (operation: 'create' | 'update', payload: any) => any
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

  if (toolCall.name === "create_task" && onTaskOperation) {
    const title = toolCall.args?.title;
    if (title) {
      const newTask = onTaskOperation('create', { title });
      return {
        functionResponse: {
          id: toolCall.id,
          name: toolCall.name,
          response: { result: "success", task: newTask }
        }
      };
    }
    return {
      functionResponse: {
        id: toolCall.id,
        name: toolCall.name,
        response: { result: "error", message: "Missing title" }
      }
    };
  }

  if (toolCall.name === "update_task_status" && onTaskOperation) {
    const { id, status } = toolCall.args || {};
    if (id && (status === 'pending' || status === 'completed')) {
      const updated = onTaskOperation('update', { id, status });
      if (updated) {
        return {
          functionResponse: {
            id: toolCall.id,
            name: toolCall.name,
            response: { result: "success", message: `Task ${id} updated to ${status}` }
          }
        };
      } else {
        return {
          functionResponse: {
            id: toolCall.id,
            name: toolCall.name,
            response: { result: "error", message: `Task ${id} not found` }
          }
        };
      }
    }
    return {
      functionResponse: {
        id: toolCall.id,
        name: toolCall.name,
        response: { result: "error", message: "Invalid arguments" }
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
