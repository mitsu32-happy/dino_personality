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
const axisColors = {
  aggression: "#ff6a62",
  cooperation: "#4de0aa",
  curiosity: "#42d5e8",
  caution: "#ffba54",
  speed: "#b98cff",
};

let questions = [];
let types = [];
let rules = {};
let answers = [];
let currentIndex = 0;

async function boot() {
  try {
    const [questionData, typeData, ruleData] = await Promise.all([
      fetchJson("./data/questions.json"),
      fetchJson("./data/dino_types.json"),
      fetchJson("./data/scoring_rules.json"),
    ]);
    questions = questionData;
    types = typeData;
    rules = ruleData;
    window.addEventListener("hashchange", render);
    render();
  } catch (error) {
    app.innerHTML = `<section class="error-view"><p>データを読み込めませんでした。ローカルサーバー経由で開いてください。</p></section>`;
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
  if (!answers.length || currentIndex >= questions.length || answers.length >= questions.length) restoreProgress();
  if (answers.length >= questions.length) {
    answers = [];
    currentIndex = 0;
  }
  if (currentIndex >= questions.length) currentIndex = 0;
  setView(templates.quiz);
  paintQuestion();
}

function paintQuestion() {
  const question = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  bind("question-count").textContent = `${currentIndex + 1} / ${questions.length}`;
  bind("progress-percent").textContent = `${Math.round(progress)}%`;
  bind("progress-bar").style.width = `${progress}%`;
  bind("question-id").textContent = question.id.toUpperCase();
  bind("question-text").textContent = question.text;

  const options = bind("options");
  options.replaceChildren();
  question.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.className = "option-button";
    button.type = "button";
    button.textContent = option.label;
    button.setAttribute("aria-pressed", answers[currentIndex]?.optionIndex === index ? "true" : "false");
    button.addEventListener("click", () => chooseOption(index, option));
    options.append(button);
  });

  const backButton = document.querySelector('[data-action="back"]');
  backButton.disabled = currentIndex === 0;
  backButton.addEventListener("click", () => {
    if (currentIndex > 0) {
      currentIndex -= 1;
      paintQuestion();
    }
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
    setTimeout(paintQuestion, 100);
    return;
  }

  const result = calculateResult();
  localStorage.setItem("dino:lastResult", JSON.stringify(result));
  localStorage.removeItem("dino:progress");
  location.hash = `result/${result.type.id}`;
}

