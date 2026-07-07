import fs from "fs";
import path from "path";

const textDir = path.join("public", "runes", "text");
const outFile = path.join("src", "lib", "runeDescriptions.ts");

const descriptions = Object.fromEntries(
  fs
    .readdirSync(textDir)
    .filter((file) => file.endsWith(".txt"))
    .map((file) => {
      const name = file.replace(".txt", "");
      const text = fs.readFileSync(path.join(textDir, file), "utf8").trim();
      return [name, text];
    }),
);

const output =
  "export const RUNE_DESCRIPTIONS: Record<string, string> = " +
  JSON.stringify(descriptions, null, 2) +
  ";\n";

fs.writeFileSync(outFile, output);
console.log(`Wrote ${Object.keys(descriptions).length} descriptions to ${outFile}`);