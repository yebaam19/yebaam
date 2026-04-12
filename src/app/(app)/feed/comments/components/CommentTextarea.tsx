import { TextareaHTMLAttributes, forwardRef } from 'react';

interface CommentTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
}

export const CommentTextarea = forwardRef<HTMLTextAreaElement, CommentTextareaProps>(
  ({ error, className = '', ...props }, ref) => {
    return (
      <div className="flex-1 min-w-0">
        <textarea
          ref={ref}
          rows={1}
          className={`
            w-full px-4 py-2 
            bg-gray-100 dark:bg-neutral-700 
            border border-transparent
            rounded-full
            resize-none
            text-gray-900 dark:text-white
            placeholder:text-gray-500 dark:placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
            transition-all
            overflow-hidden
            break-words
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
          style={{
            minHeight: '40px',
            maxHeight: '120px',
            overflowY: 'auto',
            overflowX: 'hidden',
            wordWrap: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
          onInput={(e) => {
            const target = e.target as HTMLTextAreaElement;
            target.style.height = 'auto';
            target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
          }}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-500 px-4">{error}</p>
        )}
      </div>
    );
  }
);

CommentTextarea.displayName = 'CommentTextarea';
