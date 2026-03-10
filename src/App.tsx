import React, { useState, useRef, useEffect } from 'react';
import { streamChatResponse } from './ai/chatService';
import { tools } from './ai/tools';
import { Mood, GroundingChunk, Task } from './types';
import { Content } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import { Send, Loader2, Moon, Sun, CheckCircle2, Circle } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  groundingChunks?: GroundingChunk[];
}

export default function App() {
  const [mood, setMood] = useState<Mood>(() => {
    const savedMood = localStorage.getItem('agent_mood');
    if (savedMood === 'light' || savedMood === 'dark') {
      return savedMood as Mood;
    }
    return 'light';
  });
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('chat_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('agent_tasks');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('agent_mood', mood);
  }, [mood]);

  useEffect(() => {
    localStorage.setItem('agent_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleTaskOperation = (operation: 'create' | 'update', payload: any) => {
    if (operation === 'create') {
      const newTask: Task = {
        id: Math.random().toString(36).substring(2, 9),
        title: payload.title,
        status: 'pending'
      };
      setTasks(prev => [...prev, newTask]);
      return newTask;
    } else if (operation === 'update') {
      let updated = false;
      setTasks(prev => {
        const newTasks = [...prev];
        const taskIndex = newTasks.findIndex(t => t.id === payload.id);
        if (taskIndex !== -1) {
          newTasks[taskIndex] = { ...newTasks[taskIndex], status: payload.status };
          updated = true;
        }
        return newTasks;
      });
      return updated;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      // Format history for the API
      const formattedHistory: Content[] = messages.map(m => ({
        role: m.role,
        parts: [{ text: m.text }]
      }));

      const stream = streamChatResponse({
        modelName: 'gemini-3.1-pro-preview',
        formattedHistory,
        tools,
        newMessage: userMessage,
        onMoodChange: (newMood) => setMood(newMood),
        onTaskOperation: handleTaskOperation,
        currentTasks: tasks,
        streamMode: 'speculative'
      });

      let modelText = '';
      let modelGroundingChunks: GroundingChunk[] = [];
      setMessages(prev => [...prev, { role: 'model', text: '', groundingChunks: [] }]);

      for await (const yieldResult of stream) {
        if ('text' in yieldResult) {
          modelText += yieldResult.text;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].text = modelText;
            return newMessages;
          });
        }
        if ('groundingChunks' in yieldResult) {
          modelGroundingChunks = yieldResult.groundingChunks;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1].groundingChunks = modelGroundingChunks;
            return newMessages;
          });
        }
      }
    } catch (error: any) {
      console.error("Chat error:", JSON.stringify(error));
      let errorMessage = 'Sorry, an error occurred.';
      
      // Parse the error object safely
      const errObj = error?.error || error;
      const errCode = errObj?.code || error?.status;
      const errText = errObj?.message || error?.message || JSON.stringify(error);

      if (errCode === 429 || errText?.includes('429') || errText?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'You have exceeded your current Gemini API quota or rate limit. Please check your plan and billing details at https://ai.google.dev/gemini-api/docs/rate-limits.';
      } else {
        errorMessage = `Sorry, an error occurred: ${errText}`;
      }

      setMessages(prev => {
        const newMessages = [...prev];
        if (newMessages[newMessages.length - 1].role === 'model' && newMessages[newMessages.length - 1].text === '') {
          newMessages[newMessages.length - 1].text = errorMessage;
        } else {
          newMessages.push({ role: 'model', text: errorMessage });
        }
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = mood === 'dark';

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-500 ${isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-slate-50 text-slate-900'}`}>
      <header className={`p-4 flex justify-between items-center border-b ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-slate-200 bg-white/50'} backdrop-blur-sm sticky top-0 z-10`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            {isDark ? <Moon size={18} /> : <Sun size={18} />}
          </div>
          <h1 className="font-semibold text-lg tracking-tight">Interactive Agent</h1>
        </div>
        <div className="text-xs font-medium uppercase tracking-wider opacity-50">
          Mood: {mood}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="text-center py-20 opacity-50">
                <p className="text-lg">Hello! I am your interactive agent.</p>
                <p className="text-sm mt-2">I can change the UI mood based on our conversation.</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-5 py-3 ${
                  msg.role === 'user' 
                    ? (isDark ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white') 
                    : (isDark ? 'bg-zinc-900 border border-zinc-800' : 'bg-white border border-slate-200 shadow-sm')
                }`}>
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="prose prose-sm md:prose-base max-w-none dark:prose-invert">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                      {msg.groundingChunks && msg.groundingChunks.length > 0 && (
                        <div className={`mt-2 pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-slate-200'}`}>
                          <p className="text-xs font-semibold uppercase tracking-wider mb-2 opacity-70">Sources</p>
                          <div className="flex flex-wrap gap-2">
                            {msg.groundingChunks.map((chunk, i) => chunk.web?.uri ? (
                              <a 
                                key={i} 
                                href={chunk.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 transition-colors ${
                                  isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-indigo-300' : 'bg-slate-100 hover:bg-slate-200 text-indigo-600'
                                }`}
                              >
                                <span className="truncate max-w-[200px]">{chunk.web.title || chunk.web.uri}</span>
                              </a>
                            ) : null)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </main>

        <aside className={`hidden md:block w-80 border-l p-4 overflow-y-auto ${isDark ? 'border-zinc-800 bg-zinc-900/30' : 'border-slate-200 bg-slate-50/50'}`}>
          <h2 className="font-semibold mb-4 text-sm uppercase tracking-wider opacity-70">Tasks</h2>
          {tasks.length === 0 ? (
            <p className="text-sm opacity-50">No tasks yet. Ask me to create one!</p>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${isDark ? 'border-zinc-800 bg-zinc-900' : 'border-slate-200 bg-white shadow-sm'}`}>
                  <div className="mt-0.5 text-indigo-500">
                    {task.status === 'completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </div>
                  <div className={`text-sm ${task.status === 'completed' ? 'line-through opacity-50' : ''}`}>
                    {task.title}
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      <footer className={`p-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-950' : 'border-slate-200 bg-white'}`}>
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type a message..."
              disabled={isLoading}
              className={`w-full rounded-full pl-6 pr-12 py-3 outline-none transition-shadow ${
                isDark 
                  ? 'bg-zinc-900 border border-zinc-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-white placeholder-zinc-500' 
                  : 'bg-slate-100 border border-transparent focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`absolute right-2 p-2 rounded-full transition-colors ${
                !input.trim() || isLoading
                  ? 'opacity-50 cursor-not-allowed'
                  : isDark
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
            >
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </footer>
    </div>
  );
}
