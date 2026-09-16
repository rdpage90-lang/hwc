import type { Metadata } from "next";
import { Rajdhani, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { SessionProvider } from "@/components/SessionProvider";
import { Nav } from "@/components/Nav";

const display = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});
const body = Inter({ subsets: ["latin"], variable: "--font-body" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "HWC — HEAT World Championship",
  description: "Championship management for HEAT: Pedal to the Metal.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  return (
    <html lang="en" className="dark">
      <body className={`${display.variable} ${body.variable} ${mono.variable} font-body bg-track-950 text-track-300 antialiased min-h-screen`}>
        <SessionProvider session={session}>
          {session?.user && <Nav role={session.user.role} name={session.user.name ?? ""} />}
          <main className={session?.user ? "pb-24 md:pb-8" : ""}>{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
