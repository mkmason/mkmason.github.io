// Powerlifting Total Progression page
const LB_TO_KG = 0.45359237;
const LOG_KEY = "trainingLog"; // shared with the Weekly Volume page
const MANUAL_KEY = "powerlifting.manualLifts";
const SETTINGS_KEY = "powerlifting.settings";
const SETTING_IDS = [
  "squatName", "benchName", "deadliftName", "SumoDeadliftName", "dateName", "exerciseName",
  "weightName", "repsName", "bodyWeight", "sex", "maxReps", "lbs", "lbsLifted", "removeSumo",
  "compareSex", "country", "weightClassCheck",
];
const LIFTS = [
  { key: "squat", label: "Squat" },
  { key: "bench", label: "Bench Press" },
  { key: "deadlift", label: "Deadlift" },
];
const METRICS = ["total", "squat", "bench", "deadlift"];
const LIFT_LABELS = { squat: "Squat", bench: "Bench Press", deadlift: "Deadlift", sumo: "Sumo Deadlift" };
const COLORS = { record: "#e4572e", estimate: "#3d8bfd", pool: "#8a96a3" };

const el = (id) => document.getElementById(id);

let trainingLog = null; // { name, text, savedAt }
let manualLifts = AppStorage.getJSON(MANUAL_KEY, []);
let opl = null; // OpenPowerlifting rankings data, see loadOpenPowerlifting()

// ---------- Settings ----------

function readSettings() {
  let bodyWeight = parseFloat(el("bodyWeight").value);
  if (!(bodyWeight > 0)) bodyWeight = 80;
  if (el("lbs").checked) bodyWeight *= LB_TO_KG;
  const maxReps = parseInt(el("maxReps").value, 10);
  return {
    names: {
      squat: el("squatName").value,
      bench: el("benchName").value,
      deadlift: el("deadliftName").value,
      sumo: el("SumoDeadliftName").value,
      date: el("dateName").value,
      exercise: el("exerciseName").value,
      weight: el("weightName").value,
      reps: el("repsName").value,
    },
    bodyWeight,
    isFemale: el("sex").value === "F",
    liftsInLbs: el("lbsLifted").checked,
    maxReps: maxReps > 0 ? maxReps : 30,
    removeSumo: el("removeSumo").checked,
    compareSex: el("compareSex").value,
    country: el("country").value,
    weightClassOnly: el("weightClassCheck").checked,
  };
}

// ---------- Training data ----------

function csvToArr(stringVal, splitter) {
  const [keys, ...rest] = stringVal
    .trim()
    .split("\n")
    .map((item) => item.split(splitter));

  return rest.map((item) => {
    const object = {};
    keys.forEach((key, index) => {
      const cleanedKey = key.trim().replace(/\r/g, "");
      object[cleanedKey] = item.at(index)?.trim().replace(/\r/g, "");
    });
    return object;
  });
}

function parseDate(value) {
  // "YYYY-MM-DD HH:MM" is not parsed by every browser, the "T" form is
  return Date.parse(String(value).replace(" ", "T"));
}

function nowStamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

// Combines the CSV log and manual lifts into [{ date, lift, weight (kg), reps }] in date order
function buildLiftRows(settings) {
  const names = settings.names;
  const liftByName = {
    [names.squat]: "squat",
    [names.bench]: "bench",
    [names.deadlift]: "deadlift",
    [names.sumo]: "sumo",
  };
  const rows = [];

  if (trainingLog) {
    const csv = csvToArr(trainingLog.text, /[,;]/);
    const missing = ["date", "exercise", "weight", "reps"].filter((key) => csv.length && csv[0][names[key]] === undefined);
    if (missing.length) {
      throw new Error("The CSV file has no column named " + missing.map((key) => `"${names[key]}"`).join(", ") +
        ". Check the column names under Training log.");
    }
    csv.forEach((row) => {
      const lift = liftByName[row[names.exercise]];
      if (lift) {
        rows.push({ date: row[names.date], lift, weight: parseFloat(row[names.weight]), reps: parseFloat(row[names.reps]) });
      }
    });
  }
  manualLifts.forEach((entry) => rows.push({ ...entry }));

  const cleaned = rows
    .filter((row) => row.weight > 0 && row.reps > 0 && !(settings.removeSumo && row.lift === "sumo"))
    .map((row, index) => ({
      ...row,
      lift: row.lift === "sumo" ? "deadlift" : row.lift,
      weight: settings.liftsInLbs ? row.weight * LB_TO_KG : row.weight,
      time: parseDate(row.date),
      index,
    }));
  cleaned.sort((a, b) => (a.time - b.time) || (a.index - b.index));
  return cleaned;
}

