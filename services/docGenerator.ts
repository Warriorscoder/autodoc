import { RepoAnalysis } from "@/services/repoAnalyzer";
import {
  GeneratedDocumentation,
  GeneratedDocumentationSchema,
} from "@/services/schemas";

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";
import { ChatOpenAI } from "@langchain/openai";

/**
 * -----------------------------
 * LLM (Groq – OpenAI compatible)
 * -----------------------------
 */
const llm = new ChatOpenAI({
  apiKey: process.env.GROQ_API_KEY!,
  modelName: "llama-3.1-8b-instant",
  temperature: 0,
  configuration: {
    baseURL: "https://api.groq.com/openai/v1",
  },
});

/**
 * ---------------------------------
 * Structured output parser (Zod)
 * ---------------------------------
 */
const parser = StructuredOutputParser.fromZodSchema(
  GeneratedDocumentationSchema
);

/**
 * -----------------------------
 * Prompt template (CRITICAL)
 * -----------------------------
 */
const prompt = ChatPromptTemplate.fromTemplate(`
You are a senior software architect and technical documentation expert.

Your task:
Analyze the repository analysis below and return ONE valid JSON object
that strictly matches the required structure.

ABSOLUTE RULES (DO NOT BREAK):
- Do NOT include markdown
- Do NOT include triple backticks
- Do NOT include JSON schema
- Do NOT include explanations
- The output must be a raw JSON object only

Use ONLY the provided analysis.
Do NOT invent features.
If something is missing, say "Not implemented".

{format_instructions}

REPOSITORY ANALYSIS:
{analysis}
`);

/**
 * -----------------------------
 * LangChain Runnable (Stage 2)
 * -----------------------------
 */
const chain = RunnableSequence.from([
  {
    analysis: (input: RepoAnalysis) => JSON.stringify(input, null, 2),
    format_instructions: () => parser.getFormatInstructions(),
  },
  prompt,
  llm,
  parser,
]);

/**
 * -----------------------------
 * Defensive JSON extractor
 * -----------------------------
 */
function extractPureJSON(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("No valid JSON object found in LLM output");
  }
  return JSON.parse(match[0]);
}

/**
 * -----------------------------
 * Public API
 * -----------------------------
 */
export async function generateDocumentationWithLangChain(
  analysis: RepoAnalysis
): Promise<GeneratedDocumentation> {
  try {
    return await chain.invoke(analysis);
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "llmOutput" in err &&
      typeof (err as { llmOutput?: unknown }).llmOutput === "string"
    ) {
      const cleaned = extractPureJSON((err as { llmOutput: string }).llmOutput);
      return GeneratedDocumentationSchema.parse(cleaned);
    }

    throw err;
  }
}
