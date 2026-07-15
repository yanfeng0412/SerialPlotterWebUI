import React, { useState, useEffect, useRef } from 'react';
import { useSerial } from './lib/useSerial';
import { useParser } from './lib/useParser';
import { PlotterTab } from './components/PlotterTab';
import { LogViewer } from './components/LogViewer';
import { SendPanel } from './components/SendPanel';
import { cn } from './lib/utils';
import { X, Settings, HelpCircle, FileText, Activity, Sun, Moon, Play, Square, Upload, Languages } from 'lucide-react';
import { Language, getT } from './lib/i18n';

const BAUD_RATES = [9600, 19200, 38400, 57600, 115200, 230400, 460800, 921600];

export default function App() {
  const [baudRate, setBaudRate] = useState(115200);
  const [activeTopTab, setActiveTopTab] = useState<string>('plotter');
  const [activeBottomTab, setActiveBottomTab] = useState<string>('main');
  const [highlightedId, setHighlightedId] = useState<string | undefined>();
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [lang, setLang] = useState<Language>('zh');
  const [isInIframe, setIsInIframe] = useState(false);
  const [appMode, setAppMode] = useState<'live' | 'playback'>('live');
  const [isPlaying, setIsPlaying] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const playbackIntervalRef = useRef<any>(null);
  const playbackLinesRef = useRef<string[]>([]);
  const playbackIndexRef = useRef<number>(0);

  useEffect(() => {
    if (window !== window.parent) {
      setIsInIframe(true);
    }
  }, []);
  
  const { logs, parsedData, titles, handleData, parseLine, clearData } = useParser();
  
  const { port, isConnected, error, connect, disconnect, write } = useSerial(handleData);

  // Sync titles to tabs if not present
  useEffect(() => {
    if (activeTopTab !== 'plotter' && !titles.includes(activeTopTab)) {
      setActiveTopTab(titles.length > 0 ? titles[0] : 'plotter');
    }
  }, [titles, activeTopTab]);

  const handleSend = (text: string) => {
    if (appMode === 'playback') return;
    write(text);
    parseLine(text, false); // Add to logs as Tx
  };

  const handleDataClick = (id: string) => {
    setHighlightedId(id);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        clearData();
        playbackLinesRef.current = content.split('\n');
        playbackIndexRef.current = 0;
        setIsPlaying(true);
      }
    };
    reader.readAsText(file);
  };

  useEffect(() => {
    if (isPlaying && appMode === 'playback') {
      playbackIntervalRef.current = setInterval(() => {
        const lines = playbackLinesRef.current;
        let index = playbackIndexRef.current;
        
        // Feed 5 lines at a time to speed it up slightly if there's a lot of data
        for (let i = 0; i < 5; i++) {
          if (index < lines.length) {
            const line = lines[index];
            if (line.trim()) {
              // Strip our own prepended time/RX/TX tags if they exist from our own save format
              // E.g. [19:01:23.123] RX: {IMU}0,0,0
              let dataToParse = line;
              const match = line.match(/^[.*?] (?:RX|TX|Rx|Tx).*?: (.*)$/);
              if (match) {
                dataToParse = match[1];
              }
              handleData(dataToParse + '\n');
            }
            index++;
          } else {
            setIsPlaying(false);
            break;
          }
        }
        playbackIndexRef.current = index;
      }, 50); // 50ms interval
    } else {
      if (playbackIntervalRef.current) {
        clearInterval(playbackIntervalRef.current);
      }
    }
    return () => {
      if (playbackIntervalRef.current) clearInterval(playbackIntervalRef.current);
    };
  }, [isPlaying, appMode, handleData]);

  const stopPlayback = () => {
    setIsPlaying(false);
    playbackIndexRef.current = 0;
  };

  const t = getT(lang);

  return (
    <div className={cn("h-screen flex flex-col font-sans overflow-hidden border transition-colors text-sm", isDarkMode ? "dark" : "", "bg-[var(--bg-root)] text-[var(--text-main)] border-[var(--border-main)]")}>
      {isInIframe && (
        <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs px-4 py-2 border-b border-amber-500/20 flex justify-between items-center shrink-0">
          <span className="flex items-center">
            {t('iframeWarning')}
            <a 
              href={window.location.href} 
              target="_blank" 
              rel="noopener noreferrer"
              className="ml-2 underline font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
            >
              {t('openNewTab')}
            </a>
          </span>
          <button onClick={() => setIsInIframe(false)} className="text-amber-600 hover:text-amber-800"><X className="w-3 h-3" /></button>
        </div>
      )}
      {/* Header with connection controls */}
      <header className="h-14 border-b border-[var(--border-main)] bg-[var(--bg-header)] flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-primary)] rounded flex items-center justify-center font-bold text-[var(--color-primary-text)]">SP</div>
            <h1 className="text-lg font-semibold tracking-tight text-[var(--text-main)] uppercase">SerialPro Web <span className="text-xs text-neutral-500 font-normal ml-2 tracking-widest">v1.0.4-BETA</span></h1>
          </div>
          <div className="flex items-center space-x-6 text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-bold ml-6">
            <button onClick={() => setAppMode('live')} className={cn("transition-colors", appMode === 'live' ? "text-[var(--text-main)]" : "hover:text-[var(--text-main)]")}>{t('live')}</button>
            <button onClick={() => {
              if (isConnected) disconnect();
              setAppMode('playback');
            }} className={cn("transition-colors", appMode === 'playback' ? "text-[var(--text-main)]" : "hover:text-[var(--text-main)]")}>{t('playback')}</button>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-[var(--bg-control)] p-1.5 rounded-lg border border-[var(--border-main)]">
          <button 
            onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
            title="Toggle Language"
          >
            <Languages className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-[var(--border-main)]"></div>
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--hover-bg)] transition-colors text-[var(--text-muted)] hover:text-[var(--text-main)]"
            title="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <div className="w-px h-4 bg-[var(--border-main)]"></div>
          
          {appMode === 'live' ? (
            <>
              <div className="flex items-center gap-2 px-3">
                <span className="text-xs uppercase text-[var(--text-muted)] font-bold">{t('port')}</span>
                <div className="text-sm text-[var(--color-active)] font-medium focus:outline-none">{isConnected ? t('connected') : t('notSelected')}</div>
              </div>
              <div className="w-px h-4 bg-[var(--border-main)]"></div>
              <div className="flex items-center gap-2 px-3">
                <span className="text-xs uppercase text-[var(--text-muted)] font-bold">{t('baud')}</span>
                <select 
                  className="bg-transparent text-sm text-[var(--color-active)] font-medium focus:outline-none cursor-pointer"
                  value={baudRate}
                  onChange={(e) => setBaudRate(Number(e.target.value))}
                  disabled={isConnected}
                >
                  {BAUD_RATES.map(rate => (
                    <option key={rate} value={rate} className="bg-[var(--bg-header)] text-[var(--text-main)]">{rate}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={isConnected ? disconnect : () => connect({ baudRate })}
                className={cn(
                  "text-white text-xs font-bold py-1.5 px-4 rounded transition-colors uppercase tracking-wider",
                  isConnected ? "bg-red-600 hover:bg-red-500" : "bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-[var(--color-primary-text)]"
                )}
              >
                {isConnected ? t('disconnect') : t('connect')}
              </button>
            </>
          ) : (
            <>
              <input type="file" accept=".txt,.csv,.log" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="text-[var(--text-main)] text-xs font-bold py-1.5 px-4 rounded transition-colors uppercase tracking-wider border border-[var(--border-main)] hover:bg-[var(--hover-bg)] flex items-center gap-2"
              >
                <Upload className="w-3 h-3"/> {t('loadFile')}
              </button>
              {playbackLinesRef.current.length > 0 && (
                <>
                  <div className="text-[10px] font-mono text-[var(--text-muted)] px-2">
                    {Math.round((playbackIndexRef.current / playbackLinesRef.current.length) * 100)}%
                  </div>
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={cn("text-white text-xs font-bold py-1.5 px-4 rounded transition-colors uppercase tracking-wider flex items-center gap-2", isPlaying ? "bg-amber-600 hover:bg-amber-500" : "bg-emerald-600 hover:bg-emerald-500")}
                  >
                    {isPlaying ? <><Square className="w-3 h-3"/> {t('pause')}</> : <><Play className="w-3 h-3"/> {t('play')}</>}
                  </button>
                  <button 
                    onClick={stopPlayback}
                    className="text-white text-xs font-bold py-1.5 px-4 rounded transition-colors uppercase tracking-wider bg-red-600 hover:bg-red-500"
                  >
                    {t('stop')}
                  </button>
                </>
              )}
            </>
          )}

          <button 
            onClick={clearData}
            className="text-[var(--text-main)] text-xs font-bold py-1.5 px-4 rounded transition-colors uppercase tracking-wider border border-[var(--border-main)] bg-[var(--bg-panel)] hover:bg-[var(--hover-bg)]"
          >
            {t('clear')}
          </button>
        </div>
      </header>

      {error && <div className="bg-red-900/50 text-red-400 text-xs px-4 py-2 border-b border-red-800 truncate">{error}</div>}

      {/* Main Content Area - Split Vertically */}
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-app)]">
        
        {/* Top Half: Plotter area */}
        <div className="flex-1 flex flex-col border-b border-[var(--border-main)] min-h-0 relative">
          <div className="flex space-x-1 px-2 pt-2 border-b border-[var(--border-main)] bg-[var(--bg-panel)] overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveTopTab('plotter')}
              className={cn(
                "px-4 py-1.5 text-xs rounded-t border border-[var(--border-main)] border-b-0 flex items-center space-x-2 transition-colors",
                activeTopTab === 'plotter' 
                  ? "bg-[var(--bg-subpanel)] text-[var(--color-active)] relative top-[1px]" 
                  : "bg-[var(--bg-header)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
              )}
            >
              <span className="font-bold tracking-wider uppercase">plotter</span>
              {activeTopTab === 'plotter' && <X className="w-3 h-3 ml-2" />}
            </button>
            {titles.map(title => (
              <button
                key={`top-${title}`}
                onClick={() => setActiveTopTab(title)}
                className={cn(
                  "px-4 py-1.5 text-xs rounded-t border border-[var(--border-main)] border-b-0 flex items-center space-x-2 transition-colors",
                  activeTopTab === title 
                    ? "bg-[var(--bg-subpanel)] text-[var(--color-active)] relative top-[1px]" 
                    : "bg-[var(--bg-header)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                )}
              >
                <span className="font-bold tracking-wider uppercase">{title}</span>
                {activeTopTab === title && <X className="w-3 h-3 ml-2" />}
              </button>
            ))}
          </div>
          
          <div className="flex-1 overflow-hidden relative bg-[var(--bg-subpanel)]">
            {activeTopTab === 'plotter' && (
              <div className="flex items-center justify-center h-full text-[var(--text-muted)] font-mono text-xs uppercase tracking-widest">
                {!isConnected ? t('waitingConnection') : titles.length === 0 ? t('waitingData') : t('selectTab')}
              </div>
            )}
            {activeTopTab !== 'plotter' && parsedData[activeTopTab] && (
              <PlotterTab 
                title={activeTopTab} 
                data={parsedData[activeTopTab]} 
                onDataClick={handleDataClick}
                highlightedId={highlightedId}
                lang={lang}
              />
            )}
          </div>
        </div>

        {/* Bottom Half: Raw logs and Send area */}
        <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-app)]">
          <div className="flex space-x-1 px-2 pt-2 border-b border-[var(--border-main)] bg-[var(--bg-panel)] overflow-x-auto flex-shrink-0">
            <button
              onClick={() => setActiveBottomTab('main')}
              className={cn(
                "px-4 py-1.5 text-xs rounded-t border border-[var(--border-main)] border-b-0 flex items-center space-x-2 transition-colors",
                activeBottomTab === 'main' 
                  ? "bg-[var(--bg-subpanel)] text-[var(--color-active)] relative top-[1px]" 
                  : "bg-[var(--bg-header)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
              )}
            >
              <span className="font-bold tracking-wider uppercase">main</span>
              {activeBottomTab === 'main' && <X className="w-3 h-3 ml-2" />}
            </button>
            {titles.map(title => (
              <button
                key={`bottom-${title}`}
                onClick={() => setActiveBottomTab(title)}
                className={cn(
                  "px-4 py-1.5 text-xs rounded-t border border-[var(--border-main)] border-b-0 flex items-center space-x-2 transition-colors",
                  activeBottomTab === title 
                    ? "bg-[var(--bg-subpanel)] text-[var(--color-active)] relative top-[1px]" 
                    : "bg-[var(--bg-header)] text-[var(--text-muted)] hover:bg-[var(--hover-bg)]"
                )}
              >
                <span className="font-bold tracking-wider uppercase">{title}</span>
                {activeBottomTab === title && <X className="w-3 h-3 ml-2" />}
              </button>
            ))}
          </div>
          
          <div className="flex-1 min-h-0 flex flex-col relative bg-[var(--bg-panel)]">
             <LogViewer 
               logs={logs} 
               activeTitle={activeBottomTab} 
               highlightedId={highlightedId}
               onLogClick={handleDataClick}
               lang={lang}
             />
          </div>
          
          <SendPanel onSend={handleSend} isConnected={isConnected} lang={lang} />
        </div>
      </div>
    </div>
  );
}
