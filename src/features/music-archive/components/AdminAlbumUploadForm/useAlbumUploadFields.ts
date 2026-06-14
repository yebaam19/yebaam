'use client';

import { useState } from 'react';
import type {
  MusicAlbumFormat,
  MusicCopyrightStatus,
  MusicSourceMedia,
} from '../../types/music.types';
import { type ArtistSelection } from '../upload/ArtistAutocomplete';
import { type LabelSelection } from '../upload/LabelAutocomplete';

/**
 * Owns the admin album-upload form's editable field state: the artist block,
 * the album metadata + cover files, and the legal (source/copyright/attestation)
 * block. `useAdminAlbumUpload` composes this and layers the track drafts +
 * publish pipeline on top.
 */
export function useAlbumUploadFields() {
  const [artist, setArtist] = useState<ArtistSelection>({ existingId: null, name: '' });
  const [artistCountry, setArtistCountry] = useState('');
  const [artistBornYear, setArtistBornYear] = useState('');
  const [artistDiedYear, setArtistDiedYear] = useState('');
  const [artistPhoto, setArtistPhoto] = useState<File | null>(null);

  const [albumTitle, setAlbumTitle] = useState('');
  const [albumYear, setAlbumYear] = useState('');
  const [albumCountry, setAlbumCountry] = useState('');
  const [albumFormat, setAlbumFormat] = useState<MusicAlbumFormat>('78rpm');
  const [label, setLabel] = useState<LabelSelection>({ existingId: null, name: '' });
  const [catalogNumber, setCatalogNumber] = useState('');
  const [albumNotes, setAlbumNotes] = useState('');
  const [coverFront, setCoverFront] = useState<File | null>(null);
  const [coverBack, setCoverBack] = useState<File | null>(null);
  const [labelImage, setLabelImage] = useState<File | null>(null);

  const [sourceMedia, setSourceMedia] = useState<MusicSourceMedia>('78rpm');
  const [copyrightStatus, setCopyrightStatus] = useState<MusicCopyrightStatus>('public_domain');
  const [attestation, setAttestation] = useState(true);

  return {
    artist,
    setArtist,
    artistCountry,
    setArtistCountry,
    artistBornYear,
    setArtistBornYear,
    artistDiedYear,
    setArtistDiedYear,
    artistPhoto,
    setArtistPhoto,
    albumTitle,
    setAlbumTitle,
    albumYear,
    setAlbumYear,
    albumCountry,
    setAlbumCountry,
    albumFormat,
    setAlbumFormat,
    label,
    setLabel,
    catalogNumber,
    setCatalogNumber,
    albumNotes,
    setAlbumNotes,
    coverFront,
    setCoverFront,
    coverBack,
    setCoverBack,
    labelImage,
    setLabelImage,
    sourceMedia,
    setSourceMedia,
    copyrightStatus,
    setCopyrightStatus,
    attestation,
    setAttestation,
  };
}