function calculateResult() {
  const rawScores = baseScores();
  const recentScores = baseScores();
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
  const type = selectType(primaryAxis, secondaryAxis, rawScores);
  return {
    type,
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

function baseScores() {
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

function renderResult(routeTypeId) {
  const stored = readLastResult();
  const result = stored?.type?.id === routeTypeId || !routeTypeId ? stored : previewResult(routeTypeId);
  if (!result) {
    location.hash = "quiz";
    return;
  }

  setView(templates.result);
  const type = result.type;
  bind("type-name").textContent = type.name;
  bind("dino-name").textContent = type.dinosaur;
  bind("type-catch").textContent = type.catch;
  bind("description").textContent = type.description;
  bind("real-caption").textContent = `${type.dinosaur} イメージ`;
  bindList("strengths", type.strengths);
  bindList("weaknesses", type.weaknesses);
  bind("best-match").textContent = type.bestMatch.map(typeName).join(" / ");
  bind("near-types").textContent = type.nearTypes.map(typeName).join(" / ");
  paintScores(result.normalizedScores);
  loadImage(bind("real-image"), `./assets/images/dinos/real/${type.id}.webp`, type.dinosaur);
  loadImage(bind("mascot-image"), `./assets/images/dinos/mascot/${type.id}.webp`, `${type.name} マスコット`);
  drawRadar(document.querySelector("#radar"), result.normalizedScores);
  document.querySelector('[data-action="save-card"]').addEventListener("click", () => saveResultImage(result));
}

function previewResult(typeId) {
  const type = types.find((item) => item.id === typeId);
  if (!type) return null;
  const normalizedScores = Object.fromEntries(axes.map((axis) => [axis, 42]));
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

function readLastResult() {
  try {
    return JSON.parse(localStorage.getItem("dino:lastResult"));
  } catch {
    return null;
  }
}

function paintScores(scores) {
  const panel = bind("score-list");
  panel.replaceChildren();
  axes.forEach((axis) => {
    const row = document.createElement("div");
    row.className = "score-block";
    row.innerHTML = `
      <div class="score-row"><strong>${axisLabels[axis]}</strong><span>${scores[axis]}</span></div>
      <div class="meter"><span style="--value:${scores[axis]}%; background:${axisColors[axis]}"></span></div>
    `;
    panel.append(row);
  });
}

function drawRadar(canvas, scores) {
  const ctx = canvas.getContext("2d");
  const center = 160;
  const radius = 106;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "700 13px Yu Gothic UI, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (let step = 1; step <= 4; step += 1) {
    drawPolygon(ctx, center, radius * (step / 4), "rgba(244, 248, 246, 0.12)", false);
  }
  axes.forEach((axis, index) => {
    const point = radarPoint(index, center, radius);
    ctx.strokeStyle = "rgba(244, 248, 246, 0.16)";
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    const labelPoint = radarPoint(index, center, radius + 30);
    ctx.fillStyle = axisColors[axis];
    ctx.fillText(axisLabels[axis], labelPoint.x, labelPoint.y);
  });

  ctx.beginPath();
  axes.forEach((axis, index) => {
    const point = radarPoint(index, center, radius * (scores[axis] / 100));
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  ctx.fillStyle = "rgba(77, 224, 170, 0.28)";
  ctx.strokeStyle = "#ffba54";
  ctx.lineWidth = 3;
  ctx.fill();
  ctx.stroke();
}

function drawPolygon(ctx, center, radius, color, fill) {
  ctx.beginPath();
  axes.forEach((_, index) => {
    const point = radarPoint(index, center, radius);
    if (index === 0) ctx.moveTo(point.x, point.y);
    else ctx.lineTo(point.x, point.y);
  });
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = color;
    ctx.fill();
  } else {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function radarPoint(index, center, radius) {
  const angle = -Math.PI / 2 + (Math.PI * 2 * index) / axes.length;
  return {
    x: center + Math.cos(angle) * radius,
    y: center + Math.sin(angle) * radius,
  };
}

function renderDex() {
  setView(templates.dex);
  const grid = bind("dex-grid");
  types.forEach((type) => {
    const card = document.createElement("a");
    card.className = "dex-card";
    card.href = `#result/${type.id}`;
    card.innerHTML = `
      <div class="dex-mascot"></div>
      <p class="eyebrow">${axisLabels[type.primaryAxis]} + ${axisLabels[type.secondaryAxis]}</p>
      <h2>${type.name}</h2>
      <p>${type.dinosaur}</p>
      <p>${type.catch}</p>
    `;
    grid.append(card);
  });
}

function loadImage(img, src, alt) {
  const slot = img.closest(".image-slot");
  img.alt = alt;
  img.onload = () => slot.classList.add("has-image");
  img.onerror = () => slot.classList.remove("has-image");
  img.src = src;
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

function saveResultImage(result) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, "#0b151f");
  gradient.addColorStop(0.48, "#102a2b");
  gradient.addColorStop(1, "#151018");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);

  drawGlow(ctx, 210, 210, 260, "rgba(77,224,170,0.28)");
  drawGlow(ctx, 880, 360, 300, "rgba(255,186,84,0.22)");
  drawCanvasDino(ctx, 540, 610);

  ctx.fillStyle = "#f4f8f6";
  ctx.textAlign = "center";
  ctx.font = "700 42px Yu Gothic UI, sans-serif";
  ctx.fillText("恐竜タイプ診断", 540, 120);
  ctx.font = "900 84px Yu Gothic UI, sans-serif";
  wrapCanvasText(ctx, result.type.name, 540, 250, 880, 92);
  ctx.fillStyle = "#ffba54";
  ctx.font = "800 48px Yu Gothic UI, sans-serif";
  ctx.fillText(result.type.dinosaur, 540, 430);
  ctx.fillStyle = "#d8e7e3";
  ctx.font = "500 38px Yu Gothic UI, sans-serif";
  wrapCanvasText(ctx, result.type.catch, 540, 500, 820, 54);

  const startY = 1040;
  axes.forEach((axis, index) => {
    const y = startY + index * 92;
    ctx.fillStyle = "#f4f8f6";
    ctx.textAlign = "left";
    ctx.font = "700 34px Yu Gothic UI, sans-serif";
    ctx.fillText(axisLabels[axis], 150, y);
    ctx.fillStyle = axisColors[axis];
    ctx.fillRect(410, y - 28, Math.max(12, result.normalizedScores[axis] * 4.4), 26);
    ctx.fillStyle = "#f4f8f6";
    ctx.textAlign = "right";
    ctx.fillText(String(result.normalizedScores[axis]), 930, y);
  });

  ctx.fillStyle = "#f4f8f6";
  ctx.textAlign = "left";
  ctx.font = "800 42px Yu Gothic UI, sans-serif";
  ctx.fillText("強み", 150, 1540);
  ctx.font = "500 34px Yu Gothic UI, sans-serif";
  result.type.strengths.forEach((item, index) => {
    ctx.fillText(`・${item}`, 150, 1600 + index * 52);
  });
  ctx.fillStyle = "#b6c5c2";
  ctx.font = "500 28px Yu Gothic UI, sans-serif";
  ctx.fillText(`診断日 ${new Date(result.answeredAt).toLocaleDateString("ja-JP")}`, 150, 1810);

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `dino-type-${result.type.id}.png`;
  link.click();
  const message = bind("save-message");
  if (message) message.textContent = "結果画像を保存しました。保存できない場合は結果カードのスクリーンショットも利用できます。";
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

function drawCanvasDino(ctx, x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "#4de0aa";
  ctx.beginPath();
  ctx.ellipse(0, 0, 270, 170, -0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d6f62";
  ctx.beginPath();
  ctx.ellipse(210, -72, 105, 78, 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c3835";
  ctx.beginPath();
  ctx.ellipse(-258, -22, 140, 48, -0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4f8f6";
  ctx.beginPath();
  ctx.arc(240, -91, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#071012";
  ctx.beginPath();
  ctx.arc(245, -91, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = [...text];
  let line = "";
  let cursorY = y;
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
}

boot();
