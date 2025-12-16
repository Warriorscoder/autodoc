import { Octokit } from "@octokit/rest";
import { GithubInfo, SourceFile } from "@/types";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

/**
 * Fetches repository metadata and file tree (NO file contents)
 */
export async function GetGithubInfo(repoUrl: string): Promise<GithubInfo> {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

  if (!match) {
    throw new Error("Invalid GitHub repository URL");
  }

  const [, owner, repo] = match;

  // 1️⃣ Repo metadata
  const repoRes = await octokit.rest.repos.get({
    owner,
    repo,
  });

  const defaultBranch = repoRes.data.default_branch;

  // 2️⃣ Latest commit
  const commitRes = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: defaultBranch,
  });

  const commitHash = commitRes.data.sha;

  // 3️⃣ Git tree (recursive)
  const treeRes = await octokit.rest.git.getTree({
    owner,
    repo,
    tree_sha: commitHash,
    recursive: "true",
  });

  const files: SourceFile[] = treeRes.data.tree
    .filter((item) => item.type === "blob" && item.path && item.sha)
    .map((item) => ({
      path: item.path as string,
      sha: item.sha as string,
      content: "", // intentionally empty
    }));

  return {
    owner,
    repo,
    default_branch: defaultBranch,
    commit_hash: commitHash,
    files,
  };
}
