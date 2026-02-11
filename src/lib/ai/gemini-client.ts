import { GoogleGenerativeAI, GenerativeModel, Content } from '@google/generative-ai';
import { GeminiResponse } from '../story-engine/types';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  throw new Error("GEMINI_API_KEY não está definida nas variáveis de ambiente.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// Usa o modelo Gemini 1.5 Flash
const model: GenerativeModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

/**
 * Envia um prompt ao modelo Gemini 1.5 Flash e espera uma resposta formatada em JSON.
 * @param systemPrompt O System Prompt que define o papel, estilo e formato de saída do Gemini.
 * @param userMessage A mensagem do utilizador (geralmente a última escolha ou uma instrução de início).
 * @returns Uma Promise que resolve para o objeto GeminiResponse validado.
 * @throws Error se a chamada à API falhar ou a resposta não for JSON válida/não conformar com GeminiResponse.
 */
export async function getGeminiCompletion(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    // O Gemini API espera que as instruções do sistema sejam parte do primeiro User Message, ou no campo systemInstruction
    // Para simplificar e garantir o formato JSON, vamos passá-lo como a primeira parte do user message.
    const fullUserMessage = `${systemPrompt}\n\nUser Action: ${userMessage}`;

    const result = await model.generateContent(fullUserMessage);
    const response = result.response;
    const text = response.text();

    // Adicionar log para depuração
    console.log("Resposta bruta do Gemini:", text);

    // Tenta extrair o JSON da string. Por vezes, o Gemini pode envolver o JSON em blocos de código markdown.
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonMatch[1];
    } else {
      // Se não for um bloco de código, assume que é o JSON diretamente
      return text;
    }

  } catch (error) {
    console.error("Erro ao comunicar com a API do Gemini:", error);
    throw new Error("Falha na comunicação com o modelo Gemini.");
  }
}
