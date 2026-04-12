/**
 * Article Feature - Mock Data
 *
 * Provides mock data for articles, authors, and related entities
 * Used for development until backend endpoints are available
 */

import {
  Article,
  ArticleAuthor,
  ArticleBasic,
  ArticleComment,
  ArticleContext,
  ArticleContextType,
  ArticleVisibility,
  MediaType,
} from '../interfaces'

// ============================================================================
// MOCK AUTHORS
// ============================================================================

export const MOCK_AUTHORS: ArticleAuthor[] = [
  {
    id: 'user-1',
    username: 'carlos_martinez',
    displayName: 'Carlos Martínez',
    avatarUrl: 'https://picsum.photos/seed/author1/200/200',
    isVerified: true,
  },
  {
    id: 'user-2',
    username: 'maria_lopez',
    displayName: 'María López',
    avatarUrl: 'https://picsum.photos/seed/author2/200/200',
    isVerified: true,
  },
  {
    id: 'user-3',
    username: 'andres_garcia',
    displayName: 'Andrés García',
    avatarUrl: 'https://picsum.photos/seed/author3/200/200',
    isVerified: false,
  },
  {
    id: 'user-4',
    username: 'valentina_restrepo',
    displayName: 'Valentina Restrepo',
    avatarUrl: 'https://picsum.photos/seed/author4/200/200',
    isVerified: true,
  },
  {
    id: 'user-5',
    username: 'santiago_mendoza',
    displayName: 'Santiago Mendoza',
    avatarUrl: 'https://picsum.photos/seed/author5/200/200',
    isVerified: false,
  },
]

// ============================================================================
// MOCK ARTICLES
// ============================================================================

