const sourceText = document.querySelector("#sourceText");
const resultText = document.querySelector("#resultText");
const tone = document.querySelector("#tone");
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

const sample = `본 문서는 사용자의 업무 효율성을 극대화하기 위해 작성되었습니다. 다양한 관점에서 살펴보면 해당 기능은 매우 중요한 역할을 수행한다고 볼 수 있습니다. 또한 이를 통해 보다 향상된 사용자 경험을 제공할 수 있으며, 결과적으로 긍정적인 효과를 기대할 수 있습니다.`;

const replacements = [
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
  ["제공합니다", "제공합니다"],
  ["수행합니다", "합니다"],
  ["기대할 수 있습니다", "기대할 수 있습니다"],
  ["~라고 할 수 있습니다", "라고 볼 수 있습니다"],
];

const toneEndings = {
  natural: [
    ["습니다.", "습니다."],
    ["합니다.", "합니다."],
  ],
  business: [
    ["꽤 중요한 역할을 합니다.", "중요한 역할을 합니다."],
    ["좋은 효과도 기대할 수 있습니다.", "실질적인 효과를 기대할 수 있습니다."],
  ],
  essay: [
    ["습니다.", "습니다. 이 지점이 글의 설득력을 좌우합니다."],
    ["합니다.", "합니다. 결국 중요한 것은 읽는 사람이 자연스럽게 받아들이는 흐름입니다."],
  ],
  casual: [
    ["습니다.", "어요."],
    ["합니다.", "해요."],
    ["있습니다.", "있어요."],
    ["됩니다.", "돼요."],
  ],
};

function splitSentences(text) {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?。]|다\.|요\.)\s+/)
    .filter(Boolean);
}

function applyReplacements(sentence, notes) {
  let revised = sentence;

  replacements.forEach(([from, to]) => {
    if (revised.includes(from)) {
      revised = revised.replaceAll(from, to);
      notes.add(`딱딱한 표현 "${from}"을 더 자연스러운 표현으로 바꿨습니다.`);
    }
  });

  if (reduceBuzzwords.checked) {
    revised = revised
      .replaceAll("매우 ", "")
      .replaceAll("상당히 ", "")
      .replaceAll("혁신적인 ", "")
      .replaceAll("효율적인 ", "");
  }

  return revised;
}

function addRhythm(sentence, index, level, notes) {
  let revised = sentence;

  if (!varySentences.checked || level < 45) return revised;

  if (index % 3 === 1 && revised.length > 45 && !revised.includes("다만")) {
    revised = `다만 ${revised.charAt(0).toLowerCase()}${revised.slice(1)}`;
    notes.add("비슷하게 반복되는 문장 시작을 바꿨습니다.");
  }

  if (index % 4 === 2 && revised.includes("있으며")) {
    revised = revised.replace("있으며", "있고");
    notes.add("문어체 연결어를 구어에 가까운 흐름으로 다듬었습니다.");
  }

  return revised;
}

function addHumanConnector(sentence, index, level, notes) {
  if (!addHumanTouch.checked || level < 60 || index === 0) return sentence;

  const connectors = ["이 부분은", "여기서 중요한 점은", "실제로는"];
  if (index % 3 === 0 && sentence.length < 90) {
    notes.add("문장 사이의 연결감을 보강했습니다.");
    return `${connectors[index % connectors.length]} ${sentence}`;
  }

  return sentence;
}

function applyTone(sentence, notes) {
  const rules = toneEndings[tone.value] || toneEndings.natural;
  let revised = sentence;

  rules.forEach(([from, to]) => {
    if (revised.endsWith(from) && from !== to) {
      revised = `${revised.slice(0, -from.length)}${to}`;
      notes.add("선택한 톤에 맞춰 문장 끝맺음을 조정했습니다.");
    }
  });

  return revised;
}

