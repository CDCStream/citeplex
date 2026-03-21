"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[blog/[slug]]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-sm font-medium text-muted-foreground">Blog</p>
      <h1 className="mt-2 text-2xl font-bold">Something went wrong</h1>
      <p className="mt-3 text-muted-foreground">
        This post could not be loaded. Try again, or open from the{" "}
        <Link href="/blog" className="text-primary underline">
          blog list
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Try again
      </button>
    </div>
  );
}
