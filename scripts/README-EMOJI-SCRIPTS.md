# Scripts de Limpieza de Emojis

Este directorio contiene scripts para gestionar y eliminar emojis del proyecto.

## Scripts Disponibles

### 1. `preview-emojis.js` - Preview sin modificar
Muestra todos los emojis encontrados SIN modificar ningún archivo.

```bash
node scripts/preview-emojis.js
```

**Salida:**
- Lista de archivos con emojis
- Número de línea donde aparecen
- Vista previa del contenido
- Total de emojis encontrados

---

### 2. `remove-emojis.js` - Eliminar emojis
Elimina TODOS los emojis del proyecto y genera un reporte.

```bash
node scripts/remove-emojis.js
```

** ADVERTENCIA:** Este script MODIFICA los archivos. Asegúrate de:
1. Hacer commit de tus cambios actuales
2. Revisar el preview primero con `preview-emojis.js`
3. Tener un backup o usar Git para revertir si es necesario

**Salida:**
- Procesa todos los archivos en `src/`
- Genera reporte en `emoji-removal-report.txt`
- Muestra estadísticas de cambios

---

##  Configuración

Ambos scripts comparten la misma configuración:

```javascript
const CONFIG = {
  directories: ['src'],           // Directorios a procesar
  extensions: ['.ts', '.tsx', '.js', '.jsx'],  // Extensiones
  ignoreDirs: ['node_modules', '.next', 'dist', 'build', '.git'],
};
```

Para modificar qué archivos procesar, edita el objeto `CONFIG` en cada script.

---

##  Ejemplo de Uso

### Paso 1: Preview (Recomendado)
```bash
# Ver qué emojis se encontraron
node scripts/preview-emojis.js
```

### Paso 2: Commit actual
```bash
git add .
git commit -m "Before emoji removal"
```

### Paso 3: Eliminar emojis
```bash
node scripts/remove-emojis.js
```

### Paso 4: Revisar cambios
```bash
# Ver el reporte
cat emoji-removal-report.txt

# Ver cambios en Git
git diff

# Si todo está bien
git add .
git commit -m "Remove all emojis from source code"
```

### Paso 5 (Opcional): Revertir
```bash
# Si no te gustan los cambios
git reset --hard HEAD
```

---

##  ¿Qué Emojis se Eliminan?

El script detecta y elimina:
-  Emojis de texto (, 🔥, ✨, etc.)
-  Símbolos Unicode (✓, ✗, , etc.)
-  Emociones (😀, 😢, , etc.)
-  Iconos (🔔, 📬, 💬, etc.)

---

##  Notas

- Los scripts solo procesan archivos en `src/`
- No tocan `node_modules`, `.next`, `dist`, etc.
- Solo procesan archivos `.ts`, `.tsx`, `.js`, `.jsx`
- Los emojis en comentarios también se eliminan
- Los emojis en strings también se eliminan

---

## 🚨 Casos Especiales

### Si necesitas mantener algunos emojis

1. Ejecuta `preview-emojis.js` primero
2. Anota qué archivos quieres excluir
3. Modifica el script `remove-emojis.js`:

```javascript
// Agregar archivos a excluir
const EXCLUDE_FILES = [
  'src/config/socket-events.ts',  // Ejemplo
];

function shouldProcessFile(fileName, filePath) {
  if (EXCLUDE_FILES.some(f => filePath.includes(f))) {
    return false;
  }
  return CONFIG.extensions.some(ext => fileName.endsWith(ext));
}
```

---

## 📞 Soporte

Si tienes problemas con los scripts, revisa:
1. Que estés en la raíz del proyecto
2. Que exista el directorio `src/`
3. Que tengas permisos de escritura

Para revertir cambios siempre puedes usar Git:
```bash
git checkout .
```
