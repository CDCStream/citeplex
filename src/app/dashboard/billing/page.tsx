import { getAuthUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  ArrowUpRight,
  Zap,
  Check,
  MessageSquare,
  Globe,
  BarChart3,
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  XCircle,
  Receipt,
} from "lucide-react";
import {
  PLAN_LABELS,
  PLAN_LIMITS,
  PLAN_PRICES,
  PLAN_PRODUCT_IDS,
  getPromptLimit,
} from "@/lib/plans";

const PLAN_ORDER = ["free", "starter", "growth", "pro", "business", "enterprise"];

const PLAN_FEATURES: Record<string, string[]> = {
  free: [
    "3 prompts",
    "Daily scans",
    "7 AI engines",
    "Competitor tracking",
  ],
  starter: [
    "15 prompts",
    "Daily scans",
    "7 AI engines",
    "Competitor tracking",
    "Email reports",
  ],
  growth: [
    "30 prompts",
    "Daily scans",
    "7 AI engines",
    "Competitor tracking",
    "Email reports",
    "Priority support",
  ],
  pro: [
    "50 prompts",
    "Daily scans",
    "7 AI engines",
    "Competitor tracking",
    "Email reports",
    "Priority support",
  ],
  business: [
    "100 prompts",
    "Daily scans",
    "7 AI engines",
    "Competitor tracking",
    "Email reports",
    "Priority support",
  ],
  enterprise: [
    "250 prompts",
    "Daily scans",
    "7 AI engines",
    "Competitor tracking",
    "Email reports",
    "Priority support",
  ],
};

export default async function BillingPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  const plan = user.plan || "free";
  const promptLimit = getPromptLimit(plan);
  const planLabel = PLAN_LABELS[plan] || "Free";
  const planPrice = PLAN_PRICES[plan] || 0;
  const features = PLAN_FEATURES[plan] || PLAN_FEATURES.free;

  const { data: domains } = await supabaseAdmin
    .from("domains")
    .select("id")
    .eq("user_id", user.id);

  const domainIds = domains?.map((d) => d.id) || [];
  let totalPromptsUsed = 0;
  if (domainIds.length > 0) {
    const { count } = await supabaseAdmin
      .from("prompts")
      .select("id", { count: "exact", head: true })
      .in("domain_id", domainIds);
    totalPromptsUsed = count || 0;
  }

  const usagePercent = Math.min(100, Math.round((totalPromptsUsed / promptLimit) * 100));

  const { data: billingHistory } = await supabaseAdmin
    .from("billing_history")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-primary/10 p-2.5">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="text-sm text-muted-foreground">
            Manage your plan, usage, and billing history.
          </p>
        </div>
      </div>

      {/* Active Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Active Plan
                <Badge variant={plan === "free" ? "secondary" : "default"}>
                  {planLabel}
                </Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                {plan === "free"
                  ? "You are on the free plan. Upgrade to unlock more prompts."
                  : `Your current plan renews monthly at $${planPrice}/mo.`}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-3xl font-extrabold tracking-tight">
                ${planPrice}
                <span className="text-base font-medium text-muted-foreground">/mo</span>
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Prompt usage</span>
              <span className="font-semibold">
                {totalPromptsUsed} / {promptLimit} prompts
              </span>
            </div>
            <div className="h-2.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  usagePercent >= 90
                    ? "bg-destructive"
                    : usagePercent >= 70
                      ? "bg-amber-500"
                      : "bg-primary"
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-2 gap-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {plan === "free" ? (
              <Button asChild>
                <Link href="/pricing">
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade Plan
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild variant="outline">
                  <Link href="/pricing">
                    Change Plan
                    <ArrowUpRight className="ml-1.5 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Compare plans and choose the one that fits your needs.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PLAN_ORDER.filter((p) => p !== "free").map((planKey) => {
              const isCurrentPlan = plan === planKey;
              const price = PLAN_PRICES[planKey];
              const prompts = PLAN_LIMITS[planKey];
              const label = PLAN_LABELS[planKey];
              const productId = PLAN_PRODUCT_IDS[planKey];

              return (
                <div
                  key={planKey}
                  className={`rounded-xl border p-5 transition-shadow hover:shadow-md ${
                    isCurrentPlan ? "border-primary bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{label}</h3>
                    {isCurrentPlan && (
                      <Badge variant="default" className="text-[10px]">
                        Current
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-2xl font-extrabold">
                    ${price}
                    <span className="text-sm font-medium text-muted-foreground">/mo</span>
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {prompts} prompts · Daily scans · 7 engines
                  </p>
                  {!isCurrentPlan && (
                    <Button
                      asChild
                      size="sm"
                      variant={isCurrentPlan ? "secondary" : "default"}
                      className="mt-4 w-full"
                    >
                      <Link href={`/checkout?products=${productId}`}>
                        {PLAN_ORDER.indexOf(planKey) > PLAN_ORDER.indexOf(plan)
                          ? "Upgrade"
                          : "Switch"}
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Usage Overview</CardTitle>
          <CardDescription>
            Your current resource usage across all domains.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <UsageStat
              icon={MessageSquare}
              label="Prompts"
              value={`${totalPromptsUsed} / ${promptLimit}`}
            />
            <UsageStat
              icon={Globe}
              label="Domains"
              value={`${domainIds.length}`}
            />
            <UsageStat
              icon={BarChart3}
              label="AI Engines"
              value="7"
            />
            <UsageStat
              icon={Users}
              label="Competitors"
              value="Unlimited"
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            Your past invoices and payment history.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!billingHistory || billingHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Receipt className="h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm font-medium text-muted-foreground">
                No billing history yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {plan === "free"
                  ? "Upgrade to a paid plan to see your invoices here."
                  : "Your billing events will appear here."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {billingHistory.map((event) => (
                <BillingEventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UsageStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border p-4">
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

interface BillingEvent {
  id: string;
  type: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  created_at: string;
}

const EVENT_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  subscription_created: { icon: ArrowUpCircle, color: "text-emerald-500" },
  subscription_updated: { icon: ArrowUpCircle, color: "text-primary" },
  subscription_canceled: { icon: XCircle, color: "text-destructive" },
  payment_success: { icon: CreditCard, color: "text-emerald-500" },
  payment_failed: { icon: XCircle, color: "text-destructive" },
};

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-500/10 text-emerald-600",
  pending: "bg-amber-500/10 text-amber-600",
  failed: "bg-destructive/10 text-destructive",
  refunded: "bg-blue-500/10 text-blue-600",
  canceled: "bg-muted text-muted-foreground",
  revoked: "bg-muted text-muted-foreground",
};

function BillingEventRow({ event }: { event: BillingEvent }) {
  const config = EVENT_CONFIG[event.type] || { icon: Receipt, color: "text-muted-foreground" };
  const Icon = config.icon;
  const statusStyle = STATUS_STYLES[event.status] || STATUS_STYLES.completed;

  const date = new Date(event.created_at);
  const formatted = date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const time = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const planLabel = PLAN_LABELS[event.plan] || event.plan;
  const amountStr = event.amount > 0 ? `$${(event.amount / 100).toFixed(2)}` : "—";

  return (
    <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">
          {event.description || event.type.replace(/_/g, " ")}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatted} · {time}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-[10px]">
          {planLabel}
        </Badge>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusStyle}`}>
          {event.status}
        </span>
        <span className="min-w-[60px] text-right text-sm font-semibold tabular-nums">
          {amountStr}
        </span>
      </div>
    </div>
  );
}
