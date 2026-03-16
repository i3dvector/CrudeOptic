"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplets, Globe2, BarChart3 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/explore", label: "Explore Map", icon: Globe2 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-crude-bg/80 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <Droplets className="w-7 h-7 text-crude-amber group-hover:text-crude-orange transition-colors" />
            <span className="font-heading text-xl font-bold gradient-text">
              CrudeOptic
            </span>
          </Link>

          <div className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-white/10 text-crude-amber"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
