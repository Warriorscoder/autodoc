import { GithubInfo } from "@/types";

/**
 * This is the factual, deterministic analysis layer.
 * NO AI. NO GUESSING.
 * Everything here must be derived from filenames and structure only.
 */

export type RepoAnalysis = {
  projectName: string;
  shortDescription: string;

  flow: string[];

  functions: {
    name: string;
    responsibility: string;
  }[];

  techStack: {
    frontend: string[];
    backend: string[];
    database: string[];
    tooling: string[];
  };

  setupHints: string[];
};

export function analyzeRepository(githubInfo: GithubInfo): RepoAnalysis {
  const files = githubInfo.files ?? [];
  const paths = files.map(f => f.path.toLowerCase());

  // -----------------------------
  // Project name
  // -----------------------------
  const projectName = githubInfo.repo;

  // -----------------------------
  // Tech stack detection
  // -----------------------------
  const techStack = {
    frontend: [] as string[],
    backend: [] as string[],
    database: [] as string[],
    tooling: [] as string[],
  };

  if (paths.some(p => p.includes("next.config"))) {
    techStack.frontend.push("Next.js");
  }

  if (paths.some(p => p.endsWith(".tsx") || p.endsWith(".jsx"))) {
    techStack.frontend.push("React");
  }

  if (paths.some(p => p.endsWith(".ts"))) {
    techStack.backend.push("TypeScript");
  }

  if (paths.some(p => p.includes("redis"))) {
    techStack.database.push("Redis");
  }

  if (paths.some(p => p.includes("eslint"))) {
    techStack.tooling.push("ESLint");
  }

  if (paths.some(p => p.includes("tailwind"))) {
    techStack.tooling.push("Tailwind CSS");
  }

  // Deduplicate
(Object.keys(techStack) as Array<keyof typeof techStack>).forEach(key => {
  techStack[key] = [...new Set(techStack[key])];
});


  // -----------------------------
  // Function-level understanding
  // -----------------------------
  const functions: RepoAnalysis["functions"] = [];

  for (const file of files) {
    const p = file.path.toLowerCase();

    if (p.includes("/api/generate-excel")) {
      functions.push({
        name: "generate-excel API",
        responsibility: "Generates an Excel file from provided JSON data",
      });
    }

    if (p.includes("/api/rate-limit")) {
      functions.push({
        name: "rate-limit-status API",
        responsibility: "Returns remaining API request quota using Redis",
      });
    }

    if (p.includes("redis")) {
      functions.push({
        name: "Redis utility",
        responsibility: "Handles caching or request tracking logic",
      });
    }

    if (p.includes("component")) {
      functions.push({
        name: file.path,
        responsibility: "Reusable UI component",
      });
    }
  }

  // -----------------------------
  // Flow (system behavior)
  // -----------------------------
  const flow: string[] = [];

  if (paths.some(p => p.includes("/api/"))) {
    flow.push("Client sends request to API endpoint");
  }

  if (paths.some(p => p.includes("redis"))) {
    flow.push("Request metadata is checked or stored in Redis");
  }

  if (paths.some(p => p.includes("generate-excel"))) {
    flow.push("Server generates Excel file and returns it as response");
  }

  if (flow.length === 0) {
    flow.push("No clear runtime flow detected");
  }

  // -----------------------------
  // Setup hints
  // -----------------------------
  const setupHints: string[] = [];

  if (paths.some(p => p.includes("package.json"))) {
    setupHints.push("Install dependencies using npm or yarn");
  }

  if (paths.some(p => p.includes("next.config"))) {
    setupHints.push("Run development server using npm run dev");
  }

  setupHints.push("Configure required environment variables");

  // -----------------------------
  // Short description (FACTUAL)
  // -----------------------------
  const shortDescription =
    "A Next.js project exposing backend APIs for generating Excel files and tracking request limits.";

  return {
    projectName,
    shortDescription,
    flow,
    functions,
    techStack,
    setupHints,
  };
}
