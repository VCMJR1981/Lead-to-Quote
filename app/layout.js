import { Syne, DM_Sans } from 'next/font/google'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne', weight: ['400','500','600','700','800'] })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm', weight: ['300','400','500','600'] })

export const metadata = { title: 'Lead-to-Quote', description: 'Quote faster. Win more jobs.' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${syne.variable} ${dmSans.variable}`}>{children}</body>
    </html>
  )
}
