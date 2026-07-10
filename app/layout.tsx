// app/layout.tsx

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Our Love 💕',
  description: 'A romantic web app celebrating our love',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Our Love',
  },
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>%E2%9D%A4%EF%B8%8F</text></svg>",
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#f43f5e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-linear-to-br from-pink-50 via-white to-red-50`}>
        {children}
      </body>
    </html>
  )
}
