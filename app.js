const sourceText = document.querySelector("#sourceText");
const resultText = document.querySelector("#resultText");
const tone = document.querySelector("#tone");
const language = document.querySelector("#language");
const strength = document.querySelector("#strength");
const strengthValue = document.querySelector("#strengthValue");
const reduceBuzzwords = document.querySelector("#reduceBuzzwords");
const varySentences = document.querySelector("#varySentences");
const addHumanTouch = document.querySelector("#addHumanTouch");
const inputCount = document.querySelector("#inputCount");
const outputCount = document.querySelector("#outputCount");
const summaryText = document.querySelector("#summaryText");
const humanizeBtn = document.querySelector("#humanizeBtn");
const sampleBtn = document.querySelector("#sampleBtn");
const copyBtn = document.querySelector("#copyBtn");
const copyForCheckBtn = document.querySelector("#copyForCheckBtn");
const detectorButtons = document.querySelectorAll(".detector-open");
const autoScore = document.querySelector("#autoScore");
const autoLabel = document.querySelector("#autoLabel");
const autoMeter = document.querySelector("#autoMeter");
const signalList = document.querySelector("#signalList");
const sentenceFlags = document.querySelector("#sentenceFlags");
const toast = document.querySelector("#toast");

const samples = {
  ko: `본 문서는 사용자의 업무 효율성을 극대화하기 위해 작성되었습니다. 다양한 관점에서 살펴보면 해당 기능은 매우 중요한 역할을 수행한다고 볼 수 있습니다. 또한 이를 통해 보다 향상된 사용자 경험을 제공할 수 있으며, 결과적으로 긍정적인 효과를 기대할 수 있습니다.`,
  en: `This document has been prepared to maximize the user's work efficiency. From various perspectives, this feature can be considered to play a very important role. In addition, it can provide an enhanced user experience, and as a result, positive outcomes can be expected.`,
};

const replacementRules = {
  ko: [
    ["본 문서는", "이 문서는"],
    ["사용자의", "사용자가 느끼는"],
    ["업무 효율성을 극대화하기 위해", "일을 더 수월하게 만들기 위해"],
    ["다양한 관점에서 살펴보면", "여러 면에서 보면"],
    ["해당 기능은", "이 기능은"],
    ["매우 중요한 역할을 수행한다고 볼 수 있습니다", "꽤 중요한 역할을 합니다"],
    ["보다 향상된", "더 나은"],
    ["사용자 경험을 제공할 수 있으며", "사용자 경험을 만들 수 있고"],
    ["결과적으로", "결국"],
    ["긍정적인 효과를 기대할 수 있습니다", "좋은 효과도 기대할 수 있습니다"],
    ["최적화", "개선"],
    ["극대화", "높이기"],
    ["활용할 수 있습니다", "쓸 수 있습니다"],
    ["수행합니다", "합니다"],
  ],
  en: [
    ["This document has been prepared to", "This document aims to"],
    ["maximize", "improve"],
    ["From various perspectives,", "Looking at it practically,"],
    ["can be considered to play a very important role", "plays an important role"],
    ["In addition,", "Also,"],
    ["provide an enhanced user experience", "make the experience better"],
    ["as a result,", "in turn,"],
    ["positive outcomes can be expected", "the results should improve"],
    ["it is important to note that", "notably"],
    ["a wide range of", "many"],
    ["in order to", "to"],
    ["utilize", "use"],
    ["facilitate", "help"],
    ["robust", "reliable"],
    ["seamless", "smooth"],
  ],
};

const buzzwords = {
  ko: ["매우 ", "상당히 ", "혁신적인 ", "효율적인 ", "탁월한 "],
  en: ["very ", "extremely ", "highly ", "significantly ", "innovative ", "cutting-edge "],
};

const connectors = {
  ko: ["다만", "여기서 중요한 점은", "실제로는"],
  en: ["That said,", "In practice,", "What matters here is"],
};

const emptyLabels = {
  ko: {
    label: "문서 대기 중",
    signal: "문서를 입력하거나 수정본을 만들면 자동으로 분석합니다.",
    sentence: "아직 분석할 문장이 없습니다.",
  },
  en: {
    label: "Waiting for text",
    signal: "Enter a document or create a revision to analyze it automatically.",
    sentence: "No sentences to analyze yet.",
  },
};

