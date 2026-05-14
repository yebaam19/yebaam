import Link from 'next/link';
import type { Metadata, Route } from 'next';

export const metadata: Metadata = {
  title: 'Acerca del Club de Coleccionistas',
  description:
    'El Club de Coleccionistas de Yebaam tiene finalidad exclusivamente informativa e histórica. No tenemos ánimo de lucro.',
};

export default function AcercaPage() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <nav className="text-xs">
        <Link
          href={'/musica' as Route}
          className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Archivo Musical
        </Link>
      </nav>

      <header className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
          Acerca del Club
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          Club de Coleccionistas
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400">
          Un archivo vivo de la música latinoamericana del siglo XX, hecho por y para
          coleccionistas.
        </p>
      </header>

      <section className="space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Finalidad informativa e histórica
        </h2>
        <p>
          Los discos, fichas técnicas, fotografías y artículos aquí publicados tienen una
          finalidad <strong>exclusivamente informativa, educativa e histórica</strong>. El
          objetivo es preservar y compartir la memoria sonora de Latinoamérica entre
          coleccionistas, melómanos, investigadores y curiosos.
        </p>
        <p>
          Este archivo <strong>no tiene ánimo de lucro</strong>. Yebaam no cobra por
          consultar, escuchar o descargar el contenido del Club de Coleccionistas, y no
          monetiza este módulo con publicidad ni con suscripciones.
        </p>
      </section>

      <section className="space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Derechos y retirada de contenido
        </h2>
        <p>
          Los discos catalogados pertenecen a sus titulares de derechos. La gran mayoría
          son grabaciones de las décadas de 1900 a 1970, muchas en dominio público en sus
          países de origen u obras huérfanas con titular desconocido. Cuando se conoce al
          titular, se indica en la ficha.
        </p>
        <p>
          Si eres titular de derechos de una obra y quieres que la retiremos del archivo,
          contáctanos y la quitaremos sin demora.
        </p>
      </section>

      <section className="space-y-4 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Cómo colaborar
        </h2>
        <p>
          Si tienes una digitalización de un disco antiguo, una historia sobre un sello
          discográfico, o quieres escribir un artículo sobre un artista, puedes hacerlo
          desde la sección «Artículos» de cualquier club temático. Lo que publiques quedará
          enlazado automáticamente a las páginas de artistas y sellos que etiquetes.
        </p>
      </section>
    </div>
  );
}
