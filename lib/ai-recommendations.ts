import OpenAI from 'openai';
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/index.mjs';
import { Manga } from './anilist';

export interface Recommendation {
  title: string;
  reason: string;
}

export interface RecommendationOptions {
  previouslyRecommended?: string[];
  highlyRated?: string[];
  poorlyRated?: string[];
  enableWebSearch?: boolean;
}

export async function getRecommendations(
  likedManga: Manga[],
  favoriteGenres: string[],
  options: RecommendationOptions = {}
): Promise<Recommendation[]> {
  const apiKey = process.env.NVIDIA_API_KEY;
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
    const webSearchTool: ChatCompletionTool = {
      type: "function",
      function: {
        name: "search_web",
        description: "Search the web for up-to-date information, news, reviews, and latest releases about manga.",
        parameters: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to look up on the web."
            }
          },
          required: ["query"]
        }
      }
    };

    const tools: ChatCompletionTool[] = options.enableWebSearch ? [webSearchTool] : [];

    let messages: ChatCompletionMessageParam[] = [{"role":"user","content":prompt}];
    let finalContent = null;
    let iterations = 0;
    const MAX_ITERATIONS = 5;

    while (iterations < MAX_ITERATIONS && !finalContent) {
      const completion = await openai.chat.completions.create({
        model: "qwen/qwen3-coder-480b-a35b-instruct",
        messages: messages,
        temperature: 0.7,
        top_p: 0.8,
        max_tokens: 4096,
        ...(tools.length > 0 ? { tools, tool_choice: "auto" } : {}),
      });

      const responseMessage = completion.choices[0]?.message;
      if (!responseMessage) break;

      messages.push(responseMessage); // Add assistant response to history

      if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
        // AI decided to call a tool
        for (const toolCall of responseMessage.tool_calls) {
          if ((toolCall as any).function.name === 'search_web') {
            try {
              const args = JSON.parse((toolCall as any).function.arguments);
              console.log(`Executing web search for: "${args.query}"`);
              
              const searchResponse = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  api_key: process.env.TAVILY_API_KEY,
                  query: args.query,
                  include_answer: true,
                  search_depth: "basic",
                })
              });

              const searchData = await searchResponse.json();
              const resultString = searchData.answer || searchData.results?.map((r: any) => `[${r.title}](${r.url}): ${r.content}`).join('\\n') || "No results found.";

              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: resultString
              });
            } catch (err: any) {
              console.error("Tool execution failed:", err);
              messages.push({
                tool_call_id: toolCall.id,
                role: "tool",
                content: "Error performing search."
              });
            }
          }
        }
      } else {
        // AI provided a final answer
        finalContent = responseMessage.content;
      }
      iterations++;
    }

    if (!finalContent) return [];

    let parsedText = finalContent.trim();
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
  const apiKey = process.env.NVIDIA_API_KEY;
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
