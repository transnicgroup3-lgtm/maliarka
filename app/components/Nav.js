"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="topbar">
      <Link href="/" className="brand">
        <strong>Maliarca</strong> · Gestiune Vopsire
      </Link>
      <div className="nav">
        <Link href="/materiale" className={pathname === "/materiale" ? "active" : ""}>
          Materiale
        </Link>
        <Link href="/masini" className={pathname === "/masini" ? "active" : ""}>
          Mașini
        </Link>
      </div>
    </div>
  );
}
