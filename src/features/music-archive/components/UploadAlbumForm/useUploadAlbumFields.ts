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
 * Owns the public upload form's editable field state: the artist block, the
 * album metadata + cover files, and the legal (source/copyright/attestation)
 * block. The track list itself lives in `useTrackDrafts`; `useUploadAlbumForm`
 * composes both and layers the publish pipeline on top.
 */
export function useUploadAlbumFields() {
  // Artist — autocomplete; if existingId is null we create on submit.
  const [artist, setArtist] = useState<ArtistSelection>({ existingId: null, name: '' });
  const [artistCountry, setArtistCountry] = useState('');
  const [artistBornYear, setArtistBornYear] = useState('');
  const [artistDiedYear, setArtistDiedYear] = useState('');
  const [artistBio, setArtistBio] = useState('');
  const [artistPhoto, setArtistPhoto] = useState<File | null>(null);

  // Album fields.
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

  // Legal / provenance fields (apply to every track in the batch).
  const [sourceMedia, setSourceMedia] = useState<MusicSourceMedia>('78rpm');
  const [copyrightStatus, setCopyrightStatus] = useState<MusicCopyrightStatus>('public_domain');
  const [restoredByNote, setRestoredByNote] = useState('');
  const [attestation, setAttestation] = useState(false);

  return {
    artist,
    setArtist,
    artistCountry,
    setArtistCountry,
    artistBornYear,
    setArtistBornYear,
    artistDiedYear,
    setArtistDiedYear,
    artistBio,
    setArtistBio,
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
    restoredByNote,
    setRestoredByNote,
    attestation,
    setAttestation,
  };
}
