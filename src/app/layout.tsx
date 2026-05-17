import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Андруа Фамиль — Домашний текстиль",
  description: "Коврики для ванной, постельное бельё, полотенца и домашний декор. Уютный домашний текстиль от бренда Андруа Фамиль.",
  openGraph: {
    title: "Андруа Фамиль",
    description: "Домашний текстиль для уютного дома",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Prata&family=Inter+Tight:ital,wght@0,300;0,400;0,500;1,300&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}
