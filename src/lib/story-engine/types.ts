export interface StorySegment {
  narrativeText: string;
  choices: string[];
  mood: 'calm' | 'tense' | 'joyful' | 'sad' | 'mysterious' | 'epic'; // Exemplo de estados emocionais/tonalidades
  imagePrompt?: string; // Prompt para geração de imagem AI
  audioPrompt?: string; // Prompt para geração de áudio AI
}

export interface WorldState {
  // Atributos que definem o estado do mundo da história, influenciados pelas escolhas do utilizador.
  // Exemplos:
  // playerReputation: number;
  // currentLocation: string;
  // characterRelationships: Record<string, 'friendly' | 'neutral' | 'hostile'>;
  // globalThreatLevel: 'low' | 'medium' | 'high';
  [key: string]: any; // Flexível por agora para permitir a evolução do estado do mundo
}

export interface StoryState {
  currentAct: 1 | 2 | 3;
  storyHistory: StorySegment[];
  currentSegment: StorySegment | null;
  worldState: WorldState;
  lastChoice: string | null;
  storyDurationProgress: number; // Por exemplo, número de segmentos de história/escolhas feitas
}

export interface GeminiResponse {
  narrative_text: string;
  choices: string[];
  mood: 'calm' | 'tense' | 'joyful' | 'sad' | 'mysterious' | 'epic';
  image_prompt?: string;
  audio_prompt?: string;
}