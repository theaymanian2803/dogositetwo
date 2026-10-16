import { execFileSync } from "node:child_process";
import { statSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const isDeploy = process.argv.includes("--deploy");
const mode = isDeploy ? "deploy" : "source";

const repoRoot = process.cwd();
const folderName = basename(repoRoot);
const parentDir = dirname(repoRoot);
const outName = isDeploy ? `${folderName}-deploy.zip` : `${folderName}.zip`;
const outPath = join(parentDir, outName);

const excludes = ["node_modules", "dist", ".superpowers"];
if (isDeploy) excludes.push(".git");

const args = [
  "-a",
  "-c",
  "-f",
  outPath,
  "-C",
  parentDir,
  ...excludes.map((e) => `--exclude=${e}`),
  folderName,
];

try {
  execFileSync("tar", args, { stdio: "inherit" });
} catch {
  console.error(`Failed to create ${outPath}`);
  process.exit(1);
}

const sizeMb = (statSync(outPath).size / (1024 * 1024)).toFixed(1);
console.log(`Created ${outPath} (${sizeMb} MB) [${mode}]`);
