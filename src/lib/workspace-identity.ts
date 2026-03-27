import { existsSync, readFileSync } from "fs";
import { join } from "path";

export interface WorkspaceIdentity {
  name?: string;
  emoji?: string;
}

export function readWorkspaceIdentity(workspacePath: string): WorkspaceIdentity {
  const identityPath = join(workspacePath, "IDENTITY.md");

  if (!existsSync(identityPath)) {
    return {};
  }

  try {
    const content = readFileSync(identityPath, "utf-8");
    const nameMatch = content.match(/- \*\*Name:\*\* (.+)/);
    const emojiMatch = content.match(/- \*\*Emoji[:：]\*\* (.+)/);

    return {
      name: nameMatch?.[1]?.trim(),
      emoji: emojiMatch?.[1]?.trim().split(" ")[0],
    };
  } catch {
    return {};
  }
}
