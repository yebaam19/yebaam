import Header from '@/components/Header/Header';
import 'rc-slider/assets/index.css';
import React, { ReactNode } from 'react';
import { ApplicationLayoutClient } from './application-layout-client';
import { getAuthUser } from '@/features/auth/actions/auth.actions';
import Aside from '@/components/aside';

interface Props {
  children: ReactNode;
  header?: ReactNode;
}

const ApplicationLayout: React.FC<Props> = async ({ children, header }) => {
  const user = await getAuthUser();
  

  // Si no hay usuario autenticado, envolver en AsideProvider para que Header funcione
  if (!user) {
    return (
      <Aside.Provider>
        {header || <Header />}
        <main className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
          {children}
        </main>
      </Aside.Provider>
    );
  }

  return (
    <ApplicationLayoutClient 
   
      user={user}
    >
      {children}
    </ApplicationLayoutClient>
  );
};

export { ApplicationLayout };
