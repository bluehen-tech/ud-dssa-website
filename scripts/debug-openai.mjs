import "dotenv/config";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error("Missing OPENAI_API_KEY in environment.");
  process.exit(1);
}

const model = (process.env.OPENAI_MODEL || "gpt-4.1-mini").trim();
const org = process.env.OPENAI_ORGANIZATION?.trim();
const project = process.env.OPENAI_PROJECT?.trim();

const headers = {
  Authorization: `Bearer ${apiKey}`,
  "Content-Type": "application/json",
};
if (org) headers["OpenAI-Organization"] = org;
if (project) headers["OpenAI-Project"] = project;

const payload = {
  model,
  input: [
    { role: "system", content: "Return ONLY JSON: {\"ok\":true}." },
    { role: "user", content: "Say ok." },
  ],
  store: false,
};

console.log("[debug-openai] model=%s keySuffix=...%s org=%s project=%s", model, apiKey.slice(-6), org ? "set" : "unset", project ? "set" : "unset");

const res = await fetch("https://api.openai.com/v1/responses", {
  method: "POST",
  headers,
  body: JSON.stringify(payload),
});

const requestId =
  res.headers.get("x-request-id") ??
  res.headers.get("openai-request-id") ??
  "(none)";

console.log("[debug-openai] status=%s request_id=%s", res.status, requestId);

const text = await res.text();
console.log("[debug-openai] body=%s", text.slice(0, 2000));