function estimate1RM(weight, reps) {
  if (reps <= 10) {
    return weight / (1.0278 - 0.0278 * reps);
  }
  return weight * (1 + reps / 30);
}

// Walks the log in date order and records every new personal record
function computeProgress(rows, maxReps) {
  const best = { squat: 0, bench: 0, deadlift: 0 };
  const bestEstimate = { squat: 0, bench: 0, deadlift: 0 };
  const records = { squat: [], bench: [], deadlift: [], total: [] };
  const estimates = { squat: [], bench: [], deadlift: [], total: [] };
  const sum = (values) => values.squat + values.bench + values.deadlift;
  // A total only exists once all three lifts have been done
  const hasTotal = (values) => values.squat > 0 && values.bench > 0 && values.deadlift > 0;

  rows.forEach((row) => {
    const estimate = estimate1RM(row.weight, Math.min(row.reps, maxReps));
    if (row.weight > best[row.lift]) {
      best[row.lift] = row.weight;
      records[row.lift].push({ date: row.date, value: row.weight });
      if (hasTotal(best)) records.total.push({ date: row.date, value: sum(best) });
    }
    if (estimate > bestEstimate[row.lift]) {
      bestEstimate[row.lift] = estimate;
      estimates[row.lift].push({ date: row.date, value: estimate });
      if (hasTotal(bestEstimate)) estimates.total.push({ date: row.date, value: sum(bestEstimate) });
    }
  });

  return {
    best: { ...best, total: sum(best) },
    bestEstimate: { ...bestEstimate, total: sum(bestEstimate) },
    records,
    estimates,
    firstDate: rows[0].date,
    lastDate: rows[rows.length - 1].date,
  };
}

// ---------- Scores ----------

function calculateOldWilks(bodyWeight, isFemale, weightLifted) {
  const maleCoeff = [-216.0475144, 16.2606339, -0.002388645, -0.00113732, 7.01863e-6, -1.291e-8];
  const femaleCoeff = [594.31747775582, -27.23842536447, 0.82112226871, -0.00930733913, 4.731582e-5, -9.054e-8];
  const coeff = isFemale ? femaleCoeff : maleCoeff;
  const bw = Math.min(Math.max(bodyWeight, isFemale ? 26.51 : 40), isFemale ? 154.53 : 201.9);
  let denominator = coeff[0];
  for (let i = 1; i < coeff.length; i++) {
    denominator += coeff[i] * Math.pow(bw, i);
  }
  return (500 / denominator) * weightLifted;
}

function Calculate_NewWilks(bodyWeight, isFemale, weightLifted) {
  const maleCoeff = [47.4617885411949, 8.47206137941125, 0.073694103462609, -1.39583381094385e-3, 7.07665973070743e-6, -1.20804336482315e-8];
  const femaleCoeff = [-125.425539779509, 13.7121941940668, -0.0330725063103405, -1.0504000506583e-3, 9.38773881462799e-6, -2.3334613884954e-8];
  const coeff = isFemale ? femaleCoeff : maleCoeff;
  const bw = Math.min(Math.max(bodyWeight, 40), isFemale ? 150.95 : 200.95);
  let denominator = coeff[0];
  for (let i = 1; i < coeff.length; i++) {
    denominator += coeff[i] * Math.pow(bw, i);
  }
  return (600 / denominator) * weightLifted;
}

