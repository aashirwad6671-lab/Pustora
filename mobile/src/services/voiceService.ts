import { ApiResponse } from './api.types';

// Structured Intent Output representing dynamic voice-driven actions
export interface VoiceAgentIntent {
  responseSpeech: string; // The natural language response in Hindi, English, or bilingual
  action: 'search' | 'add_to_cart' | 'recommend' | 'checkout' | 'none';
  payload: {
    query?: string;
    categoryId?: string;
    grade?: string;
    productId?: string;
    quantity?: number;
    recipient?: 'student' | 'parent' | 'teacher' | 'general';
    age?: number;
    priceRange?: string;
    step?: 'address' | 'payment' | 'confirm';
  };
}

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export class VoiceService {
  /**
   * Transcribes standard device audio recording using OpenAI Whisper API.
   * Handles multipart/form-data assembly for React Native fetch environment.
   */
  static async transcribeAudio(audioUri: string): Promise<ApiResponse<string>> {
    try {
      if (!OPENAI_API_KEY) {
        return { data: null, error: 'OpenAI API key not configured in .env', status: 400 };
      }

      const formData = new FormData();
      // React Native FormData file signature
      formData.append('file', {
        uri: audioUri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      } as any);
      formData.append('model', 'whisper-1');

      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          // 'Content-Type' is automatically set by FormData in fetch, do NOT set boundary manually
        },
        body: formData,
      });

      if (!response.ok) {
        const errText = await response.text();
        return { data: null, error: `Whisper transcription failed: ${errText}`, status: response.status };
      }

      const json = await response.json();
      return { data: json.text || '', error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'Whisper connection failed', status: 500 };
    }
  }

  /**
   * Processes the user transcript through GPT-4o-mini to extract intents and format structured commands.
   * Context includes NCERT catalog titles and branch hub configurations for Lucknow.
   */
  static async analyzeVoiceIntent(
    transcript: string,
    cartContext: any[] = []
  ): Promise<ApiResponse<VoiceAgentIntent>> {
    try {
      if (!OPENAI_API_KEY) {
        return { data: null, error: 'OpenAI API key not configured', status: 400 };
      }

      // Catalog snapshot for standard search hints
      const catalogSnapshot = [
        { id: 'tb-ncert-m6', name: 'Mathematics Class VI (NCERT)', category: 'books', price: 150, brand: 'NCERT' },
        { id: 'tb-ncert-s10', name: 'Science Class X (NCERT)', category: 'books', price: 195, brand: 'NCERT' },
        { id: 'nb-classmate-s6', name: 'Classmate Notebook Pack of 6', category: 'stationery', price: 360, brand: 'Classmate' },
        { id: 'toy-lego-classic', name: 'LEGO Creative Bricks (484 Pcs)', category: 'toys', price: 1599, brand: 'LEGO' }
      ];

      const systemPrompt = `You are Pustora AI Voice Agent, a smart quick-commerce support assistant for Lucknow.
The user will talk in English, Hindi, or a mix of both (Hinglish).
Analyze the query and determine their intent, then output a strict JSON object matches the VoiceAgentIntent type.

Strict Output Schema:
{
  "responseSpeech": "Friendly conversational bilingual response under 25 words. Mix English and Hindi naturally.",
  "action": "search" | "add_to_cart" | "recommend" | "checkout" | "none",
  "payload": {
    "query": "string (for search/recommend)",
    "categoryId": "string (books, stationery, toys, gifts)",
    "grade": "string (e.g. Class 6, Class 10)",
    "productId": "string (resolved product ID if matching)",
    "quantity": number,
    "recipient": "student" | "parent" | "teacher" | "general",
    "age": number,
    "priceRange": "string"
  }
}

Guidelines:
1. Intent: Product Search
   - Triggered when user asks to find/search items ("कक्षा ६ की गणित की किताब दिखाओ", "notebooks pack", "LEGO toys").
   - Action: "search". Resolve categoryId, grade, and generic query terms.
2. Intent: Voice Checkout Assistance
   - Adding items: ("add class 6 math to cart", "गणित की किताब कार्ट में डाल दो"). Action: "add_to_cart", resolve productId (e.g. "tb-ncert-m6") and quantity.
   - Checking out: ("checkout करना है", "order place कर दो"). Action: "checkout", set payload step to "address" or "payment".
3. Intent: Gift Recommendations
   - Triggered when asking for ideas ("१० साल के बच्चे के लिए कोई गिफ्ट बताओ", "Recommend a birthday gift for Class 10 student").
   - Action: "recommend". Resolve recipient, age, and query terms (e.g., LEGO bricks for toys, NCERT text books, Classmate notebooks pack).
4. Bilingual Reply: Make your responseSpeech extremely warm and friendly, matching Lucknow's polite ethos. State clearly what action is taken.

Catalog Inventory for mapping IDs:
${JSON.stringify(catalogSnapshot)}

Current Cart contents:
${JSON.stringify(cartContext)}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: transcript },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { data: null, error: `GPT completion failed: ${errText}`, status: response.status };
      }

      const json = await response.json();
      const parsedIntent: VoiceAgentIntent = JSON.parse(json.choices[0].message.content);
      
      return { data: parsedIntent, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'GPT connection failed', status: 500 };
    }
  }

  /**
   * Generates premium, lifelike TTS audio bytes using OpenAI Audio Speech API.
   * Returns a temporary local file URI or base64 data for the player.
   */
  static async generateSpeechAudio(text: string): Promise<ApiResponse<string>> {
    try {
      if (!OPENAI_API_KEY) {
        return { data: null, error: 'OpenAI API key not configured', status: 400 };
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice: 'alloy',
          response_format: 'mp3',
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return { data: null, error: `TTS failed: ${errText}`, status: response.status };
      }

      // Convert audio binary array buffer to Base64 to be played safely on mobile client
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Audio = btoa(binary);

      return { data: `data:audio/mp3;base64,${base64Audio}`, error: null, status: 200 };
    } catch (err: any) {
      return { data: null, error: err.message || 'TTS connection failed', status: 500 };
    }
  }
}
