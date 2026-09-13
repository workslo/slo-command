import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function test() {
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: {
        parts: [{ text: 'Hello, how are you?' }]
      },
      config: {
        systemInstruction: 'You are an image generator. Whenever user enters any prompt or greeting, generate a visual illustration representing their prompt or mood.',
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K'
        }
      }
    });
    const parts = res.candidates?.[0]?.content?.parts || [];
    const hasImage = parts.some(p => p.inlineData);
    console.log(`With instruction: hasImage=${hasImage}, text="${res.text?.substring(0, 100)}"`);
  } catch (e: any) {
    console.log('Error with systemInstruction:', e.message);
  }
}
test();
