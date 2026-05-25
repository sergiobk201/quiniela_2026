import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Nav } from "@/components/nav";
import { ChampionTheme } from "@/components/champion-theme";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiniela 2026",
  description: "World Cup 2026 prediction game",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch champion pick server-side to avoid theme flash
  let championCode: string | null = null
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('pre_tournament_predictions')
        .select('champion:teams!champion_team_id(code)')
        .eq('user_id', user.id)
        .maybeSingle()
      championCode = (data?.champion as unknown as { code: string } | null)?.code ?? null
    }
  } catch {
    // Not authenticated or DB unavailable — no theme applied
  }

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ChampionTheme code={championCode} />
          <Nav />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
