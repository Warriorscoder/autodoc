export const docKey = (commitHash: string, promptVersion = "v1") =>
  `doc:${commitHash}:${promptVersion}`;

export const githubTreeKey = (commitHash: string) => `github:tree:${commitHash}`;
export const githubFileKey = (commitHash: string, path: string) =>
  `github:file:${commitHash}:${encodeURIComponent(path)}`;
