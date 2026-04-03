"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { ArrowRight, BookOpen, FileText, Home, Menu, Plug, Tag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TubelightNavBar } from "@/components/ui/tubelight-navbar";

const NAV_ITEMS = [
  { name: "Home", url: "/", icon: Home },
  { name: "Writing Examples", url: "/examples", icon: FileText },
  { name: "Integrations", url: "/integrations", icon: Plug },
  { name: "Blog", url: "/blog", icon: BookOpen },
  { name: "Pricing", url: "/pricing", icon: Tag },
];

type SiteHeaderProps = {
  authenticated?: boolean;
};

export function SiteHeader({ authenticated = false }: SiteHeaderProps) {
  const [concealed, setConcealed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
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

          {/* Desktop nav */}
          <div className="hidden lg:flex min-w-0 flex-1 justify-center px-1">
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
                <Button size="sm" className="hidden sm:inline-flex" asChild>
                  <Link href="/login">
                    Get Started
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-lg border bg-background transition-colors hover:bg-muted"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
          >
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <motion.nav
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute top-16 left-0 right-0 border-b bg-background shadow-xl"
            >
              <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
                <div className="flex flex-col gap-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        href={item.url}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors hover:bg-muted"
                      >
                        <Icon className="h-5 w-5 text-muted-foreground" />
                        {item.name}
                      </Link>
                    );
                  })}
                </div>
                {!authenticated && (
                  <div className="mt-4 flex flex-col gap-2 border-t pt-4">
                    <Button variant="outline" className="w-full justify-center" asChild>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>Sign In</Link>
                    </Button>
                    <Button className="w-full justify-center" asChild>
                      <Link href="/login" onClick={() => setMobileOpen(false)}>
                        Get Started Free
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
