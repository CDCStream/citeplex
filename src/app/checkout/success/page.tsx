import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, ArrowRight } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-primary/5 via-background to-primary/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-500/10 p-3">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <div className="flex justify-center">
            <Image src="/logo.png" alt="Citeplex" width={40} height={40} />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Payment successful!
          </CardTitle>
          <CardDescription className="text-base">
            Your plan has been upgraded. You now have access to more prompts and features.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="w-full h-11 text-base" asChild>
            <Link href="/dashboard">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Your subscription details are available in your account settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
