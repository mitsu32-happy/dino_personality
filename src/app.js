const app = document.querySelector("#app");
const templates = {
  home: document.querySelector("#tpl-home"),
  quiz: document.querySelector("#tpl-quiz"),
  result: document.querySelector("#tpl-result"),
  dex: document.querySelector("#tpl-dex"),
};

const axes = ["aggression", "cooperation", "curiosity", "caution", "speed"];
const axisLabels = {
  aggression: "攻撃性",
  cooperation: "協調性",
  curiosity: "探究心",
  caution: "慎重さ",
  speed: "スピード感",
};
const axisShort = {
  aggression: "A",
  cooperation: "C",
  curiosity: "Q",
  caution: "S",
  speed: "V",
};
const axisColors = {
  aggression: "#e9574e",
  cooperation: "#51df9a",
  curiosity: "#3ccfe5",
  caution: "#f6c76b",
  speed: "#c36ef1",
};

let questions = [];
let types = [];
let assetManifest = { real: [], mascot: [], cards: [] };
let answers = [];
let currentIndex = 0;

async function boot() {
  try {
    const [loadedQuestions, loadedTypes, loadedManifest] = await Promise.all([
      fetchJson("./data/questions.json"),
      fetchJson("./data/dino_types.json"),
      fetchJson("./data/scoring_rules.json"),
      fetchJson("./assets/images/manifest.json").catch(() => ({ real: [], mascot: [] })),
    ]).then(([questionData, typeData, _rules, manifest]) => [questionData, typeData, manifest]);
    questions = loadedQuestions;
    types = loadedTypes;
    assetManifest = loadedManifest;
    window.addEventListener("hashchange", render);
    render();
  } catch (error) {
    app.innerHTML = `<section class="error-view"><p>データを読み込めませんでした。READMEの手順どおりローカルサーバー経由で開いてください。</p></section>`;
    console.error(error);
  }
}

async function fetchJson(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`${path}: ${response.status}`);
  return response.json();
}

