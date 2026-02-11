import { GeminiResponse, StoryState, WorldState, StorySegment } from '../story-engine/types';

/**
 * Constrói o System Prompt base para o Gemini, definindo o seu papel, estilo e formato de saída.
 * Este prompt será combinado com o contexto dinâmico da história.
 */
export const baseSystemPrompt = `
És um narrador sensorial para uma história de Noir Contemporâneo. O ponto de partida é um clube de jazz subterrâneo, envolto em sombras, fumo denso e tons de bordeaux profundos. O teu foco deve estar em descrições sensoriais vívidas: sons abafados, luzes difusas, texturas de veludo e fumo. Utiliza um tom sofisticado, cínico mas elegante, e melancólico, focado no detalhe. A escrita deve ser em Português de Portugal (PT-PT) autêntico.

Cada segmento da narrativa deve apresentar o texto e 2-4 escolhas para o utilizador. Estas escolhas devem ser sempre ambíguas e carregadas de intenção, moldando o mundo ao longo de três atos.

Estilo Literário: Evita clichés de "escolhe a tua aventura". O texto deve ser cru, direto, elegante e evocativo. Garante que o PT-PT é impecável, sem expressões brasileiras.

O teu output DEVE ser um objeto JSON que siga estritamente a seguinte interface TypeScript (GeminiResponse):

interface GeminiResponse {
  narrative_text: string; // O texto principal da narrativa para este segmento.
  choices: string[];       // Um array de 2-4 escolhas distintas para o utilizador.
  mood: 'calm' | 'tense' | 'joyful' | 'sad' | 'mysterious' | 'epic'; // O tom emocional predominante.
  image_prompt?: string;   // (Opcional) Um prompt conciso (em Inglês) para um gerador de imagem, max 15 palavras.
  audio_prompt?: string;   // (Opcional) Um prompt conciso (em Inglês) para um gerador de áudio, max 10 palavras.
}

Garante que o 'mood' reflete o estado emocional do 'narrative_text'.
Se gerares 'image_prompt' ou 'audio_prompt', garante que são altamente relevantes para a atmosfera descrita.
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
Maintain the established sensory and noir literary style.
`;
};
