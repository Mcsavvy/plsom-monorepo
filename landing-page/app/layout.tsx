import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/theme-provider'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: "Perfect Love School of Ministry",
  description: "We are Devoted to training and guiding the next generation of Ministry leaders, empowering them to shape society for the glory of JESUS CHRIST.Guided by the Holy Spirit, this generation will fearlessly proclaim the message of the Kingdom of God with unwavering conviction.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange={false}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
