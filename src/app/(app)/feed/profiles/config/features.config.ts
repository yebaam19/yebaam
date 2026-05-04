import {
    ShieldCheckIcon,
    DocumentTextIcon,
    BriefcaseIcon,
    UserGroupIcon,
    BuildingOffice2Icon,
    CakeIcon,
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
    /**
     * When the destination lives outside this app (a separate Vercel project /
     * subdomain like `food.yebaam.com`), set `external: true` so the card
     * renders as a plain `<a>` with the absolute `href`. Otherwise the card
     * uses `next/link` for client-side navigation within this app.
     */
    external?: boolean;
    bgColor: string;
    iconColor: string;
    buttonLabel: string;
    disabled: boolean;
}

/**
 * Configuración de tipos de perfiles/espacios disponibles en Yebaam.
 * Sólo se listan secciones cuya página real ya está activa.
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
        href: '/feed/clubs',
        bgColor: 'bg-primary-600',
        iconColor: 'text-primary-600',
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
        bgColor: 'bg-secondary-500',
        iconColor: 'text-secondary-600',
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
        bgColor: 'bg-primary-700',
        iconColor: 'text-primary-700',
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
        bgColor: 'bg-secondary-700',
        iconColor: 'text-secondary-700',
        buttonLabel: 'Explorar Comunidades',
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
        bgColor: 'bg-primary-800',
        iconColor: 'text-primary-800',
        buttonLabel: 'Explorar Empresas',
        disabled: false,
    },
    {
        id: 'food',
        title: 'Food',
        description: 'Explora y comparte la mejor gastronomía: restaurantes, recetas y experiencias culinarias.',
        icon: CakeIcon,
        benefits: [
            'Descubre restaurantes locales',
            'Comparte recetas y reseñas',
            'Conecta con foodies y chefs',
        ],
        href: 'http://food.yebaam.com/?fbclid=IwY2xjawRk9YVleHRuA2FlbQIxMABicmlkETFGOThUMHJEcEpLUjNlSlRRc3J0YwZhcHBfaWQQMjIyMDM5MTc4ODIwMDg5MgABHqaDv09UQU7l43k9NGfHzgQtyEl-9GMczTX4bbl8SQ54bvLzpXvnegcacxqB_aem_gLe6_akUqnvd2jSKiom8dg',
        external: true,
        bgColor: 'bg-amber-500',
        iconColor: 'text-amber-600',
        buttonLabel: 'Explorar Food',
        disabled: false,
    },
];
