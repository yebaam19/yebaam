import Image from 'next/image';
import YebaamLogo from '@/images/brand/Yebaam-Logo.svg';
import { Diamond } from './CertificateIcons';

interface CertificateHeaderProps {
  fullName: string;
  username: string | null;
}

export default function CertificateHeader({ fullName, username }: CertificateHeaderProps) {
  return (
    <>
      {/* Header */}
      <header className="text-center">
        <div className="flex items-center justify-center">
          <Image src={YebaamLogo} alt="Yebaam" priority className="h-14 w-auto" />
        </div>
        <div className="mt-4 flex items-center justify-center gap-3 text-[11px] font-semibold uppercase tracking-[0.4em] text-[#0f3d2a]/80">
          <span className="h-px w-10 bg-[#c8a86a]" />
          Identidad Digital Certificada
          <span className="h-px w-10 bg-[#c8a86a]" />
        </div>
        <div className="mt-2 flex items-center justify-center">
          <Diamond />
        </div>
      </header>

      {/* Name */}
      <div className="mt-6 text-center">
        <h1 className="break-words text-[56px] font-bold leading-tight text-[#0f3d2a]">
          {fullName}
        </h1>
        {username && (
          <p className="mt-1 text-lg text-neutral-500">@{username}</p>
        )}
      </div>
    </>
  );
}
