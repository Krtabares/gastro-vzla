import type { Metadata } from "next";
import "./globals.css";
import { CurrencyProvider } from "@/context/CurrencyContext";
import { OrdersProvider } from "@/context/OrdersContext";
import AuthGuard from "@/components/AuthGuard";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GastroVnzla - Elite Restaurant Management",
  description: "MVP para gestión de restaurantes en Venezuela",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-brand-dark text-brand-text`}>
        <CurrencyProvider>
          <OrdersProvider>
            <AuthGuard>
              <div className="flex flex-col min-h-screen">
                <main className="flex-grow pb-16">
                  {children}
                </main>
                <footer className="fixed bottom-0 left-0 w-full py-4 text-center border-t border-brand-border bg-brand-dark/80 backdrop-blur-md z-50">
                  <p className="text-[10px] tracking-[0.2em] text-zinc-500 uppercase font-medium">
                    POWERED BY <span className="text-brand-accent font-bold ml-1">KENAT POWERHOUSE</span>
                  </p>
                </footer>
              </div>
            </AuthGuard>
          </OrdersProvider>
        </CurrencyProvider>
      </body>
    </html>
  );
}
