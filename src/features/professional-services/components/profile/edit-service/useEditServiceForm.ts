'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FEATURE_FLAGS } from '@/config/features-flag';
import { useUpdateService } from '../../../hooks/useServices';
import { useUploadServiceImages } from '../../../hooks/useUploadServiceImages';
import type { UpdateServicePatchInput } from '../../../actions/service-action.helpers';
import type {
  PortfolioProject,
  ProfessionalService,
  UpdateProfessionalServiceDTO,
} from '../../../interfaces/professional-service.interfaces';
import type {
  EditServiceFields,
  EditServiceSetters,
  UseEditServiceForm,
} from './edit-service-form.types';

// Re-exported so the tab components keep importing these from `./useEditServiceForm`.
export type { EditServiceFields, EditServiceSetters, UseEditServiceForm };

/**
 * View-model for `EditServiceModal`. Owns the ~20 form-state pieces, the
 * four Cloudflare upload hooks, the submit pipeline, and the derived
 * `isBusy` flag the shell + footer buttons gate on. The return-contract types
 * live in `./edit-service-form.types`.
 *
 * Tabs read their slice off the returned object — the modal shell wires
 * everything together and chooses which tabs render.
 */
export function useEditServiceForm(
  service: ProfessionalService,
  onOpenChange: (open: boolean) => void,
): UseEditServiceForm {
  const t = useTranslations('professional.services.editModal');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateServiceMutation = useUpdateService();
  const coverUpload = useUploadServiceImages();
  const logoUpload = useUploadServiceImages();
  const adImageUpload = useUploadServiceImages();
  const cvUpload = useUploadServiceImages();

  // Basic
  const [name, setName] = useState(service.name);
  const [description, setDescription] = useState(service.description || '');
  const [tags, setTags] = useState(service.tags?.join(', ') || '');

  // Contact
  const [email, setEmail] = useState(service.email || '');
  const [phone, setPhone] = useState(service.phone || '');
  const [website, setWebsite] = useState(service.website || '');
  const [address, setAddress] = useState(service.address || '');

  // Social
  const [facebookUrl, setFacebookUrl] = useState(service.facebookUrl || '');
  const [instagramUrl, setInstagramUrl] = useState(service.instagramUrl || '');
  const [twitterUrl, setTwitterUrl] = useState(service.twitterUrl || '');
  const [linkedinUrl, setLinkedinUrl] = useState(service.linkedinUrl || '');
  const [youtubeUrl, setYoutubeUrl] = useState(service.youtubeUrl || '');
  const [tiktokUrl, setTiktokUrl] = useState(service.tiktokUrl || '');

  // Rates
  const [hourlyRate, setHourlyRate] = useState(service.hourlyRate?.toString() || '');
  const [dailyRate, setDailyRate] = useState(service.dailyRate?.toString() || '');
  const [projectRate, setProjectRate] = useState(service.projectRate?.toString() || '');
  const [currency, setCurrency] = useState(service.currency || 'USD');
  const [availableForHire, setAvailableForHire] = useState(service.availableForHire);
  const [workType, setWorkType] = useState<string[]>(service.workType || []);

  // Images
  const [logoUrl, setLogoUrl] = useState<string | null>(service.logoUrl || null);
  const [coverUrl, setCoverUrl] = useState<string | null>(
    service.coverImage || service.coverUrl || null,
  );
  const [adImageUrl, setAdImageUrl] = useState<string | null>(service.adImageUrl || null);
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);
  const [selectedAdImageFile, setSelectedAdImageFile] = useState<File | null>(null);

  // CV + portfolio (feature-flagged)
  const [cvUrl, setCvUrl] = useState<string | null>(service.cvUrl || null);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(
    service.portfolioProjects || [],
  );

  const onLogoSelect = useCallback((file: File) => setSelectedLogoFile(file), []);
  const onCoverSelect = useCallback((file: File) => setSelectedCoverFile(file), []);
  const onAdImageSelect = useCallback((file: File) => setSelectedAdImageFile(file), []);
  const onLogoUrlChange = useCallback((url: string) => {
    setLogoUrl(url);
    setSelectedLogoFile(null);
  }, []);
  const onCoverUrlChange = useCallback((url: string) => {
    setCoverUrl(url);
    setSelectedCoverFile(null);
  }, []);
  const onAdImageUrlChange = useCallback((url: string) => {
    setAdImageUrl(url);
    setSelectedAdImageFile(null);
  }, []);
  const onCvSelect = useCallback((file: File) => setSelectedCvFile(file), []);
  const onCvUrlChange = useCallback((url: string | null) => {
    setCvUrl(url);
    setSelectedCvFile(null);
  }, []);

  const toggleWorkType = useCallback((type: string) => {
    setWorkType((prev) =>
      prev.includes(type) ? prev.filter((tt) => tt !== type) : [...prev, type],
    );
  }, []);

  // NOTE: `saveSuccess` is returned in `status` but currently only ever set to
  // `false` — the mutation fires-and-forgets; success toast + cache invalidation
  // live in `useUpdateService`. Wiring a success/auto-close branch is a follow-up.

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setError(null);

    try {
      let uploadedLogoUrl = logoUrl;
      let uploadedCoverUrl = coverUrl;
      let uploadedAdImageUrl = adImageUrl;
      let uploadedCvUrl = cvUrl;
      let cvError: string | null = null;

      if (selectedLogoFile) {
        uploadedLogoUrl = await logoUpload.uploadImage(selectedLogoFile);
        setLogoUrl(uploadedLogoUrl);
      }
      if (selectedCoverFile) {
        uploadedCoverUrl = await coverUpload.uploadImage(selectedCoverFile);
        setCoverUrl(uploadedCoverUrl);
      }
      if (selectedAdImageFile) {
        uploadedAdImageUrl = await adImageUpload.uploadImage(selectedAdImageFile);
        setAdImageUrl(uploadedAdImageUrl);
      }
      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD && selectedCvFile) {
        // El CV se aísla del resto del guardado: hoy no existe ruta de subida
        // de documentos PDF (Cloudflare Images los rechaza), así que su fallo
        // solo marca este campo y deja que los demás cambios se guarden.
        try {
          uploadedCvUrl = await cvUpload.uploadImage(selectedCvFile);
          setCvUrl(uploadedCvUrl);
        } catch {
          cvError =
            'No se pudo subir el CV: la subida de documentos PDF aún no está disponible. El resto de los cambios sí se guardó.';
          uploadedCvUrl = cvUrl; // conserva el CV anterior; no tocamos cv_cf_file_id
        }
      }

      const updateData: UpdateServicePatchInput = {
        name,
        // Cadena vacía = limpieza explícita (el patch del servidor la persiste
        // como NULL). Este formulario edita el servicio completo, así que los
        // campos de texto siempre viajan.
        description,
        email,
        phone,
        website,
        address,
        facebookUrl,
        instagramUrl,
        twitterUrl,
        linkedinUrl,
        youtubeUrl,
        tiktokUrl,
        // `null` = limpiar la tarifa guardada (`undefined` significaría "no tocar").
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : null,
        dailyRate: dailyRate ? parseFloat(dailyRate) : null,
        projectRate: projectRate ? parseFloat(projectRate) : null,
        currency,
        availableForHire,
        workType,
        tags: tags.split(',').map((tt) => tt.trim()).filter(Boolean),
        // `?? undefined` (not `||`) so a cleared field ('') is sent through and
        // persisted as a removal; updateServiceAction maps '' → null.
        logoUrl: uploadedLogoUrl ?? undefined,
        coverUrl: uploadedCoverUrl ?? undefined,
        adImageUrl: uploadedAdImageUrl ?? undefined,
      };

      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD && !cvError) {
        updateData.cvUrl = uploadedCvUrl ?? undefined;
      }
      // NOTE: portfolioProjects no se envía — no existe la columna
      // `portfolio_projects` todavía; el tab está apagado vía
      // FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO hasta la migración.

      // El hook de mutación está tipado con el DTO base; el cast habilita los
      // `null` de limpieza de tarifas que `updateServiceAction` sí acepta
      // (UpdateServicePatchInput). Solo afecta tipos, no runtime.
      updateServiceMutation.mutate({
        id: service.id,
        data: updateData as UpdateProfessionalServiceDTO,
      });

      if (cvError) {
        // Mantener el modal abierto para que el fallo del CV sea visible.
        setError(cvError);
      } else {
        // Close the modal optimistically — the mutation hook handles toast +
        // cache invalidation. Preserves the original auto-close UX from before
        // the split.
        onOpenChange(false);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : t('uploadError');
      setError(message);
    }
  };

  const isPending = updateServiceMutation.isPending;
  const isBusy =
    isPending ||
    coverUpload.isUploading ||
    logoUpload.isUploading ||
    adImageUpload.isUploading ||
    cvUpload.isUploading;

  return {
    fields: {
      name,
      description,
      tags,
      email,
      phone,
      website,
      address,
      facebookUrl,
      instagramUrl,
      twitterUrl,
      linkedinUrl,
      youtubeUrl,
      tiktokUrl,
      hourlyRate,
      dailyRate,
      projectRate,
      currency,
      availableForHire,
      workType,
    },
    setters: {
      setName,
      setDescription,
      setTags,
      setEmail,
      setPhone,
      setWebsite,
      setAddress,
      setFacebookUrl,
      setInstagramUrl,
      setTwitterUrl,
      setLinkedinUrl,
      setYoutubeUrl,
      setTiktokUrl,
      setHourlyRate,
      setDailyRate,
      setProjectRate,
      setCurrency,
      setAvailableForHire,
    },
    images: {
      logoUrl,
      coverUrl,
      adImageUrl,
      onLogoSelect,
      onCoverSelect,
      onAdImageSelect,
      onLogoUrlChange,
      onCoverUrlChange,
      onAdImageUrlChange,
    },
    cv: { cvUrl, onCvSelect, onCvUrlChange },
    portfolio: { projects: portfolioProjects, setProjects: setPortfolioProjects },
    rates: { toggleWorkType },
    uploads: { cover: coverUpload, logo: logoUpload, adImage: adImageUpload, cv: cvUpload },
    status: { isBusy, isPending, saveSuccess, error },
    handleSubmit,
  };
}
