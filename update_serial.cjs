const fs = require('fs');
const content = fs.readFileSync('src/lib/useSerial.ts', 'utf8');

const updated = content.replace(
  /const disconnect = async \(\) => \{[\s\S]*?if \(port\) \{[\s\S]*?await port\.close\(\);[\s\S]*?setPort\(null\);[\s\S]*?setIsConnected\(false\);[\s\S]*?\}[\s\S]*?\};/,
  `const disconnect = async () => {
    keepReadingRef.current = false;
    setIsConnected(false);
    
    try {
      if (readerRef.current) {
        await readerRef.current.cancel().catch(() => {});
        readerRef.current = null;
      }
    } catch(e) {}
    
    try {
      if (port) {
        await port.close().catch(() => {});
      }
    } catch(e) {}
    
    setPort(null);
  };`
);

fs.writeFileSync('src/lib/useSerial.ts', updated);
