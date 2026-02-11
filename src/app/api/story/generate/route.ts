import { NextRequest, NextResponse } from 'next/server';
import { storyOrchestrator } from '../../../../lib/story-engine/story-orchestrator';
import { StoryState } from '../../../../lib/story-engine/types';

// Define o handler para requisições POST
export async function POST(request: NextRequest) {
  try {
    const { lastChoice, currentStoryState }: { lastChoice: string | null; currentStoryState?: StoryState } = await request.json();

    // Nota: currentStoryState é recebido do cliente. Num cenário de uma única sessão de utilizador
    // e um StoryOrchestrator singleton, o orquestrador mantém o seu próprio estado.
    // Para a primeira interação (lastChoice === null), o currentStoryState pode ser ignorado,
    // ou usado para inicializar o orquestrador se ele não tiver um estado.
    // Para interações subsequentes, o orquestrador interno já tem o estado.
    // Se precisarmos suportar múltiplas sessões de utilizador, teríamos de gerir
    // o estado do StoryOrchestrator por sessão (ex: um mapa de sessionID -> StoryOrchestrator instance).
    // Por agora, o singleton StoryOrchestrator gere o seu próprio estado persistente para esta instância do servidor.

    // Gera o próximo segmento da história usando o StoryOrchestrator
    const nextSegment = await storyOrchestrator.getNextStorySegment(lastChoice);

    // Retorna o novo segmento da história como JSON
    return NextResponse.json(nextSegment, { status: 200 });

  } catch (error) {
    console.error('Erro na API /api/story/generate:', error);

    // Retorna uma resposta de erro clara
    return NextResponse.json(
      { error: 'Não foi possível gerar o próximo segmento da história.', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
