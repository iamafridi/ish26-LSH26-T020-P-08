"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode } from "react";

type Props = {
  href: string;
  className: string;
  activeClassName?: string;
  title?: string;
  mode: "dashboard" | "checking" | "admin" | "ledger" | "docs";
  children: ReactNode;
};

export default function ActiveNavLink({
  href,
  className,
  activeClassName = "active",
  title,
  mode,
  children,
}: Props) {
  const pathname = usePathname();
  const checking = pathname === "/checking";
  const ledger = pathname === "/ledger";
  const active =
    (mode === "dashboard" && pathname === "/") ||
    (mode === "checking" && checking) ||
    (mode === "admin" && pathname === "/admin") ||
    (mode === "ledger" && ledger) ||
    (mode === "docs" && pathname.startsWith("/docs"));

  const resolvedClassName = `${className}${active ? ` ${activeClassName}` : ""}`;

  return <Link href={href} className={resolvedClassName} title={title} aria-current={active ? "page" : undefined}>{children}</Link>;
}