export const MOCK_ARTICLES: Article[] = [
  {
    id: 'article-1',
    title: 'Guía Completa de Next.js 15: Novedades y Mejores Prácticas',
    subtitle: 'Descubre las nuevas características del framework más popular de React',
    headerImageUrl: 'https://picsum.photos/seed/article1/1200/600',
    content: `
      <h2>Introducción</h2>
      <p>Next.js 15 ha llegado con una serie de mejoras significativas que transforman la manera en que desarrollamos aplicaciones web. En este artículo, exploraremos todas las novedades y cómo aprovecharlas al máximo.</p>
      
      <h2>Nuevas Características</h2>
      <p>Entre las características más destacadas encontramos:</p>
      <ul>
        <li><strong>Turbopack estable:</strong> El nuevo bundler que promete compilaciones hasta 700 veces más rápidas.</li>
        <li><strong>Server Actions mejorados:</strong> Mayor flexibilidad para manejar formularios y mutaciones de datos.</li>
        <li><strong>Partial Prerendering:</strong> Una revolución en la renderización híbrida.</li>
      </ul>
      
      <h2>Mejoras de Rendimiento</h2>
      <p>El equipo de Vercel ha trabajado incansablemente para optimizar cada aspecto del framework. Los tiempos de compilación se han reducido drásticamente y la experiencia de desarrollo es más fluida que nunca.</p>
      
      <blockquote>
        "Next.js 15 representa el futuro del desarrollo web con React" - Guillermo Rauch, CEO de Vercel
      </blockquote>
      
      <h2>Conclusión</h2>
      <p>Si aún no has actualizado a Next.js 15, este es el momento perfecto para hacerlo. Las mejoras en rendimiento y las nuevas características justifican completamente la migración.</p>
    `,
    summary:
      'Explora las nuevas características de Next.js 15 incluyendo Turbopack, Server Actions mejorados y Partial Prerendering.',
    authorId: 'user-1',
    contextType: ArticleContextType.USER_PROFILE,
    contextId: null,
    visibility: ArticleVisibility.PUBLIC,
    slug: 'guia-completa-nextjs-15-novedades-mejores-practicas',
    readTime: 8,
    tags: ['nextjs', 'react', 'web development', 'javascript'],
    createdAt: new Date('2024-12-01T10:00:00Z'),
    updatedAt: new Date('2024-12-01T10:00:00Z'),
    publishedAt: new Date('2024-12-01T10:00:00Z'),
    author: MOCK_AUTHORS[0],
    media: [
      {
        id: 'media-1-1',
        articleId: 'article-1',
        type: MediaType.IMAGE,
        url: 'https://picsum.photos/seed/media1/800/600',
        caption: 'Dashboard de Next.js',
        order: 0,
        createdAt: new Date('2024-12-01T10:00:00Z'),
      },
    ],
    likes: [
      { userId: 'user-2', articleId: 'article-1', createdAt: new Date('2024-12-01T12:00:00Z') },
      { userId: 'user-3', articleId: 'article-1', createdAt: new Date('2024-12-01T14:00:00Z') },
    ],
    bookmarks: [
      { id: 'bookmark-1', userId: 'user-2', articleId: 'article-1', createdAt: new Date('2024-12-01T12:30:00Z') },
    ],
    _count: {
      likes: 156,
      comments: 42,
      views: 2340,
    },
  },
  {
    id: 'article-2',
    title: 'Clean Architecture en Proyectos Frontend: Una Guía Práctica',
    subtitle: 'Cómo estructurar tu código para máxima escalabilidad y mantenibilidad',
    headerImageUrl: 'https://picsum.photos/seed/article2/1200/600',
    content: `
      <h2>¿Qué es Clean Architecture?</h2>
      <p>Clean Architecture es un patrón de diseño de software propuesto por Robert C. Martin (Uncle Bob) que promueve la separación de responsabilidades en capas bien definidas.</p>
      
      <h2>Capas de la Arquitectura</h2>
      <p>Las principales capas que debemos considerar son:</p>
      <ol>
        <li><strong>Entidades:</strong> Representan las reglas de negocio más generales.</li>
        <li><strong>Casos de Uso:</strong> Contienen la lógica de aplicación específica.</li>
        <li><strong>Adaptadores de Interface:</strong> Convierten datos entre capas.</li>
        <li><strong>Frameworks & Drivers:</strong> Detalles externos como UI y bases de datos.</li>
      </ol>
      
      <h2>Implementación en React</h2>
      <p>En proyectos React, podemos aplicar estos principios organizando nuestro código en features, cada una con sus propias interfaces, servicios y componentes.</p>
      
      <pre><code>
src/
  features/
    user/
      interfaces/
      services/
      components/
      hooks/
      </code></pre>
      
      <h2>Beneficios</h2>
      <p>Adoptar Clean Architecture nos permite:</p>
      <ul>
        <li>Código más testeable y mantenible</li>
        <li>Independencia de frameworks</li>
        <li>Facilidad para escalar el proyecto</li>
        <li>Mejor colaboración en equipos grandes</li>
      </ul>
    `,
    summary:
      'Aprende a implementar Clean Architecture en tus proyectos frontend para lograr código más escalable y mantenible.',
    authorId: 'user-2',
    contextType: ArticleContextType.PROFESSIONAL,
    contextId: 'prof-1',
    visibility: ArticleVisibility.PUBLIC,
    slug: 'clean-architecture-proyectos-frontend-guia-practica',
    readTime: 12,
    tags: ['architecture', 'clean code', 'frontend', 'react'],
    createdAt: new Date('2024-11-28T08:00:00Z'),
    updatedAt: new Date('2024-11-28T08:00:00Z'),
    publishedAt: new Date('2024-11-28T08:00:00Z'),
    author: MOCK_AUTHORS[1],
    media: [],
    likes: [{ userId: 'user-1', articleId: 'article-2', createdAt: new Date('2024-11-28T10:00:00Z') }],
    bookmarks: [],
    _count: {
      likes: 234,
      comments: 67,
      views: 4521,
    },
  },
  {
    id: 'article-3',
    title: 'TypeScript Avanzado: Patrones que Todo Desarrollador Debe Conocer',
    subtitle: 'Domina los tipos genéricos, utilidades y patrones de diseño en TypeScript',
    headerImageUrl: 'https://picsum.photos/seed/article3/1200/600',
    content: `
      <h2>Más Allá de los Tipos Básicos</h2>
      <p>TypeScript ofrece un sistema de tipos increíblemente poderoso que va mucho más allá de string, number y boolean. En este artículo exploraremos técnicas avanzadas que elevarán tu código.</p>
      
      <h2>Tipos Genéricos</h2>
      <p>Los genéricos nos permiten crear componentes reutilizables que funcionan con múltiples tipos:</p>
      
      <pre><code>
function identity&lt;T&gt;(arg: T): T {
  return arg;
}

const result = identity&lt;string&gt;("hello");
      </code></pre>
      
      <h2>Utility Types</h2>
      <p>TypeScript incluye tipos de utilidad que facilitan transformaciones comunes:</p>
      <ul>
        <li><code>Partial&lt;T&gt;</code> - Hace todas las propiedades opcionales</li>
        <li><code>Required&lt;T&gt;</code> - Hace todas las propiedades requeridas</li>
        <li><code>Pick&lt;T, K&gt;</code> - Selecciona propiedades específicas</li>
        <li><code>Omit&lt;T, K&gt;</code> - Excluye propiedades específicas</li>
      </ul>
      
      <h2>Template Literal Types</h2>
      <p>Una característica poderosa para crear tipos de string dinámicos:</p>
      
      <pre><code>
type EventName = \`on\${Capitalize&lt;string&gt;}\`;
// "onClick", "onChange", etc.
      </code></pre>
    `,
    summary: 'Aprende patrones avanzados de TypeScript incluyendo genéricos, utility types y template literal types.',
    authorId: 'user-3',
    contextType: ArticleContextType.BLOG,
    contextId: 'blog-1',
    visibility: ArticleVisibility.PUBLIC,
    slug: 'typescript-avanzado-patrones-desarrollador-conocer',
    readTime: 15,
    tags: ['typescript', 'javascript', 'programming', 'types'],
    createdAt: new Date('2024-11-25T14:30:00Z'),
    updatedAt: new Date('2024-11-25T14:30:00Z'),
    publishedAt: new Date('2024-11-25T14:30:00Z'),
    author: MOCK_AUTHORS[2],
    media: [
      {
        id: 'media-3-1',
        articleId: 'article-3',
        type: MediaType.IMAGE,
        url: 'https://picsum.photos/seed/media3/800/600',
        caption: 'TypeScript logo',
        order: 0,
        createdAt: new Date('2024-11-25T14:30:00Z'),
      },
    ],
    likes: [],
    bookmarks: [],
    _count: {
      likes: 189,
      comments: 34,
      views: 3210,
    },
  },
  {
    id: 'article-4',
    title: 'Diseño de APIs REST: Principios y Buenas Prácticas',
    subtitle: 'Construye APIs robustas, escalables y fáciles de consumir',
    headerImageUrl: 'https://picsum.photos/seed/article4/1200/600',
    content: `
      <h2>Fundamentos de REST</h2>
      <p>REST (Representational State Transfer) es un estilo arquitectónico que define un conjunto de restricciones para crear servicios web escalables.</p>
      
      <h2>Principios Fundamentales</h2>
      <ul>
        <li><strong>Stateless:</strong> Cada petición debe contener toda la información necesaria.</li>
        <li><strong>Uniform Interface:</strong> Usa métodos HTTP de forma consistente.</li>
        <li><strong>Layered System:</strong> Arquitectura en capas para escalabilidad.</li>
        <li><strong>Cacheable:</strong> Las respuestas deben indicar si pueden ser cacheadas.</li>
      </ul>
      
      <h2>Nomenclatura de Endpoints</h2>
      <p>Usa sustantivos en plural y mantén la consistencia:</p>
      <pre><code>
GET    /api/users          # Lista usuarios
GET    /api/users/:id      # Obtiene un usuario
POST   /api/users          # Crea un usuario
PUT    /api/users/:id      # Actualiza un usuario
DELETE /api/users/:id      # Elimina un usuario
      </code></pre>
      
      <h2>Códigos de Estado HTTP</h2>
      <p>Usa los códigos de estado apropiados:</p>
      <ul>
        <li><code>200</code> - OK</li>
        <li><code>201</code> - Created</li>
        <li><code>400</code> - Bad Request</li>
        <li><code>401</code> - Unauthorized</li>
        <li><code>404</code> - Not Found</li>
        <li><code>500</code> - Internal Server Error</li>
      </ul>
    `,
    summary:
      'Guía completa sobre diseño de APIs REST con principios y buenas prácticas para construir servicios robustos.',
    authorId: 'user-4',
    contextType: ArticleContextType.USER_PROFILE,
    contextId: null,
    visibility: ArticleVisibility.PUBLIC,
    slug: 'diseno-apis-rest-principios-buenas-practicas',
    readTime: 10,
    tags: ['api', 'rest', 'backend', 'web development'],
    createdAt: new Date('2024-11-20T09:15:00Z'),
    updatedAt: new Date('2024-11-20T09:15:00Z'),
    publishedAt: new Date('2024-11-20T09:15:00Z'),
    author: MOCK_AUTHORS[3],
    media: [],
    likes: [
      { userId: 'user-1', articleId: 'article-4', createdAt: new Date('2024-11-20T11:00:00Z') },
      { userId: 'user-2', articleId: 'article-4', createdAt: new Date('2024-11-20T12:00:00Z') },
      { userId: 'user-3', articleId: 'article-4', createdAt: new Date('2024-11-20T13:00:00Z') },
    ],
    bookmarks: [
      { id: 'bookmark-4', userId: 'user-1', articleId: 'article-4', createdAt: new Date('2024-11-20T11:30:00Z') },
      { id: 'bookmark-5', userId: 'user-3', articleId: 'article-4', createdAt: new Date('2024-11-20T13:30:00Z') },
    ],
    _count: {
      likes: 312,
      comments: 89,
      views: 5678,
    },
  },
  {
    id: 'article-5',
    title: 'Estado Global en React: Zustand vs Redux Toolkit',
    subtitle: 'Comparativa completa de las dos librerías más populares para manejo de estado',
    headerImageUrl: 'https://picsum.photos/seed/article5/1200/600',
    content: `
      <h2>La Evolución del Estado en React</h2>
      <p>El manejo de estado ha evolucionado significativamente desde los primeros días de React. Hoy tenemos opciones más simples y potentes que nunca.</p>
      
      <h2>Redux Toolkit</h2>
      <p>Redux Toolkit simplifica la configuración de Redux con:</p>
      <ul>
        <li>createSlice para reducers más concisos</li>
        <li>createAsyncThunk para operaciones asíncronas</li>
        <li>RTK Query para fetching de datos</li>
      </ul>
      
      <h2>Zustand</h2>
      <p>Zustand ofrece una API minimalista y flexible:</p>
      <pre><code>
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}))
      </code></pre>
      
      <h2>¿Cuál Elegir?</h2>
      <p>La elección depende de tu proyecto:</p>
      <ul>
        <li><strong>Redux Toolkit:</strong> Ideal para proyectos grandes con lógica compleja</li>
        <li><strong>Zustand:</strong> Perfecto para proyectos medianos con necesidad de simplicidad</li>
      </ul>
    `,
    summary:
      'Análisis comparativo entre Zustand y Redux Toolkit para ayudarte a elegir la mejor opción para tu proyecto.',
    authorId: 'user-5',
    contextType: ArticleContextType.CLUB,
    contextId: 'club-1',
    visibility: ArticleVisibility.PUBLIC,
    slug: 'estado-global-react-zustand-vs-redux-toolkit',
    readTime: 7,
    tags: ['react', 'state management', 'zustand', 'redux'],
    createdAt: new Date('2024-11-15T16:45:00Z'),
    updatedAt: new Date('2024-11-15T16:45:00Z'),
    publishedAt: new Date('2024-11-15T16:45:00Z'),
    author: MOCK_AUTHORS[4],
    media: [],
    likes: [],
    bookmarks: [],
    _count: {
      likes: 98,
      comments: 23,
      views: 1890,
    },
  },
]

