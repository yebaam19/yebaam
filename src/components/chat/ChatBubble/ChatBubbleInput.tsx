'use client';

import { useTranslations } from 'next-intl';
import CameraCaptureModal from '../CameraCaptureModal';
import { AttachmentPreview } from './ChatBubbleInput/AttachmentPreview';
import { AttachButtons } from './ChatBubbleInput/AttachButtons';
import { MessageTextArea } from './ChatBubbleInput/MessageTextArea';
import { InputActions } from './ChatBubbleInput/InputActions';
import { useChatBubbleInput, type ChatBubbleInputProps } from './ChatBubbleInput/useChatBubbleInput';

export function ChatBubbleInput(props: ChatBubbleInputProps) {
  const t = useTranslations('chat.bubble.input');
  const {
    message,
    isSending,
    emojiOpen,
    setEmojiOpen,
    cameraOpen,
    setCameraOpen,
    selectedFile,
    selectedKind,
    previewUrl,
    fileInputRef,
    textareaRef,
    isUploading,
    uploadProgress,
    trimmedEmpty,
    handleFileSelect,
    handleAudioSelect,
    handleDocSelect,
    handlePaste,
    handleRemoveFile,
    handleInputChange,
    handleEmojiSelect,
    handleSubmit,
    handleKeyDown,
    handleCameraCapture,
    handleThumb,
    handleSendVoice,
  } = useChatBubbleInput(props);

  return (
    <form
      onSubmit={handleSubmit}
      className="border-t border-neutral-200 bg-[#f0f2f5] px-2 py-2 dark:border-neutral-800 dark:bg-neutral-900"
    >
      {selectedFile && (
        <AttachmentPreview
          previewUrl={previewUrl}
          kind={selectedKind}
          fileName={selectedFile.name}
          fileSize={selectedFile.size}
          isUploading={isUploading}
          isSending={isSending}
          uploadProgress={uploadProgress}
          onRemove={handleRemoveFile}
          labels={{ previewAlt: t('previewAlt'), removeAttachment: t('removeAttachment') }}
        />
      )}

      <div className="flex items-end gap-1.5">
        <AttachButtons
          fileInputRef={fileInputRef}
          isUploading={isUploading}
          isSending={isSending}
          onOpenCamera={() => setCameraOpen(true)}
          onFileSelect={handleFileSelect}
          onAudioSelect={handleAudioSelect}
          onDocSelect={handleDocSelect}
          labels={{
            more: t('more'),
            cameraPhoto: t('cameraPhoto'),
            attachImage: t('attachImage'),
            attachAudio: t('attachAudio'),
            attachFile: t('attachFile'),
          }}
        />

        <MessageTextArea
          textareaRef={textareaRef}
          value={message}
          disabled={isSending || isUploading}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          labels={{ placeholder: t('placeholder'), ariaLabel: t('ariaLabel') }}
        />

        <InputActions
          emojiOpen={emojiOpen}
          isSending={isSending}
          isUploading={isUploading}
          showSendAlternatives={trimmedEmpty && !selectedFile}
          onToggleEmoji={() => setEmojiOpen((v) => !v)}
          onCloseEmoji={() => setEmojiOpen(false)}
          onSelectEmoji={handleEmojiSelect}
          onSendVoice={handleSendVoice}
          onSendLike={() => void handleThumb()}
          labels={{ emoji: t('emoji'), sendLike: t('sendLike'), send: t('send') }}
        />
      </div>

      <CameraCaptureModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCameraCapture}
        sending={isUploading}
      />
    </form>
  );
}
