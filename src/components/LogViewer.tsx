import React, { useRef, useEffect, useState, useMemo } from 'react';
import { LogEntry } from '../types';
import { cn } from '../lib/utils';
import { Search, ChevronUp, ChevronDown, Copy } from 'lucide-react';

import { Language, getT } from "../lib/i18n";

interface LogViewerProps {
  lang: Language;
  logs: LogEntry[];
  activeTitle?: string | 'main';
  highlightedId?: string;
  onLogClick?: (id: string) => void;
}

export function LogViewer({ logs, activeTitle = 'main', highlightedId, onLogClick, lang }: LogViewerProps) {
  const t = getT(lang);
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightedRef = useRef<HTMLDivElement>(null);
  
  const [showTx, setShowTx] = useState(true);
  const [showRx, setShowRx] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (!showRx && log.isRx) return false;
      if (!showTx && !log.isRx) return false;
      if (activeTitle !== 'main' && log.parsedTitle !== activeTitle) return false;
      if (searchText && !log.rawStr.toLowerCase().includes(searchText.toLowerCase())) return false;
      return true;
    });
  }, [logs, activeTitle, showTx, showRx, searchText]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      setAutoScroll(isAtBottom);
    }
  };

  useEffect(() => {
    if (highlightedId) {
      // Small timeout to ensure DOM is updated after tab switch or filtering
      setTimeout(() => {
        const el = document.getElementById(`log-${highlightedId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setAutoScroll(false);
        }
      }, 50);
    }
  }, [highlightedId, activeTitle, filteredLogs.length]);

  useEffect(() => {
    if (autoScroll && containerRef.current && !highlightedId) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [filteredLogs.length, autoScroll, highlightedId]);

  const handleCopy = () => {
    const text = filteredLogs.map(l => `[${l.timeStr}] ${l.isRx ? 'Rx' : 'Tx'}: ${l.rawStr}`).join('\n');
    navigator.clipboard.writeText(text);
  };

  // Function to highlight parts of the text
  const renderLogText = (text: string) => {
    if (!text.includes('{')) return <span className="text-\[var(--text-main)\]">{text}</span>;
    
    // Simple regex to colorize {TITLE} and the rest
    const parts = text.split(/(\{[^}]+\})/);
    return (
      <>
        {parts.map((part, i) => {
          if (part.startsWith('{') && part.endsWith('}')) {
            return <span key={i} className="text-amber-600 font-semibold">{part}</span>;
          }
          return <span key={i} className="text-[var(--color-active)]">{part}</span>;
        })}
      </>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[var(--bg-panel)] border-t border-[var(--border-main)]">
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border-main)] bg-[var(--bg-header)]">
        <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{t('rawConsole')}</span>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showTx} onChange={e => setShowTx(e.target.checked)} className="accent-[var(--color-active)]" />
            <span className="text-[10px] font-bold text-[var(--text-muted)]">TX</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={showRx} onChange={e => setShowRx(e.target.checked)} className="accent-emerald-500" />
            <span className="text-[10px] font-bold text-[var(--text-muted)]">RX</span>
          </label>
          <div className="w-px h-4 bg-[var(--border-main)]"></div>
          <div className="flex items-center relative">
            <Search className="w-3 h-3 text-[var(--text-muted)] absolute left-2" />
            <input 
              type="text" 
              placeholder={t('search')}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              className="bg-[var(--bg-input)] text-[10px] text-[var(--text-main)] border border-[var(--border-main)] rounded pl-6 pr-2 py-0.5 focus:outline-none focus:border-[var(--color-active)] w-32 placeholder:text-[var(--text-muted)]"
            />
          </div>
          <div className="w-px h-4 bg-[var(--border-main)]"></div>
          <button onClick={handleCopy} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase flex items-center gap-1 transition-colors">
            <Copy className="w-3 h-3" /> {t('copyAll')}
          </button>
          <button onClick={() => {
            const text = filteredLogs.map(l => `[${l.timeStr}] ${l.isRx ? 'RX' : 'TX'}: ${l.rawStr}`).join('\n');
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${activeTitle}_log.txt`;
            a.click();
            URL.revokeObjectURL(url);
          }} className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-main)] uppercase flex items-center gap-1 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> {t('save')}
          </button>
        </div>
      </div>
      <div 
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed space-y-[1px] text-[var(--text-muted)] bg-[var(--bg-app)]"
      >
        {filteredLogs.map(log => (
          <div 
            key={log.id}
            id={`log-${log.id}`}
            ref={log.id === highlightedId ? highlightedRef : null}
            onClick={() => {
              if (window.getSelection()?.toString().length) return;
              if (onLogClick) onLogClick(log.id);
            }}
            className={cn(
              "group flex items-start px-1 rounded-sm transition-colors cursor-pointer relative",
              log.id === highlightedId ? "bg-[var(--color-primary)]/20 border-l-2 border-[var(--color-active)] text-[var(--text-main)]" : "hover:bg-[var(--color-primary)]/10",
              log.isRx ? "" : "opacity-70"
            )}
          >
            <span className="text-[var(--text-muted)] opacity-70 mr-2 flex-shrink-0">[{log.timeStr}]</span>
            <span className={cn(
              "mr-2 tracking-tighter flex-shrink-0 font-bold",
              log.isRx ? "text-emerald-500" : "text-[var(--color-active)]"
            )}>
              {log.isRx ? 'RX <-' : 'TX ->'}
            </span>
            <span className="break-all whitespace-pre-wrap">{renderLogText(log.rawStr)}</span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(`[${log.timeStr}] ${log.isRx ? 'RX' : 'TX'}: ${log.rawStr}`);
              }}
              className="opacity-0 group-hover:opacity-100 absolute right-2 top-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] transition-opacity"
              title="Copy line"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        ))}
        {filteredLogs.length === 0 && (
          <div className="text-[var(--text-muted)] italic text-center mt-10">{t('noLogs')}</div>
        )}
      </div>
    </div>
  );
}
