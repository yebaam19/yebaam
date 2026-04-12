'use client';

import Image from 'next/image'
import Link from 'next/link'
import YebaamLogo from '@/images/brand/Yebaam-Logo.svg'

const NotFound = () => (
  <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center px-4">
    <div className="max-w-md w-full text-center space-y-8">
      {/* Logo de Yebaam */}
      <div className="flex justify-center">
        <Link href="/feed" className="inline-block">
          <Image 
            src={YebaamLogo} 
            alt="Yebaam" 
            width={180}
            height={60}
            className="dark:invert"
          />
        </Link>
      </div>

      {/* Número 404 estilizado */}
      <div className="space-y-4">
        <h1 className="text-8xl font-bold text-primary-600 dark:text-primary-500">
          404
        </h1>
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Página no encontrada
        </h2>
        <p className="text-base text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
          Lo sentimos, la página que estás buscando no existe o ha sido movida.
        </p>
      </div>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
        <Link href="/feed">
          <button className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors shadow-sm">
            Ir al inicio
          </button>
        </Link>
        <button 
          onClick={() => window.history.back()}
          className="w-full sm:w-auto px-6 py-3 text-sm font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
        >
          Volver atrás
        </button>
      </div>

      {/* Enlaces útiles */}
      <div className="pt-8 border-t border-neutral-200 dark:border-neutral-800">
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
          Enlaces útiles:
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link 
            href="/feed" 
            className="text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-medium"
          >
            Feed
          </Link>
          <Link 
            href="/messages" 
            className="text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-medium"
          >
            Mensajes
          </Link>
          <Link 
            href="/notifications" 
            className="text-primary-600 hover:text-primary-700 dark:text-primary-500 dark:hover:text-primary-400 font-medium"
          >
            Notificaciones
          </Link>
        </div>
      </div>
    </div>
  </div>
)

export default NotFound
