/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { ScoreDetails } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const generateFeedback = async (name: string, scores: ScoreDetails, role: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "AI Feedback unavailable: Missing API Key.";
  }

  // Calculate total for context
  const total = Object.values(scores).reduce((a, b) => a + (b || 0), 0);

  const prompt = `
    You are an HR assistant writing a performance review.
    Employee: ${name} (${role})
    
    Total Score: ${total}
    
    Detailed Scores:
    ${JSON.stringify(scores, null, 2)}

    Write a professional, constructive paragraph (max 80 words) in Traditional Chinese (zh-TW).
    - Focus on their strongest and weakest specific areas from the breakdown.
    - Address them as "您".
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Could not generate feedback.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error generating AI feedback.";
  }
};