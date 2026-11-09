interface Props {
  readonly code: string;
}

export default function DownloadPdfButton({ code }: Props) {
  return (
    <a
      href={`/api/verification/certificate/${encodeURIComponent(code)}/pdf`}
      download={`yebaam-certificate-${code}.pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-md bg-[#c8a86a] px-5 py-2.5 text-sm font-semibold text-[#0f3d2a] shadow-lg transition hover:bg-[#b8975a] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c8a86a]"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4" aria-hidden>
        <path d="M12 3v12m0 0 4-4m-4 4-4-4" />
        <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      Descargar PDF
    </a>
  );
}
