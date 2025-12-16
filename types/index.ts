// src/types/index.ts
export type SourceFile = {
  path: string;
  sha: string;
  content: string;
};

export type GithubInfo = {
  owner: string;
  repo: string;
  default_branch: string;
  commit_hash: string;
  files: SourceFile[];
};