function Calculate_DOTS(bodyWeight, isFemale, weightLifted) {
  const maleCoeff = [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093];
  const femaleCoeff = [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706];
  const coeff = isFemale ? femaleCoeff : maleCoeff;
  const bw = Math.min(Math.max(bodyWeight, 40), isFemale ? 150 : 210);
  let denominator = coeff[0];
  for (let i = 1; i < coeff.length; i++) {
    denominator += coeff[i] * Math.pow(bw, i);
  }
  return (500 / denominator) * weightLifted;
}

// IPF GL points, using the classic (raw) powerlifting coefficients
function Calculate_GLPoints(bodyWeight, isFemale, weightLifted) {
  const [a, b, c] = isFemale ? [610.32796, 1045.59282, 0.03048] : [1199.72839, 1025.18162, 0.00921];
  if (bodyWeight < 35) return 0;
  return (weightLifted * 100) / (a - b * Math.exp(-c * bodyWeight));
}

// ---------- OpenPowerlifting rankings ----------

// data/opl is built from the OpenPowerlifting bulk export by scripts/build_opl_data.py
async function loadOpenPowerlifting() {
  const [metaResponse, entriesResponse] = await Promise.all([
    fetch("data/opl/meta.json"),
    fetch("data/opl/entries.csv"),
  ]);
  if (!metaResponse.ok || !entriesResponse.ok) {
    throw new Error("OpenPowerlifting data is missing");
  }
  const meta = await metaResponse.json();
  const text = await entriesResponse.text();

  const size = meta.rows;
  const data = {
    meta,
    size: 0,
    female: new Uint8Array(size),
    bodyweight: new Float32Array(size),
    country: new Uint16Array(size),
    lifter: new Int32Array(size),
    values: {}, // per metric: the result of each row
    best: {}, // per metric: scratch space with one slot per lifter
  };
  METRICS.forEach((metric) => {
    data.values[metric] = new Float32Array(size);
    data.best[metric] = new Float32Array(meta.lifters);
  });
  // Columns: sex,bodyweight,total,squat,bench,deadlift,country,lifter (blank total = sum of lifts)
  let position = text.indexOf("\n") + 1;
  let i = 0;
  while (position < text.length && i < size) {
    let end = text.indexOf("\n", position);
    if (end === -1) end = text.length;
    const parts = text.slice(position, end).split(",");
    if (parts.length === 8) {
      const squat = +parts[3];
      const bench = +parts[4];
      const deadlift = +parts[5];
      data.female[i] = parts[0] === "F" ? 1 : 0;
      data.bodyweight[i] = +parts[1];
      data.values.total[i] = parts[2] === "" ? squat + bench + deadlift : +parts[2];
      data.values.squat[i] = squat;
      data.values.bench[i] = bench;
      data.values.deadlift[i] = deadlift;
      data.country[i] = +parts[6];
      data.lifter[i] = +parts[7];
      i++;
    }
    position = end + 1;
  }
  data.size = i;
  return data;
}

function weightClassRange(settings) {
  const classes = opl.meta.weightClasses[settings.isFemale ? "F" : "M"];
  const index = classes.findIndex((limit) => settings.bodyWeight <= limit);
  if (index === -1) {
    const last = classes[classes.length - 1];
    return { min: last, max: Infinity, label: `${last}+ kg class` };
  }
  const min = index > 0 ? classes[index - 1] : 0;
  return { min, max: classes[index], label: `${classes[index]} kg class` };
}

