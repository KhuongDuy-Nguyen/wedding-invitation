import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

function normalizeBasePath(value) {
  if (!value || value === "/") return "";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}

const outputUrl = new URL("../out/", import.meta.url);
const basePath = normalizeBasePath(process.env.PAGES_BASE_PATH);

test("exports a deployable static wedding invitation", async () => {
  await Promise.all([
    access(new URL("index.html", outputUrl)),
    access(new URL("404.html", outputUrl)),
    access(new URL("_next/static/", outputUrl)),
    access(new URL(".nojekyll", outputUrl)),
  ]);

  const html = await readFile(new URL("index.html", outputUrl), "utf8");
  assert.match(html, /Duy &amp; Lan \| Thiệp cưới/i);
  assert.match(html, /Lịch hẹn Sài Gòn/i);
  assert.ok(html.includes(`${basePath}/_next/static/`));
  assert.ok(html.includes(`${basePath}/images/logo/wedding-lockup.webp`));
  assert.doesNotMatch(html, /_vinext|dist\/server/i);
});
