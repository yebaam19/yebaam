import { FC } from 'react';

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  pattern?: string;
  required?: boolean;
  disabled?: boolean;
  hint?: string;
}

const INPUT_CLASS =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed';

/** Labeled text input used across the "Información general" settings sections. */
export const TextField: FC<TextFieldProps> = ({
  id,
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
  pattern,
  required,
  disabled,
  hint,
}) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      {label}
    </label>
    <input
      id={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      pattern={pattern}
      required={required}
      disabled={disabled}
      className={INPUT_CLASS}
    />
    {hint && (
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
    )}
  </div>
);
