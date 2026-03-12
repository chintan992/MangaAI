import { GoogleGenAI, Type } from '@google/genai';
import { Manga } from './anilist';

export interface Recommendation {
  title: string;
  reason: string;
}

export interface RecommendationOptions {
  previouslyRecommended?: string[];
  highlyRated?: string[];
  poorlyRated?: string[];
}

export async function getRecommendations(
  likedManga: Manga[],
  favoriteGenres: string[],
  options: RecommendationOptions = {}
): Promise<Recommendation[]> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
    throw new Error('Gemini API key is missing');
  }

  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });

  const likedTitles = likedManga.map((m) => m.title.english || m.title.romaji).join(', ');
  const genres = favoriteGenres.join(', ');
  const previousTitles = (options.previouslyRecommended || []).join(', ');
  const highlyRatedTitles = (options.highlyRated || []).join(', ');
  const poorlyRatedTitles = (options.poorlyRated || []).join(', ');

  const prompt = `
    You are an expert manga recommender system. Your goal is to provide highly relevant, personalized, and diverse manga recommendations.
    
    USER PROFILE:
    - Liked Manga: ${likedTitles || 'None specified yet'}
    - Highly Rated Manga (4-5 stars): ${highlyRatedTitles || 'None specified yet'}
    - Poorly Rated Manga (1-2 stars): ${poorlyRatedTitles || 'None specified yet'}
    - Favorite Genres: ${genres || 'None specified yet'}
    
    CONSTRAINTS:
    - Recommend EXACTLY 10 distinct manga titles.
    - DO NOT recommend any manga the user already likes (${likedTitles || 'N/A'}).
    - DO NOT recommend any manga the user has highly rated or poorly rated.
    - DO NOT recommend any manga that were previously recommended (${previousTitles || 'N/A'}).
    - Ensure a diverse selection: include a mix of popular hits, hidden gems, and different sub-genres that align with the user's tastes.
    - Avoid recommending anything similar to the poorly rated manga.
    
    OUTPUT FORMAT:
    Provide a brief, compelling reason for each recommendation (1-2 sentences) explaining exactly why this user would like it based on their profile.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'The exact title of the recommended manga (preferably the Romaji or English title as it appears on Anilist).',
              },
              reason: {
                type: Type.STRING,
                description: 'A brief, personalized reason why this manga is recommended based on the user profile.',
              },
            },
            required: ['title', 'reason'],
          },
        },
      },
    });

    const text = response.text;
    if (!text) return [];

    const recommendations: Recommendation[] = JSON.parse(text);
    return recommendations;
  } catch (error) {
    console.error('Error fetching recommendations from Gemini:', error);
    return [];
  }
}

export async function getQuickPitch(title: string, description: string): Promise<string> {
  if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) return '';
  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Give a punchy, exciting 1-sentence pitch for the manga "${title}" based on this description: ${description}`,
    });
    return response.text || '';
  } catch (e) {
    console.error('Error fetching quick pitch:', e);
    return '';
  }
}
