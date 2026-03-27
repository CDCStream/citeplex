"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  Eye,
  Lock,
  LogIn,
  ArrowLeft,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  author: string | null;
  image: string | null;
  tags: string[] | null;
  status: string;
  published_at: string | null;
}

export default function AdminBlogPage() {
  const [authed, setAuthed] = useState(false);
  const [secret, setSecret] = useState("");
  const [authError, setAuthError] = useState("");
  const [storedSecret, setStoredSecret] = useState("");

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("Citeplex Team");
  const [imageUrl, setImageUrl] = useState("");
  const [tags, setTags] = useState("");
  const [htmlContent, setHtmlContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{ ok: boolean; message: string } | null>(null);

  const slugify = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 120);

  const extractFromHtml = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const h1 = doc.querySelector("h1");
    const extractedTitle = h1?.textContent?.trim() ?? "";

    const firstP = doc.querySelector("p");
    const extractedDesc = firstP?.textContent?.trim().slice(0, 280) ?? "";

    const firstImg = doc.querySelector("img");
    const extractedImage = firstImg?.getAttribute("src") ?? "";

    const headings = doc.querySelectorAll("h2, h3");
    const extractedTags: string[] = [];
    headings.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 3 && text.length < 50) {
        const words = text.toLowerCase().split(/\s+/).slice(0, 3).join(" ");
        if (!extractedTags.includes(words)) extractedTags.push(words);
      }
    });

    if (extractedTitle && !title) {
      setTitle(extractedTitle);
      if (!editSlug) setSlug(slugify(extractedTitle));
    }
    if (extractedDesc && !description) setDescription(extractedDesc);
    if (extractedImage && !imageUrl) setImageUrl(extractedImage);
    if (extractedTags.length > 0 && !tags) setTags(extractedTags.slice(0, 5).join(", "));
  };

  const handleHtmlChange = (value: string) => {
    setHtmlContent(value);
    if (value.length > 50 && !title) extractFromHtml(value);
  };

  const handleLogin = () => {
    if (!secret.trim()) {
      setAuthError("Secret is required");
      return;
    }
    setStoredSecret(secret.trim());
    setAuthed(true);
    setAuthError("");
  };

  const fetchPosts = useCallback(async () => {
    setLoadingPosts(true);
    try {
      const res = await fetch("/api/admin/blog/list", {
        headers: { "x-admin-secret": storedSecret },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch {
      setPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  }, [storedSecret]);

  useEffect(() => {
    if (authed && storedSecret) fetchPosts();
  }, [authed, storedSecret, fetchPosts]);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setDescription("");
    setAuthor("Citeplex Team");
    setImageUrl("");
    setTags("");
    setHtmlContent("");
    setEditSlug(null);
    setSaveResult(null);
  };

  const handleNew = () => {
    resetForm();
    setEditing(true);
  };

  const handleEdit = async (post: BlogPost) => {
    setEditing(true);
    setEditSlug(post.slug);
    setTitle(post.title);
    setSlug(post.slug);
    setDescription(post.description ?? "");
    setAuthor(post.author ?? "Citeplex Team");
    setImageUrl(post.image ?? "");
    setTags((post.tags ?? []).join(", "));
    setSaveResult(null);

    try {
      const res = await fetch(`/api/admin/blog/get?slug=${encodeURIComponent(post.slug)}`, {
        headers: { "x-admin-secret": storedSecret },
      });
      if (res.ok) {
        const data = await res.json();
        setHtmlContent(data.content ?? "");
      }
    } catch {
      // keep content empty
    }
  };

  const handleDelete = async (postSlug: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      const res = await fetch("/api/admin/blog/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": storedSecret,
        },
        body: JSON.stringify({ slug: postSlug }),
      });
      if (res.ok) fetchPosts();
    } catch {
      // ignore
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !htmlContent.trim()) {
      setSaveResult({ ok: false, message: "Title and HTML content are required" });
      return;
    }

    setSaving(true);
    setSaveResult(null);

    const finalSlug = slug.trim() || slugify(title);
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/blog/save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": storedSecret,
        },
        body: JSON.stringify({
          title: title.trim(),
          slug: finalSlug,
          description: description.trim() || null,
          content: htmlContent,
          author: author.trim() || "Citeplex Team",
          image: imageUrl.trim() || null,
          tags: tagList,
          published_at: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveResult({ ok: true, message: `Published at /blog/${data.slug}` });
        fetchPosts();
      } else {
        setSaveResult({ ok: false, message: data.error || "Save failed" });
      }
    } catch (err) {
      setSaveResult({ ok: false, message: (err as Error).message });
    } finally {
      setSaving(false);
    }
  };

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardHeader className="text-center">
            <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
            <CardTitle className="mt-2">Admin Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="secret">Admin Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="BLOG_ADMIN_SECRET"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              />
            </div>
            {authError && <p className="text-sm text-destructive">{authError}</p>}
            <Button onClick={handleLogin} className="w-full">
              <LogIn className="mr-2 h-4 w-4" />
              Enter
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Button variant="ghost" onClick={() => { setEditing(false); resetForm(); }} className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to posts
          </Button>

          <h1 className="mb-6 text-2xl font-bold">
            {editSlug ? "Edit Post" : "New Post"}
          </h1>

          <div className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editSlug) setSlug(slugify(e.target.value));
                  }}
                  placeholder="Blog post title"
                />
              </div>
              <div>
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="auto-generated-from-title"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description (SEO)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Meta description for search engines"
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma separated)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="seo, ai, branding"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="html">HTML Content *</Label>
                {htmlContent.length > 20 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setTitle("");
                      setSlug("");
                      setDescription("");
                      setImageUrl("");
                      setTags("");
                      setTimeout(() => extractFromHtml(htmlContent), 0);
                    }}
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Auto-fill from HTML
                  </Button>
                )}
              </div>
              <textarea
                id="html"
                value={htmlContent}
                onChange={(e) => handleHtmlChange(e.target.value)}
                placeholder="Paste your HTML content from Writesonic here..."
                className="mt-1 min-h-[400px] w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            {saveResult && (
              <div className={`rounded-md p-3 text-sm ${saveResult.ok ? "bg-green-500/10 text-green-600" : "bg-destructive/10 text-destructive"}`}>
                {saveResult.message}
                {saveResult.ok && slug && (
                  <a
                    href={`/blog/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 inline-flex items-center gap-1 underline"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editSlug ? "Update Post" : "Publish Post"}
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); resetForm(); }}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Blog Posts</h1>
          <Button onClick={handleNew}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        {loadingPosts ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              No blog posts yet. Create your first one!
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card key={post.id}>
                <CardContent className="flex items-center justify-between py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{post.title}</h3>
                      <Badge variant={post.status === "published" ? "default" : "secondary"}>
                        {post.status}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      /blog/{post.slug}
                      {post.published_at && (
                        <span className="ml-3">
                          {new Date(post.published_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="ml-4 flex shrink-0 gap-2">
                    <Button variant="ghost" size="icon" asChild>
                      <a href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(post)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(post.slug)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
