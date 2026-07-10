import type { Page, PageCategory, PageContact, UpdatePageDto } from '../../../types/page.types';
import { SOCIAL_NETWORKS, type SocialKey } from './social-networks';

/**
 * Flat, controlled-input shape for the "Información general" settings form.
 * Kept flat (street/city/country + per-network social) so each <input> binds to
 * one primitive; `buildUpdateDto` re-nests it into the `contact` jsonb on save.
 */
export interface GeneralFormData {
  name: string;
  username: string;
  description: string;
  category: string;
  subcategory: string;
  email: string;
  phone: string;
  website: string;
  street: string;
  city: string;
  country: string;
  social: Record<SocialKey, string>;
}

function emptySocial(): Record<SocialKey, string> {
  return SOCIAL_NETWORKS.reduce(
    (acc, n) => ({ ...acc, [n.key]: '' }),
    {} as Record<SocialKey, string>
  );
}

export function formDataFromPage(page: Page): GeneralFormData {
  const contact = page.contact ?? {};
  const address = contact.address ?? {};
  const social = { ...emptySocial() };
  for (const n of SOCIAL_NETWORKS) {
    social[n.key] = contact.social?.[n.key] ?? '';
  }
  return {
    name: page.name,
    username: page.slug,
    description: page.description || '',
    category: page.category,
    subcategory: page.subcategory || '',
    email: contact.email || '',
    phone: contact.phone || '',
    website: contact.website || '',
    street: address.street || '',
    city: address.city || '',
    country: address.country || '',
    social,
  };
}

/**
 * Re-nests the flat form back into an `UpdatePageDto`. Preserves any address
 * sub-fields the form does not edit (state/zipCode) and drops empty social
 * entries so we never persist blank keys. `username`/`slug` is intentionally
 * omitted — the PUT handler does not accept slug changes.
 */
export function buildUpdateDto(form: GeneralFormData, page: Page): UpdatePageDto {
  const prevAddress = page.contact?.address ?? {};

  const social: Record<string, string> = {};
  for (const n of SOCIAL_NETWORKS) {
    const value = form.social[n.key]?.trim();
    if (value) social[n.key] = value;
  }

  const contact: PageContact = {
    email: form.email.trim() || undefined,
    phone: form.phone.trim() || undefined,
    website: form.website.trim() || undefined,
    address: {
      ...prevAddress,
      street: form.street.trim() || undefined,
      city: form.city.trim() || undefined,
      country: form.country.trim() || undefined,
    },
    social: Object.keys(social).length ? social : undefined,
  };

  return {
    name: form.name.trim(),
    description: form.description,
    category: form.category as PageCategory,
    subcategory: form.subcategory.trim() || undefined,
    contact,
  };
}
