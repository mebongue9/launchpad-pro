// /src/components/ui/Input.jsx
// Form input component with label, error state, and helper text
// Handles text, email, password, and textarea types
// RELEVANT FILES: src/index.css, src/components/auth/LoginForm.jsx

export function Input({
  label,
  error,
  type = 'text',
  className = '',
  ...props
}) {
  const inputClasses = `input-field ${error ? 'input-error' : ''} ${className}`

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          className={inputClasses}
          rows={4}
          {...props}
        />
      ) : (
        <input
          type={type}
          className={inputClasses}
          {...props}
        />
      )}
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  )
}
