import React, { ReactNode } from 'react';
import Aside from '@/components/aside';

interface Props {
  children: ReactNode;
}

/**
 * Layout para la página de landing/login
 * No incluye Header para evitar confusión cuando el usuario no está autenticado
 */
export default function LandingLayout({ children }: Props) {
  return (
    <Aside.Provider>
      <main className="min-h-screen">
        {children}
      </main>
    </Aside.Provider>
  );
}
