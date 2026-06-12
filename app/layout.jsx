import { Anton, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const display = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

const body = IBM_Plex_Sans({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "Join the Waiting List — JobHackers.global",
  description:
    "Hack the hiring game. Join the JobHackers.global waiting list and get first access when the doors open.",
  icons: { icon: "/jhg-hand.png" },
  openGraph: {
    title: "Join the Waiting List — JobHackers.global",
    description:
      "Hack the hiring game. Join the JobHackers.global waiting list and get first access when the doors open.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${mono.variable} ${body.variable}`}>
        {children}
      </body>
    </html>
  );
}
