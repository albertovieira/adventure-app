import { StoryState, StorySegment, WorldState, GeminiResponse } from './types';
import { buildDynamicSystemPrompt } from '../ai/gemini-prompts';

/**
 * Função simulada para interagir com o endpoint da nossa API que chamará o Gemini.
 * Em um ambiente real, esta função faria uma requisição `fetch` para `'/api/story/generate'`.
 * Por agora, retorna uma resposta JSON simulada.
 * @param systemPrompt O prompt completo do sistema a ser enviado ao Gemini.
 * @param userChoice A última escolha do utilizador.
 * @returns Uma Promise que resolve para a string JSON bruta da resposta do Gemini.
 */
async function callGeminiApi(systemPrompt: string, userChoice: string | null): Promise<string> {
  console.log("Chamando Gemini com System Prompt (fragmento):", systemPrompt.substring(0, 500) + '...');
  console.log("Última escolha do utilizador:", userChoice);

  // Simula um atraso de rede para imitar uma chamada de API real.
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Resposta mockada que simula a saída esperada do Gemini.
  const mockResponse: GeminiResponse = {
    narrative_text: "O ar estagnado na câmara escura trazia o cheiro a mofo e metal oxidado. Um som distante de gotejamento ecoava na penumbra, que era apenas quebrada por um feixe ténue de luz que se esgueirava por uma fenda no teto, iluminando partículas de pó dançantes. A parede rochosa à sua frente parecia húmida ao toque. Uma brisa fria, vinda de uma abertura que antes não notaras, roçou-te a nuca, prometendo um caminho inexplorado.",
    choices: ["Explorar a fenda de luz", "Procurar a origem do gotejamento", "Tocar na parede húmida", "Investigar a brisa"],
    mood: "mysterious",
    image_prompt: "Dark, damp cave, single light beam, ancient metal, subtle cold breeze, sense of exploration",
    audio_prompt: "Subtle water dripping, distant echoing, faint breeze sound in a cave"
  };

  return JSON.stringify(mockResponse);
}

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
      const response: GeminiResponse = JSON.parse(rawGeminiResponseText);

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

    // 3. Envia o prompt para o modelo (via API simulada por enquanto)
    try {
      geminiRawResponseText = await callGeminiApi(systemPrompt, userChoice);
    } catch (error) {
      console.error("Erro ao chamar a API do Gemini:", error);
      throw new Error("Não foi possível obter o segmento da história. Por favor, tente novamente.");
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