"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  Globe,
  LayoutDashboard,
  Menu,
  Plus,
  Settings,
  LogOut,
  Users,
  MessageSquare,
  Loader2,
  CreditCard,
  Eye,
  FileText,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Favicon } from "@/components/ui/favicon";

interface DashboardShellProps {
  user: { name?: string | null; email?: string | null; image?: string | null };
  domains: { id: string; brandName: string; url: string }[];
  children: React.ReactNode;
}

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Domains", href: "/dashboard/domains", icon: Globe },
];

interface NavSection {
  title?: string;
  items: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
}

function getDomainNavSections(domainId: string): NavSection[] {
  return [
    {
      title: "AI Visibility",
      items: [
        { label: "Dashboard", href: `/dashboard/${domainId}`, icon: LayoutDashboard },
        { label: "Overview", href: `/dashboard/${domainId}/ai-visibility`, icon: Eye },
        { label: "Prompts", href: `/dashboard/${domainId}/prompts`, icon: MessageSquare },
        { label: "Competitor Gaps", href: `/dashboard/${domainId}/ai-visibility/gaps`, icon: Globe },
      ],
    },
    {
      title: "Content",
      items: [
        { label: "Planner", href: `/dashboard/${domainId}/content`, icon: FileText },
        { label: "Write Article", href: `/dashboard/${domainId}/content/write`, icon: FileText },
      ],
    },
    {
      items: [
        { label: "Competitors", href: `/dashboard/${domainId}/competitors`, icon: Users },
      ],
    },
  ];
}

function SidebarContent({
  user,
  domains,
  pathname,
}: {
  user: DashboardShellProps["user"];
  domains: DashboardShellProps["domains"];
  pathname: string;
}) {
  const activeDomainId = pathname.split("/")[2];
  const isDomainPage =
    activeDomainId && activeDomainId !== "domains" && domains.some((d) => d.id === activeDomainId);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image src="/logo.png" alt="Citeplex" width={28} height={28} />
          <span className="text-lg font-bold"><span className="text-primary">Cite</span>plex</span>
        </Link>
      </div>

      <Separator />

      <nav className="flex-1 overflow-y-auto space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        {domains.length > 0 && (
          <>
            <Separator className="my-3" />
            <p className="px-3 text-xs font-semibold uppercase text-muted-foreground">
              Your Domains
            </p>
            {domains.map((domain) => (
              <Link
                key={domain.id}
                href={`/dashboard/${domain.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  activeDomainId === domain.id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Favicon url={domain.url} size={16} />
                <span className="truncate">{domain.brandName}</span>
              </Link>
            ))}
          </>
        )}

        {isDomainPage && (
          <>
            {getDomainNavSections(activeDomainId).map((section, si) => (
              <div key={si}>
                <Separator className="my-3" />
                {section.title && (
                  <p className="px-3 pb-1 text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        section.title ? "pl-6" : "pl-6",
                        isActive
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </>
        )}

        <Separator className="my-3" />
        <Link
          href="/onboarding"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          <Plus className="h-4 w-4" />
          Add Domain
        </Link>
      </nav>

      <div className="border-t p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3">
              <Avatar className="h-7 w-7">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>
                  {user.name?.charAt(0)?.toUpperCase() ?? "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium truncate max-w-[140px]">
                  {user.name ?? "User"}
                </span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <NavDropdownItem href="/dashboard/billing" icon={CreditCard} label="Billing" />
            <NavDropdownItem href="/settings" icon={Settings} label="Settings" />
            <DropdownMenuSeparator />
            <NavDropdownItem href="/api/auth/signout" icon={LogOut} label="Sign out" />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function NavDropdownItem({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <DropdownMenuItem
      disabled={loading}
      onClick={(e) => {
        e.preventDefault();
        setLoading(true);
        if (href.startsWith("/api/")) {
          window.location.href = href;
        } else {
          router.push(href);
        }
      }}
    >
      {loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {label}
    </DropdownMenuItem>
  );
}

export function DashboardShell({ user, domains, children }: DashboardShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — sticky, full viewport height, scrollable nav */}
      <aside className="hidden w-64 shrink-0 border-r bg-sidebar-background lg:block sticky top-0 h-screen overflow-hidden">
        <SidebarContent user={user} domains={domains} pathname={pathname} />
      </aside>

      {/* Mobile header + sheet */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center gap-4 border-b px-4 lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <SidebarContent user={user} domains={domains} pathname={pathname} />
            </SheetContent>
          </Sheet>
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Citeplex" width={24} height={24} />
            <span className="font-bold"><span className="text-primary">Cite</span>plex</span>
          </Link>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
