/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";
import { ScoreDetails } from '../types';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const generateFeedback = async (name: string, scores: ScoreDetails, role: string): Promise<string> => {
  if (!import.meta.env.VITE_GEMINI_API_KEY) {
    return "AI Feedback unavailable: Missing API Key.";
  }

  // Calculate totals for context
  const commonTotal = (scores.problemSolving||0) + (scores.collaboration||0) + (scores.professionalDev||0) + (scores.engagement||0);
  let deptTotal = 0;
  if(scores.achievementRate !== undefined) {
      deptTotal = (scores.achievementRate||0) + (scores.salesAmount||0) + (scores.developmentActive||0) + (scores.activityQuality||0);
  } else {
      deptTotal = (scores.accuracy||0) + (scores.timeliness||0) + (scores.targetAchievement||0);
  }

  const prompt = `
    You are an HR assistant writing a performance review.
    Employee: ${name} (${role})
    
    Scores:
    - Department Goals (Max 70): ${deptTotal}
    - Common Traits (Max 30): ${commonTotal}
    
    Detailed Breakdown:
    ${JSON.stringify(scores)}

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