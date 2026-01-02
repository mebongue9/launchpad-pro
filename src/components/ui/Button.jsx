// /src/components/ui/Button.jsx
// Reusable button component with variants and loading state
// Supports primary, secondary, and danger styles
// RELEVANT FILES: src/index.css, src/components/profiles/ProfileForm.jsx

import { Loader2 } from 'lucide-react'

export function Button({
  children,
  variant = 'primary',
  loading = false,
  className = '',
  ...props
}) {
  const variants = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'btn-danger',
  }

  return (
    <button
      className={`${variants[variant]} flex items-center justify-center gap-2 ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
}
