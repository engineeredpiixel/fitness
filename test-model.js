const { GoogleGenAI } = require('@google/genai');

async function listModels() {
  try {
    const ai = new GoogleGenAI({ apiKey: 'AIzaSyDeU5n5Vtcq4bX5qqENJ8K66H2RIBq_WD0' });
    const response = await ai.models.list();
    console.log("Available models for this API key:");
    for await (const model of response) {
      if (model.name.includes("gemini")) {
        console.log(model.name);
      }
    }
  } catch (error) {
    console.error("Error listing models:", error.message);
  }
}

listModels();
