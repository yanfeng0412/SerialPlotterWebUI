export interface ParsedData {
  id: string;
  timestamp: number;
  timeStr: string;
  title: string;
  values: number[];
  rawStr: string;
}

export interface LogEntry {
  id: string;
  timestamp: number;
  timeStr: string;
  rawStr: string;
  parsedTitle?: string;
  isRx: boolean;
}
