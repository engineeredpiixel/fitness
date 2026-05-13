import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    analysis: {
      type: Type.STRING,
      description: "A short breakdown of the food in the image and its estimated calories/macros in Bengali."
    },
    isMatch: {
      type: Type.BOOLEAN,
      description: "True if the food matches the expected diet/meal plan, false otherwise."
    },
    feedback: {
      type: Type.STRING,
      description: "If they ate extra, suggest an extra specific workout to burn it off. If they ate less, suggest a specific snack. Explain this in Bengali."
    }
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { images, mealType, targetGoal } = body;

    const parts: any[] = [];
    
    const systemPrompt = `You are a world-class AI Nutritionist. 
The user's overall fitness goal is: ${targetGoal}.
They have uploaded pictures of their ${mealType} (e.g. Breakfast, Lunch, Dinner).

YOUR TASK:
1. Analyze the uploaded food image(s). Estimate what the food is, the calories, and the macronutrients.
2. Determine if this meal aligns well with their fitness goal (${targetGoal}).
3. If they ate something unhealthy or excessive (like too much oil, sugar, or fast food), set 'isMatch' to false. Then in the 'feedback' field (in Bengali), suggest a specific extra workout (e.g., 20 mins of HIIT or running) they must do today to burn off the extra calories.
4. If they ate too little for a major meal, suggest a healthy extra snack later to balance it.
5. If it perfectly matches a healthy diet for their goal, set 'isMatch' to true and give encouraging feedback.

Respond strictly in the provided JSON format, with text in BENGALI.`;

    parts.push({ text: systemPrompt });

    if (Array.isArray(images)) {
      for (const img of images) {
        if (typeof img === 'string') {
          const matches = img.match(/^data:image\/([a-zA-Z0-9+.]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            parts.push({
              inlineData: {
                data: matches[2],
                mimeType: `image/${matches[1]}`
              }
            });
          }
        }
      }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-pro',
      contents: parts,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.7,
      }
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json({ error: 'Failed to analyze meal' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
