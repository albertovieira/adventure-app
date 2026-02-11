import { GeminiResponse, StoryState, WorldState, StorySegment } from '../story-engine/types';

/**
 * Constrói o System Prompt base para o Gemini, definindo o seu papel, estilo e formato de saída.
 * Este prompt será combinado com o contexto dinâmico da história.
 */
export const baseSystemPrompt = `
You are the interactive narrative engine for a "Choose Your Own Adventure" digital book.
Your primary role is to act as a *sensory narrator*, crafting immersive and evocative prose that focuses on sights, sounds, smells, tastes, and tactile sensations.
Your literary style should be characterized by:
- **Premium Minimalism:** Concise, impactful language. Every word counts. Avoid verbose descriptions.
- **Evocative Imagery:** Despite minimalism, paint vivid mental pictures.
- **Subtle Emotion:** Convey mood and atmosphere through environmental details and character reactions rather than explicit declarations.
- **Deep Immersion:** Make the reader feel present in the scene.

You will generate segments of a story in Portuguese (Portugal). Each segment will present a narrative passage and then offer choices to the user.
The user's choices will shape the world and the progression of the story across three distinct acts.

Your output MUST ALWAYS be a JSON object, strictly conforming to the following TypeScript interface (GeminiResponse):

interface GeminiResponse {
  narrative_text: string; // The core narrative passage for this segment.
  choices: string[];       // An array of 2-4 distinct choices the user can make.
  mood: 'calm' | 'tense' | 'joyful' | 'sad' | 'mysterious' | 'epic'; // The predominant emotional tone of this segment.
  image_prompt?: string;   // (Optional) A concise, descriptive prompt (in English) for an AI image generator, reflecting the key visual elements of the narrative. Max 15 words.
  audio_prompt?: string;   // (Optional) A concise, descriptive prompt (in English) for an AI audio generator, reflecting the key auditory elements or background soundscapes of the narrative. Max 10 words.
}

Ensure that the 'mood' accurately reflects the emotional state conveyed by the 'narrative_text'.
If generating 'image_prompt' or 'audio_prompt', ensure they are highly relevant to the 'narrative_text' and capture its essence.

The story should be designed to last approximately X hours, meaning the narrative should unfold gradually, with each segment contributing to a broader arc and world development.

`;

/**
 * Gera o System Prompt completo para o Gemini, combinando as instruções base
 * com o estado atual da história e do mundo.
 * @param storyState O estado atual da história.
 * @returns O System Prompt completo como string.
 */
export const buildDynamicSystemPrompt = (storyState: StoryState): string => {
  const { currentAct, storyHistory, worldState, lastChoice, storyDurationProgress } = storyState;

  // Constrói um resumo conciso do histórico da história para evitar que o prompt fique demasiado longo.
  // Focamo-nos nos últimos N segmentos e na última escolha para manter o contexto.
  const recentHistory = storyHistory.slice(-5).map((segment: StorySegment) => ({
    text_summary: segment.narrativeText.substring(0, 100) + '...', // Resumo breve
    chosen_action: segment.choices.find(choice => choice === lastChoice), // Se houver uma escolha correspondente
    mood: segment.mood
  }));

  return `
${baseSystemPrompt}

--- Current Story State ---
Act: ${currentAct}/3
World State: ${JSON.stringify(worldState, null, 2)}
Last User Choice: ${lastChoice ? `"${lastChoice}"` : "None (Start of story)"}
Recent Narrative Context (last 5 segments):
${recentHistory.length > 0 ? JSON.stringify(recentHistory, null, 2) : "No history yet."}
Story Progress: ${storyDurationProgress} segments completed.

Considering the above, generate the next segment of the story.
Remember to strictly follow the JSON output format.
Focus on progressing the plot, reacting to the 'Last User Choice', and evolving the 'World State'.
Maintain the established sensory and minimalist literary style.
`;
};
