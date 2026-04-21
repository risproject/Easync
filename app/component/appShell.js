"use client";

import { usePathname } from "next/navigation";
import Sidebar from "./sidebar";
import Header from "./header";

export default function AppShell({ children }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 transition-all duration-300 overflow-y-auto">
        <div className="ms-15 md:ms-0">
          <Header />
          <div className="pt-14">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
