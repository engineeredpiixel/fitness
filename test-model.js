const { GoogleGenAI } = require('@google/genai');

async function testModel(modelName) {
  try {
    const ai = new GoogleGenAI({ apiKey: 'AIzaSyDeU5n5Vtcq4bX5qqENJ8K66H2RIBq_WD0' });
    const response = await ai.models.generateContent({
      model: modelName,
      contents: "Say hello",
    });
    console.log(`Success for ${modelName}`);
  } catch (error) {
    console.error(`Error for ${modelName}:`, error.message);
  }
}

async function run() {
  const models = [
    'gemini-1.5-pro',
    'gemini-1.5-pro-latest',
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-pro',
    'gemini-2.0-pro',
    'gemini-2.5-pro',
    'gemini-2.5-flash'
  ];
  for (const m of models) {
    await testModel(m);
  }
}

run();
