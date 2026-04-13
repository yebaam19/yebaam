import {
    ShieldCheckIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    UserGroupIcon,
    BuildingStorefrontIcon,
    WrenchScrewdriverIcon,
    BuildingOffice2Icon,
    HeartIcon,
    UsersIcon,
} from '@/components/icons/heroicons-shim';
import type { ComponentType, SVGProps } from 'react';

/**
 * Interfaz para las características/tipos de perfiles
 */
export interface ProfileFeature {
    id: string;
    title: string;
    description: string;
    icon: ComponentType<SVGProps<SVGSVGElement>>;
    benefits: string[];
    href: string;
    bgColor: string;
    iconColor: string;
    buttonLabel: string;
    disabled: boolean;
}

/**
 * Configuración de todos los tipos de perfiles/espacios disponibles en Yebaam
 * 
 * Rutas actuales del proyecto:
 * - /feed/clubes - Clubs
 * - /feed/blogs - Blogs
 * - /feed/professional-profile - Perfil Profesional
 * - /feed/comunidades - Comunidades
 * - /feed/businesses - Negocios
 * - /feed/professional-services - Servicios Profesionales
 * - /feed/grupos - Grupos (similar a empresas)
 * - /feed/arbol-genealogico - Árbol genealógico (para familia)
 */
export const PROFILE_FEATURES: ProfileFeature[] = [
    {
        id: 'clubs',
        title: 'Clubs',
        description: 'Crea y gestiona comunidades basadas en intereses o afiliaciones compartidas.',
        icon: ShieldCheckIcon,
        benefits: [
            'Construye comunidades temáticas',
            'Organiza eventos y actividades',
            'Conecta con personas afines',
        ],
        href: '/feed/clubes',
        bgColor: 'bg-feature-clubs',
        iconColor: 'text-emerald-500',
        buttonLabel: 'Explorar Clubs',
        disabled: false,
    },
    {
        id: 'blogs',
        title: 'Blogs',
        description: 'Comparte conocimiento y experiencias en tu espacio personal de publicación.',
        icon: DocumentTextIcon,
        benefits: [
            'Publica artículos y contenido',
            'Construye una audiencia',
            'Comparte tu experiencia',
        ],
        href: '/feed/blogs',
        bgColor: 'bg-feature-blogs',
        iconColor: 'text-amber-500',
        buttonLabel: 'Explorar Blogs',
        disabled: false,
    },
    {
        id: 'professional-profile',
        title: 'Perfil Profesional',
        description: 'Destaca tus logros y experiencia profesional con un perfil verificado.',
        icon: BriefcaseIcon,
        benefits: [
            'Portafolio profesional',
            'Red de contactos laborales',
            'Oportunidades de carrera',
        ],
        href: '/feed/professional-profile',
        bgColor: 'bg-feature-professional',
        iconColor: 'text-amber-500',
        buttonLabel: 'Editar Perfil',
        disabled: false,
    },
    {
        id: 'communities',
        title: 'Comunidades',
        description: 'Únete a grandes comunidades regionales y temáticas para conectar a mayor escala.',
        icon: UserGroupIcon,
        benefits: [
            'Acceso a comunidades masivas',
            'Networking a gran escala',
            'Eventos regionales y nacionales',
        ],
        href: '/feed/comunidades',
        bgColor: 'bg-feature-communities',
        iconColor: 'text-red-500',
        buttonLabel: 'Próximamente',
        disabled: true,
    },
    {
        id: 'businesses',
        title: 'Negocios',
        description: 'Crea y promociona tu negocio con herramientas de gestión y marketing digital.',
        icon: BuildingStorefrontIcon,
        benefits: [
            'Escaparate digital completo',
            'Herramientas de marketing',
            'Gestión de clientes',
        ],
        href: '/feed/businesses',
        bgColor: 'bg-feature-businesses',
        iconColor: 'text-orange-500',
        buttonLabel: 'Explorar Negocios',
        disabled: false,
    },
    {
        id: 'professional-services',
        title: 'Servicios Profesionales',
        description: 'Ofrece tus servicios profesionales y conecta con potenciales clientes.',
        icon: WrenchScrewdriverIcon,
        benefits: [
            'Catálogo de servicios',
            'Sistema de citas y reservas',
            'Reseñas y calificaciones',
        ],
        href: '/feed/professional-services',
        bgColor: 'bg-feature-services',
        iconColor: 'text-teal-500',
        buttonLabel: 'Editar Servicios',
        disabled: false,
    },
    {
        id: 'companies',
        title: 'Empresas',
        description: 'Espacio corporativo para empresas con múltiples colaboradores y proyectos.',
        icon: BuildingOffice2Icon,
        benefits: [
            'Perfil corporativo completo',
            'Gestión de equipos',
            'Proyectos colaborativos',
        ],
        href: '/feed/grupos',
        bgColor: 'bg-feature-companies',
        iconColor: 'text-lime-500',
        buttonLabel: 'Próximamente',
        disabled: true,
    },
    {
        id: 'associations',
        title: 'Asociaciones',
        description: 'Plataforma para organizaciones sin fines de lucro y asociaciones civiles.',
        icon: HeartIcon,
        benefits: [
            'Gestión de miembros',
            'Organización de eventos benéficos',
            'Transparencia en donaciones',
        ],
        href: '#',
        bgColor: 'bg-feature-associations',
        iconColor: 'text-green-500',
        buttonLabel: 'Próximamente',
        disabled: true,
    },
    {
        id: 'family',
        title: 'Grupo Familiar',
        description: 'Espacio privado para familias donde compartir momentos, eventos y tradiciones.',
        icon: UsersIcon,
        benefits: [
            'Álbum familiar privado',
            'Calendario de eventos familiares',
            'Árbol genealógico interactivo',
        ],
        href: '/feed/arbol-genealogico',
        bgColor: 'bg-feature-family',
        iconColor: 'text-yellow-500',
        buttonLabel: 'Explorar Familia',
        disabled: false,
    },
];
