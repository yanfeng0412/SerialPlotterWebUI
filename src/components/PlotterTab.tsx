import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine
} from 'recharts';
import { ParsedData } from '../types';

const COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#10b981', // emerald
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
];

import { Language, getT } from "../lib/i18n";

interface PlotterTabProps {
  lang: Language;
  title: string;
  data: ParsedData[];
  onDataClick?: (id: string) => void;
  highlightedId?: string;
}

export function PlotterTab({ title, data, onDataClick, highlightedId, lang }: PlotterTabProps) {
  const t = getT(lang);
  const [hiddenLines, setHiddenLines] = useState<Set<number>>(new Set());
  const [activeLine, setActiveLine] = useState<number | null>(null);

  const [customNames, setCustomNames] = useState<Record<number, string>>({});
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editName, setEditName] = useState<string>('');

  const getChannelName = (i: number) => customNames[i] || `Line ${i + 1}`;

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditName(getChannelName(index));
  };

  const saveEdit = () => {
    if (editingIndex !== null) {
      if (editName.trim()) {
        setCustomNames(prev => ({ ...prev, [editingIndex]: editName.trim() }));
      }
      setEditingIndex(null);
    }
  };

  const toggleLine = (index: number) => {
    setHiddenLines(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const DISPLAY_POINTS = 500;
  
  const displayData = useMemo(() => {
    const rawDisplay = data.slice(-DISPLAY_POINTS);
    return rawDisplay.map(d => {
      const point: any = {
        id: d.id,
        time: d.timeStr,
      };
      d.values.forEach((v, i) => {
        point[`Line ${i + 1}`] = v;
      });
      return point;
    });
  }, [data]);

  const numLines = data.length > 0 ? data[0].values.length : 0;
  const lines = Array.from({ length: numLines }, (_, i) => i);

  const handleSave = () => {
    const header = ['time', ...lines.map(i => getChannelName(i))].join(',');
    const rows = data.map(d => {
      const row = [d.timeStr];
      lines.forEach(i => {
        row.push(d.values[i] !== undefined ? d.values[i].toString() : '');
      });
      return row.join(',');
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const highlightedPoint = useMemo(() => {
    return displayData.find(d => d.id === highlightedId);
  }, [displayData, highlightedId]);

  if (data.length === 0) {
    return <div className="flex items-center justify-center h-full text-\[var(--text-muted)\]">{t('noDataFor')} {title}</div>;
  }

  return (
    <div className="w-full h-full flex bg-[var(--bg-app)]">
      {/* Legend Area */}
      <div className="w-48 border-r border-[var(--border-main)] p-4 flex flex-col overflow-y-auto flex-shrink-0 bg-[var(--bg-panel)] z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[10px] uppercase tracking-[0.2em] text-[var(--text-muted)]">{t('activeChannels')}</h3>
          <button onClick={handleSave} title={t('save')} className="text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
          </button>
        </div>
        <div className="space-y-2 flex-1">
          {lines.map(i => {
            const isHidden = hiddenLines.has(i);
            const color = COLORS[i % COLORS.length];
            return (
              <div 
                key={i} 
                className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors border ${isHidden ? 'bg-transparent border-transparent hover:bg-[var(--hover-bg)]' : 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30 group'}`}
                onMouseEnter={() => setActiveLine(i)}
                onMouseLeave={() => setActiveLine(null)}
                onClick={() => {
                  if (editingIndex !== i) toggleLine(i);
                }}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-2 h-2 rounded-full transition-all flex-shrink-0" 
                    style={{ 
                      backgroundColor: isHidden ? 'var(--chart-text)' : color,
                      boxShadow: isHidden ? 'none' : `0 0 8px ${color}`
                    }} 
                  />
                  {editingIndex === i ? (
                    <input 
                      autoFocus
                      className="bg-[var(--bg-input)] border border-[var(--border-main)] text-[var(--text-main)] text-xs px-1 w-20 outline-none focus:border-[var(--color-active)] rounded"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onBlur={saveEdit}
                      onKeyDown={e => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span 
                      className={`text-xs font-medium truncate w-20 ${isHidden ? 'text-[var(--text-muted)]' : 'text-[var(--text-main)]'}`}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startEdit(i);
                      }}
                      title={t('doubleClickRename')}
                    >
                      {getChannelName(i)}
                    </span>
                  )}
                </div>
                <div className={`text-[10px] ${isHidden ? 'opacity-0' : 'text-[var(--text-muted)]'}`}>●</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 relative">
         <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            onClick={(e: any) => {
              if (e && e.activePayload && e.activePayload.length > 0 && onDataClick) {
                onDataClick(e.activePayload[0].payload.id);
              }
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--chart-grid)" />
            <XAxis 
              dataKey="time" 
              tick={{ fill: 'var(--chart-text)', fontSize: 10 }} 
              tickFormatter={(val) => val.split('.')[0]} 
              minTickGap={50}
              stroke="var(--chart-grid)"
            />
            <YAxis tick={{ fill: 'var(--chart-text)', fontSize: 10 }} stroke="var(--chart-grid)" />
            <Tooltip
              contentStyle={{ backgroundColor: 'var(--chart-tooltip-bg)', fontSize: '12px', borderRadius: '8px', border: '1px solid var(--chart-tooltip-border)', color: 'var(--text-main)' }}
              labelStyle={{ fontWeight: 'bold', color: 'var(--text-muted)' }}
              itemStyle={{ color: 'var(--text-main)' }}
            />
            {highlightedPoint && (
              <ReferenceLine x={highlightedPoint.time} stroke="var(--color-active)" strokeWidth={2} strokeDasharray="3 3" />
            )}
            {lines.map(i => (
              !hiddenLines.has(i) && (
                <Line
                  key={i}
                  name={getChannelName(i)}
                  type="linear"
                  dataKey={`Line ${i + 1}`}
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  activeDot={{ 
                    r: 6, 
                    stroke: 'var(--bg-app)', 
                    strokeWidth: 2,
                    onClick: (e: any, payload: any) => {
                      if (onDataClick && payload && payload.payload) {
                        onDataClick(payload.payload.id);
                      }
                    }
                  }}
                  isAnimationActive={false}
                  strokeWidth={activeLine === i ? 3 : 1.5}
                  strokeOpacity={activeLine === null || activeLine === i ? 1 : 0.2}
                />
              )
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
