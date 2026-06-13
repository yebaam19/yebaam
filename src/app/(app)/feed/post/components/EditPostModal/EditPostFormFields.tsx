'use client';

import { type ReactNode } from 'react';
import Avatar from '@/ui/Avatar';
import type { PostFeeling, PostLocation, PostGif } from '../../interfaces/post.interfaces';

import PostVisibilitySelector from '../PostVisibilitySelector';
import PostContentEditor from '../PostContentEditor';
import PostBackgroundColorPicker from '../PostBackgroundColorPicker';
import PostSelectedItems from '../PostSelectedItems';
import PostEnhancementsPicker from '../PostEnhancementsPicker';

interface EditPostFormFieldsProps {
  // User
  username: string;
  avatar?: string;
  userInitials: string;
  // Visibility
  selectedVisibility: 'public' | 'friends' | 'private';
  onVisibilityChange: (value: 'public' | 'friends' | 'private') => void;
  // Content
  content: string;
  onContentChange: (value: string) => void;
  contentPlaceholder: string;
  contentError?: string;
  backgroundColor?: string;
  // Selected items
  selectedFeeling: PostFeeling | null;
  selectedLocation: PostLocation | null;
  selectedGif: PostGif | null;
  onRemoveFeeling: () => void;
  onRemoveLocation: () => void;
  onRemoveGif: () => void;
  // Enhancements
  onColorSelect: (color: string | undefined) => void;
  showColorPicker: boolean;
  onToggleColorPicker: () => void;
  onFeelingSelect: (feeling: PostFeeling) => void;
  onPhotoClick: () => void;
  disabled?: boolean;
  /** Media region (file previews + hidden input) rendered between content and selected items. */
  mediaSlot?: ReactNode;
}

export default function EditPostFormFields({
  username,
  avatar,
  userInitials,
  selectedVisibility,
  onVisibilityChange,
  content,
  onContentChange,
  contentPlaceholder,
  contentError,
  backgroundColor,
  selectedFeeling,
  selectedLocation,
  selectedGif,
  onRemoveFeeling,
  onRemoveLocation,
  onRemoveGif,
  onColorSelect,
  showColorPicker,
  onToggleColorPicker,
  onFeelingSelect,
  onPhotoClick,
  disabled,
  mediaSlot,
}: EditPostFormFieldsProps) {
  return (
    <>
      {/* User Info */}
      <div className="px-6 pt-4">
        <div className="flex items-center gap-3">
          <Avatar
            src={avatar}
            className="h-10 w-10"
            initials={userInitials}
          />
          <div>
            <p className="font-semibold text-neutral-900 dark:text-white">
              {username}
            </p>

            {/* Visibility Selector */}
            <PostVisibilitySelector
              value={selectedVisibility}
              onChange={onVisibilityChange}
              disabled={disabled}
            />
          </div>
        </div>
      </div>

      {/* Content Input */}
      <div className="px-6 pt-4">
        <PostContentEditor
          content={content}
          onChange={onContentChange}
          placeholder={contentPlaceholder}
          backgroundColor={backgroundColor}
          error={contentError}
          disabled={disabled}
        />
      </div>

      {/* Media region (file previews + hidden file input) */}
      {mediaSlot}

      {/* Selected Items (Feeling, Location, GIF) */}
      <PostSelectedItems
        feeling={selectedFeeling}
        location={selectedLocation}
        gif={selectedGif}
        onRemoveFeeling={onRemoveFeeling}
        onRemoveLocation={onRemoveLocation}
        onRemoveGif={onRemoveGif}
      />

      {/* Enhanced Actions */}
      <div className="mx-6 rounded-lg border border-neutral-200 dark:border-neutral-800">
        {/* Color Picker */}
        {!selectedGif && (
          <PostBackgroundColorPicker
            selectedColor={backgroundColor}
            onColorSelect={onColorSelect}
            isOpen={showColorPicker}
            onToggle={onToggleColorPicker}
            disabled={disabled}
          />
        )}

        {/* Enhancement Options */}
        <PostEnhancementsPicker
          onFeelingSelect={onFeelingSelect}
          onPhotoClick={onPhotoClick}
          disabled={disabled}
        />
      </div>
    </>
  );
}
