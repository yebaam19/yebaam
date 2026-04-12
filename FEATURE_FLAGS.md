# Feature Flags - Sistema de Control de Visibilidad

## 📋 Descripción

Sistema centralizado para controlar la visibilidad de features en desarrollo. Permite ocultar secciones que solo tienen UI/UX implementado pero no funcionalidad backend.

## 🎯 Propósito

Evitar confusión en clientes al mostrar data mock o interfaces no funcionales. En lugar de explicar repetidamente que "esto es solo UI/UX", simplemente ocultamos estas secciones hasta que estén completamente implementadas.

## 📁 Archivos

- **`src/config/features-flag.ts`** - Configuración de feature flags
- **`src/config/menuConfig.ts`** - Implementación en menú de navegación

## 🚀 Uso

### 1. Configurar Feature Flags

Edita `src/config/features-flag.ts`:

```typescript
export const FEATURE_FLAGS = {
  GRUPOS_ENABLED: false,      // 🔴 Oculto - Solo UI/UX
  CLUBES_ENABLED: false,      // 🔴 Oculto - Solo UI/UX
  BLOGS_ENABLED: false,       // 🔴 Oculto - Solo UI/UX
  COMUNIDADES_ENABLED: false, // 🔴 Oculto - Solo UI/UX
  CHAT_ENABLED: true,         //  Visible - Funcional
};
```

### 2. Aplicar a Items de Menú

En `src/config/menuConfig.ts`:

```typescript
{
  icon: UsersIcon,
  label: 'Grupos',
  href: '{basePath}/grupos',
  featureFlag: 'GRUPOS_ENABLED' as FeatureFlag // 👈 Agregar esta línea
}
```

### 3. Usar en Componentes

```typescript
import { isFeatureEnabled } from '@/config/features-flag';

// Verificar si una feature está habilitada
if (isFeatureEnabled('GRUPOS_ENABLED')) {
  // Mostrar feature
}
```

## 📊 Features Actuales

| Feature | Estado | Descripción |
|---------|--------|-------------|
| **Grupos** | 🔴 Deshabilitado | Solo UI/UX implementado |
| **Clubes** | 🔴 Deshabilitado | Solo UI/UX implementado |
| **Blogs** | 🔴 Deshabilitado | Solo UI/UX implementado |
| **Comunidades** | 🔴 Deshabilitado | Solo UI/UX implementado |
| **Chat** |  Habilitado | Funcionalidad completa |
| **Stories** |  Habilitado | Funcionalidad completa |
| **Live Stream** |  Habilitado | Funcionalidad completa |

##  Proceso de Activación

Cuando una feature esté lista para producción:

1. **Verificar funcionalidad completa**
   - Backend implementado 
   - Frontend conectado 
   - Pruebas realizadas 
   - Data real (no mock) 

2. **Cambiar flag en `features-flag.ts`**
   ```typescript
   GRUPOS_ENABLED: true, // Cambiar de false a true
   ```

3. **Commit y deploy**
   ```bash
   git add src/config/features-flag.ts
   git commit -m "feat: enable grupos feature"
   ```

## 🛠️ Helpers Disponibles

### `isFeatureEnabled(feature)`

Verifica si una feature específica está habilitada.

```typescript
import { isFeatureEnabled } from '@/config/features-flag';

if (isFeatureEnabled('GRUPOS_ENABLED')) {
  console.log('Grupos está habilitado');
}
```

### `filterByFeatureFlag(items)`

Filtra un array de items basándose en sus feature flags.

```typescript
import { filterByFeatureFlag } from '@/config/features-flag';

const menuItems = [
  { label: 'Inicio', href: '/' },
  { label: 'Grupos', href: '/grupos', featureFlag: 'GRUPOS_ENABLED' },
  { label: 'Chat', href: '/chat', featureFlag: 'CHAT_ENABLED' },
];

const visibleItems = filterByFeatureFlag(menuItems);
// Solo devuelve items sin featureFlag o con featureFlag = true
```

## 📝 Notas

- Los items **sin** `featureFlag` se muestran **siempre**
- Los items **con** `featureFlag` se filtran según el valor en `FEATURE_FLAGS`
- Las secciones vacías (sin items visibles) se ocultan automáticamente
- Los cambios en feature flags **NO requieren rebuild**, solo reload de la página

## 🎨 Best Practices

1. **Nombra flags descriptivamente**: `FEATURE_ENABLED` no `FEATURE_FLAG`
2. **Documenta el estado**: Agrega comentarios sobre por qué está deshabilitado
3. **Mantén actualizado**: Elimina flags cuando la feature esté permanentemente activada
4. **Testing**: Prueba con flags en `true` y `false` antes de deployment

## 🐛 Troubleshooting

**Problema**: El item no se oculta
- Verifica que el `featureFlag` esté escrito correctamente
- Confirma que el valor en `FEATURE_FLAGS` sea `false`
- Limpia caché del navegador

**Problema**: Typescript error en `featureFlag`
- Asegúrate de hacer el cast: `featureFlag: 'GRUPOS_ENABLED' as FeatureFlag`
- Verifica que el flag exista en `FEATURE_FLAGS`

## 📞 Soporte

Si tienes dudas sobre feature flags, contacta al equipo de desarrollo.
