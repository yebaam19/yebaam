#!/usr/bin/env node

/**
 * Script para eliminar todos los emojis del proyecto
 * Uso: node scripts/remove-emojis.js
 */

const fs = require('fs');
const path = require('path');

// Configuración
const CONFIG = {
  // Directorios a procesar
  directories: ['src'],
  
  // Extensiones de archivos a procesar
  extensions: ['.ts', '.tsx', '.js', '.jsx'],
  
  // Directorios a ignorar
  ignoreDirs: ['node_modules', '.next', 'dist', 'build', '.git'],
  
  // Archivo de log
  logFile: 'emoji-removal-report.txt',
};

// Regex para detectar emojis (Unicode)
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2300}-\u{23FF}\u{2B50}\u{2B55}\u{231A}\u{231B}\u{2328}\u{23CF}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{24C2}\u{25AA}\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2600}-\u{2604}\u{260E}\u{2611}\u{2614}\u{2615}\u{2618}\u{261D}\u{2620}\u{2622}\u{2623}\u{2626}\u{262A}\u{262E}\u{262F}\u{2638}-\u{263A}\u{2640}\u{2642}\u{2648}-\u{2653}\u{2660}\u{2663}\u{2665}\u{2666}\u{2668}\u{267B}\u{267F}\u{2692}-\u{2697}\u{2699}\u{269B}\u{269C}\u{26A0}\u{26A1}\u{26AA}\u{26AB}\u{26B0}\u{26B1}\u{26BD}\u{26BE}\u{26C4}\u{26C5}\u{26C8}\u{26CE}\u{26CF}\u{26D1}\u{26D3}\u{26D4}\u{26E9}\u{26EA}\u{26F0}-\u{26F5}\u{26F7}-\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}\u{2712}\u{2714}\u{2716}\u{271D}\u{2721}\u{2728}\u{2733}\u{2734}\u{2744}\u{2747}\u{274C}\u{274E}\u{2753}-\u{2755}\u{2757}\u{2763}\u{2764}\u{2795}-\u{2797}\u{27A1}\u{27B0}\u{27BF}\u{2934}\u{2935}\u{2B05}-\u{2B07}\u{2B1B}\u{2B1C}\u{2B50}\u{2B55}\u{3030}\u{303D}\u{3297}\u{3299}\u{FE0F}]/gu;

// Estadísticas
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  emojisRemoved: 0,
  errors: 0,
};

// Log de cambios
const changeLog = [];

/**
 * Verifica si un directorio debe ser ignorado
 */
function shouldIgnoreDir(dirName) {
  return CONFIG.ignoreDirs.some(ignore => dirName.includes(ignore));
}

/**
 * Verifica si un archivo debe ser procesado
 */
function shouldProcessFile(fileName) {
  return CONFIG.extensions.some(ext => fileName.endsWith(ext));
}

/**
 * Procesa un archivo y elimina emojis
 */
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const emojisFound = content.match(EMOJI_REGEX);
    
    if (!emojisFound || emojisFound.length === 0) {
      stats.filesProcessed++;
      return;
    }

    // Eliminar emojis
    const newContent = content.replace(EMOJI_REGEX, '');
    
    // Guardar archivo
    fs.writeFileSync(filePath, newContent, 'utf8');
    
    // Actualizar estadísticas
    stats.filesProcessed++;
    stats.filesModified++;
    stats.emojisRemoved += emojisFound.length;
    
    // Registrar cambio
    const relPath = path.relative(process.cwd(), filePath);
    changeLog.push({
      file: relPath,
      emojisRemoved: emojisFound.length,
      emojis: [...new Set(emojisFound)], // Únicos
    });
    
    console.log(`✓ ${relPath}: ${emojisFound.length} emojis eliminados`);
    
  } catch (error) {
    stats.errors++;
    console.error(`✗ Error procesando ${filePath}:`, error.message);
  }
}

/**
 * Recorre directorios recursivamente
 */
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
          processFile(fullPath);
        }
      }
    }
  } catch (error) {
    console.error(`Error leyendo directorio ${dirPath}:`, error.message);
  }
}

/**
 * Genera reporte de cambios
 */
function generateReport() {
  const lines = [
    '═══════════════════════════════════════════════════════════',
    '           REPORTE DE ELIMINACIÓN DE EMOJIS',
    '═══════════════════════════════════════════════════════════',
    '',
    `Fecha: ${new Date().toLocaleString()}`,
    '',
    '─────────────────────────────────────────────────────────',
    '  ESTADÍSTICAS',
    '─────────────────────────────────────────────────────────',
    `  Archivos procesados: ${stats.filesProcessed}`,
    `  Archivos modificados: ${stats.filesModified}`,
    `  Emojis eliminados: ${stats.emojisRemoved}`,
    `  Errores: ${stats.errors}`,
    '',
    '─────────────────────────────────────────────────────────',
    '  ARCHIVOS MODIFICADOS',
    '─────────────────────────────────────────────────────────',
  ];
  
  if (changeLog.length === 0) {
    lines.push('  No se encontraron emojis para eliminar.');
  } else {
    changeLog.forEach((change, index) => {
      lines.push('');
      lines.push(`${index + 1}. ${change.file}`);
      lines.push(`   Emojis eliminados: ${change.emojisRemoved}`);
      lines.push(`   Emojis únicos: ${change.emojis.join(' ')}`);
    });
  }
  
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

/**
 * Función principal
 */
function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('           🧹 ELIMINANDO EMOJIS DEL PROYECTO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');
  
  const startTime = Date.now();
  
  // Procesar directorios
  CONFIG.directories.forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      console.log(`Procesando directorio: ${dir}`);
      processDirectory(dirPath);
    } else {
      console.warn(`⚠ Directorio no encontrado: ${dir}`);
    }
  });
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PROCESO COMPLETADO');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Archivos procesados: ${stats.filesProcessed}`);
  console.log(`  Archivos modificados: ${stats.filesModified}`);
  console.log(`  Emojis eliminados: ${stats.emojisRemoved}`);
  console.log(`  Errores: ${stats.errors}`);
  console.log(`  Tiempo: ${duration}s`);
  console.log('═══════════════════════════════════════════════════════════');
  
  // Generar reporte
  const report = generateReport();
  fs.writeFileSync(CONFIG.logFile, report, 'utf8');
  console.log('');
  console.log(` Reporte guardado en: ${CONFIG.logFile}`);
  console.log('');
}

// Ejecutar
main();