function humanize(text) {
  const notes = new Set();
  const level = Number(strength.value);
  const sentences = splitSentences(text);

  if (!sentences.length) {
    return {
      text: "",
      notes: ["문서를 입력하면 수정 방향을 표시합니다."],
    };
  }

  const revised = sentences.map((sentence, index) => {
    let next = sentence.trim();
    next = applyReplacements(next, notes);
    next = addRhythm(next, index, level, notes);
    next = addHumanConnector(next, index, level, notes);
    next = applyTone(next, notes);
    return next;
  });

  if (level >= 80) {
    notes.add("높은 강도 설정에 맞춰 AI 특유의 과장과 반복을 더 적극적으로 줄였습니다.");
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
  const sentences = splitSentences(text);
  const signals = [];
  let score = 0;

  if (!text.trim()) {
    return {
      score: 0,
      label: "문서 대기 중",
      signals: ["문서를 입력하거나 수정본을 만들면 자동으로 분석합니다."],
      sentences: [],
    };
  }

  const aiPhrases = [
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
  const phraseHits = aiPhrases.filter((phrase) => text.includes(phrase));

  if (phraseHits.length) {
    score += Math.min(30, phraseHits.length * 7);
    signals.push(`AI 문서에서 자주 보이는 표현 ${phraseHits.length}개가 감지됐습니다.`);
  }

  const formalEndings = sentences.filter((sentence) =>
    /(습니다|합니다|됩니다|있습니다)\.?$/.test(sentence.trim()),
  ).length;
  const endingRatio = sentences.length ? formalEndings / sentences.length : 0;

  if (sentences.length >= 3 && endingRatio > 0.75) {
    score += 22;
    signals.push("문장 끝맺음이 지나치게 일정합니다.");
  }

  const lengths = sentences.map((sentence) => sentence.length);
  const average = lengths.reduce((sum, length) => sum + length, 0) / (lengths.length || 1);
  const variance =
    lengths.reduce((sum, length) => sum + Math.abs(length - average), 0) / (lengths.length || 1);

  if (sentences.length >= 4 && variance < 16) {
    score += 16;
    signals.push("문장 길이 변화가 적어 기계적인 리듬으로 보일 수 있습니다.");
  }

  const commaHeavy = sentences.filter((sentence) => (sentence.match(/,/g) || []).length >= 2).length;
  if (commaHeavy >= 2) {
    score += 12;
    signals.push("긴 병렬 문장이 많아 설명문 템플릿처럼 보일 수 있습니다.");
  }

  const humanMarkers = ["저는", "제가", "내가", "느꼈", "생각했", "실제로", "다만", "예를 들어"];
  const humanHits = humanMarkers.filter((marker) => text.includes(marker)).length;
  score -= Math.min(18, humanHits * 6);

  if (text.length < 120) {
    score = Math.min(score, 55);
    signals.push("짧은 글은 자동 탐지 신뢰도가 낮습니다.");
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const flaggedSentences = sentences.slice(0, 8).map((sentence, index) => {
    let risk = 0;
    if (aiPhrases.some((phrase) => sentence.includes(phrase))) risk += 2;
    if (/(습니다|합니다|됩니다|있습니다)\.?$/.test(sentence.trim())) risk += 1;
    if (sentence.length > 80) risk += 1;
    return {
      index: index + 1,
      risk,
      text: sentence,
    };
  });

  if (!signals.length) {
    signals.push("강한 AI 문체 신호는 적게 감지됐습니다.");
  }

  return {
    score,
    label: score >= 70 ? "AI 문체 가능성 높음" : score >= 40 ? "추가 점검 권장" : "자연스러운 편",
    signals,
    sentences: flaggedSentences,
  };
}

function updateAutoDetector() {
  const text = resultText.value.trim() || sourceText.value.trim();
  const analysis = analyzeAiSignals(text);

  autoScore.textContent = `${analysis.score}%`;
  autoLabel.textContent = analysis.label;
  autoMeter.style.width = `${analysis.score}%`;
  signalList.innerHTML = analysis.signals.map((signal) => `<li>${signal}</li>`).join("");

  if (!analysis.sentences.length) {
    sentenceFlags.textContent = "아직 분석할 문장이 없습니다.";
    return;
  }

  sentenceFlags.innerHTML = analysis.sentences
    .map((sentence) => {
      const className = sentence.risk >= 3 ? "danger" : sentence.risk >= 2 ? "warn" : "";
      return `<span class="sentence-chip ${className}">${sentence.index}번 문장</span>`;
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

sourceText.addEventListener("input", refreshCounts);
resultText.addEventListener("input", refreshCounts);

strength.addEventListener("input", () => {
  strengthValue.textContent = strength.value;
});

humanizeBtn.addEventListener("click", runHumanizer);

sampleBtn.addEventListener("click", () => {
  sourceText.value = sample;
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
