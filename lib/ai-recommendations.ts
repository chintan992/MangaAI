'use server';

import OpenAI from 'openai';
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
  const apiKey = process.env.NVIDIA_API_KEY || process.env.NEXT_PUBLIC_NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA API key is missing');
  }

  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

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
    Your response must be a valid JSON object containing a "recommendations" array. Each item must have a "title" and a "reason".
    Example:
    {
      "recommendations": [
        {
          "title": "Manga Title",
          "reason": "Reason for recommendation (1-2 sentences)."
        }
      ]
    }
    Return ONLY valid JSON. Do not include markdown code blocks.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "qwen/qwen3-coder-480b-a35b-instruct",
      messages: [{"role":"user","content":prompt}],
      temperature: 0.7,
      top_p: 0.8,
      max_tokens: 4096,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content;
    if (!text) return [];

    let parsedText = text.trim();
    if (parsedText.startsWith('```json')) {
      parsedText = parsedText.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (parsedText.startsWith('```')) {
      parsedText = parsedText.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    const parsed = JSON.parse(parsedText);
    return parsed.recommendations || [];
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429')) {
      console.warn('NVIDIA API Rate Limit (429) hit. Please wait a moment.');
    } else {
      console.error('Error fetching recommendations from NVIDIA NIM:', error?.message || error);
    }
    return [];
  }
}

export async function getQuickPitch(title: string, description: string): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY || process.env.NEXT_PUBLIC_NVIDIA_API_KEY;
  if (!apiKey) return '';
  const openai = new OpenAI({
    apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });
  try {
    const completion = await openai.chat.completions.create({
      model: "qwen/qwen3-coder-480b-a35b-instruct",
      messages: [{"role":"user","content":`Give a punchy, exciting 1-sentence pitch for the manga "${title}" based on this description: ${description}`}],
      temperature: 0.7,
      max_tokens: 256,
    });
    return completion.choices[0]?.message?.content || '';
  } catch (e) {
    console.error('Error fetching quick pitch:', e);
    return '';
  }
}
