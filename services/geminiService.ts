import { GoogleGenAI } from "@google/genai";
import { BuyerProfile } from '../types';

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
    You are a lead generation expert. Your task is to generate a list of 500 potential B2B buyers for photo laboratory and photo printing services located in Lagos, Nigeria. Use Google Search to find public information on businesses that would require such services.

    Examples of potential buyers include:
    - Event management companies
    - Marketing and advertising agencies
    - Corporate marketing departments
    - Large schools and universities
    - Wedding planners
    - Professional photography studios that may outsource printing
    - Art galleries and museums

    Please format the response as a valid JSON array of objects. Each object in the array represents one potential buyer and MUST have the following structure and data types:
    {
      "fullName": "string",
      "portfolioImageUrl": "string (a valid URL)",
      "Interest": "string",
      "Address": "string"
    }

    Instructions:
    1.  **fullName**: Provide the business's full name.
    2.  **portfolioImageUrl**: Find a URL for the company's logo or a representative image. If a specific image is not available, use a generic placeholder like "https://picsum.photos/seed/{unique_seed}/400/300". Replace {unique_seed} with the business name to ensure variety.
    3.  **Interest**: Describe their likely need (e.g., "Bulk event photo printing", "Marketing material production", "Fine art prints for exhibitions", "Student ID card printing").
    4.  **Address**: Provide the physical address of the business in Lagos.
    5.  **VERY IMPORTANT**: The final output MUST be ONLY the JSON array. Do not include any introductory text, concluding remarks, markdown formatting (like \`\`\`json), or any other text outside of the JSON array itself. The response should start with '[' and end with ']'.
    `;
};

export const generateBuyerData = async () => {
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
        const parsedData: Omit<BuyerProfile, 'uid' | 'email' | 'role' | 'city' | 'createdAt' | 'walletBalance'>[] = JSON.parse(jsonString);

        if (!Array.isArray(parsedData)) {
            throw new Error("Parsed data is not an array.");
        }

        const enrichedData: BuyerProfile[] = parsedData.map((p, index) => ({
          ...p,
          uid: `buyer-lagos-${Date.now()}-${index}`,
          email: `${p.fullName.toLowerCase().replace(/\s+/g, '.')}.${index}@test.com`,
          role: 'buyer',
          city: 'Lagos',
          createdAt: new Date().toISOString(),
          walletBalance: 0,
        }));
        
        return {
            buyers: enrichedData,
            groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
        };

    } catch (error) {
        console.error("JSON Parsing Error:", error);
        throw new Error("The data received from the model was not in the correct format. Please try generating again.");
    }
};