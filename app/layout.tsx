import type { Metadata } from "next";
import "./styles.css";
export const metadata: Metadata = { title: "Pipfolio — Forex Trading Journal", description: "A private, local-first journal for deliberate forex trading." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
