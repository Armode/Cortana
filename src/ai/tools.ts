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
      }
    ]
  },
  {
    googleSearch: {}
  }
];
