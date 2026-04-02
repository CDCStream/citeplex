"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowRight, BookOpen, FileText, Home, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TubelightNavBar } from "@/components/ui/tubelight-navbar";

const NAV_ITEMS = [
  { name: "Home", url: "/", icon: Home },
  { name: "Writing Examples", url: "/examples", icon: FileText },
  { name: "Blog", url: "/blog", icon: BookOpen },
  { name: "Pricing", url: "/pricing", icon: Tag },
];

type SiteHeaderProps = {
  /** When set, show Dashboard instead of auth CTAs */
  authenticated?: boolean;
};

export function SiteHeader({ authenticated = false }: SiteHeaderProps) {
  const [concealed, setConcealed] = useState(false);
  const lastScroll = useRef(0);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const prev = lastScroll.current;
    lastScroll.current = latest;

    if (latest < 32) {
      setConcealed(false);
      return;
    }
    if (latest > prev && latest > 72) {
      setConcealed(true);
    } else if (latest < prev) {
      setConcealed(false);
    }
  });

  useEffect(() => {
    lastScroll.current = window.scrollY;
  }, []);

  return (
    <motion.header
      className="fixed left-0 right-0 top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-xl supports-backdrop-filter:bg-background/65"
      initial={false}
      animate={{ y: concealed ? -88 : 0 }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <Image src="/logo.png" alt="Citeplex" width={32} height={32} />
          <span className="text-xl font-bold">
            <span className="text-primary">Cite</span>plex
          </span>
        </Link>

        <div className="min-w-0 flex-1 flex justify-center px-1">
          <TubelightNavBar items={NAV_ITEMS} className="max-w-full" />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {authenticated ? (
            <Button size="sm" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
                <Link href="/login">Sign In</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/login">
                  <span className="hidden sm:inline">Get Started</span>
                  <span className="sm:hidden">Start</span>
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.header>
  );
}
