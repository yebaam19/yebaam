'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FEATURE_FLAGS } from '@/config/features-flag';
import { useUpdateService } from '../../../hooks/useServices';
import { useUploadServiceImages } from '../../../hooks/useUploadServiceImages';
import type {
  PortfolioProject,
  ProfessionalService,
  UpdateProfessionalServiceDTO,
} from '../../../interfaces/professional-service.interfaces';

/**
 * View-model for `EditServiceModal`. Owns the ~20 form-state pieces, the
 * three Cloudflare upload hooks, the submit pipeline, and the derived
 * `isBusy` flag the shell + footer buttons gate on.
 *
 * Tabs read their slice off the returned object — the modal shell wires
 * everything together and chooses which tabs render.
 */
export interface UseEditServiceForm {
  fields: EditServiceFields;
  setters: EditServiceSetters;
  images: ImageState;
  cv: CvState;
  portfolio: PortfolioState;
  rates: RatesHelpers;
  uploads: {
    cover: ReturnType<typeof useUploadServiceImages>;
    logo: ReturnType<typeof useUploadServiceImages>;
    cv: ReturnType<typeof useUploadServiceImages>;
  };
  status: {
    isBusy: boolean;
    isPending: boolean;
    saveSuccess: boolean;
    error: string | null;
  };
  handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export interface EditServiceFields {
  name: string;
  description: string;
  tags: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  hourlyRate: string;
  dailyRate: string;
  projectRate: string;
  currency: string;
  availableForHire: boolean;
  workType: string[];
}

export interface EditServiceSetters {
  setName: (v: string) => void;
  setDescription: (v: string) => void;
  setTags: (v: string) => void;
  setEmail: (v: string) => void;
  setPhone: (v: string) => void;
  setWebsite: (v: string) => void;
  setAddress: (v: string) => void;
  setFacebookUrl: (v: string) => void;
  setInstagramUrl: (v: string) => void;
  setTwitterUrl: (v: string) => void;
  setLinkedinUrl: (v: string) => void;
  setYoutubeUrl: (v: string) => void;
  setTiktokUrl: (v: string) => void;
  setHourlyRate: (v: string) => void;
  setDailyRate: (v: string) => void;
  setProjectRate: (v: string) => void;
  setCurrency: (v: string) => void;
  setAvailableForHire: (v: boolean) => void;
}

interface ImageState {
  logoUrl: string | null;
  coverUrl: string | null;
  onLogoSelect: (file: File) => void;
  onCoverSelect: (file: File) => void;
  onLogoUrlChange: (url: string) => void;
  onCoverUrlChange: (url: string) => void;
}

interface CvState {
  cvUrl: string | null;
  onCvSelect: (file: File) => void;
  onCvUrlChange: (url: string | null) => void;
}

interface PortfolioState {
  projects: PortfolioProject[];
  setProjects: (p: PortfolioProject[]) => void;
}

interface RatesHelpers {
  toggleWorkType: (type: string) => void;
}

export function useEditServiceForm(
  service: ProfessionalService,
  onOpenChange: (open: boolean) => void,
): UseEditServiceForm {
  const t = useTranslations('professional.services.editModal');
  const router = useRouter();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateServiceMutation = useUpdateService();
  const coverUpload = useUploadServiceImages();
  const logoUpload = useUploadServiceImages();
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
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null);
  const [selectedCoverFile, setSelectedCoverFile] = useState<File | null>(null);

  // CV + portfolio (feature-flagged)
  const [cvUrl, setCvUrl] = useState<string | null>(service.cvUrl || null);
  const [selectedCvFile, setSelectedCvFile] = useState<File | null>(null);
  const [portfolioProjects, setPortfolioProjects] = useState<PortfolioProject[]>(
    service.portfolioProjects || [],
  );

  const onLogoSelect = useCallback((file: File) => setSelectedLogoFile(file), []);
  const onCoverSelect = useCallback((file: File) => setSelectedCoverFile(file), []);
  const onLogoUrlChange = useCallback((url: string) => {
    setLogoUrl(url);
    setSelectedLogoFile(null);
  }, []);
  const onCoverUrlChange = useCallback((url: string) => {
    setCoverUrl(url);
    setSelectedCoverFile(null);
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

  // NOTE: the original modal defined `handleUpdateSuccess` / `handleUpdateError`
  // for the mutation but never wired them to React Query — they were silenced
  // with `void`. Preserving the same behavior here (mutation fires-and-forgets;
  // success toast/cache invalidation lives in `useUpdateService`). The local
  // `saveSuccess` + auto-close branch remain reachable via a dedicated wiring
  // in a follow-up — out of scope for this split.
  // Reserved for that follow-up:
  void setSaveSuccess;
  void router;
  void t;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);
    setError(null);

    try {
      let uploadedLogoUrl = logoUrl;
      let uploadedCoverUrl = coverUrl;
      let uploadedCvUrl = cvUrl;

      if (selectedLogoFile) {
        uploadedLogoUrl = await logoUpload.uploadImage(selectedLogoFile);
        setLogoUrl(uploadedLogoUrl);
      }
      if (selectedCoverFile) {
        uploadedCoverUrl = await coverUpload.uploadImage(selectedCoverFile);
        setCoverUrl(uploadedCoverUrl);
      }
      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD && selectedCvFile) {
        uploadedCvUrl = await cvUpload.uploadImage(selectedCvFile);
        setCvUrl(uploadedCvUrl);
      }

      const updateData: UpdateProfessionalServiceDTO = {
        name,
        description: description || undefined,
        email: email || undefined,
        phone: phone || undefined,
        website: website || undefined,
        address: address || undefined,
        facebookUrl: facebookUrl || undefined,
        instagramUrl: instagramUrl || undefined,
        twitterUrl: twitterUrl || undefined,
        linkedinUrl: linkedinUrl || undefined,
        youtubeUrl: youtubeUrl || undefined,
        tiktokUrl: tiktokUrl || undefined,
        hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
        dailyRate: dailyRate ? parseFloat(dailyRate) : undefined,
        projectRate: projectRate ? parseFloat(projectRate) : undefined,
        currency,
        availableForHire,
        workType,
        tags: tags ? tags.split(',').map((tt) => tt.trim()) : undefined,
        logoUrl: uploadedLogoUrl || undefined,
        coverUrl: uploadedCoverUrl || undefined,
      };

      if (FEATURE_FLAGS.SERVICES_CV_UPLOAD) {
        updateData.cvUrl = uploadedCvUrl || undefined;
      }
      if (FEATURE_FLAGS.SERVICES_PROJECTS_PORTFOLIO) {
        updateData.portfolioProjects =
          portfolioProjects.length > 0 ? portfolioProjects : undefined;
      }

      updateServiceMutation.mutate({ id: service.id, data: updateData });
      // Close the modal optimistically — the mutation hook handles toast +
      // cache invalidation. Preserves the original auto-close UX from before
      // the split.
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('uploadError');
      setError(message);
    }
  };

  const isPending = updateServiceMutation.isPending;
  const isBusy =
    isPending || coverUpload.isUploading || logoUpload.isUploading || cvUpload.isUploading;

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
      onLogoSelect,
      onCoverSelect,
      onLogoUrlChange,
      onCoverUrlChange,
    },
    cv: { cvUrl, onCvSelect, onCvUrlChange },
    portfolio: { projects: portfolioProjects, setProjects: setPortfolioProjects },
    rates: { toggleWorkType },
    uploads: { cover: coverUpload, logo: logoUpload, cv: cvUpload },
    status: { isBusy, isPending, saveSuccess, error },
    handleSubmit,
  };
}