function render() {
  const [route, id] = location.hash.replace(/^#/, "").split("/");
  if (!route || route === "home") return renderHome();
  if (route === "quiz") return renderQuiz();
  if (route === "result") return renderResult(id);
  if (route === "dex") return renderDex();
  renderHome();
}

function setView(template) {
  app.replaceChildren(template.content.cloneNode(true));
  app.focus({ preventScroll: true });
}

function renderHome() {
  setView(templates.home);
}

function renderQuiz() {
  restoreProgress();
  if (answers.length >= questions.length) {
    answers = [];
    currentIndex = 0;
    localStorage.removeItem("dino:progress");
  }
  setView(templates.quiz);
  paintQuestion();
}

function paintQuestion() {
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  bind("question-count").textContent = `Question ${String(currentIndex + 1).padStart(2, "0")}`;
  bind("progress-text").textContent = `/ ${questions.length}`;
  bind("progress-bar").style.width = `${progress}%`;
  bind("question-id").textContent = `${Math.round(progress)}% complete`;
  bind("question-text").textContent = question.text;

  const options = bind("options");
  options.replaceChildren();
  question.options.forEach((option, index) => {
    const mainAxis = Object.keys(option.scores)[0] ?? axes[index % axes.length];
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.style.setProperty("--option-color", axisColors[mainAxis]);
    button.setAttribute("aria-pressed", answers[currentIndex]?.optionIndex === index ? "true" : "false");
    button.innerHTML = `
      <span class="option-icon">${axisShort[mainAxis]}</span>
      <span class="option-label"></span>
      <span class="option-arrow">›</span>
    `;
    button.querySelector(".option-label").textContent = option.label;
    button.addEventListener("click", () => chooseOption(index, option));
    options.append(button);
  });

  const backButton = document.querySelector('[data-action="back"]');
  backButton.disabled = currentIndex === 0;
  backButton.addEventListener("click", () => {
    if (currentIndex <= 0) return;
    currentIndex -= 1;
    persistProgress();
    paintQuestion();
  });
}

function chooseOption(optionIndex, option) {
  answers[currentIndex] = {
    questionId: questions[currentIndex].id,
    optionIndex,
    scores: option.scores,
  };
  persistProgress();

  if (currentIndex < questions.length - 1) {
    currentIndex += 1;
    setTimeout(paintQuestion, 90);
    return;
  }

  const result = calculateResult();
  localStorage.setItem("dino:lastResult", JSON.stringify(result));
  localStorage.removeItem("dino:progress");
  location.hash = `result/${result.type.id}`;
}

function calculateResult() {
  const rawScores = emptyScores();
  const recentScores = emptyScores();
  answers.forEach((answer, index) => {
    addScores(rawScores, answer.scores);
    if (index >= Math.max(0, answers.length - 10)) addScores(recentScores, answer.scores);
  });

  const rankedAxes = [...axes].sort((a, b) => {
    const scoreDelta = rawScores[b] - rawScores[a];
    if (scoreDelta !== 0) return scoreDelta;
    const recentDelta = recentScores[b] - recentScores[a];
    if (recentDelta !== 0) return recentDelta;
    return axes.indexOf(a) - axes.indexOf(b);
  });

  const [primaryAxis, secondaryAxis] = rankedAxes;
  return {
    type: selectType(primaryAxis, secondaryAxis, rawScores),
    rawScores,
    normalizedScores: normalizeScores(rawScores),
    primaryAxis,
    secondaryAxis,
    answeredAt: new Date().toISOString(),
  };
}

function selectType(primaryAxis, secondaryAxis, rawScores) {
  const exact = types
    .filter((type) => type.primaryAxis === primaryAxis && type.secondaryAxis === secondaryAxis)
    .sort((a, b) => a.priority - b.priority)[0];
  if (exact) return exact;

  const primaryMatches = types.filter((type) => type.primaryAxis === primaryAxis);
  if (primaryMatches.length) {
    return primaryMatches.sort((a, b) => {
      const secondaryDelta = rawScores[b.secondaryAxis] - rawScores[a.secondaryAxis];
      if (secondaryDelta !== 0) return secondaryDelta;
      return a.priority - b.priority;
    })[0];
  }

  return [...types].sort((a, b) => {
    const aScore = rawScores[a.primaryAxis] + rawScores[a.secondaryAxis];
    const bScore = rawScores[b.primaryAxis] + rawScores[b.secondaryAxis];
    if (bScore !== aScore) return bScore - aScore;
    return a.priority - b.priority;
  })[0];
}

function renderResult(routeTypeId) {
  const stored = readLastResult();
  const result = stored?.type?.id === routeTypeId || !routeTypeId ? stored : previewResult(routeTypeId);
  if (!result) {
    location.hash = "quiz";
    return;
  }

  setView(templates.result);
  const { type } = result;
  document.documentElement.style.setProperty("--accent", axisColors[type.primaryAxis]);
  document.documentElement.style.setProperty("--accent-2", axisColors[type.secondaryAxis]);

  bind("diagnosis-date").textContent = formatDate(result.answeredAt);
  bind("type-name").textContent = type.name;
  bind("dino-name").textContent = type.dinosaur;
  bind("type-catch").textContent = type.catch;
  bind("card-strengths").textContent = type.strengths.join(" / ");
  bind("detail-title").textContent = `${type.name} / ${type.dinosaur}`;
  bind("description").textContent = type.description;
  bindList("strengths", type.strengths);
  bindList("weaknesses", type.weaknesses);
  bind("best-match").textContent = type.bestMatch.map(typeName).join(" / ");
  bind("near-types").textContent = type.nearTypes.map(typeName).join(" / ");
  hydrateCardBackground(bind("card-bg"), type.id);
  hydrateArt(bind("real-art"), "real", type.id);
  hydrateArt(bind("mascot-art"), "mascot", type.id);
  paintScores(result.normalizedScores);
  drawRadar(document.querySelector("#radar"), result.normalizedScores, 160, 160, 105, 13);

  document.querySelector('[data-action="save-card"]').addEventListener("click", () => saveResultImage(result));
}

function previewResult(typeId) {
  const type = types.find((item) => item.id === typeId);
  if (!type) return null;
  const normalizedScores = Object.fromEntries(axes.map((axis) => [axis, 44]));
  normalizedScores[type.primaryAxis] = 100;
  normalizedScores[type.secondaryAxis] = 78;
  return {
    type,
    rawScores: normalizedScores,
    normalizedScores,
    primaryAxis: type.primaryAxis,
    secondaryAxis: type.secondaryAxis,
    answeredAt: new Date().toISOString(),
  };
}

function renderDex() {
  setView(templates.dex);
  const grid = bind("dex-grid");
  types.forEach((type, index) => {
    const card = document.createElement("a");
    card.className = "dex-card";
    card.href = `#result/${type.id}`;
    card.style.setProperty("--card-accent", axisColors[type.primaryAxis]);
    card.style.setProperty("--card-accent-2", axisColors[type.secondaryAxis]);
    card.innerHTML = `
      <div class="dex-art" data-type-id="${type.id}"></div>
      <div class="dex-copy">
        <p>${String(index + 1).padStart(2, "0")} ${axisLabels[type.primaryAxis]}</p>
        <h2></h2>
        <span></span>
      </div>
    `;
    card.querySelector("h2").textContent = type.name;
    card.querySelector("span").textContent = type.dinosaur;
    hydrateArt(card.querySelector(".dex-art"), "mascot", type.id);
    grid.append(card);
  });
}

function paintScores(scores) {
  const scoreList = bind("score-list");
  scoreList.replaceChildren();
  axes.forEach((axis) => {
    const row = document.createElement("div");
    row.className = "score-row";
    row.innerHTML = `
      <span>${axisLabels[axis]}</span>
      <span class="score-meter"><i style="--value:${scores[axis]}%; --axis-color:${axisColors[axis]}"></i></span>
      <b>${scores[axis]}</b>
    `;
    scoreList.append(row);
  });
}

function drawRadar(canvas, scores, centerX, centerY, radius, labelSize) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRadarToContext(ctx, scores, centerX, centerY, radius, labelSize);
}

