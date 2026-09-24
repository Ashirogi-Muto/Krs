import type { Metadata } from "next";
import "@/styles/globals.css";
import { AuthProvider } from "@/lib/authContext";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Kalam Robotics Society — Financial Management",
  description: "Centralized financial ledger, expense tracking, receipt vault, and reporting dashboard for Kalam Robotics Society.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Navbar />
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
