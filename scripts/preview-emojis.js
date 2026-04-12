#!/usr/bin/env node

/**
 * Script para PREVISUALIZAR emojis antes de eliminarlos
 * Uso: node scripts/preview-emojis.js
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  directories: ['src'],
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  ignoreDirs: ['node_modules', '.next', 'dist', 'build', '.git'],
};

const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}\u{2623}\u{2626}\u{262A}\u{262E}\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{2660}\u{2663}\u{2665}\u{2666}\u{2668}\u{267B}\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}\u{269C}\u{26A0}\u{26A1}\u{26AA}\u{26AB}\u{26B0}\u{26B1}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26C8}\u{26CE}\u{26CF}\u{26D1}\u{26D3}\u{26D4}\u{26E9}\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}]/gu;

const results = [];
let totalEmojis = 0;

function shouldIgnoreDir(dirName) {
  return CONFIG.ignoreDirs.some(ignore => dirName.includes(ignore));
}

function shouldProcessFile(fileName) {
  return CONFIG.extensions.some(ext => fileName.endsWith(ext));
}

function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const emojisFound = [];
    
    lines.forEach((line, index) => {
      const matches = line.match(EMOJI_REGEX);
      if (matches && matches.length > 0) {
        emojisFound.push({
          lineNumber: index + 1,
          line: line.trim(),
          emojis: matches,
        });
      }
    });
    
    if (emojisFound.length > 0) {
      const relPath = path.relative(process.cwd(), filePath);
      results.push({
        file: relPath,
        occurrences: emojisFound,
      });
      totalEmojis += emojisFound.reduce((sum, occ) => sum + occ.emojis.length, 0);
    }
  } catch (error) {
    console.error(`Error procesando ${filePath}:`, error.message);
  }
}

function processDirectory(dirPath) {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!shouldIgnoreDir(entry.name)) {
          processDirectory(fullPath);
        }
      } else if (entry.isFile()) {
        if (shouldProcessFile(entry.name)) {
          analyzeFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error leyendo directorio ${dirPath}:`, error.message);
  }
}

function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           PREVIEW DE EMOJIS EN EL PROYECTO');
  console.log('═══════════════════════════════════════════════════════════\n');
  
  CONFIG.directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      processDirectory(dirPath);
    }
  });
  
  console.log(`\nSe encontraron ${totalEmojis} emojis en ${results.length} archivos:\n`);
  
  results.forEach((result, index) => {
    console.log(`\n${index + 1}. ${result.file}`);
    console.log('─'.repeat(60));
    
    result.occurrences.slice(0, 5).forEach(occ => {
      console.log(`   Línea ${occ.lineNumber}: ${occ.line.substring(0, 80)}`);
      console.log(`   Emojis: ${occ.emojis.join(' ')}`);
    });
    
    if (result.occurrences.length > 5) {
      console.log(`   ... y ${result.occurrences.length - 5} ocurrencias más`);
    }
  });
  
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`TOTAL: ${totalEmojis} emojis en ${results.length} archivos`);
  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('Para eliminarlos, ejecuta: node scripts/remove-emojis.js\n');
}

main();
