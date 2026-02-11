'use client';

import { useState } from 'react';
import { StorySegment } from '@/lib/story-engine/types';

export default function Home() {
  const [story, setStory] = useState<StorySegment | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleStart = async (choice: string = "Começar a narrativa.") => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/story/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ lastChoice: choice }),
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar a história');
      }

      const data = await response.json();
      setStory(data);
    } catch (error) {
      console.error('Erro ao iniciar a história:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex items-center justify-center min-h-[100dvh] px-8">
      {!story ? (
        <div className="flex flex-col items-center gap-12">
          <h1 className="text-white text-5xl md:text-7xl font-light tracking-tight drop-shadow-2xl">
            Adventure
          </h1>
          <button
            onClick={() => handleStart()}
            disabled={isLoading}
            className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white font-light tracking-widest uppercase transition-all duration-500 backdrop-blur-md disabled:opacity-50"
          >
            {isLoading ? 'A evocar...' : 'Começar'}
          </button>
        </div>
      ) : (
        <div className="max-w-2xl w-full flex flex-col gap-12 animate-in fade-in duration-1000">
          <p className="text-white text-xl md:text-2xl font-light leading-relaxed tracking-wide drop-shadow-lg text-justify italic opacity-90">
            {story.narrativeText}
          </p>
          
          <div className="flex flex-col gap-4">
            {story.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleStart(choice)}
                disabled={isLoading}
                className="w-full text-left px-6 py-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/30 rounded-lg text-white font-light tracking-wide transition-all duration-300 backdrop-blur-sm disabled:opacity-50 group"
              >
                <span className="opacity-40 group-hover:opacity-100 transition-opacity mr-4">
                  {index + 1}.
                </span>
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
