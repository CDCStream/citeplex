import { z } from "zod";

// ─── Article Generator ───

export const OutlineResponseSchema = z.object({
  sections: z.array(
    z.object({
      heading: z.string(),
      level: z.number(),
      points: z.array(z.string()).optional().default([]),
    })
  ),
});
export type OutlineResponse = z.infer<typeof OutlineResponseSchema>;

export const ResearchSchema = z.object({
  keyPoints: z.array(z.string()).default([]),
  competitors: z.array(z.string()).default([]),
  relatedTopics: z.array(z.string()).default([]),
  suggestedImages: z.array(z.string()).default([]),
  internalLinkSuggestions: z.array(z.string()).default([]),
  externalSources: z.array(z.string()).default([]),
  backlinkAngles: z.array(z.string()).default([]),
  statistics: z.array(z.string()).default([]),
});
export type ResearchResponse = z.infer<typeof ResearchSchema>;

export const ArticleMetaSchema = z.object({
  metaDescription: z.string().default(""),
  tags: z.array(z.string()).default([]),
  faq: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .default([]),
});
export type ArticleMetaResponse = z.infer<typeof ArticleMetaSchema>;

// ─── Keyword Planner ───

export const KeywordListSchema = z.object({
  keywords: z.array(z.string()),
});
export type KeywordListResponse = z.infer<typeof KeywordListSchema>;

export const TitleGenerationSchema = z.object({
  articles: z.array(
    z.object({
      keyword: z.string(),
      title: z.string(),
      articleType: z.string().default("guide"),
      reasoning: z.string().default(""),
    })
  ),
});
export type TitleGenerationResponse = z.infer<typeof TitleGenerationSchema>;

// ─── Gap Analyzer ───

export const GapCandidatesSchema = z.object({
  candidates: z.array(
    z.object({
      keyword: z.string(),
      intent: z.string().default("informational"),
      rationale: z.string().default(""),
    })
  ),
});
export type GapCandidatesResponse = z.infer<typeof GapCandidatesSchema>;

export const GapFinalSelectionSchema = z.object({
  targetKeyword: z.string(),
  topic: z.string(),
  title: z.string(),
  reasoning: z.string().default(""),
});
export type GapFinalSelectionResponse = z.infer<typeof GapFinalSelectionSchema>;

export const SecondaryKeywordsSchema = z.object({
  keywords: z.array(
    z.object({
      keyword: z.string(),
      relevance: z.string().default("high"),
    })
  ),
});
export type SecondaryKeywordsResponse = z.infer<typeof SecondaryKeywordsSchema>;

export const GapOutlineSchema = z.object({
  outline: z.array(
    z.object({
      heading: z.string(),
      level: z.number().default(2),
      points: z.array(z.string()).optional().default([]),
    })
  ),
});
export type GapOutlineResponse = z.infer<typeof GapOutlineSchema>;

// ─── Suggest Route ───

export const TopicSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      title: z.string(),
      keyword: z.string(),
      type: z.string().default("guide"),
    })
  ),
});
export type TopicSuggestionsResponse = z.infer<typeof TopicSuggestionsSchema>;

// ─── Recommendations ───

export const RecommendationsSchema = z.object({
  recommendations: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      priority: z.enum(["high", "medium", "low"]).default("medium"),
    })
  ),
});
export type RecommendationsResponse = z.infer<typeof RecommendationsSchema>;

// ─── Brand Voice ───

export const BrandVoiceSchema = z.object({
  tone: z.string(),
  style: z.string(),
  vocabulary: z.string(),
  sentenceStructure: z.string(),
  personality: z.string(),
  doList: z.array(z.string()).default([]),
  dontList: z.array(z.string()).default([]),
  sampleExcerpt: z.string().default(""),
});
export type BrandVoiceResponse = z.infer<typeof BrandVoiceSchema>;

// ─── Coherence Check ───

export const CoherenceCheckSchema = z.object({
  isCoherent: z.boolean().default(true),
  score: z.number().default(75),
  issues: z.array(z.string()).default([]),
  needsFix: z.boolean().default(false),
});
export type CoherenceCheckResponse = z.infer<typeof CoherenceCheckSchema>;