function detectLanguage(text) {
  if (language.value !== "auto") return language.value;

  const koreanChars = (text.match(/[ㄱ-ㅎㅏ-ㅣ가-힣]/g) || []).length;
  const englishChars = (text.match(/[A-Za-z]/g) || []).length;
  return englishChars > koreanChars ? "en" : "ko";
}

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?。]|다\.|요\.)\s+/)
    .filter(Boolean);
}

function applyReplacements(sentence, notes, lang) {
  let revised = sentence;

  replacementRules[lang].forEach(([from, to]) => {
    const hasMatch = lang === "en"
      ? revised.toLowerCase().includes(from.toLowerCase())
      : revised.includes(from);

    if (!hasMatch) return;

    if (lang === "en") {
      revised = revised.replace(new RegExp(escapeRegExp(from), "gi"), to);
    } else {
      revised = revised.replaceAll(from, to);
    }

    notes.add(lang === "en"
      ? `Replaced formulaic wording such as "${from}".`
      : `딱딱한 표현 "${from}"을 더 자연스러운 표현으로 바꿨습니다.`);
  });

  if (reduceBuzzwords.checked) {
    buzzwords[lang].forEach((word) => {
      revised = lang === "en"
        ? revised.replace(new RegExp(`\\b${escapeRegExp(word)}`, "gi"), "")
        : revised.replaceAll(word, "");
    });
  }

  return revised;
}

function addRhythm(sentence, index, level, notes, lang) {
  let revised = sentence;

  if (!varySentences.checked || level < 45) return revised;

  if (index % 3 === 1 && revised.length > 45) {
    const prefix = lang === "en" ? "Still, " : "다만 ";
    const alreadyHasPrefix = lang === "en"
      ? /^(Still|However|That said),/i.test(revised)
      : revised.startsWith("다만");

    if (!alreadyHasPrefix) {
      revised = `${prefix}${lang === "en" ? lowerFirst(revised) : revised}`;
      notes.add(lang === "en"
        ? "Varied repetitive sentence openings."
        : "비슷하게 반복되는 문장 시작을 바꿨습니다.");
    }
  }

  if (index % 4 === 2) {
    const before = revised;
    revised = lang === "en"
      ? revised.replace(/\bmoreover\b/gi, "also").replace(/\bfurthermore\b/gi, "also")
      : revised.replace("있으며", "있고");

    if (before !== revised) {
      notes.add(lang === "en"
        ? "Softened formal connectors."
        : "문어체 연결어를 구어에 가까운 흐름으로 다듬었습니다.");
    }
  }

  return revised;
}

function addHumanConnector(sentence, index, level, notes, lang) {
  if (!addHumanTouch.checked || level < 60 || index === 0) return sentence;

  if (index % 3 === 0 && sentence.length < 110) {
    notes.add(lang === "en"
      ? "Added a more natural transition between sentences."
      : "문장 사이의 연결감을 보강했습니다.");
    return `${connectors[lang][index % connectors[lang].length]} ${sentence}`;
  }

  return sentence;
}

function applyTone(sentence, notes, lang) {
  let revised = sentence;

  if (lang === "ko") {
    if (tone.value === "casual") {
      revised = revised
        .replace(/습니다\.$/, "어요.")
        .replace(/합니다\.$/, "해요.")
        .replace(/됩니다\.$/, "돼요.");
    }

    if (tone.value === "business") {
      revised = revised.replace("꽤 중요한 역할을 합니다.", "중요한 역할을 합니다.");
    }

    return revised;
  }

  if (tone.value === "business") {
    revised = revised
      .replace(/\bI think\b/gi, "The key point is")
      .replace(/\bkind of\b/gi, "somewhat");
  }

  if (tone.value === "essay" && !/[.!?]$/.test(revised)) {
    revised = `${revised}.`;
  }

  if (tone.value === "casual") {
    revised = revised
      .replace(/\btherefore\b/gi, "so")
      .replace(/\butilize\b/gi, "use")
      .replace(/\bapproximately\b/gi, "about");
  }

  notes.add("Adjusted wording for the selected tone.");
  return revised;
}

