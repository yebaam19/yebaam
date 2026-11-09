import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import DownloadPdfButton from '@/app/verification/certificate/[code]/DownloadPdfButton';

describe('certificate PDF download', () => {
  it('uses a native file link instead of a JavaScript blob download', () => {
    render(<DownloadPdfButton code="YBM-EXAMPLE" />);
    const link = screen.getByRole('link', { name: 'Descargar PDF' });
    expect(link).toHaveAttribute('href', '/api/verification/certificate/YBM-EXAMPLE/pdf');
    expect(link).toHaveAttribute('download', 'yebaam-certificate-YBM-EXAMPLE.pdf');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('encodes the certificate code as one URL segment', () => {
    render(<DownloadPdfButton code="YBM-A/B?x=1" />);
    expect(screen.getByRole('link', { name: 'Descargar PDF' }))
      .toHaveAttribute('href', '/api/verification/certificate/YBM-A%2FB%3Fx%3D1/pdf');
  });
});
