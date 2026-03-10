import { Montserrat } from 'next/font/google'
import './globals.css'
import Navbar from './components/Navbar'
import { CartProvider } from './context/CartContext'
import Footer from './components/Footer'


const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-montserrat',
})

export const metadata = {
  title: 'The Vape Kings | Experiencia Premium en Mérida',
  description: 'Vapes de alta gama y sabores únicos. Envío a domicilio en Mérida.',
  openGraph: {
    images: ['/logo-og.png'], // The image people see when you share the link
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* 3. Apply the variable to the body */}
      <body className={`${montserrat.variable} font-sans antialiased`}>
        <CartProvider>
          <Navbar/>
          {children}
          <Footer/>
        </CartProvider>
      </body>
    </html>
  )
}