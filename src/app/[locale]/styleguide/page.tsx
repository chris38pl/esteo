"use client";

// i18n-ignore-file (styleguide uses hardcoded demo labels intentionally)

import { useState } from "react";
import { useTranslations } from "next-intl";

import { AssistantSurface } from "@/components/ai/assistant-surface";
import { PaginationControls } from "@/components/shared/pagination-controls";
import { DashboardFrame } from "@/components/layout/dashboard-frame";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const tokenPreview = [
  { name: "background", className: "bg-background" },
  { name: "foreground", className: "bg-foreground" },
  { name: "card", className: "bg-card" },
  { name: "muted", className: "bg-muted" },
  { name: "accent", className: "bg-accent" },
  { name: "primary", className: "bg-primary" },
  { name: "border", className: "bg-border" },
  { name: "input", className: "bg-input" },
  { name: "sidebar", className: "bg-sidebar" },
  { name: "ai", className: "bg-ai" },
] as const;

export default function StyleguidePage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const t = useTranslations("styleguide");

  return (
    <main className="surface-base min-h-screen px-6 py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("kicker")}
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">
                {t("title")}
              </h1>
            </div>
            <ThemeToggle />
          </div>
          <p className="max-w-3xl text-sm text-muted-foreground">
            {t("description")}
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {tokenPreview.map((token) => (
            <div key={token.name} className="surface-card p-4">
              <div className={`mb-3 h-14 rounded-md border ${token.className}`} />
              <p className="text-xs font-medium text-muted-foreground">
                {token.name}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.typography")}</CardTitle>
              <CardDescription>Operational hierarchy preview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight">
                Heading 1
              </h1>
              <h2 className="text-2xl font-semibold tracking-tight">
                Heading 2
              </h2>
              <h3 className="text-xl font-semibold tracking-tight">
                Heading 3
              </h3>
              <p className="text-base">
                Base text for business workflows and data-heavy pages.
              </p>
              <p className="text-sm text-muted-foreground">
                Secondary text for hints and contextual explanations.
              </p>
              <code className="block rounded-md bg-muted px-3 py-2 text-xs">
                Monospace for IDs and numeric data.
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("sections.buttonsInputsBadges")}</CardTitle>
              <CardDescription>Core interaction primitives</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="sample-email">Email</Label>
                  <Input id="sample-email" placeholder="name@company.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sample-password">Hasło</Label>
                  <Input id="sample-password" type="password" placeholder="••••••••" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Checkbox id="sample-check" />
                <Label htmlFor="sample-check">Remember selection</Label>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge>Primary</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Alert</Badge>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t("sections.dialog")}</CardTitle>
              <CardDescription>
                Confirmations and destructive action pattern
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline">Open Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete estimate?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setDialogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button variant="destructive">Delete</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          <AssistantSurface title={t("sections.ai")}>
            AI suggestions should stay contextual and subtle. Use this surface
            for estimate hints, extracted scope and actionable adjustments.
          </AssistantSurface>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("sections.table")}
          </h2>
          <p className="text-sm text-muted-foreground">
            Dense operational table style for estimate editor and dashboard
            lists.
          </p>
          <div className="surface-card p-0">
            <Table className="table-operational">
              <TableHeader>
                <TableRow>
                  <TableHead>Pozycja</TableHead>
                  <TableHead>Ilość</TableHead>
                  <TableHead>Stawka</TableHead>
                  <TableHead className="text-right">Wartość netto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Demontaż</TableCell>
                  <TableCell>12 h</TableCell>
                  <TableCell>120 PLN</TableCell>
                  <TableCell className="text-right">1 440 PLN</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Montaż</TableCell>
                  <TableCell>20 h</TableCell>
                  <TableCell>145 PLN</TableCell>
                  <TableCell className="text-right">2 900 PLN</TableCell>
                </TableRow>
                <TableRow className="table-summary-sticky">
                  <TableCell className="font-medium">Suma</TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell className="text-right font-semibold">
                    4 340 PLN
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">{t("sections.pagination")}</h2>
          <p className="text-sm text-muted-foreground">
            Pagination control used across admin and dashboard tables.
          </p>
          <div className="surface-card p-4 space-y-4">
            <PaginationControls
              page={5}
              pageSize={20}
              totalCount={234}
              totalPages={12}
              hasPreviousPage
              hasNextPage
              onPageChange={() => {}}
              onPageSizeChange={() => {}}
            />
            <PaginationControls
              page={2}
              pageSize={20}
              totalCount={234}
              totalPages={12}
              hasPreviousPage
              hasNextPage
              onPageChange={() => {}}
              compact
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("sections.dashboard")}
          </h2>
          <DashboardFrame
            sidebar={
              <div className="space-y-2 text-sm">
                <p className="font-semibold">Navigation</p>
                <p className="rounded-md bg-sidebar-accent px-3 py-2">
                  Dashboard
                </p>
                <p className="rounded-md px-3 py-2 text-muted-foreground">
                  Requests
                </p>
                <p className="rounded-md px-3 py-2 text-muted-foreground">
                  Estimates
                </p>
              </div>
            }
          >
            <div className="surface-card p-4">
              <p className="text-sm">
                Main workspace panel for widgets, forms, and table-heavy
                operations.
              </p>
            </div>
          </DashboardFrame>
        </section>

        <section className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight">
            {t("sections.spacing")}
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            {[4, 8, 12, 16, 24, 32, 48, 64].map((size) => (
              <div key={size} className="space-y-2 text-center">
                <div
                  className="mx-auto rounded bg-primary/20"
                  style={{ width: `${size}px`, height: `${size}px` }}
                />
                <p className="text-xs text-muted-foreground">{size}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