function humanize(text) {
  const notes = new Set();
  const lang = detectLanguage(text);
  const level = Number(strength.value);
  const sentences = splitSentences(text);

  if (!sentences.length) {
    return {
      text: "",
      notes: [emptyLabels[lang].signal],
    };
  }

  const revised = sentences.map((sentence, index) => {
    let next = sentence.trim();
    next = applyReplacements(next, notes, lang);
    next = addRhythm(next, index, level, notes, lang);
    next = addHumanConnector(next, index, level, notes, lang);
    next = applyTone(next, notes, lang);
    return next;
  });

  if (level >= 80) {
    notes.add(lang === "en"
      ? "High strength setting reduced repetitive and promotional wording more aggressively."
      : "높은 강도 설정에 맞춰 AI 특유의 과장과 반복을 더 적극적으로 줄였습니다.");
  }

  return {
    text: revised.join("\n\n"),
    notes: Array.from(notes).slice(0, 4),
  };
}

function refreshCounts() {
  inputCount.textContent = `${sourceText.value.length.toLocaleString("ko-KR")}자`;
  outputCount.textContent = `${resultText.value.length.toLocaleString("ko-KR")}자`;
  updateAutoDetector();
}

function runHumanizer() {
  const { text, notes } = humanize(sourceText.value);
  resultText.value = text;
  summaryText.textContent = notes.join(" ");
  refreshCounts();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function analyzeAiSignals(text) {
  const lang = detectLanguage(text);
  const labels = emptyLabels[lang];
  const sentences = splitSentences(text);
  const signals = [];
  let score = 0;

  if (!text.trim()) {
    return {
      score: 0,
      label: labels.label,
      signals: [labels.signal],
      sentences: [],
    };
  }

  const aiPhrases = lang === "en"
    ? [
        "from various perspectives",
        "it is important to note",
        "plays a very important role",
        "enhanced user experience",
        "positive outcomes can be expected",
        "as a result",
        "in addition",
        "wide range of",
        "seamless",
        "robust",
        "maximize",
      ]
    : [
        "다양한 관점",
        "긍정적인 효과",
        "사용자 경험",
        "효율성을 극대화",
        "중요한 역할",
        "기대할 수 있습니다",
        "제공할 수 있습니다",
        "결과적으로",
        "이를 통해",
        "뿐만 아니라",
      ];

  const source = lang === "en" ? text.toLowerCase() : text;
  const phraseHits = aiPhrases.filter((phrase) => source.includes(lang === "en" ? phrase.toLowerCase() : phrase));

  if (phraseHits.length) {
    score += Math.min(30, phraseHits.length * 7);
    signals.push(lang === "en"
      ? `${phraseHits.length} common AI-style phrases were detected.`
      : `AI 문서에서 자주 보이는 표현 ${phraseHits.length}개가 감지됐습니다.`);
  }

  const formalEndings = sentences.filter((sentence) => {
    const trimmed = sentence.trim();
    return lang === "en"
      ? /\b(can be|should be|is expected|it is|this document)\b/i.test(trimmed)
      : /(습니다|합니다|됩니다|있습니다)\.?$/.test(trimmed);
  }).length;
  const endingRatio = sentences.length ? formalEndings / sentences.length : 0;

  if (sentences.length >= 3 && endingRatio > 0.65) {
    score += 22;
    signals.push(lang === "en"
      ? "Sentence structure is very consistent, which can feel machine-written."
      : "문장 끝맺음이 지나치게 일정합니다.");
  }

  const lengths = sentences.map((sentence) => sentence.length);
  const average = lengths.reduce((sum, length) => sum + length, 0) / (lengths.length || 1);
  const variance =
    lengths.reduce((sum, length) => sum + Math.abs(length - average), 0) / (lengths.length || 1);

  if (sentences.length >= 4 && variance < 16) {
    score += 16;
    signals.push(lang === "en"
      ? "Sentence lengths are too even, so the rhythm may feel templated."
      : "문장 길이 변화가 적어 기계적인 리듬으로 보일 수 있습니다.");
  }

  const commaHeavy = sentences.filter((sentence) => (sentence.match(/,/g) || []).length >= 2).length;
  if (commaHeavy >= 2) {
    score += 12;
    signals.push(lang === "en"
      ? "Several long chained sentences were detected."
      : "긴 병렬 문장이 많아 설명문 템플릿처럼 보일 수 있습니다.");
  }

  const humanMarkers = lang === "en"
    ? ["I ", "we ", "my ", "our ", "in practice", "for example", "that said", "I noticed"]
    : ["저는", "제가", "내가", "느꼈", "생각했", "실제로", "다만", "예를 들어"];
  const humanHits = humanMarkers.filter((marker) =>
    lang === "en" ? text.toLowerCase().includes(marker.toLowerCase()) : text.includes(marker),
  ).length;
  score -= Math.min(18, humanHits * 6);

  if (text.length < 120) {
    score = Math.min(score, 55);
    signals.push(lang === "en"
      ? "Short text has lower detection confidence."
      : "짧은 글은 자동 탐지 신뢰도가 낮습니다.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const flaggedSentences = sentences.slice(0, 8).map((sentence, index) => {
    const sentenceSource = lang === "en" ? sentence.toLowerCase() : sentence;
    let risk = 0;
    if (aiPhrases.some((phrase) => sentenceSource.includes(lang === "en" ? phrase.toLowerCase() : phrase))) risk += 2;
    if (lang === "en" ? /\b(can be|should be|is expected|it is)\b/i.test(sentence) : /(습니다|합니다|됩니다|있습니다)\.?$/.test(sentence.trim())) risk += 1;
    if (sentence.length > 90) risk += 1;
    return {
      index: index + 1,
      risk,
      text: sentence,
    };
  });

  if (!signals.length) {
    signals.push(lang === "en"
      ? "Few strong AI-style signals were detected."
      : "강한 AI 문체 신호는 적게 감지됐습니다.");
  }

  return {
    score,
    label: lang === "en"
      ? score >= 70 ? "Likely AI-style" : score >= 40 ? "Needs review" : "Mostly natural"
      : score >= 70 ? "AI 문체 가능성 높음" : score >= 40 ? "추가 점검 권장" : "자연스러운 편",
    signals,
    sentences: flaggedSentences,
  };
}

function updateAutoDetector() {
  const text = resultText.value.trim() || sourceText.value.trim();
  const lang = detectLanguage(text);
  const analysis = analyzeAiSignals(text);

  autoScore.textContent = `${analysis.score}%`;
  autoLabel.textContent = analysis.label;
  autoMeter.style.width = `${analysis.score}%`;
  signalList.innerHTML = analysis.signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("");

  if (!analysis.sentences.length) {
    sentenceFlags.textContent = emptyLabels[lang].sentence;
    return;
  }

  sentenceFlags.innerHTML = analysis.sentences
    .map((sentence) => {
      const className = sentence.risk >= 3 ? "danger" : sentence.risk >= 2 ? "warn" : "";
      const label = lang === "en" ? `Sentence ${sentence.index}` : `${sentence.index}번 문장`;
      return `<span class="sentence-chip ${className}">${label}</span>`;
    })
    .join("");
}

async function copyCheckText() {
  const text = resultText.value.trim() || sourceText.value.trim();

  if (!text) {
    showToast("검사할 문서가 없습니다.");
    return false;
  }

  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const target = resultText.value.trim() ? resultText : sourceText;
    target.select();
    document.execCommand("copy");
  }

  showToast("검사용 텍스트를 복사했습니다.");
  return true;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function lowerFirst(text) {
  return `${text.charAt(0).toLowerCase()}${text.slice(1)}`;
}

sourceText.addEventListener("input", refreshCounts);
resultText.addEventListener("input", refreshCounts);
language.addEventListener("change", refreshCounts);

strength.addEventListener("input", () => {
  strengthValue.textContent = strength.value;
});

humanizeBtn.addEventListener("click", runHumanizer);

sampleBtn.addEventListener("click", () => {
  const lang = language.value === "auto" ? "ko" : language.value;
  sourceText.value = samples[lang];
  runHumanizer();
});

copyBtn.addEventListener("click", async () => {
  if (!resultText.value.trim()) {
    showToast("복사할 수정본이 없습니다.");
    return;
  }

  try {
    await navigator.clipboard.writeText(resultText.value);
    showToast("수정본을 복사했습니다.");
  } catch {
    resultText.select();
    document.execCommand("copy");
    showToast("수정본을 복사했습니다.");
  }
});

copyForCheckBtn.addEventListener("click", copyCheckText);

detectorButtons.forEach((button) => {
  button.addEventListener("click", async () => {
    await copyCheckText();
    window.open(button.dataset.url, "_blank", "noopener,noreferrer");
  });
});

refreshCounts();
