import { Poppins, Roboto } from "next/font/google";
import "./globals.css";

const heading = Poppins({
  weight: ["500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-heading",
});

const body = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata = {
  title: "Join the Waiting List — JobHackers Global",
  description:
    "Get a job you love. Join the JobHackers Global waiting list and get first access when the doors open.",
  icons: { icon: "/jhg-hand.png" },
  openGraph: {
    title: "Join the Waiting List — JobHackers Global",
    description:
      "Get a job you love. Join the JobHackers Global waiting list and get first access when the doors open.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${heading.variable} ${body.variable}`}>
        {children}
      </body>
    </html>
  );
}
