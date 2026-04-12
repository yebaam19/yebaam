/**
 * Datos de las secciones del Portal de la Salsa
 * 
 * Configuración de las secciones temáticas que aparecen en el portal
 */

import { PortalSection } from '../interfaces';

/**
 * Secciones del Portal de la Salsa de Cali
 */
export const salsaSections: PortalSection[] = [
    {
        id: 'historia',
        label: 'Historia de la Salsa en Cali',
        icon: 'GlobeAltIcon',
        color: '#f59e0b', // amber
        description:
            'Descubre cómo Cali se convirtió en la capital mundial de la salsa y su evolución a través de las décadas.',
    },
    {
        id: 'iconos',
        label: 'Iconos de la Salsa en Cali',
        icon: 'UserGroupIcon',
        color: '#16A44C', // green
        description:
            'Conoce a los bailarines, músicos y personalidades que han marcado la historia salsera de la ciudad.',
    },
    {
        id: 'lugares',
        label: 'Lugares para Visitar',
        icon: 'MapPinIcon',
        color: '#16A44C', // green
        description:
            'Explora los sitios emblemáticos donde la salsa cobra vida: monumentos, parques y lugares históricos.',
    },
    {
        id: 'escuelas',
        label: 'Escuelas de Música y Baile',
        icon: 'AcademicCapIcon',
        color: '#f59e0b', // amber
        description:
            'Aprende a bailar salsa en las mejores academias y escuelas de la ciudad con maestros reconocidos.',
    },
    {
        id: 'orquestas',
        label: 'Orquestas y Cantantes de Salsa',
        icon: 'MusicalNoteIcon',
        color: '#f59e0b', // amber
        description:
            'Las agrupaciones y voces que mantienen viva la tradición musical de la salsa caleña.',
    },
    {
        id: 'discotecas',
        label: 'Discotecas y Tabernas de Salsa',
        icon: 'BuildingStorefrontIcon',
        color: '#16A44C', // green
        description:
            'Los mejores lugares para bailar salsa hasta el amanecer: desde tabernas tradicionales hasta discotecas modernas.',
    },
];
