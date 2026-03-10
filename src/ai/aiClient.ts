/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY
});
