import { redirect } from "next/navigation";

export default async function DomainPage({
  params,
}: {
  params: Promise<{ domainId: string }>;
}) {
  const { domainId } = await params;
  redirect(`/dashboard/${domainId}/ai-visibility`);
}
