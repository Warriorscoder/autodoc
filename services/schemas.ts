import { z } from "zod";

export const GeneratedDocumentationSchema = z.object({
  overview: z.string(),
  flow: z.array(z.string()),
  functions: z.array(
    z.object({
      name: z.string(),
      responsibility: z.string(),
    })
  ),
  techStack: z.object({
    frontend: z.array(z.string()),
    backend: z.array(z.string()),
    database: z.array(z.string()),
    tooling: z.array(z.string()),
  }),
  setup: z.array(z.string()),
});

export type GeneratedDocumentation = z.infer<
  typeof GeneratedDocumentationSchema
>;
