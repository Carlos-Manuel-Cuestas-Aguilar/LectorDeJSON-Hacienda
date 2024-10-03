'use client';

import { useEffect, useState } from "react";
import localFont from "next/font/local";
import "./globals.css";

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

  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className={`bg-blue-600 p-4 flex items-center fixed top-0 left-0 right-0 transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>

          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQDKQHEn1w_YsXmkIt9sg2zWh_JX4serYjvNw&s" alt="Logo" className="h-8 mr-4" />

          <h1 className="text-white text-2xl">Mi Aplicación</h1>
        </header>
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}
