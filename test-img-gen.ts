import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function run() {
  try {
    const prompt = 'A futuristic city glowing with amber lights at midnight';
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: prompt,
      config: {
        imageConfig: {
          aspectRatio: '1:1',
          imageSize: '1K'
        }
      }
    });
    console.log('Response candidates:', JSON.stringify(response.candidates, (key, value) => {
      if (key === 'data' && typeof value === 'string' && value.length > 50) {
        return value.substring(0, 30) + '... (' + value.length + ' chars)';
      }
      return value;
    }, 2));
    console.log('Response text:', response.text);
  } catch (e: any) {
    console.error('Error generating image:', e);
  }
}
run();
