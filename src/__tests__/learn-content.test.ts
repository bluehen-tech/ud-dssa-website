import { describe, expect, it } from "vitest";
import { STAGES } from "@/content/learn/stages";
import { GLOSSARY, findWord, type GlossaryEntry } from "@/content/learn/glossary";
import { renderLessonHtml } from "@/components/learn/lessonHtml";

/**
 * Guards the Builder Path's reading level. Most learners have never heard of
 * the tools the path teaches, so a lesson may not lean on a word before the
 * stage that teaches it. See src/content/learn/VOICE.md.
 */

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function names(entry: GlossaryEntry): string[] {
  return [entry.word, ...(entry.aliases ?? [])];
}

/** Matches a word on its own, so "Git" does not match inside "GitHub" and "commit" does not match "committed". */
function wholeWord(name: string): RegExp {
  return new RegExp(`(?<![A-Za-z0-9])${escapeRegExp(name)}(?![A-Za-z0-9])`, "i");
}

/** The text a learner reads without opening anything: no optional blocks, no code, no web addresses, no [[marked]] words. */
function mainText(markdown: string): string {
  return markdown
    .replace(/\r\n/g, "\n")
    .replace(/^:::more[^\n]*\n[\s\S]*?\n:::[ \t]*$/gm, "")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`\n]*`/g, "")
    .replace(/\[\[[^\]\n]+\]\]/g, "")
    .replace(/\]\([^)]*\)/g, "]")
    .replace(/[\w.-]+\.(?:com|org|edu|app|dev|io)\b[^\s)]*/g, "");
}

const documents = STAGES.flatMap((stage) => [
  { stage, name: `stage ${stage.id} lesson`, text: stage.lesson },
  { stage, name: `stage ${stage.id} build card`, text: stage.build },
]);

describe("Builder Path glossary", () => {
  it("has no duplicate words", () => {
    const seen = new Set<string>();
    for (const entry of GLOSSARY) {
      for (const name of names(entry)) {
        const key = name.toLowerCase();
        expect(seen.has(key), `"${name}" is listed twice`).toBe(false);
        seen.add(key);
      }
    }
  });

  it("keeps each definition short", () => {
    for (const entry of GLOSSARY) {
      expect(entry.definition.length, `definition of "${entry.word}"`).toBeLessThanOrEqual(140);
    }
  });

  it("is taught: each word is defined in bold in its own stage", () => {
    for (const entry of GLOSSARY) {
      const stage = STAGES.find((s) => s.id === entry.stage);
      expect(stage, `"${entry.word}" names stage ${entry.stage}, which does not exist`).toBeDefined();
      const text = `${stage!.lesson}\n${stage!.build}`;
      const bolded = names(entry).some((name) =>
        new RegExp(`\\*\\*\`?${escapeRegExp(name)}\`?\\*\\*`, "i").test(text)
      );
      expect(bolded, `"${entry.word}" is never bolded in stage ${entry.stage}'s lesson or build card`).toBe(true);
    }
  });
});

describe("Builder Path lessons and build cards", () => {
  it("mark only words that have a definition", () => {
    for (const doc of documents) {
      const marked = doc.text.match(/\[\[[^\]\n]+\]\]/g) ?? [];
      for (const marker of marked) {
        const word = marker.slice(2, -2);
        expect(findWord(word), `${doc.name}: [[${word}]] is not in glossary.ts`).toBeDefined();
      }
    }
  });

  it("render with every block closed and every word resolved", () => {
    for (const doc of documents) {
      const html = renderLessonHtml(doc.text, { replacements: { githubUsername: "octocat" } });
      expect(html, `${doc.name}: a ::: block is not closed`).not.toContain(":::");
      expect(html, `${doc.name}: a [[word]] did not render`).not.toContain("[[");
      expect(html, `${doc.name}: a {{placeholder}} was not filled`).not.toContain("{{");
    }
  });

  it("open each lesson that has a concept check with the short version", () => {
    for (const stage of STAGES.filter((s) => s.questions.length > 0)) {
      expect(stage.lesson, `stage ${stage.id} lesson has no :::short block`).toMatch(/^:::short[ \t]*\r?$/m);
      const html = renderLessonHtml(stage.lesson, { skipHref: "#concept-check" });
      expect(html).toContain("The short version");
      expect(html).toContain('href="#concept-check"');
    }
  });

  it("do not use a tool name or technical word before the stage that teaches it", () => {
    const problems: string[] = [];
    const strict = GLOSSARY.filter((entry) => entry.strict);

    const check = (stageId: number, where: string, text: string) => {
      for (const entry of strict) {
        if (entry.stage <= stageId) continue;
        for (const name of names(entry)) {
          if (wholeWord(name).test(text)) {
            problems.push(`${where} uses "${name}", which is taught in stage ${entry.stage}`);
          }
        }
      }
    };

    for (const stage of STAGES) {
      check(stage.id, `stage ${stage.id} title`, stage.title);
      check(stage.id, `stage ${stage.id} path-map line`, stage.idea);
      check(stage.id, `stage ${stage.id} lesson`, mainText(stage.lesson));
      check(stage.id, `stage ${stage.id} build card`, mainText(stage.build));
      for (const question of stage.questions) {
        const text = [question.concept, question.prompt, question.answer, ...question.wrong].join("\n");
        check(stage.id, `stage ${stage.id} question ${question.id}`, text);
      }
    }

    expect(problems, problems.join("\n")).toEqual([]);
  });

  it("follow the voice guide: no filler words, at most one em-dash", () => {
    for (const doc of documents) {
      const text = mainText(doc.text);
      for (const word of ["simply", "just", "easy", "easily", "powerful", "exciting"]) {
        expect(wholeWord(word).test(text), `${doc.name} uses "${word}"`).toBe(false);
      }
      const dashes = (doc.text.match(/—/g) ?? []).length;
      expect(dashes, `${doc.name} has ${dashes} em-dashes`).toBeLessThanOrEqual(1);
    }
  });
});

describe("Builder Path concept checks", () => {
  it("point each question at a lesson heading the learner can find", () => {
    // A missed question tells the learner which part to reread. That heading must exist outside the optional blocks.
    for (const stage of STAGES) {
      const headings = (mainText(stage.lesson).match(/^#{1,3} .+$/gm) ?? []).map((line) =>
        line.replace(/^#+ /, "").trim().toLowerCase()
      );
      for (const question of stage.questions) {
        const section = question.concept.split(":")[0].trim().toLowerCase();
        const found = headings.some((heading) => heading === section || heading.startsWith(section));
        expect(found, `stage ${stage.id} question ${question.id}: no lesson heading matches "${question.concept}"`).toBe(
          true
        );
      }
    }
  });

  it("have 3 to 5 questions, unique ids and four distinct choices each", () => {
    const ids = new Set<string>();
    for (const stage of STAGES.filter((s) => s.questions.length > 0)) {
      expect(stage.questions.length, `stage ${stage.id}`).toBeGreaterThanOrEqual(3);
      expect(stage.questions.length, `stage ${stage.id}`).toBeLessThanOrEqual(5);
      for (const question of stage.questions) {
        expect(ids.has(question.id), `duplicate question id ${question.id}`).toBe(false);
        ids.add(question.id);
        expect(new Set([question.answer, ...question.wrong]).size, `question ${question.id}`).toBe(4);
      }
    }
  });
});
