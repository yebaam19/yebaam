'use client';

import { useCallback, useState } from 'react';
import type {
  AlbumCondition,
  MusicAlbumFormat,
  MusicAlbumRow,
  MusicLabelRow,
} from '../../../types/music.types';
import type { LabelSelection } from '../../upload/LabelAutocomplete';

/** The album-level editable field values, bundled so the form takes one
 *  prop instead of one per field. Produced by {@link useAlbumFields}, consumed by `AlbumFieldsForm`. */
export interface AlbumFieldsValues {
  title: string;
  year: string;
  decade: string;
  country: string;
  accompaniment: string;
  format: MusicAlbumFormat;
  catalogNumber: string;
  notes: string;
  condition: AlbumCondition | '';
  forTrade: boolean;
  label: LabelSelection;
  coverFront: File | null;
  coverBack: File | null;
  labelImage: File | null;
}

/** Matching setters for {@link AlbumFieldsValues}. */
export interface AlbumFieldsSetters {
  setTitle: (v: string) => void;
  setYear: (v: string) => void;
  setDecade: (v: string) => void;
  setCountry: (v: string) => void;
  setAccompaniment: (v: string) => void;
  setFormat: (v: MusicAlbumFormat) => void;
  setCatalogNumber: (v: string) => void;
  setNotes: (v: string) => void;
  setCondition: (v: AlbumCondition | '') => void;
  setForTrade: (v: boolean) => void;
  setLabel: (v: LabelSelection) => void;
  setCoverFront: (f: File | null) => void;
  setCoverBack: (f: File | null) => void;
  setLabelImage: (f: File | null) => void;
}

export interface UseAlbumFields {
  fields: AlbumFieldsValues;
  setters: AlbumFieldsSetters;
  /** Populate every field from a freshly loaded album row (+ its label row, if any). */
  hydrate: (album: MusicAlbumRow, label: MusicLabelRow | null) => void;
  /** Clear the three pending cover `File` selections after a successful save. */
  resetCovers: () => void;
}

/**
 * Owns the album-editor's editable field states and exposes them as the
 * `fields`/`setters` bundles `AlbumFieldsForm` consumes. `useAlbumEditor`
 * composes this and layers the load/save/track-operation logic on top.
 */
export function useAlbumFields(): UseAlbumFields {
  const [title, setTitle] = useState('');
  const [year, setYear] = useState('');
  const [decade, setDecade] = useState('');
  const [country, setCountry] = useState('');
  const [accompaniment, setAccompaniment] = useState('');
  const [format, setFormat] = useState<MusicAlbumFormat>('78rpm');
  const [catalogNumber, setCatalogNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [condition, setCondition] = useState<AlbumCondition | ''>('');
  const [forTrade, setForTrade] = useState(false);
  const [label, setLabel] = useState<LabelSelection>({ existingId: null, name: '' });
  const [coverFront, setCoverFront] = useState<File | null>(null);
  const [coverBack, setCoverBack] = useState<File | null>(null);
  const [labelImage, setLabelImage] = useState<File | null>(null);

  const hydrate = useCallback((album: MusicAlbumRow, labelRow: MusicLabelRow | null) => {
    setTitle(album.title);
    setYear(album.year?.toString() ?? '');
    setDecade(album.decade?.toString() ?? '');
    setCountry(album.country ?? '');
    setAccompaniment(album.accompaniment ?? '');
    setFormat(album.format);
    setCatalogNumber(album.catalog_number ?? '');
    setNotes(album.notes ?? '');
    setCondition(album.condition ?? '');
    setForTrade(Boolean(album.for_trade));
    setLabel({ existingId: labelRow?.id ?? null, name: labelRow?.name ?? '' });
  }, []);

  const resetCovers = useCallback(() => {
    setCoverFront(null);
    setCoverBack(null);
    setLabelImage(null);
  }, []);

  const fields: AlbumFieldsValues = {
    title,
    year,
    decade,
    country,
    accompaniment,
    format,
    catalogNumber,
    notes,
    condition,
    forTrade,
    label,
    coverFront,
    coverBack,
    labelImage,
  };

  const setters: AlbumFieldsSetters = {
    setTitle,
    setYear,
    setDecade,
    setCountry,
    setAccompaniment,
    setFormat,
    setCatalogNumber,
    setNotes,
    setCondition,
    setForTrade,
    setLabel,
    setCoverFront,
    setCoverBack,
    setLabelImage,
  };

  return { fields, setters, hydrate, resetCovers };
}