function drawRadarToContext(ctx, scores, centerX, centerY, radius, labelSize) {
  ctx.save();
  ctx.font = `800 ${labelSize}px Yu Gothic UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let step = 1; step <= 4; step += 1) {
    ctx.beginPath();
    axes.forEach((_, index) => {
      const point = radarPoint(index, centerX, centerY, radius * (step / 4));
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.strokeStyle = "rgba(255, 247, 220, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  axes.forEach((axis, index) => {
    const edge = radarPoint(index, centerX, centerY, radius);
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(edge.x, edge.y);
    ctx.strokeStyle = "rgba(255, 247, 220, 0.13)";
    ctx.stroke();

    const label = radarPoint(index, centerX, centerY, radius + labelSize * 2.2);
    ctx.fillStyle = axisColors[axis];
    ctx.fillText(axisLabels[axis], label.x, label.y);
  });

  ctx.beginPath();
  axes.forEach((axis, index) => {
    const point = radarPoint(index, centerX, centerY, radius * (scores[axis] / 100));
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(81, 223, 154, 0.28)";
  ctx.strokeStyle = "#f6c76b";
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

async function saveResultImage(result) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  await drawDownloadCard(ctx, result);
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `dino-type-${result.type.id}-1080x1920.png`;
  link.click();
  const message = bind("save-message");
  if (message) message.textContent = "スマホ表示向けの1080x1920画像を書き出しました。";
}

async function drawDownloadCard(ctx, result) {
  const { type, normalizedScores } = result;
  const accent = axisColors[type.primaryAxis];
  const accent2 = axisColors[type.secondaryAxis];

  const bg = ctx.createLinearGradient(0, 0, 1080, 1920);
  bg.addColorStop(0, "#071018");
  bg.addColorStop(0.5, "#0b2222");
  bg.addColorStop(1, "#080b0f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 1080, 1920);
  const cardBackground = assetManifest.cards.includes(type.id)
    ? await loadCanvasImage(`./assets/images/cards/bg_${type.id}.webp`)
    : null;
  if (cardBackground) {
    ctx.globalAlpha = 0.98;
    drawCoverImage(ctx, cardBackground, 0, 0, 1080, 1920);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(3,7,9,0.16)";
    ctx.fillRect(0, 0, 1080, 1920);
  }
  const frame = await loadCanvasImage("./assets/images/ui/card-frame.webp");
  if (frame && !cardBackground) {
    ctx.globalAlpha = 0.78;
    drawCoverImage(ctx, frame, 0, 0, 1080, 1920);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "rgba(3,7,9,0.34)";
    ctx.fillRect(0, 0, 1080, 1920);
  }
  if (cardBackground) {
    roundRect(ctx, 32, 32, 1016, 1856, 44, "rgba(0,0,0,0)", hexToRgba(accent, 0.62));
    roundRect(ctx, 48, 48, 984, 1824, 34, "rgba(0,0,0,0)", "rgba(246,199,107,0.22)");
  }
  drawGlow(ctx, 260, 240, 360, hexToRgba(accent, 0.34));
  drawGlow(ctx, 830, 490, 390, hexToRgba(accent2, 0.24));
  drawAmber(ctx, 180, 610, 112);
  const realImage = assetManifest.real.includes(type.id)
    ? await loadCanvasImage(`./assets/images/dinos/real/${type.id}.webp`)
    : null;
  const mascotImage = assetManifest.mascot.includes(type.id)
    ? await loadCanvasImage(`./assets/images/dinos/mascot/${type.id}.webp`)
    : null;

  if (realImage) {
    ctx.save();
    ctx.globalAlpha = 0.96;
    drawContainImage(ctx, realImage, 105, 560, 870, 440);
    ctx.restore();
  } else {
    drawDownloadDino(ctx, 540, 730, accent, accent2);
  }

  if (mascotImage) {
    drawContainImage(ctx, mascotImage, 690, 710, 250, 250);
  }

  ctx.fillStyle = "rgba(255,247,220,0.82)";
  ctx.font = "800 34px Yu Gothic UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("恐竜タイプ診断", 74, 106);
  ctx.textAlign = "right";
  ctx.fillText(formatDate(result.answeredAt), 1006, 106);

  ctx.textAlign = "center";
  ctx.fillStyle = "#51df9a";
  ctx.font = "900 34px Yu Gothic UI, sans-serif";
  ctx.fillText("あなたの恐竜タイプは...", 540, 218);
  ctx.fillStyle = "#fff7dc";
  ctx.font = "900 88px Yu Gothic UI, sans-serif";
  wrapCanvasText(ctx, type.name, 540, 334, 910, 98, "center");
  ctx.fillStyle = "#f6c76b";
  ctx.font = "italic 800 52px Georgia, serif";
  ctx.fillText(type.dinosaur, 540, 540);

  ctx.fillStyle = "#fff7dc";
  ctx.font = "800 40px Yu Gothic UI, sans-serif";
  wrapCanvasText(ctx, type.catch, 540, 970, 850, 56, "center");

  roundRect(ctx, 74, 1110, 932, 350, 34, "rgba(4,15,17,0.78)", "rgba(246,199,107,0.34)");
  drawRadarToContext(ctx, normalizedScores, 295, 1285, 122, 20);

  axes.forEach((axis, index) => {
    const y = 1180 + index * 54;
    ctx.fillStyle = "#fff7dc";
    ctx.font = "800 28px Yu Gothic UI, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(axisLabels[axis], 530, y);
    roundRect(ctx, 690, y - 22, 230, 16, 8, "rgba(255,255,255,0.12)");
    roundRect(ctx, 690, y - 22, Math.max(10, normalizedScores[axis] * 2.3), 16, 8, axisColors[axis]);
    ctx.textAlign = "right";
    ctx.fillText(String(normalizedScores[axis]), 950, y);
  });

  roundRect(ctx, 74, 1508, 932, 250, 34, "rgba(6,24,21,0.76)", "rgba(81,223,154,0.32)");
  ctx.fillStyle = "#51df9a";
  ctx.font = "900 34px Yu Gothic UI, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("あなたの強み", 124, 1582);
  ctx.fillStyle = "#fff7dc";
  ctx.font = "800 36px Yu Gothic UI, sans-serif";
  type.strengths.forEach((item, index) => ctx.fillText(`・${item}`, 124, 1648 + index * 48));

  ctx.fillStyle = "rgba(255,247,220,0.7)";
  ctx.font = "600 28px Yu Gothic UI, sans-serif";
  wrapCanvasText(ctx, `注意ポイント: ${type.weaknesses[0]}`, 124, 1814, 840, 40, "left");
}

function loadCanvasImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawCoverImage(ctx, img, x, y, width, height) {
  const scale = Math.max(width / img.width, height / img.height);
  const sw = width / scale;
  const sh = height / scale;
  const sx = (img.width - sw) / 2;
  const sy = (img.height - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, width, height);
}

function drawContainImage(ctx, img, x, y, width, height) {
  const scale = Math.min(width / img.width, height / img.height);
  const dw = img.width * scale;
  const dh = img.height * scale;
  const dx = x + (width - dw) / 2;
  const dy = y + (height - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

function drawDownloadDino(ctx, x, y, accent, accent2) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = hexToRgba(accent, 0.94);
  ctx.beginPath();
  ctx.ellipse(0, 0, 320, 178, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hexToRgba(accent2, 0.86);
  ctx.beginPath();
  ctx.ellipse(246, -92, 118, 84, 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(6,16,18,0.9)";
  ctx.beginPath();
  ctx.ellipse(-302, -20, 154, 48, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff7dc";
  ctx.beginPath();
  ctx.arc(276, -108, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#071012";
  ctx.beginPath();
  ctx.arc(281, -108, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAmber(ctx, x, y, size) {
  const gradient = ctx.createLinearGradient(x - size, y - size, x + size, y + size);
  gradient.addColorStop(0, "#ffc760");
  gradient.addColorStop(0.6, "#e99028");
  gradient.addColorStop(1, "#8f361f");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(x, y, size * 0.75, size, -0.16, 0, Math.PI * 2);
  ctx.fill();
}

function drawGlow(ctx, x, y, radius, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius);
  glow.addColorStop(0, color);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.stroke();
  }
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, align = "left") {
  const originalAlign = ctx.textAlign;
  ctx.textAlign = align;
  let line = "";
  let cursorY = y;
  const chars = [...text];
  chars.forEach((char, index) => {
    const testLine = line + char;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, cursorY);
      line = char;
      cursorY += lineHeight;
    } else {
      line = testLine;
    }
    if (index === chars.length - 1) ctx.fillText(line, x, cursorY);
  });
  ctx.textAlign = originalAlign;
}

function hydrateArt(element, kind, typeId) {
  if (!assetManifest[kind]?.includes(typeId)) return;
  const src = `./assets/images/dinos/${kind}/${typeId}.webp`;
  element.classList.add("has-image");
  element.style.backgroundImage = `url("${src}")`;
}

function hydrateCardBackground(element, typeId) {
  if (!element || !assetManifest.cards.includes(typeId)) return;
  const src = `../assets/images/cards/bg_${typeId}.webp`;
  element.classList.add("has-image");
  element.style.setProperty("--type-card-bg", `url("${src}")`);
}

function emptyScores() {
  return Object.fromEntries(axes.map((axis) => [axis, 0]));
}

function addScores(total, scores) {
  Object.entries(scores).forEach(([axis, value]) => {
    total[axis] = (total[axis] ?? 0) + Number(value);
  });
}

function normalizeScores(rawScores) {
  const max = Math.max(...axes.map((axis) => rawScores[axis]), 1);
  return Object.fromEntries(axes.map((axis) => [axis, Math.round((rawScores[axis] / max) * 100)]));
}

function radarPoint(index, centerX, centerY, radius) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / axes.length;
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius,
  };
}

function bind(name) {
  return app.querySelector(`[data-bind="${name}"]`);
}

function bindList(name, items) {
  const list = bind(name);
  list.replaceChildren(...items.map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
}

function typeName(id) {
  const type = types.find((item) => item.id === id);
  return type ? `${type.name}（${type.dinosaur}）` : id;
}

function readLastResult() {
  try {
    return JSON.parse(localStorage.getItem("dino:lastResult"));
  } catch {
    return null;
  }
}

function persistProgress() {
  localStorage.setItem("dino:progress", JSON.stringify({ answers, currentIndex }));
}

function restoreProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("dino:progress"));
    if (!saved) {
      answers = [];
      currentIndex = 0;
      return;
    }
    answers = Array.isArray(saved.answers) ? saved.answers : [];
    currentIndex = Math.min(Number(saved.currentIndex) || 0, questions.length - 1);
  } catch {
    answers = [];
    currentIndex = 0;
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

boot();