// Best total, squat, bench and deadlift per lifter within the chosen filters, each highest first
function rankingPool(settings) {
  const range = settings.weightClassOnly
    ? weightClassRange(settings)
    : { min: 0, max: settings.bodyWeight, label: `at or below ${formatNumber(settings.bodyWeight)} kg` };
  const countryIndex = settings.country ? opl.meta.countries.indexOf(settings.country) + 1 : 0;
  const wantFemale = settings.compareSex === "F" ? 1 : 0;
  const seen = new Uint8Array(opl.meta.lifters);
  const touched = [];

  for (let i = 0; i < opl.size; i++) {
    if (settings.compareSex !== "B" && opl.female[i] !== wantFemale) continue;
    if (countryIndex && opl.country[i] !== countryIndex) continue;
    const bodyweight = opl.bodyweight[i];
    if (bodyweight <= range.min || bodyweight > range.max) continue;
    const lifter = opl.lifter[i];
    if (!seen[lifter]) {
      seen[lifter] = 1;
      touched.push(lifter);
    }
    METRICS.forEach((metric) => {
      const value = opl.values[metric][i];
      if (value > opl.best[metric][lifter]) opl.best[metric][lifter] = value;
    });
  }

  const pools = {};
  METRICS.forEach((metric) => {
    const best = opl.best[metric];
    const values = [];
    touched.forEach((lifter) => {
      if (best[lifter] > 0) values.push(best[lifter]); // some federations only report totals
      best[lifter] = 0; // reset the shared buffer for the next query
    });
    pools[metric] = Float64Array.from(values).sort().reverse();
  });

  const sexLabel = { B: "male and female", M: "male", F: "female" }[settings.compareSex];
  return {
    pools,
    totals: pools.total,
    description: `${sexLabel}, ${settings.country || "world"}, ${range.label}`,
  };
}

// 1 + number of lifters with a higher result (values sorted highest first)
function placement(totals, total) {
  let low = 0;
  let high = totals.length;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (totals[mid] > total) low = mid + 1;
    else high = mid;
  }
  return low + 1;
}

function populateCountries() {
  const select = el("country");
  opl.meta.countries.forEach((country) => {
    const option = document.createElement("option");
    option.value = country;
    option.textContent = country;
    select.appendChild(option);
  });
  const saved = AppStorage.getJSON(SETTINGS_KEY, {}).country;
  if (saved && opl.meta.countries.includes(saved)) {
    select.value = saved;
  }
}

// ---------- Rendering ----------

function formatNumber(value, digits = 1) {
  return Number(value.toFixed(digits)).toLocaleString();
}

function renderResults(settings, progress, ranking, error) {
  const container = el("results");
  container.textContent = "";

  if (error) {
    const message = document.createElement("div");
    message.className = "error-message";
    message.textContent = error;
    container.appendChild(message);
    return;
  }
  if (!progress) {
    container.innerHTML = '<p class="hint">Upload your training log or add a lift to see your results.</p>';
    return;
  }

  const kg = (value) => formatNumber(value) + " kg";
  const scores = (total) => [
    ["DOTS", formatNumber(Calculate_DOTS(settings.bodyWeight, settings.isFemale, total), 2)],
    ["GL points", formatNumber(Calculate_GLPoints(settings.bodyWeight, settings.isFemale, total), 2)],
    ["New Wilks", formatNumber(Calculate_NewWilks(settings.bodyWeight, settings.isFemale, total), 2)],
    ["Old Wilks", formatNumber(calculateOldWilks(settings.bodyWeight, settings.isFemale, total), 2)],
  ];
  const groups = [
    {
      title: "Personal records",
      stats: [...LIFTS.map((lift) => [lift.label, kg(progress.best[lift.key])]), ["Total", kg(progress.best.total), true]],
    },
    {
      title: "1RM estimates",
      stats: [...LIFTS.map((lift) => [lift.label, kg(progress.bestEstimate[lift.key])]), ["Total", kg(progress.bestEstimate.total), true]],
    },
    { title: "Scores", stats: scores(progress.best.total) },
    { title: "Estimated scores", stats: scores(progress.bestEstimate.total) },
  ];

  if (ranking && ranking.totals.length) {
    // "#123 (top 4.5%)" for a result within one of the ranking pools
    const rank = (metric, value) => {
      const pool = ranking.pools[metric];
      if (!(value > 0) || !pool.length) return "–";
      const place = placement(pool, value);
      return `#${place.toLocaleString()} (top ${formatNumber((place / pool.length) * 100, 2)}%)`;
    };
    groups.push({
      title: "Ranking",
      wide: true,
      stats: [
        ["Total", rank("total", progress.best.total), true],
        ["Total (estimated)", rank("total", progress.bestEstimate.total)],
        ...LIFTS.map((lift) => [lift.label, rank(lift.key, progress.best[lift.key])]),
        ["Lifters compared", ranking.totals.length.toLocaleString()],
      ],
    });
  }

  const wrapper = document.createElement("div");
  wrapper.className = "stat-groups";
  groups.forEach((group) => {
    const section = document.createElement("div");
    section.className = group.wide ? "stat-group wide" : "stat-group";
    const heading = document.createElement("h3");
    heading.textContent = group.title;
    const list = document.createElement("dl");
    group.stats.forEach(([label, value, highlight]) => {
      const row = document.createElement("div");
      row.className = highlight ? "stat highlight" : "stat";
      const term = document.createElement("dt");
      term.textContent = label;
      const detail = document.createElement("dd");
      detail.textContent = value;
      row.append(term, detail);
      list.appendChild(row);
    });
    section.append(heading, list);
    wrapper.appendChild(section);
  });
  container.appendChild(wrapper);
}

