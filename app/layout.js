import './globals.css'

export const metadata = {
  title: 'Quotify — Quote faster. Win more jobs.',
  description: 'Turn leads into quotes in minutes.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
