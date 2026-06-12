import './globals.css'
import React from 'react'
import Header from '../components/Header'
import Footer from '../components/Footer'
import ToastProvider from '../components/ToastProvider'
import AdScript from '../components/AdScript'
import ThemeScript from '../components/ThemeScript'
import { Space_Grotesk, Inter, Noto_Sans_JP } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['400','500','700'], variable: '--font-display' })
const inter = Inter({ subsets: ['latin'], weight: ['400','500','700'], variable: '--font-body' })
const notoJP = Noto_Sans_JP({ subsets: ['latin'], weight: ['400','700'], variable: '--font-jp' })

const adsClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT

export const metadata = {
  title: 'Animédula',
  description: 'Reseñas, listados y guías de anime y manga en español',
  ...(adsClient
    ? { other: { 'google-adsense-account': adsClient } }
    : {}),
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable} ${notoJP.variable}`} suppressHydrationWarning>
      <body className="antialiased text-text font-body">
        <ThemeScript />
        <div className="site-bg" aria-hidden />
        <div className="site-grid" aria-hidden />
        <AdScript />
        <div className="min-h-screen flex flex-col relative">
          <Header />
          <ToastProvider>
            <main className="flex-1 container mx-auto px-4 py-8 md:py-10">{children}</main>
          </ToastProvider>
          <Footer />
        </div>
      </body>
    </html>
  )
}
