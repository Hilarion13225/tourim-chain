'use client';

import { FormEvent, useMemo, useState } from 'react';

type ChatMessage = {
  id: string;
  role: 'user' | 'bot';
  text: string;
};

export default function HomeChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Bonjour 👋 Je suis votre assistant tourisme Côte d’Ivoire. Posez une question pour commencer.',
    },
  ]);

  const quickQuestions = useMemo(
    () => [
      'Quelles destinations recommandes-tu ?',
      'Quel budget prévoir pour 5 jours ?',
      'Quels plats locaux faut-il essayer ?',
    ],
    [],
  );

  async function askBot(question: string) {
    const trimmedQuestion = question.trim();

    if (!trimmedQuestion || isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      text: trimmedQuestion,
    };

    setMessages((previous) => [...previous, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedQuestion }),
      });

      const data = (await response.json()) as {
        answer?: string;
        error?: string;
      };

      const botText = response.ok
        ? (data.answer ?? 'Je n’ai pas de réponse pour le moment.')
        : (data.error ?? 'Une erreur est survenue.');

      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-b`,
          role: 'bot',
          text: botText,
        },
      ]);
    } catch {
      setMessages((previous) => [
        ...previous,
        {
          id: `${Date.now()}-b`,
          role: 'bot',
          text: 'Erreur réseau. Veuillez réessayer.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await askBot(input);
  }

  return (
    <div className="fixed right-3 bottom-3 z-50 sm:right-5 sm:bottom-5">
      {isOpen ? (
        <section className="w-[min(92vw,340px)] rounded-2xl border border-black/10 bg-white shadow-2xl dark:border-white/15 dark:bg-zinc-900">
          <header className="flex items-center justify-between rounded-t-2xl bg-orange-500 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Assistant Tourisme CI</p>
              <p className="text-xs text-orange-100">
                Aide voyage en Côte d’Ivoire
              </p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-white/15 px-2 py-1 text-xs"
            >
              Fermer
            </button>
          </header>

          <div className="max-h-[320px] space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                  message.role === 'user'
                    ? 'ml-auto bg-orange-500 text-white'
                    : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100'
                }`}
              >
                {message.text}
              </article>
            ))}

            {isLoading ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Réponse en cours...
              </p>
            ) : null}
          </div>

          <div className="px-3 pb-2">
            <div className="mb-2 flex flex-wrap gap-2">
              {quickQuestions.map((question) => (
                <button
                  key={question}
                  onClick={() => void askBot(question)}
                  className="rounded-full border border-zinc-200 px-2.5 py-1 text-xs text-zinc-600 dark:border-white/15 dark:text-zinc-300"
                >
                  {question}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="flex gap-2 pb-3">
              <input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Posez votre question..."
                className="h-10 flex-1 rounded-xl border border-zinc-200 px-3 text-sm dark:border-white/15"
              />
              <button
                disabled={isLoading}
                className="rounded-xl bg-orange-500 px-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                Envoyer
              </button>
            </form>
          </div>
        </section>
      ) : null}

      <button
        onClick={() => setIsOpen((value) => !value)}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-500 text-2xl text-white shadow-xl"
        aria-label="Ouvrir le chatbot"
      >
        💬
      </button>
    </div>
  );
}
