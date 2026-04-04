import { Montserrat } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import { CartProvider } from './context/CartContext'
import Footer from './components/Footer'
import { Metadata, Viewport } from 'next'
import PromoPopup from './components/PromoPopUp'

const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
})

// Correct way to handle format detection in Next.js
export const metadata: Metadata = {
  title: 'The Vape Kings | Experiencia Premium en Mérida',
  description: 'Vapes de alta gama y sabores únicos. Envío a domicilio en Mérida.',
  formatDetection: {
    telephone: false,
    date: false,
    email: false,
    address: false,
  },
  openGraph: {
    images: ['/logo-og.png'],
  },
}

export const viewport: Viewport = {
  themeColor: 'black',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <CartProvider>
          <Navbar />
          <PromoPopup/>
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  )
}