// ─── Fact Check ───

export const FactCheckClaimsSchema = z.object({
  claims: z.array(
    z.object({
      claim: z.string(),
      context: z.string(),
      type: z.string(),
      suggestedSource: z.string(),
    })
  ),
});
export type FactCheckClaimsResponse = z.infer<typeof FactCheckClaimsSchema>;

// ─── Scan Insights ───

export const ScanInsightSchema = z.object({
  whyMentioned: z.string().default(""),
  mentionContext: z.string().default("unknown"),
  recommendations: z.array(z.string()).default([]),
});
export type ScanInsightResponse = z.infer<typeof ScanInsightSchema>;

// ─── Onboarding ───

export const PromptGenerationSchema = z.object({
  prompts: z.array(
    z.object({
      text: z.string(),
      category: z.string(),
    })
  ),
});
export type PromptGenerationResponse = z.infer<typeof PromptGenerationSchema>;

export const CompetitorDiscoverySchema = z.object({
  competitors: z.array(
    z.object({
      brandName: z.string(),
      url: z.string(),
    })
  ),
});
export type CompetitorDiscoveryResponse = z.infer<typeof CompetitorDiscoverySchema>;

// ─── Onboarding Website Analysis ───

export const WebsiteAnalysisSchema = z.object({
  brandName: z.string(),
  description: z.string(),
  industry: z.string(),
  primaryCountry: z.string().default("US"),
});
export type WebsiteAnalysisResponse = z.infer<typeof WebsiteAnalysisSchema>;

// ─── Utility: Convert Zod schema → JSON Schema ───

type SchemaTarget = "openai" | "gemini" | "anthropic";

/**
 * Convert Zod schema to JSON Schema.
 *
 * OpenAI strict mode: all properties must be in "required", additionalProperties=false
 * Gemini: does NOT support "additionalProperties"
 * Anthropic: standard JSON Schema via tool_use
 */
export function zodToJsonSchema(
  schema: z.ZodType,
  target: SchemaTarget = "openai",
): Record<string, unknown> {
  return convertZod(schema, target);
}

function convertZod(schema: z.ZodType, target: SchemaTarget): Record<string, unknown> {
  if (schema instanceof z.ZodObject) {
    const shape = schema.shape as Record<string, z.ZodType>;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    for (const [key, value] of Object.entries(shape)) {
      const unwrapped = unwrapDefault(value);
      properties[key] = convertZod(unwrapped, target);
      if (target === "openai") {
        required.push(key);
      } else if (!(value instanceof z.ZodDefault) && !(value instanceof z.ZodOptional)) {
        required.push(key);
      }
    }

    const result: Record<string, unknown> = { type: "object", properties };
    if (required.length > 0) result.required = required;
    if (target !== "gemini") {
      result.additionalProperties = false;
    }
    return result;
  }

  if (schema instanceof z.ZodArray) {
    return { type: "array", items: convertZod(schema.element as z.ZodType, target) };
  }

  if (schema instanceof z.ZodString) return { type: "string" };
  if (schema instanceof z.ZodNumber) return { type: "number" };
  if (schema instanceof z.ZodBoolean) return { type: "boolean" };

  if (schema instanceof z.ZodEnum) {
    return { type: "string", enum: (schema as unknown as { options: string[] }).options };
  }

  if (schema instanceof z.ZodDefault) {
    return convertZod((schema as z.ZodDefault<z.ZodType>)._def.innerType, target);
  }

  if (schema instanceof z.ZodOptional) {
    return convertZod((schema as z.ZodOptional<z.ZodType>)._def.innerType, target);
  }

  return { type: "string" };
}

function unwrapDefault(schema: z.ZodType): z.ZodType {
  if (schema instanceof z.ZodDefault) return (schema as z.ZodDefault<z.ZodType>)._def.innerType;
  if (schema instanceof z.ZodOptional) return (schema as z.ZodOptional<z.ZodType>)._def.innerType;
  return schema;
}
