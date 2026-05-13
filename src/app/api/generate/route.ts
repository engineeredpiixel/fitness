import { GoogleGenAI, Type } from '@google/genai';
import { NextResponse } from 'next/server';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const schema = {
  type: Type.OBJECT,
  properties: {
    error: {
      type: Type.STRING,
      description: "If the images are completely blurry or dark and cannot be analyzed, provide a gentle error message in Bengali here, explaining that they need to upload clearer pictures. Leave this empty if everything is fine."
    },
    physiqueAnalysis: {
      type: Type.STRING,
      description: "Detailed analysis in Bengali of their current physique based on the images. Include estimated body fat percentage, weak points, muscle imbalances, or any noticeable posture/fitness issues."
    },
    advice: {
      type: Type.STRING,
      description: "General fitness and health advice in Bengali based on the user's specific goal, health issues, and current physique analysis from the images."
    },
    trainingRoutine: {
      type: Type.ARRAY,
      description: "A 6-day training routine tailored to the goal.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "e.g., 'Day 1: Push' or 'Day 6: Full Body'" },
          focus: { type: Type.STRING, description: "Main muscle focus for the day" },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                sets: { type: Type.STRING },
                reps: { type: Type.STRING },
                notes: { type: Type.STRING, description: "Any specific instructions, especially modifying for the user's health issues" }
              }
            }
          }
        }
      }
    },
    dietChart: {
      type: Type.ARRAY,
      description: "A 7-day dynamic diet chart featuring exclusively available foods in Bangladesh. Must vary daily.",
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.STRING, description: "e.g., 'Day 1', 'Day 2'" },
          totalCalories: { type: Type.STRING, description: "Target calories for the day" },
          macros: { type: Type.STRING, description: "e.g., '150g Protein, 180g Carbs, 50g Fat'" },
          meals: {
            type: Type.OBJECT,
            properties: {
              breakfast: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING, description: "Exact food items and quantities" },
                  calories: { type: Type.STRING },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fats: { type: Type.STRING }
                }
              },
              midMorning: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  calories: { type: Type.STRING },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fats: { type: Type.STRING }
                }
              },
              lunch: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  calories: { type: Type.STRING },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fats: { type: Type.STRING }
                }
              },
              eveningSnack: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  calories: { type: Type.STRING },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fats: { type: Type.STRING }
                }
              },
              dinner: {
                type: Type.OBJECT,
                properties: {
                  food: { type: Type.STRING },
                  calories: { type: Type.STRING },
                  protein: { type: Type.STRING },
                  carbs: { type: Type.STRING },
                  fats: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    }
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { age, weight, goal, duration, healthIssues, images } = body;

    // Build the parts array for Gemini
    const parts: any[] = [];
    
    // Add the text prompt
    let goalText = "";
    switch(goal) {
      case 'weight_loss': goalText = "Weight Loss"; break;
      case 'fat_loss': goalText = "Fat Loss (Maintain Weight)"; break;
      case 'muscle_gain': goalText = "Muscle Gain"; break;
      case 'recomposition': goalText = "Body Recomposition (Lose fat, build muscle)"; break;
      case 'maintenance': goalText = "Maintenance"; break;
    }

    const systemPrompt = `You are a world-class AI Fitness Trainer and Nutritionist.
Your client is a ${age} years old person weighing ${weight}.
Their primary goal is: ${goalText}. They want to achieve this in ${duration} months.
Health Issues / Injuries reported: ${healthIssues ? healthIssues : "None"}.

I have attached pictures of their body parts (Bicep, Tricep, Forearm, Shoulder, Chest, Back, Lower back, Belly, Legs) for you to analyze their current physique and body fat percentage visually.

YOUR TASK:
1. First, provide a highly accurate 'physiqueAnalysis' analyzing their current body. Estimate their exact body fat percentage and point out any weak muscle groups, imbalances, or problem areas you see in the pictures.
2. Provide a 100% personalized and accurate 6-day workout routine based strictly on their specific use case, goal and current physique. Modify exercises to safely work around any reported health issues.
3. Provide a 7-day dynamic diet chart. You MUST use 100% local Bangladeshi foods (e.g., red rice, lentils/dal, rui/telapia fish, chicken breast, eggs, local vegetables, sweet potatoes). Do NOT suggest generic western foods like 'kale', 'quinoa', or 'salmon'. Ensure the diet varies every day to prevent diet fatigue.
4. Calculate 100% precise required macros and calories to hit their goal. You MUST provide the exact calorie, protein, carb, and fat breakdown for EVERY SINGLE MEAL.
5. Output everything in the requested JSON structure. Provide descriptions and text in BENGALI language.

CRITICAL INSTRUCTION: If the attached images are so blurry or completely dark that you cannot see the physique at all, fill the 'error' field in the JSON with a polite message in Bengali asking for clearer photos, and leave the routine/diet empty. If they are decently visible, proceed normally.`;

    parts.push({ text: systemPrompt });

    // Process base64 images
    for (const [partName, dataUrl] of Object.entries(images)) {
      if (typeof dataUrl === 'string') {
        // data:image/jpeg;base64,/9j/4AAQ...
        const matches = dataUrl.match(/^data:image\/([a-zA-Z0-9+.]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = `image/${matches[1]}`;
          const base64Data = matches[2];
          
          parts.push({ text: `[Image of ${partName}]` });
          parts.push({
            inlineData: {
              data: base64Data,
              mimeType: mimeType
            }
          });
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

    const text = response.text();
    if (!text) {
      return NextResponse.json({ error: 'Failed to generate content' }, { status: 500 });
    }

    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
  }
}
