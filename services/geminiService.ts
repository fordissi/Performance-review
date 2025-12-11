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

export const generateInterviewGuide = async (name: string, managerScores: ScoreDetails, selfScores: ScoreDetails, role: string): Promise<string> => {
    if (!import.meta.env.VITE_GEMINI_API_KEY) return "AI Service Unavailable.";

    const prompt = `
      你是專業的人資顧問，請協助主管準備績效面談。
      員工: ${name} (${role})
      
      比較雙方評分 (分數格式為 JSON key: score):
      [主管評分]: 
      ${JSON.stringify(managerScores, null, 2)}
      
      [員工自評]: 
      ${JSON.stringify(selfScores, null, 2)}

      請用繁體中文 (zh-TW) 生成一份「績效面談引導指南」:
      1. 【認知落差分析】: 找出 1-2 個分數差異最大(員工自評顯著高於或低於主管)的項目，指出差異。
      2. 【面談切入點】: 針對上述差異，提供主管可以詢問的問題範例 (例如: "我注意到在XX項目上，你給自己滿分，能否分享具體例子...")。
      3. 【肯定與鼓勵】: 指出雙方都有高分共識的強項。
      
      語氣專業、客觀。字數控制在 150 字以內，列點呈現。
    `;

    try {
        const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
        return response.text || "無需面談建議。";
    } catch (e) {
        console.error(e);
        return "無法生成面談建議。";
    }
};