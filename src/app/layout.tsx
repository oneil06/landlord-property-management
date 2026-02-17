import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PropertyPro - Simple Property Management for Small Landlords",
  description: "The all-in-one property management solution for landlords with 1-10 units. Track rent, manage tenants, schedule maintenance, and more.",
  keywords: ["property management", "landlord software", "rent tracking", "tenant management", "small landlord"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
