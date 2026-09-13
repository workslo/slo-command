import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  const ai = new GoogleGenAI({ 
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Chat API
  app.post('/api/chat', async (req, res) => {
    try {
      const { messages, model = 'gemini-3.5-flash', systemInstruction } = req.body;
      
      const formattedMessages = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      // We extract the last user message to use as the `message` argument
      // And the previous messages are just chat history, but since we are using `chat.sendMessage` 
      // we need to set history. Wait, the new SDK uses `ai.chats.create({ history: ... })`?
      // Actually, to use history, we pass `history` to `ai.chats.create()`.
      
      // Let's use `generateContent` directly for simpler history management if needed, 
      // but `ai.chats.create` is better.
      const history = formattedMessages.slice(0, -1);
      const latestMessage = formattedMessages[formattedMessages.length - 1].parts[0].text;

      const chat = ai.chats.create({
        model: model,
        config: {
          systemInstruction: systemInstruction,
        }
      });
      
      // Load history into the chat
      // Wait, is history supported in `ai.chats.create({ history: ... })`?
      // Let's just use `generateContent` with `contents: formattedMessages` instead of `chats.create`.
      
      const response = await ai.models.generateContent({
        model: model,
        contents: formattedMessages,
        config: {
          systemInstruction: systemInstruction
        }
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Image Generation API
  app.post('/api/image/generate', async (req, res) => {
    try {
      const { prompt, aspectRatio = '1:1', imageSize = '1K' } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'A text prompt is required to generate an image.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: prompt.trim() }]
        },
        config: {
          systemInstruction: 'You are an image generation engine. When given any prompt or request, create and output a vivid visual image matching the description. Always output the generated image.',
          imageConfig: {
            aspectRatio,
            imageSize
          }
        }
      });
      
      let imageUrl: string | null = null;
      let textResponse: string | undefined = undefined;

      const candidates = response.candidates || [];
      for (const candidate of candidates) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
          if (part.text) {
            textResponse = part.text;
          }
        }
        if (imageUrl) break;
      }
      
      if (!imageUrl) {
        const finishReason = candidates[0]?.finishReason;
        const explanation = textResponse || response.text;
        const errorMsg = explanation 
          ? `The model responded: "${explanation}"`
          : (finishReason && finishReason !== 'STOP' 
              ? `Generation stopped (${finishReason}). Please adjust your prompt.` 
              : 'No image could be generated for this prompt. Please try a more descriptive visual prompt.');
        return res.status(422).json({ error: errorMsg, text: explanation });
      }

      res.json({ imageUrl, text: textResponse || response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Image generation failed' });
    }
  });

  // Image Editing API
  app.post('/api/image/edit', upload.single('image'), async (req, res) => {
    try {
      const { prompt } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ error: 'Image file is required' });
      }
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Editing instructions are required.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: file.buffer.toString('base64'),
                mimeType: file.mimetype || 'image/png'
              }
            },
            {
              text: prompt.trim()
            }
          ]
        },
        config: {
          systemInstruction: 'You are an expert image editing engine. Modify and return the edited image as an image output based on the user instructions.',
        }
      });
      
      let imageUrl: string | null = null;
      let textResponse: string | undefined = undefined;

      const candidates = response.candidates || [];
      for (const candidate of candidates) {
        for (const part of candidate.content?.parts || []) {
          if (part.inlineData?.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            imageUrl = `data:${mime};base64,${part.inlineData.data}`;
            break;
          }
          if (part.text) {
            textResponse = part.text;
          }
        }
        if (imageUrl) break;
      }

      if (!imageUrl) {
        const finishReason = candidates[0]?.finishReason;
        const explanation = textResponse || response.text;
        const errorMsg = explanation 
          ? `The model responded: "${explanation}"`
          : (finishReason && finishReason !== 'STOP' 
              ? `Editing stopped (${finishReason}). Please adjust your image or instructions.` 
              : 'No edited image could be returned. Please try different edit instructions.');
        return res.status(422).json({ error: errorMsg, text: explanation });
      }
      
      res.json({ imageUrl, text: textResponse || response.text });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'Image alteration failed' });
    }
  });

  // Search Grounding API
  app.post('/api/search', async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }]
        }
      });
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      res.json({ text: response.text, groundingChunks: chunks });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Maps Grounding API
  app.post('/api/maps', async (req, res) => {
    try {
      const { prompt } = req.body;
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleMaps: {} }]
        }
      });
      
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      res.json({ text: response.text, groundingChunks: chunks });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