function drawProgressPlots(progress) {
  const container = el("progressPlots");
  if (!progress) {
    container.hidden = true;
    return;
  }
  container.hidden = false;

  const plots = [
    ["myPlot7", progress.records.total, "Total Personal Records", "Total (kg)", COLORS.record],
    ["myPlot8", progress.estimates.total, "Total 1RM Estimate", "Total (kg)", COLORS.estimate],
    ["myPlot", progress.records.squat, "Squat Personal Records", "Squat (kg)", COLORS.record],
    ["myPlot2", progress.estimates.squat, "Squat 1RM Estimate", "Squat (kg)", COLORS.estimate],
    ["myPlot3", progress.records.bench, "Bench Press Personal Records", "Bench Press (kg)", COLORS.record],
    ["myPlot4", progress.estimates.bench, "Bench Press 1RM Estimate", "Bench Press (kg)", COLORS.estimate],
    ["myPlot5", progress.records.deadlift, "Deadlift Personal Records", "Deadlift (kg)", COLORS.record],
    ["myPlot6", progress.estimates.deadlift, "Deadlift 1RM Estimate", "Deadlift (kg)", COLORS.estimate],
  ];
  // Shared date range so the charts line up (left to Plotly when there is a single date)
  const dateRange = progress.firstDate === progress.lastDate
    ? undefined
    : [progress.firstDate, progress.lastDate].map((date) => String(date).replace(" ", "T"));

  plots.forEach(([id, points, title, axisTitle, color]) => {
    const values = points.map((point) => point.value);
    const data = [{
      x: points.map((point) => point.date),
      y: values,
      mode: "lines+markers",
      line: { color, shape: "hv" },
      marker: { size: 5 },
      hovertemplate: "%{x}<br>%{y:.1f} kg<extra></extra>",
    }];
    const layout = {
      title,
      height: 340,
      margin: { l: 60, r: 20, t: 50, b: 50 },
      xaxis: { range: dateRange, title: "Date", type: "date" },
      yaxis: { range: [0, Math.max(0, ...values) + 10], title: axisTitle },
    };
    Plotly.newPlot(id, data, SiteTheme.plotLayout(layout), { responsive: true });
  });
}

