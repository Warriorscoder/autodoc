import { NextResponse } from "next/server";
import { GetGithubInfo } from "@/services/github";
import { analyzeRepository } from "@/services/repoAnalyzer";
import { generateDocumentationWithLangChain } from "@/services/docGenerator";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Request body:", body);

    const repoUrl = body.repoUrl;
    if (!repoUrl) {
      console.error("Missing repoUrl");
      return NextResponse.json(
        { error: "Missing repoUrl in request body" },
        { status: 400 }
      );
    }

    console.log("Fetching GitHub info...");
    const githubInfo = await GetGithubInfo(repoUrl);

    console.log("Analyzing repository...");
    const analysis = analyzeRepository(githubInfo);

    console.log("Generating documentation via LangChain...");
    const documentation = await generateDocumentationWithLangChain(analysis);

    if (!documentation) {
      console.error("LangChain returned empty result");
      return NextResponse.json(
        { error: "Documentation generation failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      documentation,
      commit_hash: githubInfo.commit_hash,
      generated_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown server error" },
      { status: 500 }
    );
  }
}
