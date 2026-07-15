import { useState, useRef, useCallback, useEffect } from 'react';

export interface SerialOptions {
  baudRate: number;
}

export function useSerial(onDataReceived: (data: string) => void) {
  const [port, setPort] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
  const keepReadingRef = useRef<boolean>(false);
  const closedPromiseRef = useRef<Promise<void> | null>(null);

  const connect = async (options: SerialOptions) => {
    try {
      if (!('serial' in navigator)) {
        throw new Error('Web Serial API not supported in this browser.');
      }
      
      const newPort = await (navigator as any).serial.requestPort();
      await newPort.open({ baudRate: options.baudRate });
      
      setPort(newPort);
      setIsConnected(true);
      setError(null);
      
      keepReadingRef.current = true;
      readLoop(newPort);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      setIsConnected(false);
    }
  };

  const disconnect = async () => {
    keepReadingRef.current = false;
    setIsConnected(false);
    
    try {
      if (readerRef.current) {
        await readerRef.current.cancel().catch(() => {});
        readerRef.current = null;
      }
    } catch(e) {}
    
    if (closedPromiseRef.current) {
      await closedPromiseRef.current.catch(() => {});
      closedPromiseRef.current = null;
    }
    
    try {
      if (port) {
        await port.close().catch(() => {});
      }
    } catch(e) {}
    
    setPort(null);
  };

  const readLoop = async (activePort: any) => {
    while (activePort.readable && keepReadingRef.current) {
      const textDecoder = new TextDecoderStream();
      closedPromiseRef.current = activePort.readable.pipeTo(textDecoder.writable);
      readerRef.current = textDecoder.readable.getReader();
      
      try {
        while (true) {
          const { value, done } = await readerRef.current.read();
          if (done) break;
          if (value) {
            onDataReceived(value);
          }
        }
      } catch (err: any) {
        console.error('Read error:', err);
      } finally {
        if (readerRef.current) {
          readerRef.current.releaseLock();
        }
      }
    }
  };

  const write = async (data: string) => {
    if (!port || !port.writable) return;
    
    const encoder = new TextEncoder();
    const writer = port.writable.getWriter();
    try {
      await writer.write(encoder.encode(data));
    } catch(err) {
      console.error('Write error:', err);
    } finally {
      writer.releaseLock();
    }
  };

  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected]);

  return { port, isConnected, error, connect, disconnect, write };
}
