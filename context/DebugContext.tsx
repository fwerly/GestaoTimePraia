
import React, { createContext, useContext, useState, useCallback } from 'react';
import { Terminal, X, Trash2, ChevronUp, ChevronDown } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'error' | 'warn';
}

interface DebugContextData {
  log: (message: string, type?: 'info' | 'error' | 'warn') => void;
  clearLogs: () => void;
}

const DebugContext = createContext<DebugContextData>({} as DebugContextData);

export const DebugProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const log = useCallback((message: string, type: 'info' | 'error' | 'warn' = 'info') => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [entry, ...prev].slice(0, 50));
    console[type](`[APP-DEBUG] ${message}`);
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return (
    <DebugContext.Provider value={{ log, clearLogs }}>
      {children}
      
      {/* Botão Flutuante de Debug */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-[9999] bg-zinc-800 text-zinc-400 p-3 rounded-full border border-white/10 shadow-2xl hover:bg-zinc-700 transition-colors"
      >
        <Terminal size={20} />
        {logs.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary-500 text-black text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center">
            {logs.length}
          </span>
        )}
      </button>

      {/* Painel de Logs */}
      {isOpen && (
        <div className="fixed bottom-20 left-4 right-4 z-[9998] bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl flex flex-col max-h-[60vh] overflow-hidden animate-in slide-in-from-bottom-5">
          <div className="p-4 border-b border-white/5 flex items-center justify-between bg-zinc-900/50">
            <div className="flex items-center gap-2">
              <Terminal size={16} className="text-primary-500" />
              <span className="text-xs font-black uppercase tracking-widest text-white">Debug Console</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearLogs} className="text-zinc-500 hover:text-red-400 p-1"><Trash2 size={16} /></button>
              <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-white p-1"><X size={16} /></button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-2 font-mono text-[10px] bg-black/40">
            {logs.length === 0 ? (
              <p className="text-zinc-700 italic text-center py-4">Nenhum log registrado...</p>
            ) : (
              logs.map((l, i) => (
                <div key={i} className={`p-2 rounded border border-white/5 ${
                  l.type === 'error' ? 'bg-red-500/10 text-red-400' : 
                  l.type === 'warn' ? 'bg-yellow-500/10 text-yellow-400' : 
                  'bg-white/5 text-zinc-400'
                }`}>
                  <span className="opacity-40 mr-2">[{l.timestamp}]</span>
                  {l.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </DebugContext.Provider>
  );
};

export const useDebug = () => useContext(DebugContext);
