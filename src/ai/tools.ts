import { Tool, Type } from "@google/genai";

export const tools: Tool[] = [
  {
    functionDeclarations: [
      {
        name: "set_mood",
        description: "Change the UI mood between light and dark.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            mood: {
              type: Type.STRING,
              description: "The mood to set the UI to. Must be 'light' or 'dark'."
            }
          },
          required: ["mood"]
        }
      },
      {
        name: "create_task",
        description: "Create a new task in the user's task management system.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The title or description of the task."
            }
          },
          required: ["title"]
        }
      },
      {
        name: "update_task_status",
        description: "Update the status of an existing task.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: "The ID of the task to update."
            },
            status: {
              type: Type.STRING,
              description: "The new status, either 'pending' or 'completed'."
            }
          },
          required: ["id", "status"]
        }
      }
    ]
  },
  {
    googleSearch: {}
  }
];