function drawRankingPlot(ranking, progress) {
  const totals = ranking.totals;
  const count = totals.length;
  // A few thousand points draw the same curve as the full list
  const step = Math.max(1, Math.ceil(count / 4000));
  const x = [];
  const y = [];
  for (let i = 0; i < count; i += step) {
    x.push(i + 1);
    y.push(totals[i]);
  }
  if (count && x[x.length - 1] !== count) {
    x.push(count);
    y.push(totals[count - 1]);
  }

  const data = [{
    x,
    y,
    name: "OpenPowerlifting lifters",
    mode: "lines",
    line: { color: COLORS.pool },
    hovertemplate: "#%{x}: %{y:.1f} kg<extra></extra>",
  }];

  if (progress && count) {
    [
      [progress.best.total, "Your total", COLORS.record],
      [progress.bestEstimate.total, "Your 1RM estimate total", COLORS.estimate],
    ].forEach(([total, name, color]) => {
      const place = placement(totals, total);
      data.push({
        x: [place, place],
        y: [0, total],
        name,
        mode: "lines+markers",
        line: { color, dash: "dash" },
        marker: { size: [0, 10], color },
        hovertemplate: `${name}: %{y:.1f} kg, #${place.toLocaleString()}<extra></extra>`,
      });
    });
  }

  const layout = {
    title: "Where your total places",
    height: 460,
    margin: { l: 60, r: 20, t: 50, b: 50 },
    xaxis: { title: "Placement", range: [0, count + 1] },
    yaxis: { title: "Total (kg)", range: [0, (count ? totals[0] : 0) + 50] },
    legend: { orientation: "h", y: -0.2 },
  };
  Plotly.newPlot("myPlot9", data, SiteTheme.plotLayout(layout), { responsive: true });

  const meta = opl.meta;
  el("oplInfo").textContent =
    `Comparing with ${count.toLocaleString()} raw, drug tested, full power lifters (${ranking.description}). ` +
    `Each lifter counts once, with their best total. OpenPowerlifting data up to ${meta.latestMeet}.`;
}

function run() {
  const settings = readSettings();
  let progress = null;
  try {
    const rows = buildLiftRows(settings);
    progress = rows.length ? computeProgress(rows, settings.maxReps) : null;
  } catch (error) {
    renderResults(settings, null, null, error.message);
    drawProgressPlots(null);
    return;
  }
  const ranking = opl ? rankingPool(settings) : null;
  renderResults(settings, progress, ranking);
  drawProgressPlots(progress);
  if (ranking) drawRankingPlot(ranking, progress);
}

// ---------- Manual lifts ----------

function renderManualLifts() {
  const list = el("manualList");
  list.textContent = "";
  manualLifts.forEach((entry, index) => {
    const item = document.createElement("li");
    const text = document.createElement("span");
    text.textContent = `${LIFT_LABELS[entry.lift]} ${entry.weight} × ${entry.reps} `;
    const date = document.createElement("span");
    date.className = "entry-date";
    date.textContent = entry.date;
    text.appendChild(date);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "ghost small";
    remove.textContent = "Remove";
    remove.addEventListener("click", () => {
      manualLifts.splice(index, 1);
      AppStorage.setJSON(MANUAL_KEY, manualLifts);
      renderManualLifts();
      run();
    });
    item.append(text, remove);
    list.appendChild(item);
  });
}

el("manualForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const weight = parseFloat(el("manualWeight").value);
  const reps = parseInt(el("manualReps").value, 10);
  if (!(weight > 0) || !(reps > 0)) return;
  manualLifts.push({ date: nowStamp(), lift: el("manualLift").value, weight, reps });
  AppStorage.setJSON(MANUAL_KEY, manualLifts);
  el("manualWeight").value = "";
  renderManualLifts();
  run();
});

// ---------- Training log file ----------

function showSavedFile() {
  AppStorage.renderSavedFile(el("savedFile"), trainingLog, async () => {
    await AppStorage.deleteFile(LOG_KEY);
    trainingLog = null;
    el("csvInput").value = "";
    showSavedFile();
    run();
  });
}

el("csvInput").addEventListener("change", async () => {
  const file = await AppStorage.readFileInput(el("csvInput"));
  if (!file) return;
  trainingLog = await AppStorage.saveFile(LOG_KEY, file.name, file.text);
  showSavedFile();
  run();
});

// ---------- Start up ----------

AppStorage.persistFields(SETTINGS_KEY, SETTING_IDS);
SETTING_IDS.forEach((id) => el(id).addEventListener("change", run));
renderManualLifts();

(async () => {
  trainingLog = await AppStorage.loadFile(LOG_KEY);
  showSavedFile();
  run();
  try {
    opl = await loadOpenPowerlifting();
    populateCountries();
    run();
  } catch (error) {
    console.error("Error loading OpenPowerlifting data:", error);
    el("oplInfo").textContent = "Could not load the OpenPowerlifting data.";
  }
})();