// ============================================================================
// MOCK COMMENTS
// ============================================================================

export const MOCK_COMMENTS: ArticleComment[] = [
  {
    id: 'comment-1',
    content: '¡Excelente artículo! Muy bien explicado todo sobre Next.js 15.',
    userId: 'user-2',
    articleId: 'article-1',
    parentId: null,
    createdAt: new Date('2024-12-01T12:00:00Z'),
    updatedAt: new Date('2024-12-01T12:00:00Z'),
    user: MOCK_AUTHORS[1],
    _count: { likes: 12, replies: 2 },
  },
  {
    id: 'comment-2',
    content: 'Gracias por el artículo. ¿Podrías hacer uno sobre migración desde Next.js 14?',
    userId: 'user-3',
    articleId: 'article-1',
    parentId: null,
    createdAt: new Date('2024-12-01T14:30:00Z'),
    updatedAt: new Date('2024-12-01T14:30:00Z'),
    user: MOCK_AUTHORS[2],
    _count: { likes: 5, replies: 1 },
  },
  {
    id: 'comment-3',
    content: 'Clean Architecture ha transformado la forma en que estructuro mis proyectos. Muy recomendado.',
    userId: 'user-4',
    articleId: 'article-2',
    parentId: null,
    createdAt: new Date('2024-11-28T11:00:00Z'),
    updatedAt: new Date('2024-11-28T11:00:00Z'),
    user: MOCK_AUTHORS[3],
    _count: { likes: 23, replies: 0 },
  },
]

