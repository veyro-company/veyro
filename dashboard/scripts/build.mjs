import { cp, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const output = path.join(root, "dist");
await mkdir(output, { recursive: true });
// Jawna lista: dokumentacja, SQL, testy i kopie danych nie są publikowane.
for (const file of ["index.html", "css", "js", "assets"]) {
  await cp(path.join(root, file), path.join(output, file), {
    recursive: true,
    force: true,
  });
}
await writeFile(path.join(output, ".nojekyll"), "");
console.log(
  "Gotowe: dist/ (interfejs lokalny; backend wymaga dalszego podłączenia).",
);
