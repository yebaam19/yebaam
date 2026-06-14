import type { FormEvent } from 'react';
import type { PortfolioProject } from '../../../interfaces/professional-service.interfaces';
import type { useUploadServiceImages } from '../../../hooks/useUploadServiceImages';

/**
 * Return-contract types for `useEditServiceForm`. Split out of the hook so the
 * implementation stays focused; the tab components read their slice via indexed
 * access (e.g. `UseEditServiceForm['fields']`). Re-exported from
 * `./useEditServiceForm` so existing import specifiers keep resolving.
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
  handleSubmit: (e: FormEvent) => Promise<void>;
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
