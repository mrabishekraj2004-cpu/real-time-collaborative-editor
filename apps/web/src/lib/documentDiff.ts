export type DiffKind =
  | "unchanged"
  | "added"
  | "removed"
  | "modified"
  | "moved";

export interface DiffParagraph {
  id: string;
  kind: DiffKind;

  before:
    | string
    | null;

  after:
    | string
    | null;

  beforeIndex:
    | number
    | null;

  afterIndex:
    | number
    | null;

  similarity: number;
}

export interface DocumentDiff {
  paragraphs:
    DiffParagraph[];

  summary: {
    unchanged: number;
    added: number;
    removed: number;
    modified: number;
    moved: number;
  };
}

function normalizeText(
  value: string,
) {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function splitParagraphs(
  content: string,
) {
  return content
    .split(/\n\s*\n|\n/)
    .map((paragraph) =>
      paragraph.trim(),
    )
    .filter(Boolean);
}

function getWords(
  value: string,
) {
  return normalizeText(
    value,
  )
    .split(/\s+/)
    .filter(Boolean);
}

function calculateSimilarity(
  first: string,
  second: string,
) {
  const firstText =
    normalizeText(first);

  const secondText =
    normalizeText(second);

  if (
    firstText ===
    secondText
  ) {
    return 1;
  }

  if (
    !firstText ||
    !secondText
  ) {
    return 0;
  }

  const firstWords =
    getWords(first);

  const secondWords =
    getWords(second);

  const firstSet =
    new Set(firstWords);

  const secondSet =
    new Set(secondWords);

  let sharedWords = 0;

  for (
    const word of firstSet
  ) {
    if (
      secondSet.has(word)
    ) {
      sharedWords += 1;
    }
  }

  const totalUniqueWords =
    new Set([
      ...firstSet,
      ...secondSet,
    ]).size;

  if (
    totalUniqueWords ===
    0
  ) {
    return 0;
  }

  return (
    sharedWords /
    totalUniqueWords
  );
}

function createId(
  beforeIndex: number | null,
  afterIndex: number | null,
) {
  return [
    beforeIndex ??
      "new",
    afterIndex ??
      "gone",
  ].join("-");
}

export function compareDocuments(
  beforeContent: string,
  afterContent: string,
): DocumentDiff {
  const beforeParagraphs =
    splitParagraphs(
      beforeContent,
    );

  const afterParagraphs =
    splitParagraphs(
      afterContent,
    );

  const usedBefore =
    new Set<number>();

  const usedAfter =
    new Set<number>();

  const results:
    DiffParagraph[] = [];

  for (
    let beforeIndex = 0;
    beforeIndex <
    beforeParagraphs.length;
    beforeIndex += 1
  ) {
    const beforeParagraph =
      beforeParagraphs[
        beforeIndex
      ];

    const exactIndex =
      afterParagraphs.findIndex(
        (
          afterParagraph,
          afterIndex,
        ) =>
          !usedAfter.has(
            afterIndex,
          ) &&
          normalizeText(
            afterParagraph,
          ) ===
            normalizeText(
              beforeParagraph,
            ),
      );

    if (
      exactIndex ===
      -1
    ) {
      continue;
    }

    usedBefore.add(
      beforeIndex,
    );

    usedAfter.add(
      exactIndex,
    );

    results.push({
      id:
        createId(
          beforeIndex,
          exactIndex,
        ),

      kind:
        beforeIndex ===
        exactIndex
          ? "unchanged"
          : "moved",

      before:
        beforeParagraph,

      after:
        afterParagraphs[
          exactIndex
        ],

      beforeIndex,
      afterIndex:
        exactIndex,

      similarity: 1,
    });
  }

  for (
    let beforeIndex = 0;
    beforeIndex <
    beforeParagraphs.length;
    beforeIndex += 1
  ) {
    if (
      usedBefore.has(
        beforeIndex,
      )
    ) {
      continue;
    }

    const beforeParagraph =
      beforeParagraphs[
        beforeIndex
      ];

    let bestIndex =
      -1;

    let bestSimilarity =
      0;

    for (
      let afterIndex = 0;
      afterIndex <
      afterParagraphs.length;
      afterIndex += 1
    ) {
      if (
        usedAfter.has(
          afterIndex,
        )
      ) {
        continue;
      }

      const similarity =
        calculateSimilarity(
          beforeParagraph,
          afterParagraphs[
            afterIndex
          ],
        );

      if (
        similarity >
        bestSimilarity
      ) {
        bestSimilarity =
          similarity;

        bestIndex =
          afterIndex;
      }
    }

    if (
      bestIndex !==
        -1 &&
      bestSimilarity >=
        0.42
    ) {
      usedBefore.add(
        beforeIndex,
      );

      usedAfter.add(
        bestIndex,
      );

      results.push({
        id:
          createId(
            beforeIndex,
            bestIndex,
          ),

        kind:
          "modified",

        before:
          beforeParagraph,

        after:
          afterParagraphs[
            bestIndex
          ],

        beforeIndex,

        afterIndex:
          bestIndex,

        similarity:
          bestSimilarity,
      });

      continue;
    }

    usedBefore.add(
      beforeIndex,
    );

    results.push({
      id:
        createId(
          beforeIndex,
          null,
        ),

      kind:
        "removed",

      before:
        beforeParagraph,

      after:
        null,

      beforeIndex,

      afterIndex:
        null,

      similarity: 0,
    });
  }

  for (
    let afterIndex = 0;
    afterIndex <
    afterParagraphs.length;
    afterIndex += 1
  ) {
    if (
      usedAfter.has(
        afterIndex,
      )
    ) {
      continue;
    }

    results.push({
      id:
        createId(
          null,
          afterIndex,
        ),

      kind:
        "added",

      before:
        null,

      after:
        afterParagraphs[
          afterIndex
        ],

      beforeIndex:
        null,

      afterIndex,

      similarity: 0,
    });
  }

  results.sort(
    (first, second) => {
      const firstPosition =
        first.afterIndex ??
        first.beforeIndex ??
        Number.MAX_SAFE_INTEGER;

      const secondPosition =
        second.afterIndex ??
        second.beforeIndex ??
        Number.MAX_SAFE_INTEGER;

      return (
        firstPosition -
        secondPosition
      );
    },
  );

  const summary = {
    unchanged: 0,
    added: 0,
    removed: 0,
    modified: 0,
    moved: 0,
  };

  for (
    const paragraph of results
  ) {
    summary[
      paragraph.kind
    ] += 1;
  }

  return {
    paragraphs:
      results,

    summary,
  };
}