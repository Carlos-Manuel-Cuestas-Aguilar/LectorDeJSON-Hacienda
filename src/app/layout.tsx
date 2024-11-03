'use client';

import Image from 'next/image';
import { useEffect, useState } from "react";
import localFont from "next/font/local";
import "./globals.css";
import logoito from "./OIP.jpeg"

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isVisible, setIsVisible] = useState(true);
  //
  //const [activeView, setActiveView] = useState('vista1'); // Estado para manejar la vista activa

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  //const views = {
  //  vista1: <div>Contenido de Vista 1</div>,
  //  vista2: <div>Contenido de Vista 2</div>,
  //  vista3: <div>Contenido de Vista 3</div>,
  //};

  return (
    <html lang="en">
  <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
  <header
  style={{ backgroundColor: '#ff6d3cff' }}
  className={`p-4 flex items-center fixed top-0 left-0 right-0 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
>
      <Image src={logoito}
      alt="Logo"
      width={32}
      height={32}
      className="h-8 w-auto"/>
      <div className="flex-grow flex justify-between ml-4">
        {//Object.keys(views).map((view, index) => (
         // <button
          //  key={view}
           // className="text-white flex-1 mx-1" // Cada botón ocupará un ancho igual
            //onClick={() => setActiveView(view)}
          //>
           // Botón {index + 1}
          //</button>
        //</header>))
        }
      </div>
    </header>

    <main className="pt-16">
    {//views[activeView] || <div>Selecciona una vista</div>
    }
      {children}
    </main>
  </body>
</html>

  );
}
