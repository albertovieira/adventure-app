import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function getGeminiCompletion(systemPrompt: string, userMessage: string) {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      model: "llama-3.3-70b-versatile",
    });

    return chatCompletion.choices[0]?.message?.content || "";
  } catch (error: any) {
    console.error('ERRO GROQ:', error);
    throw new Error(`Falha na narrativa: ${error.message}`);
  }
}