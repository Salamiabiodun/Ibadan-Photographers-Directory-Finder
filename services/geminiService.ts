
import { GoogleGenAI } from "@google/genai";
import { Photographer } from '../types';

/**
 * Extracts a JSON array string from a larger text block.
 * @param text The text which may contain a JSON array.
 * @returns The extracted JSON array as a string, or null if not found.
 */
function extractJsonArrayString(text: string): string | null {
  const startIndex = text.indexOf('[');
  const endIndex = text.lastIndexOf(']');

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return text.substring(startIndex, endIndex + 1);
  }
  return null;
}

const generatePrompt = () => {
  return `
    You are an expert data aggregator. Your task is to generate a list of the top 100 photographers based in Ibadan, Nigeria, using Google Search to find public information like Google My Business listings, professional directories, and portfolio websites.

    Please format the response as a valid JSON array of objects. Each object in the array represents one photographer and MUST have the following structure and data types:
    {
      "fullName": "string",
      "portfolioImageUrl": "string (a valid URL)",
      "specialty": "string"
    }

    Instructions:
    1.  **fullName**: Provide the photographer's full name or their studio's official name.
    2.  **portfolioImageUrl**: Find a relevant, high-quality image URL from their portfolio, website, or social media. If a specific image is not available, use a generic placeholder like "https://picsum.photos/seed/{unique_seed}/400/300". Replace {unique_seed} with the photographer's name to ensure variety.
    3.  **specialty**: Briefly describe their main area of focus (e.g., "Wedding Photography", "Event & Portrait Photography", "Fashion & Commercial").
    4.  **VERY IMPORTANT**: The final output MUST be ONLY the JSON array. Do not include any introductory text, concluding remarks, markdown formatting (like \`\`\`json), or any other text outside of the JSON array itself. The response should start with '[' and end with ']'.
    `;
};

export const generatePhotographerData = async () => {
    if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: generatePrompt(),
        config: {
            tools: [{ googleSearch: {} }],
        },
    });
    
    const rawText = response.text;
    const jsonString = extractJsonArrayString(rawText);

    if (!jsonString) {
        throw new Error("Failed to extract valid JSON data from the model's response. Please try again.");
    }
    
    try {
        const parsedData: Omit<Photographer, 'uid' | 'email' | 'role' | 'isFeatured' | 'city' | 'createdAt' | 'earnings' | 'walletBalance'>[] = JSON.parse(jsonString);

        if (!Array.isArray(parsedData)) {
            throw new Error("Parsed data is not an array.");
        }

        const enrichedData: Photographer[] = parsedData.map((p, index) => ({
          ...p,
          uid: `photographer-ibadan-${Date.now()}-${index}`,
          email: `${p.fullName.toLowerCase().replace(/\s+/g, '.')}.${index}@test.com`,
          role: 'photographer',
          isFeatured: Math.random() < 0.2, // Randomly feature ~20%
          city: 'Ibadan',
          createdAt: new Date().toISOString(),
          earnings: 0,
          walletBalance: 0,
        }));
        
        return {
            photographers: enrichedData,
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };

    } catch (error) {
        console.error("JSON Parsing Error:", error);
        throw new Error("The data received from the model was not in the correct format. Please try generating again.");
    }
};
