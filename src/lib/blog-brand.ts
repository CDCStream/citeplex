/** Brand defaults for blog / Outrank (Citeplex). */
export const BLOG_BRAND_NAME = "Citeplex";

export function getDefaultBlogAuthor(): string {
  return process.env.BLOG_DEFAULT_AUTHOR?.trim() || "Citeplex Team";
}
