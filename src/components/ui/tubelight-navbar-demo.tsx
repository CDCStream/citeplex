"use client";

/**
 * Example usage (e.g. Storybook or a dev page). Marketing pages use `SiteHeader` instead.
 */
import { Briefcase, FileText, Home, User } from "lucide-react";
import { TubelightNavBar } from "@/components/ui/tubelight-navbar";

export function TubelightNavBarDemo() {
  const navItems = [
    { name: "Home", url: "#", icon: Home },
    { name: "About", url: "#", icon: User },
    { name: "Projects", url: "#", icon: Briefcase },
    { name: "Resume", url: "#", icon: FileText },
  ];

  return <TubelightNavBar items={navItems} />;
}
