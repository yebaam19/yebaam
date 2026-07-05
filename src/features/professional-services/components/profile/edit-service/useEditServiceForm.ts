'use client';

import { useCallback, useState } from 'react';
import { useTranslations } from 'next-intl';
import { FEATURE_FLAGS } from '@/config/features-flag';
import { uploadService } from '@/lib/service/upload.service';
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
 * three Cloudflare Images upload hooks + the R2 CV upload state, the submit
 * pipeline, and the derived `isBusy` flag the shell + footer buttons gate on.
 * The return-contract types live in `./edit-service-form.types`.
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
  // El CV es un PDF → va a R2 vía uploadService.uploadDocument, no por el hook
  // de Cloudflare Images. Estado local mínimo para la barra de progreso del tab.
  const [cvUploadState, setCvUploadState] = useState<{ isUploading: boolean; progress: number }>({
    isUploading: false,
    progress: 0,
  });

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
      // `undefined` = el CV no cambió (no viaja el campo); `''` = limpiar;
      // `cvs/AAAA/uuid.pdf` = clave R2 desnuda recién subida.
      let cvKeyPatch: string | undefined;
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
      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD) {
        if (selectedCvFile) {
          // El CV se aísla del resto del guardado: si su subida a R2 falla,
          // solo se marca este campo y los demás cambios sí se guardan.
          try {
            setCvUploadState({ isUploading: true, progress: 0 });
            const { key } = await uploadService.uploadDocument(selectedCvFile, (progress) =>
              setCvUploadState({ isUploading: true, progress }),
            );
            cvKeyPatch = key;
            setCvUploadState({ isUploading: false, progress: 100 });
          } catch (err) {
            setCvUploadState({ isUploading: false, progress: 0 });
            const detail = err instanceof Error && err.message ? ` ${err.message}` : '';
            cvError = `No se pudo subir el CV.${detail} El resto de los cambios sí se guardó.`;
          }
        } else if (cvUrl === null && service.cvUrl) {
          // El usuario quitó el CV existente → limpieza explícita ('' → NULL).
          cvKeyPatch = '';
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

      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD && !cvError && cvKeyPatch !== undefined) {
        // Solo viaja cuando el CV cambió: clave R2 desnuda o '' para limpiar.
        // Nunca se reenvía la URL firmada resuelta (pisaría cv_cf_file_id).
        updateData.cvKey = cvKeyPatch;
      }
      if (FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO) {
        // La columna `portfolio_projects` (jsonb) ya existe; el server action
        // la sanea (sanitizePortfolioProjects) antes de escribirla.
        updateData.portfolioProjects = portfolioProjects;
      }

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
    cvUploadState.isUploading;

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
    uploads: { cover: coverUpload, logo: logoUpload, adImage: adImageUpload, cv: cvUploadState },
    status: { isBusy, isPending, saveSuccess, error },
    handleSubmit,
  };
}
