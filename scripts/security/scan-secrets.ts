import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile } from "node:fs/promises";

const execFileAsync = promisify(execFile);
const secretPatterns = [
  /AKIA[0-9A-Z]{16}/,
  /(?:sk|pk)_(?:live|test)_[A-Za-z0-9]{12,}/,
  /gh[pousr]_[A-Za-z0-9]{20,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];

async function main(): Promise<void> {
  const { stdout } = await execFileAsync("git", ["ls-files"]);
  const files = stdout.split(/\r?\n/).filter(Boolean);
  const findings: string[] = [];
  for (const file of files) {
    try {
      const contents = await readFile(file, "utf8");
      if (secretPatterns.some((pattern) => pattern.test(contents))) findings.push(file);
    } catch {
      // Binary or unreadable tracked files are outside this text scan.
    }
  }
  if (findings.length > 0) throw new Error(`Potential secrets found in tracked files: ${findings.join(", ")}`);
  console.log(`Secret scan passed for ${files.length} tracked files.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Secret scan failed");
  process.exitCode = 1;
});

