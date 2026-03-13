import { Poppins } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import AppShell from "./component/appShell";

const fontPoppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
});

export const metadata = {
  title: "FR-6000",
  description: "Monitoring and Control",
  icons: {
    icon: "/assets/favicon.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${fontPoppins.className} antialiased`}>
        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
