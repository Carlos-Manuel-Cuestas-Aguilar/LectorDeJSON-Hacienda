'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import localFont from 'next/font/local';
import './globals.css';
import logoito from './OIP.jpeg';

// Configuración de las fuentes personalizadas locales con Tailwind variables
const geistSans = localFont({
  src: './fonts/GeistVF.woff', // Ruta al archivo de la fuente
  variable: '--font-geist-sans', // Nombre de la variable CSS para la fuente
  weight: '100 900', // Rango de pesos de la fuente
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff', // Ruta al archivo de la fuente
  variable: '--font-geist-mono', // Nombre de la variable CSS para la fuente
  weight: '100 900', // Rango de pesos de la fuente
});

// Componente principal del layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode; // Define que `children` debe ser un nodo de React
}) {
  // Estado para controlar la visibilidad del encabezado
  const [isVisible, setIsVisible] = useState(true);

  // Efecto para ocultar el encabezado al hacer scroll hacia abajo
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsVisible(false); // Ocultar encabezado
      } else {
        setIsVisible(true); // Mostrar encabezado
      }
    };

    // Registrar el evento de scroll
    window.addEventListener('scroll', handleScroll);

    // Limpiar el evento de scroll al desmontar el componente
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {/* Encabezado fijo con logo */}
        <header
          style={{ backgroundColor: '#ff6d3cff' }} // Color de fondo
          className={`p-4 flex items-center fixed top-0 left-0 right-0 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={logoito} // Imagen del logo
            alt="Logo"
            width={32} // Ancho del logo
            height={32} // Altura del logo
            className="h-8 w-auto"
          />
          <div className="flex-grow flex justify-between ml-4">
            {/* Espacio reservado para botones o contenido adicional */}
          </div>
        </header>

        {/* Contenido principal del layout */}
        <main className="pt-16">
          {children} {/* Renderiza el contenido que envuelve este layout */}
        </main>
      </body>
    </html>
  );
}