// ============================================================================
// MOCK CONTEXTS
// ============================================================================

export const MOCK_ARTICLE_CONTEXTS: ArticleContext[] = [
  {
    type: ArticleContextType.USER_PROFILE,
    id: null,
    name: 'Artículo individual',
    description: 'Publicar en tu perfil personal',
  },
  {
    type: ArticleContextType.PROFESSIONAL,
    id: 'prof-1',
    name: 'Perfil Profesional',
    description: 'Publicar en tu perfil profesional',
  },
  {
    type: ArticleContextType.BLOG,
    id: 'blog-1',
    name: 'Tech Insights',
    description: 'Blog sobre tecnología y desarrollo',
  },
  {
    type: ArticleContextType.BLOG,
    id: 'blog-2',
    name: 'Desarrollo Web',
    description: 'Artículos sobre desarrollo web moderno',
  },
  {
    type: ArticleContextType.CLUB,
    id: 'club-1',
    name: 'React Colombia',
    description: 'Comunidad de desarrolladores React',
  },
]

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export const getMockArticleById = (id: string): Article | undefined =>
  MOCK_ARTICLES.find((article) => article.id === id)

export const getMockArticleBySlug = (slug: string): Article | undefined =>
  MOCK_ARTICLES.find((article) => article.slug === slug)

export const getMockArticlesByAuthor = (authorId: string): Article[] =>
  MOCK_ARTICLES.filter((article) => article.authorId === authorId)

export const getMockArticlesByContext = (contextType: ArticleContextType, contextId?: string | null): Article[] =>
  MOCK_ARTICLES.filter(
    (article) => article.contextType === contextType && (contextId ? article.contextId === contextId : true)
  )

export const getMockCommentsByArticle = (articleId: string): ArticleComment[] =>
  MOCK_COMMENTS.filter((comment) => comment.articleId === articleId)

export const getMockArticleBasicList = (): ArticleBasic[] =>
  MOCK_ARTICLES.map((article) => ({
    id: article.id,
    title: article.title,
    subtitle: article.subtitle,
    headerImageUrl: article.headerImageUrl,
    summary: article.summary,
    slug: article.slug,
    readTime: article.readTime,
    createdAt: article.createdAt,
    publishedAt: article.publishedAt,
    author: article.author,
    tags: article.tags,
    _count: article._count,
  }))
