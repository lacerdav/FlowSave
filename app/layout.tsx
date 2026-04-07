import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FlowSave — Income Tracker for Freelancers',
  description: 'Manage irregular income, set salary targets, and forecast cash flow.',
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
