"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TubelightNavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: TubelightNavItem[];
  className?: string;
}

function matchesPath(pathname: string, itemUrl: string): boolean {
  if (itemUrl === "/") return pathname === "/";
  return pathname === itemUrl || pathname.startsWith(`${itemUrl}/`);
}

export function TubelightNavBar({ items, className }: NavBarProps) {
  const pathname = usePathname() ?? "/";

  const activeName = useMemo(() => {
    const hit = items.find((item) => matchesPath(pathname, item.url));
    return hit?.name ?? items[0]?.name ?? "";
  }, [pathname, items]);

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="flex items-center gap-1 bg-background/60 sm:bg-background/5 border border-border/80 backdrop-blur-lg py-1 px-1 rounded-full shadow-lg">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeName === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              className={cn(
                "relative cursor-pointer text-sm font-semibold px-4 sm:px-6 py-2 rounded-full transition-colors",
                "text-foreground/80 hover:text-primary",
                isActive && "text-primary",
              )}
            >
              <span className="hidden md:inline">{item.name}</span>
              <span className="md:hidden flex justify-center">
                <Icon size={18} strokeWidth={2.5} />
              </span>
              {isActive && (
                <motion.div
                  layoutId="tubelight-lamp"
                  className="absolute inset-0 w-full rounded-full -z-10 bg-primary/10"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-primary rounded-t-full">
                    <div className="absolute w-12 h-6 bg-primary/20 rounded-full blur-md -top-2 -left-2" />
                    <div className="absolute w-8 h-6 bg-primary/20 rounded-full blur-md -top-1" />
                    <div className="absolute w-4 h-4 bg-primary/20 rounded-full blur-sm top-0 left-2" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
