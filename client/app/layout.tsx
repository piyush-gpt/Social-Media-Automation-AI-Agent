import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Social Media Agent - AI-Powered Content Creation",
  description: "Create engaging social media content with AI assistance. Support for LinkedIn and Twitter.",
  keywords: ["social media", "AI", "content creation", "LinkedIn", "Twitter"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {children}
      </body>
    </html>
  );
}
