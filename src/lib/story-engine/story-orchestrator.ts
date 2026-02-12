import { StoryState, StorySegment, WorldState, GeminiResponse } from './types';
import { buildDynamicSystemPrompt } from '../ai/gemini-prompts';
import { getGeminiCompletion } from '../ai/gemini-client'; // Importa o cliente Gemini real

// A função callGeminiApi simulada será removida, pois agora usamos o getGeminiCompletion.

class StoryOrchestrator {
  private storyState: StoryState;

  constructor(initialWorldState: WorldState = {
    playerReputation: 0,
    currentLocation: "Entrada da Caverna Misteriosa",
    unlockedAbilities: [],
    timeElapsedMinutes: 0,
    // Outros atributos iniciais do mundo
  }) {
    this.storyState = {
      currentAct: 1,
      storyHistory: [],
      currentSegment: null,
      worldState: initialWorldState,
      lastChoice: null,
      storyDurationProgress: 0, // Contagem de segmentos para gerir a duração
    };
  }

  /**
   * Retorna o estado atual da história.
   * @returns O objeto StoryState atual.
   */
  public getStoryState(): StoryState {
    return { ...this.storyState }; // Retorna uma cópia para evitar modificações externas diretas
  }

  /**
   * Constrói e retorna o System Prompt dinâmico para o Gemini,
   * injetando o contexto atual da história (currentAct, worldState, etc.).
   * @returns O System Prompt completo como string.
   */
  private formatSystemPrompt(): string {
    return buildDynamicSystemPrompt(this.storyState);
  }

  /**
   * Valida e faz o parse da string JSON bruta da resposta do Gemini.
   * Garante que a resposta cumpre a interface GeminiResponse.
   * @param rawGeminiResponseText A string JSON bruta recebida do Gemini.
   * @returns O objeto GeminiResponse validado.
   * @throws Error se a string não for um JSON válido ou não conformar com GeminiResponse.
   */
  private parseAndValidateGeminiResponse(rawGeminiResponseText: string): GeminiResponse {
    try {
      // 1. Limpeza de "ruído": remove blocos de código markdown (```json ... ```)
      let cleanText = rawGeminiResponseText
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      // 2. Tenta encontrar o primeiro '{' e o último '}' caso haja texto extra fora do JSON
      const firstBracket = cleanText.indexOf('{');
      const lastBracket = cleanText.lastIndexOf('}');
      
      if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
      }

      const response: GeminiResponse = JSON.parse(cleanText);

      // Validação básica para campos obrigatórios e tipos
      if (
        typeof response.narrative_text !== 'string' ||
        !Array.isArray(response.choices) || response.choices.length === 0 ||
        response.choices.some(choice => typeof choice !== 'string') ||
        typeof response.mood !== 'string'
      ) {
        throw new Error('Resposta do Gemini está faltando campos obrigatórios ou tem tipos incorretos.');
      }

      // Validação mais rigorosa para 'mood' contra os tipos conhecidos
      const validMoods: GeminiResponse['mood'][] = ['calm', 'tense', 'joyful', 'sad', 'mysterious', 'epic'];
      if (!validMoods.includes(response.mood)) {
        throw new Error(`Mood inválido recebido: ${response.mood}. Esperava um de: ${validMoods.join(', ')}`);
      }

      // Validação opcional para image_prompt e audio_prompt
      if (response.image_prompt !== undefined && typeof response.image_prompt !== 'string') {
        throw new Error('image_prompt deve ser uma string ou indefinido.');
      }
      if (response.audio_prompt !== undefined && typeof response.audio_prompt !== 'string') {
        throw new Error('audio_prompt deve ser uma string ou indefinido.');
      }

      return response;
    } catch (error) {
      console.error("Erro ao fazer parse ou validar a resposta do Gemini:", error);
      throw new Error(`Falha ao fazer parse ou validar a resposta do Gemini: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Processa a escolha do utilizador, envia o contexto para o Gemini,
   * obtém o próximo segmento da história, atualiza o estado interno
   * e retorna o novo segmento.
   * @param userChoice A escolha feita pelo utilizador. Use `null` para iniciar a história.
   * @returns Uma Promise que resolve para o novo objeto StorySegment.
   * @throws Error se a comunicação com a API falhar ou a resposta for inválida.
   */
  public async getNextStorySegment(userChoice: string | null): Promise<StorySegment> {
    // 1. Atualiza a última escolha do utilizador e o progresso
    this.storyState.lastChoice = userChoice;
    this.storyState.storyDurationProgress++;
    this.storyState.worldState.timeElapsedMinutes += 5; // Exemplo: cada segmento adiciona 5 minutos

    // 2. Formata o System Prompt com o contexto atual
    const systemPrompt = this.formatSystemPrompt();
    let geminiRawResponseText: string;

    // 3. Envia o prompt para o modelo (agora usando o cliente Gemini real)
    try {
      // O 'userMessage' para o Gemini será a última escolha do usuário, ou uma indicação de início.
      const userMessage = userChoice || "Start the narrative.";
      geminiRawResponseText = await getGeminiCompletion(systemPrompt, userMessage);
      console.log("Resposta bruta do Gemini:", geminiRawResponseText);
    } catch (error) {
        console.error('ORCHESTRATOR ERROR:', error);
        throw error;
    }

    // 4. Valida e faz o parse da resposta
    const parsedResponse = this.parseAndValidateGeminiResponse(geminiRawResponseText);

    // 5. Cria o novo segmento da história
    const newSegment: StorySegment = {
      narrativeText: parsedResponse.narrative_text,
      choices: parsedResponse.choices,
      mood: parsedResponse.mood,
      imagePrompt: parsedResponse.image_prompt,
      audioPrompt: parsedResponse.audio_prompt,
    };

    // 6. Atualiza o histórico da história e o segmento atual
    this.storyState.storyHistory.push(newSegment);
    this.storyState.currentSegment = newSegment;

    // TODO: 7. Implementar lógica para atualizar o `worldState` de forma mais complexa.
    // Isso pode envolver:
    // a) Outro prompt ao Gemini para pedir atualizações de worldState com base na escolha e segmento.
    // b) Lógica hardcoded baseada na escolha do utilizador (ex: "Se escolher A, reputação +1").
    // Por enquanto, o `worldState` é atualizado apenas com `timeElapsedMinutes`.

    // TODO: 8. Implementar lógica para avançar o `currentAct`.
    // Isso pode ser baseado em `storyDurationProgress` (ex: "após X segmentos, Act 2")
    // ou em triggers narrativos específicos retornados pelo Gemini ou identificados no texto.
    if (this.storyState.storyDurationProgress === 5 && this.storyState.currentAct === 1) {
        this.storyState.currentAct = 2;
        console.log("Ato avançado para o Ato 2!");
    } else if (this.storyState.storyDurationProgress === 10 && this.storyState.currentAct === 2) {
        this.storyState.currentAct = 3;
        console.log("Ato avançado para o Ato 3!");
    }


    return newSegment;
  }
}

// Exporta uma instância singleton do StoryOrchestrator para ser usada em toda a aplicação.
export const storyOrchestrator = new StoryOrchestrator();