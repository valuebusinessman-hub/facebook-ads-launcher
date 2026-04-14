import { invokeLLM } from '../_core/llm';

export interface CopySuggestion {
  originalHeadline: string;
  suggestedHeadline: string;
  originalText: string;
  suggestedText: string;
  reasoning: string;
}

/**
 * Generate copy improvement suggestions using LLM
 * Provides AI-polished alternatives for ad headlines and primary text
 */
export async function generateCopySuggestions(
  headline: string,
  primaryText: string
): Promise<CopySuggestion> {
  const systemPrompt = `You are a world-class copywriting expert specializing in premium sleep and wellness brands. 
You are reviewing ad copy for Allsleepers, a luxury sleep brand known for high-quality bedding and sleep solutions.

Your task is to suggest improvements to ad headlines and primary text that:
1. Maintain the core message and brand voice
2. Increase clarity and persuasion
3. Emphasize premium quality and customer benefits
4. Use compelling, benefit-driven language
5. Create urgency or desire without being pushy

Respond ONLY with valid JSON matching this exact structure:
{
  "suggestedHeadline": "improved headline",
  "suggestedText": "improved primary text",
  "reasoning": "brief explanation of why these suggestions improve the copy"
}`;

  const userPrompt = `Please review and improve this ad copy for Allsleepers:

HEADLINE: ${headline}

PRIMARY TEXT: ${primaryText}

Provide suggestions that enhance clarity, persuasion, and brand appeal.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'copy_suggestions',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              suggestedHeadline: {
                type: 'string',
                description: 'Improved version of the ad headline',
              },
              suggestedText: {
                type: 'string',
                description: 'Improved version of the primary text',
              },
              reasoning: {
                type: 'string',
                description: 'Explanation of why these suggestions improve the copy',
              },
            },
            required: ['suggestedHeadline', 'suggestedText', 'reasoning'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No content in LLM response');
    }

    const parsed = JSON.parse(content);

    return {
      originalHeadline: headline,
      suggestedHeadline: parsed.suggestedHeadline,
      originalText: primaryText,
      suggestedText: parsed.suggestedText,
      reasoning: parsed.reasoning,
    };
  } catch (error) {
    console.error('[LLM] Generate suggestions error:', error);
    throw error;
  }
}

/**
 * Validate copy quality (optional scoring)
 */
export async function validateCopyQuality(
  headline: string,
  primaryText: string
): Promise<{
  score: number;
  issues: string[];
  suggestions: string[];
}> {
  const systemPrompt = `You are a copy quality analyst for premium brands. 
Evaluate ad copy for clarity, persuasiveness, and brand alignment.
Respond with JSON only.`;

  const userPrompt = `Evaluate this ad copy for Allsleepers:
HEADLINE: ${headline}
PRIMARY TEXT: ${primaryText}

Provide a quality score (0-100), any issues found, and suggestions for improvement.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'copy_quality',
          strict: true,
          schema: {
            type: 'object',
            properties: {
              score: {
                type: 'number',
                description: 'Quality score from 0-100',
              },
              issues: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of issues found in the copy',
              },
              suggestions: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of improvement suggestions',
              },
            },
            required: ['score', 'issues', 'suggestions'],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message.content;
    if (!content || typeof content !== 'string') {
      throw new Error('No content in LLM response');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('[LLM] Validate quality error:', error);
    throw error;
  }
}
