import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = 'INR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d)
}

export function getRiskColor(riskScore: number): string {
  if (riskScore >= 70) return 'text-red-600'
  if (riskScore >= 40) return 'text-yellow-600'
  return 'text-green-600'
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case 'high': return 'destructive'
    case 'medium': return 'secondary'
    case 'low': return 'outline'
    default: return 'default'
  }
}
