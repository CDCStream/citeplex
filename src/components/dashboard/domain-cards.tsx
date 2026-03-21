"use client";

import Link from "next/link";
import { ArrowRight, MessageSquare, Users, Trash2 } from "lucide-react";
import { Favicon } from "@/components/ui/favicon";
import { deleteDomain } from "@/app/actions/domain";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface Domain {
  id: string;
  url: string;
  brandName: string;
  _count: { prompts: number; competitors: number };
}

export function DomainCards({ domains }: { domains: Domain[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {domains.map((domain) => (
        <div key={domain.id} className="group relative rounded-3xl border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:-translate-y-0.5">
          <Link href={`/dashboard/${domain.id}`} className="absolute inset-0 rounded-3xl" />
          <div className="relative pointer-events-none">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-muted/50 p-3">
                  <Favicon url={domain.url} size={32} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight group-hover:text-primary transition-colors">
                    {domain.brandName}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {domain.url}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-1 pointer-events-auto">
                <ConfirmDeleteDialog
                  title="Delete Domain"
                  description={`Are you sure you want to delete "${domain.brandName}"? All prompts, competitors, and scan data will be permanently deleted.`}
                  confirmText={domain.brandName}
                  onConfirm={() => deleteDomain(domain.id)}
                  trigger={
                    <button
                      className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete domain"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  }
                />
                <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
              </div>
            </div>

            <div className="mt-6 flex gap-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageSquare className="h-3.5 w-3.5" />
                <span><span className="font-medium text-foreground">{domain._count.prompts}</span> prompts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span><span className="font-medium text-foreground">{domain._count.competitors}</span> competitors</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
