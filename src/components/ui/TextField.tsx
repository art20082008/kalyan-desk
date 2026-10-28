import type { InputHTMLAttributes } from 'react'

export function TextField({
  label,
  ...props
}: { label: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="text-field">
      <span>{label}</span>
      <input {...props} />
    </label>
  )
}
