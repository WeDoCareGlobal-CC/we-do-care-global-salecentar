import express from 'express';
import { pool, migrate } from './server/db';
import { installRoutes, aiQuota, requireEntitlement } from './server/routes';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import { buildFoodPhotoPrompt } from './src/utils/promptBuilder';
import { DishItem, PhotoShootConfig } from './src/types';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');
  if (!process.env.SALECENTAR_AUTH_URL && (!process.env.ADMIN_BOOTSTRAP_KEY || process.env.ADMIN_BOOTSTRAP_KEY.length < 32)) throw new Error('ADMIN_BOOTSTRAP_KEY must be at least 32 characters.');
  await migrate();
  app.get('/api/health', (_req,res) => res.json({status:'ok'}));
  installRoutes(app);
  app.use(['/api/parse-menu','/api/generate-food-photo','/api/edit-food-photo'], requireEntitlement, aiQuota);

  // Helper to get GoogleGenAI client lazily
  const getGenAIClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // 2. Parse Menu API Endpoint
  app.post('/api/parse-menu', async (req, res) => {
    try {
      const { menuText } = req.body;
      if (!menuText || typeof menuText !== 'string' || menuText.trim().length === 0 || menuText.length > 20000) {
        return res.status(400).json({ error: 'Menu text is required.' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        return res.status(503).json({ error: 'AI service is not configured.' });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: `Analyze the following restaurant menu text and extract all dishes into structured categories. For each dish, infer appetizing plating details and key ingredients for high-end food photography.\n\nMenu Text:\n${menuText}`,
        config: {
          systemInstruction: 'You are an expert culinary director and food photographer. Convert unstructured menu text into structured dish items.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              restaurantName: { type: Type.STRING, description: 'Name of the restaurant or empty string if unknown' },
              cuisine: { type: Type.STRING, description: 'Cuisine type e.g., Italian, Japanese, American' },
              description: { type: Type.STRING, description: 'Brief summary of the restaurant concept' },
              dishes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING, description: 'Name of dish' },
                    category: { type: Type.STRING, description: 'Appetizers, Mains, Desserts, Drinks, Sides' },
                    description: { type: Type.STRING, description: 'Detailed culinary description' },
                    ingredients: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'List of main visible ingredients'
                    },
                    platingNotes: { type: Type.STRING, description: 'Recommended visual plating, vessel, garnishes' },
                    price: { type: Type.STRING, description: 'Price if present, e.g., $18' },
                    tags: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: 'Badges like Vegetarian, Spicy, Gluten-Free'
                    }
                  },
                  required: ['name', 'category', 'description', 'ingredients', 'platingNotes']
                }
              }
            },
            required: ['restaurantName', 'cuisine', 'dishes']
          }
        }
      });

      const text = response.text || '{}';
      const parsed = JSON.parse(text);

      // Sanitize dishes with IDs
      const dishesWithIds: DishItem[] = (parsed.dishes || []).map((d: any, idx: number) => ({
        id: `dish-${Date.now()}-${idx}`,
        name: d.name || 'Untitled Dish',
        category: d.category || 'Mains',
        description: d.description || '',
        ingredients: Array.isArray(d.ingredients) ? d.ingredients : [],
        platingNotes: d.platingNotes || 'Plated elegantly on artisanal ceramic.',
        price: d.price || '',
        tags: Array.isArray(d.tags) ? d.tags : [],
        version: 1
      }));

      return res.json({
        restaurantName: parsed.restaurantName || 'Restaurant Menu',
        cuisine: parsed.cuisine || 'Gourmet Cuisine',
        description: parsed.description || 'Custom parsed menu',
        dishes: dishesWithIds
      });
    } catch (error: any) {
      console.error('Menu parsing error:', error);
      res.status(500).json({ error: 'Failed to parse menu text' });
    }
  });

  // 3. Generate Food Photo API Endpoint
  app.post('/api/generate-food-photo', async (req, res) => {
    try {
      const { dish, config } = req.body as { dish: DishItem; config?: PhotoShootConfig };
      if (!dish || typeof dish.name !== 'string' || !dish.name.trim() || dish.name.length > 160) {
        return res.status(400).json({ error: 'Valid dish details required.' });
      }

      const prompt = buildFoodPhotoPrompt(dish, config);
      const style = dish.selectedStyle || config?.globalStyle || 'Bright/Modern';
      const size = dish.selectedSize || config?.globalSize || '1K';
      const aspectRatio = dish.selectedAspectRatio || config?.globalAspectRatio || '1:1';

      const ai = getGenAIClient();
      if (!ai) {
        return res.status(503).json({ error: 'AI service is not configured.' });
      }

      // Determine model based on image size requested (1K, 2K, 4K)
      const modelName = (size === '2K' || size === '4K') ? 'gemini-3-pro-image' : 'gemini-3.1-flash-image';

      const response = await ai.models.generateContent({
        model: modelName,
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio as any,
            imageSize: size as any
          }
        }
      });

      let generatedImageUrl: string | null = null;
      let textMessage: string = '';

      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const mimeType = part.inlineData.mimeType || 'image/png';
            generatedImageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
          } else if (part.text) {
            textMessage += part.text;
          }
        }
      }

      if (!generatedImageUrl) {
        throw new Error(textMessage || 'No image data returned from Gemini API.');
      }

      return res.json({
        imageUrl: generatedImageUrl,
        prompt,
        aspectRatio,
        imageSize: size
      });
    } catch (error: any) {
      console.error('Image generation error:', error);
      res.status(500).json({
        error: 'Image generation failed'
      });
    }
  });

  // 4. Edit / Retouch Food Photo API Endpoint
  app.post('/api/edit-food-photo', async (req, res) => {
    try {
      const { imageUrl, instruction, dish } = req.body;
      if (typeof imageUrl !== 'string' || typeof instruction !== 'string' || !instruction.trim() || instruction.length > 1500) {
        return res.status(400).json({ error: 'Image URL and edit instruction required.' });
      }

      const ai = getGenAIClient();
      if (!ai) {
        return res.status(503).json({ error: 'AI service is not configured.' });
      }

      // Check if base64
      let base64Data = '';
      let mimeType = 'image/png';

      if (imageUrl.startsWith('data:')) {
        const matches = imageUrl.match(/^data:(image\/\w+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          base64Data = matches[2];
        }
      }

      if (!base64Data) {
        return res.status(400).json({ error: 'Editing requires a valid base64 image data URL.' });
      }

      const editPrompt = `Modify this food photo of "${dish?.name || 'dish'}". Instructions: ${instruction}. Keep the overall culinary composition realistic, professional, and mouth-watering.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType
              }
            },
            { text: editPrompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: (dish?.selectedAspectRatio || '1:1') as any
          }
        }
      });

      let updatedImageUrl: string | null = null;
      if (response.candidates && response.candidates.length > 0) {
        const parts = response.candidates[0].content?.parts || [];
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const mime = part.inlineData.mimeType || 'image/png';
            updatedImageUrl = `data:${mime};base64,${part.inlineData.data}`;
          }
        }
      }

      if (!updatedImageUrl) {
        throw new Error('No updated image returned from edit model.');
      }

      return res.json({ imageUrl: updatedImageUrl });
    } catch (error: any) {
      console.error('Photo edit error:', error);
      res.status(500).json({ error: 'Failed to edit food photo' });
    }
  });

  app.use('/api', (_req,res) => res.status(404).json({error:'API route not found'}));
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => { console.error('API error', err); res.status(500).json({error:'Internal server error'}); });

  // Serve Vite in dev mode or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((error) => { console.error('Startup failed:', error); process.exit(1); });
