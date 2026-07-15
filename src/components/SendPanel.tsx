import React, { useState, useEffect } from 'react';
import { Language, getT } from '../lib/i18n';

interface SendPanelProps {
  onSend: (data: string) => void;
  isConnected: boolean;
  lang: Language;
}

export function SendPanel({ onSend, isConnected, lang }: SendPanelProps) {
  const t = getT(lang);
  const [text, setText] = useState('');
  const [appendNewline, setAppendNewline] = useState(true);
  const [hexSend, setHexSend] = useState(false);
  const [loopSend, setLoopSend] = useState(false);
  const [loopInterval, setLoopInterval] = useState(1000);
  
  useEffect(() => {
    let intervalId: any;
    if (loopSend && isConnected && text) {
      intervalId = setInterval(() => {
        handleSend();
      }, loopInterval);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [loopSend, isConnected, text, loopInterval, appendNewline, hexSend]);

  const handleSend = () => {
    if (!text) return;
    let dataToSend = text;
    
    if (hexSend) {
      // Very basic hex string to bytes, but we send as string or arraybuffer
      // Web Serial API text stream expects string, so this is tricky for real hex.
      // We will leave as string logic or minimal hex decode if needed, but for now 
      // just pass text with optional newline.
    }
    
    if (appendNewline) {
      dataToSend += '\r\n';
    }
    
    onSend(dataToSend);
  };

  return (
    <div className="h-32 border-t border-[var(--border-main)] bg-[var(--bg-root)] flex shrink-0">
      {/* Left Text Area */}
      <div className="flex-1 p-2 flex flex-col relative">
        <textarea
          className="flex-1 resize-none border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] rounded p-2 text-sm font-mono focus:outline-none focus:border-[var(--color-active)] placeholder:text-[var(--text-muted)]"
          placeholder={t('dataSendArea')}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      
      {/* Right Controls */}
      <div className="w-[380px] border-l border-[var(--border-main)] p-2 flex flex-col justify-between bg-[var(--bg-panel)]">
        <div className="grid grid-cols-3 gap-2 text-[10px] text-[var(--text-muted)] font-medium">
          <label className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-main)] transition-colors">
            <input type="checkbox" className="rounded border-[var(--border-main)] bg-[var(--bg-input)] accent-[var(--color-active)]" />
            <span>{t('timestamp')}</span>
          </label>
          <div className="flex items-center space-x-1 col-span-2">
            <input type="number" className="w-12 border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] rounded px-1 py-0.5 focus:border-[var(--color-active)] focus:outline-none text-[10px]" defaultValue={20} />
            <span className="text-[var(--text-muted)]">{t('msTimeout')}</span>
          </div>
          
          <label className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-main)] transition-colors">
            <input 
              type="checkbox" 
              checked={loopSend}
              onChange={e => setLoopSend(e.target.checked)}
              className="rounded border-[var(--border-main)] bg-[var(--bg-input)] accent-[var(--color-active)]" 
            />
            <span>{t('loopSend')}</span>
          </label>
          <div className="flex items-center space-x-1 col-span-2">
            <input 
              type="number" 
              value={loopInterval}
              onChange={e => setLoopInterval(Number(e.target.value))}
              className="w-12 border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] rounded px-1 py-0.5 focus:border-[var(--color-active)] focus:outline-none text-[10px]" 
            />
            <span className="text-[var(--text-muted)]">{t('msTime')}</span>
          </div>
          
          <label className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-main)] transition-colors">
            <input 
              type="checkbox" 
              checked={hexSend}
              onChange={e => setHexSend(e.target.checked)}
              className="rounded border-[var(--border-main)] bg-[var(--bg-input)] accent-[var(--color-active)]" 
            />
            <span>{t('hexSend')}</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-main)] transition-colors col-span-2">
            <input type="checkbox" className="rounded border-[var(--border-main)] bg-[var(--bg-input)] accent-[var(--color-active)]" />
            <span>{t('hexDisplay')}</span>
          </label>
          
          <label className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-main)] transition-colors">
            <input 
              type="checkbox" 
              checked={appendNewline}
              onChange={e => setAppendNewline(e.target.checked)}
              className="rounded border-[var(--border-main)] bg-[var(--bg-input)] accent-[var(--color-active)]" 
            />
            <span>{t('addNewline')}</span>
          </label>
          <label className="flex items-center space-x-1 cursor-pointer hover:text-[var(--text-main)] transition-colors col-span-2">
            <input type="checkbox" className="rounded border-[var(--border-main)] bg-[var(--bg-input)] accent-[var(--color-active)]" />
            <span>{t('enterToSend')}</span>
          </label>
        </div>
        
        <div className="flex space-x-2 mt-2">
          <button 
            onClick={handleSend}
            disabled={!isConnected}
            className="flex-1 bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)] font-bold py-1.5 rounded text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {t('send')}
          </button>
          <button 
            onClick={() => setText('')}
            className="flex-1 bg-[var(--bg-header)] border border-[var(--border-main)] hover:bg-[var(--hover-bg)] text-[var(--text-main)] font-bold py-1.5 rounded text-xs uppercase tracking-wider transition-colors"
          >
            {t('clear')}
          </button>
        </div>
      </div>
    </div>
  );
}
