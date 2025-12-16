import { GithubInfo } from "@/types";

const GROQ_API_URL = process.env.GROQ_API_URL || "";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

function buildPrompt(githubInfo: GithubInfo): string {
  const summaries: string[] = [];

  for (const file of githubInfo.files || []) {
    const path = file.path.toLowerCase();

    if (path.includes("/api/")) {
      summaries.push(`${file.path}: API route`);
    } else if (path.includes("component")) {
      summaries.push(`${file.path}: UI component`);
    } else if (path.includes("page") || path.includes("app")) {
      summaries.push(`${file.path}: Application page or layout`);
    } else if (path.includes("redis")) {
      summaries.push(`${file.path}: Redis caching utility`);
    } else {
      summaries.push(`${file.path}: Supporting file`);
    }

    if (summaries.length > 100) break;
  }

  return `
You are a senior software architect and documentation expert.

The following repository analysis is FACTUAL.
Do NOT invent features or behavior.

Repository: ${githubInfo.owner}/${githubInfo.repo}

Files summary:
${summaries.join("\n")}

TASK:
Generate structured documentation in STRICT JSON format.

RULES:
- Output MUST be valid JSON
- Do NOT include markdown
- Do NOT include explanations outside JSON
- Do NOT invent functionality
- If something is unclear, say "Not implemented"

JSON SCHEMA (follow EXACTLY):

{
  "overview": "short paragraph describing what the project does",
  "flow": "high-level explanation of how the system works end-to-end",
  "functions": [
    {
      "name": "file or module name",
      "responsibility": "why it exists and what it does"
    }
  ],
  "techStack": {
    "frontend": [],
    "backend": [],
    "database": [],
    "tooling": []
  },
  "setup": [
    "step 1",
    "step 2"
  ]
}

IMPORTANT:
- Only include functions/files that clearly exist
- Base everything on filenames and structure
`;
}

async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_API_URL || !GROQ_API_KEY) {
    throw new Error("GROQ_API_URL or GROQ_API_KEY not set in environment");
  }

  const payload = {
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content:
          "You output ONLY valid JSON. No markdown. No prose outside JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],

    temperature: 0.2,
    max_tokens: 4096,
  };

  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq API Error ${res.status}: ${text}`);
  }

  const json = await res.json();

  // OpenAI-compatible response shape
  return json.choices?.[0]?.message?.content ?? "";
}

export const GenerateDocInfo = async (
  githubInfo: GithubInfo,
  promptVersion = "v2"
) => {
  const prompt = buildPrompt(githubInfo);
  const raw = await callGroq(prompt);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("LLM did not return valid JSON");
  }

  return {
    documentation: parsed, // structured
    commit_hash: githubInfo.commit_hash,
    generated_at: new Date().toISOString(),
    prompt_version: promptVersion,
  };
};
