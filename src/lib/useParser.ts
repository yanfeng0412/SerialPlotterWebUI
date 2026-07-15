import { useState, useCallback, useRef } from 'react';
import { ParsedData, LogEntry } from '../types';

export function useParser() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [parsedData, setParsedData] = useState<Record<string, ParsedData[]>>({});
  const [titles, setTitles] = useState<string[]>([]);
  
  const bufferRef = useRef<string>('');
  
  // Buffers for batch updates
  const pendingLogs = useRef<LogEntry[]>([]);
  const pendingData = useRef<Record<string, ParsedData[]>>({});
  const pendingTitles = useRef<Set<string>>(new Set());
  const updateScheduled = useRef(false);

  const flushUpdates = useCallback(() => {
    if (!updateScheduled.current) return;
    
    const logsToAdd = pendingLogs.current;
    pendingLogs.current = [];
    
    const dataToAdd = pendingData.current;
    pendingData.current = {};
    
    const titlesToAdd = Array.from(pendingTitles.current);
    pendingTitles.current.clear();

    if (logsToAdd.length > 0) {
      setLogs(prev => [...prev, ...logsToAdd].slice(-5000));
    }

    if (Object.keys(dataToAdd).length > 0) {
      setParsedData(prev => {
        const nextData = { ...prev };
        for (const title in dataToAdd) {
          const currentData = nextData[title] || [];
          // Keep last 2000 points per title for performance
          nextData[title] = [...currentData, ...dataToAdd[title]].slice(-2000);
        }
        return nextData;
      });
    }

    if (titlesToAdd.length > 0) {
      setTitles(prev => {
        const newTitles = new Set(prev);
        titlesToAdd.forEach(t => newTitles.add(t));
        const newTitlesArr = Array.from(newTitles);
        if (newTitlesArr.length !== prev.length) {
          return newTitlesArr;
        }
        return prev;
      });
    }

    updateScheduled.current = false;
  }, []);

  const scheduleUpdate = () => {
    if (!updateScheduled.current) {
      updateScheduled.current = true;
      requestAnimationFrame(flushUpdates);
    }
  };

  const parseLine = useCallback((line: string, isRx: boolean = true) => {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${now.getMilliseconds().toString().padStart(3, '0')}`;
    const id = Math.random().toString(36).substring(2, 9);
    
    let parsedTitle: string | undefined = undefined;
    
    // Check for {TITLE}val1,val2... format or space separated
    const match = line.match(/\{([^}]+)\}(.*)/);
    if (match) {
      const title = match[1];
      parsedTitle = title;
      const valuesStr = match[2].trim();
      const values = valuesStr.split(/[\s,]+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
      
      if (values.length > 0) {
        const dataPoint: ParsedData = {
          id,
          timestamp: now.getTime(),
          timeStr,
          title,
          values,
          rawStr: line
        };
        
        if (!pendingData.current[title]) {
          pendingData.current[title] = [];
        }
        pendingData.current[title].push(dataPoint);
        pendingTitles.current.add(title);
      }
    }

    const logEntry: LogEntry = {
      id,
      timestamp: now.getTime(),
      timeStr,
      rawStr: line,
      parsedTitle,
      isRx
    };
    
    pendingLogs.current.push(logEntry);
    scheduleUpdate();
  }, [flushUpdates]);

  const handleData = useCallback((chunk: string) => {
    bufferRef.current += chunk;
    const lines = bufferRef.current.split('\n');
    
    // The last element might be an incomplete line
    bufferRef.current = lines.pop() || '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        parseLine(trimmed);
      }
    }
  }, [parseLine]);

  const clearData = useCallback(() => {
    setLogs([]);
    setParsedData({});
    setTitles([]);
    pendingLogs.current = [];
    pendingData.current = {};
    pendingTitles.current.clear();
    bufferRef.current = '';
    updateScheduled.current = false;
  }, []);

  return { logs, parsedData, titles, handleData, parseLine, clearData };
}
