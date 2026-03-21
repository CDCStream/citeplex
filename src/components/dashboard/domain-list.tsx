"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, ArrowRight, Globe } from "lucide-react";
import { deleteDomain } from "@/app/actions/domain";
import { Favicon } from "@/components/ui/favicon";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface Domain {
  id: string;
  url: string;
  brandName: string;
  industry: string | null;
  description: string | null;
  _count: { prompts: number; competitors: number };
}

export function DomainList({ domains }: { domains: Domain[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/onboarding">
            <Plus className="mr-2 h-4 w-4" />
            Add Domain
          </Link>
        </Button>
      </div>

      {domains.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Globe className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No domains yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first domain to start tracking.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Domains</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Prompts</TableHead>
                  <TableHead>Competitors</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {domains.map((domain) => (
                  <TableRow key={domain.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Favicon url={domain.url} size={18} />
                        {domain.brandName}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{domain.url}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{domain._count.prompts}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{domain._count.competitors}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" asChild>
                          <Link href={`/dashboard/${domain.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                        <ConfirmDeleteDialog
                          title="Delete Domain"
                          description={`Are you sure you want to delete "${domain.brandName}"? All prompts, competitors, and scan data will be permanently deleted.`}
                          confirmText={domain.brandName}
                          onConfirm={() => deleteDomain(domain.id)}
                          trigger={
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
