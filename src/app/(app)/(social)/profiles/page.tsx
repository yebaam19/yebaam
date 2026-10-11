import type { Metadata } from 'next';
import { ProfilesContent } from './components/ProfilesContent';

export const metadata: Metadata = {
    title: 'Perfiles y Espacios',
    description: 'Explora los diferentes tipos de espacios digitales que puedes crear en Yebaam: Clubs, Blogs, Perfil Profesional, Negocios y más.',
    keywords: [
        'perfiles',
        'espacios digitales',
        'clubs',
        'blogs',
        'negocios',
        'servicios profesionales',
        'comunidades',
        'yebaam',
    ],
    openGraph: {
        title: 'Perfiles y Espacios - Yebaam',
        description: 'Crea, comparte y conecta a través de diferentes espacios diseñados para ti',
        type: 'website',
    },
};

export default function ProfilesPage() {
    return <ProfilesContent />;
}
