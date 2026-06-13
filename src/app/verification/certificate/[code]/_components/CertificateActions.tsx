import DownloadPdfButton from '../DownloadPdfButton';
import PrintButton from '../PrintButton';

interface CertificateActionsProps {
  code: string;
}

// Download / Print CTAs — outside the framed certificate so they don't print/export.
export default function CertificateActions({ code }: CertificateActionsProps) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
      <DownloadPdfButton code={code} />
      <PrintButton />
    </div>
  );
}
