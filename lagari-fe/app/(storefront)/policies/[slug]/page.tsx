import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyPageContent } from "@/components/storefront/PolicyPageContent";
import { POLICY_CONTENT } from "@/lib/policies/content";

type PolicyPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return Object.keys(POLICY_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PolicyPageProps): Promise<Metadata> {
  const { slug } = await params;
  const policy = POLICY_CONTENT[slug];
  if (!policy) return { title: "Not found" };
  const description = Array.isArray(policy.intro)
    ? policy.intro[0]
    : policy.intro;
  return {
    title: policy.title,
    description,
    robots: { index: true },
  };
}

export default async function PolicyPage({ params }: PolicyPageProps) {
  const { slug } = await params;
  const policy = POLICY_CONTENT[slug];
  if (!policy) notFound();

  return <PolicyPageContent policy={policy} />;
}
