import { GoogleGenAI } from "@google/genai";

const getClient = (): GoogleGenAI => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Edits an image based on a text prompt using gemini-2.5-flash-image
 */
export const editImageWithGemini = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  const ai = getClient();
  
  try {
    // The prompt guidance for editing requires sending both the image and the text.
    // We strip the data URL prefix if present (e.g. "data:image/png;base64,") 
    // because the API expects just the base64 string for the `data` field.
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      // No schema or responseMimeType needed for image generation/editing in this model
    });

    // Iterate through parts to find the image
    const parts = response.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      throw new Error("No content returned from Gemini");
    }

    let generatedImageBase64: string | undefined;

    for (const part of parts) {
      if (part.inlineData && part.inlineData.data) {
        generatedImageBase64 = part.inlineData.data;
        break; 
      }
    }

    if (!generatedImageBase64) {
       // If no image is found, check if there is text explaining why
       const textPart = parts.find(p => p.text);
       if (textPart) {
         throw new Error(`Model returned text instead of image: ${textPart.text}`);
       }
       throw new Error("Model did not return a valid image.");
    }

    // Return as a displayable Data URL
    return `data:image/png;base64,${generatedImageBase64}`;

  } catch (error: any) {
    console.error("Gemini Service Error:", error);
    throw new Error(error.message || "Failed to process image with Gemini");
  }
};
