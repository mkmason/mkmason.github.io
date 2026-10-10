// Parse CSV file
function parseCSV(text) {
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  const dateIndex = headers.indexOf('Date');
  const measurementIndex = headers.indexOf('Measurement');
  const valueIndex = headers.indexOf('Value');

  if (dateIndex === -1 || measurementIndex === -1 || valueIndex === -1) {
    throw new Error('CSV must contain Date, Measurement, and Value columns');
  }

  const data = {};

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '') continue;

    const parts = lines[i].split(',').map(p => p.trim());
    const date = parts[dateIndex];
    const measurement = parts[measurementIndex];
    const value = parseFloat(parts[valueIndex]);

    if (!data[date]) {
      data[date] = {};
    }

    data[date][measurement] = value;
  }

  return data;
}

function addWeeks(dateString, weeksToAdd) {
  const date = new Date(dateString);
  date.setDate(date.getDate() + (weeksToAdd * 7));
  return date.toISOString().split('T')[0];
}

function getFutureProjection(dates, values, weeklyIncrease, trendWeeks) {
  const validPoints = [];

  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null && !Number.isNaN(values[i])) {
      validPoints.push({ date: dates[i], value: values[i] });
    }
  }

  if (validPoints.length === 0) {
    return { dates: [], values: [] };
  }

  const lastPoint = validPoints[validPoints.length - 1];
  const projectionDates = [];
  const projectionValues = [];

  for (let week = 1; week <= trendWeeks; week++) {
    projectionDates.push(addWeeks(lastPoint.date, week));
    projectionValues.push(lastPoint.value + (weeklyIncrease * week));
  }

  return {
    dates: projectionDates,
    values: projectionValues
  };
}

function evaluateGoalProjection(values, goal, weeklyIncrease, trendWeeks) {
  const validValues = values.filter(v => v !== null && !Number.isNaN(v));
  if (validValues.length === 0) {
    return null;
  }

  const latestValue = validValues[validValues.length - 1];
  if (latestValue >= goal) {
    return { reached: true, weeksToGoal: 0 };
  }

  if (weeklyIncrease <= 0) {
    return { reached: false, weeksToGoal: null };
  }

  const requiredWeeks = Math.ceil((goal - latestValue) / weeklyIncrease);
  return {
    reached: requiredWeeks <= trendWeeks,
    weeksToGoal: requiredWeeks
  };
}

function formatGoalSummary(label, rightEval, leftEval, lastDate) {
  if (!rightEval && !leftEval) {
    return `${label}: insufficient data for projection.`;
  }

  const sideResults = [
    { side: 'Right', eval: rightEval },
    { side: 'Left', eval: leftEval }
  ].filter(item => item.eval !== null);

  const reachedSides = sideResults.filter(item => item.eval.reached);

  if (reachedSides.length > 0) {
    const earliest = reachedSides.reduce((best, current) => {
      if (best === null) return current;
      return current.eval.weeksToGoal < best.eval.weeksToGoal ? current : best;
    }, null);

    if (earliest.eval.weeksToGoal === 0) {
      return `${label}: goal already reached (${earliest.side} side).`;
    }

    const reachDate = addWeeks(lastDate, earliest.eval.weeksToGoal);
    return `${label}: projected to reach goal in ${earliest.eval.weeksToGoal} week(s) on ${reachDate} (${earliest.side} side).`;
  }

  const withWeeks = sideResults.filter(item => item.eval.weeksToGoal !== null);
  if (withWeeks.length === 0) {
    return `${label}: goal not projected to be reached (weekly increase is 0).`;
  }

  const soonestMiss = withWeeks.reduce((best, current) => {
    if (best === null) return current;
    return current.eval.weeksToGoal < best.eval.weeksToGoal ? current : best;
  }, null);

  return `${label}: not projected to reach goal within extension window. Estimated ${soonestMiss.eval.weeksToGoal} week(s) needed (${soonestMiss.side} side).`;
}

const MEASUREMENTS_KEY = 'measurements';
const MANUAL_KEY = 'armTracker.manualEntries';
const SETTINGS_KEY = 'armTracker.settings';
const SETTING_IDS = [
  'upperArmGoal', 'forearmGoal', 'upperWeeklyIncrease', 'forearmWeeklyIncrease',
  'trendWeeks', 'showFutureTrend', 'showDataTrend', 'dataTrendWeeks'
];
const MEASUREMENTS = [
  { name: 'Bodyweight', field: 'manualBodyweight', unit: 'kg' },
  { name: 'Upper Arm (Right)', field: 'manualUpperRight', unit: 'cm' },
  { name: 'Upper Arm (Left)', field: 'manualUpperLeft', unit: 'cm' },
  { name: 'Forearm (Right)', field: 'manualForearmRight', unit: 'cm' },
  { name: 'Forearm (Left)', field: 'manualForearmLeft', unit: 'cm' }
];
const DAY_MS = 24 * 60 * 60 * 1000;

let measurementFile = null; // { name, text, savedAt }
let manualEntries = AppStorage.getJSON(MANUAL_KEY, []); // [{ date: 'YYYY-MM-DD', values: { Bodyweight: 80 } }]

function todayString() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

// CSV measurements with manual entries added on top
function getMeasurementData() {
  const data = measurementFile ? parseCSV(measurementFile.text) : {};
  manualEntries.forEach(entry => {
    data[entry.date] = Object.assign(data[entry.date] || {}, entry.values);
  });
  return data;
}

// Least-squares line through the last `windowWeeks` of data (0 = all data),
// extended `extendWeeks` past the last measurement
function fitDataTrend(dates, values, windowWeeks, extendWeeks) {
  const points = [];
  for (let i = 0; i < values.length; i++) {
    if (values[i] !== null && !Number.isNaN(values[i])) {
      points.push({ time: Date.parse(dates[i]), value: values[i] });
    }
  }
  if (points.length < 2) {
    return null;
  }
  const lastTime = points[points.length - 1].time;
  const fromTime = windowWeeks > 0 ? lastTime - windowWeeks * 7 * DAY_MS : -Infinity;
  let used = points.filter(point => point.time >= fromTime);
  let allData = windowWeeks <= 0;
  if (used.length < 2 || used[0].time === lastTime) {
    // Too few recent measurements: fit on everything instead
    used = points;
    allData = true;
  }
  if (used[0].time === lastTime) {
    return null;
  }

  const meanTime = used.reduce((sum, p) => sum + p.time, 0) / used.length;
  const meanValue = used.reduce((sum, p) => sum + p.value, 0) / used.length;
  let numerator = 0;
  let denominator = 0;
  used.forEach(p => {
    numerator += (p.time - meanTime) * (p.value - meanValue);
    denominator += (p.time - meanTime) ** 2;
  });
  const slope = numerator / denominator; // per millisecond
  const valueAt = time => meanValue + slope * (time - meanTime);
  const endTime = lastTime + extendWeeks * 7 * DAY_MS;

  return {
    dates: [used[0].time, endTime].map(time => new Date(time).toISOString().split('T')[0]),
    values: [valueAt(used[0].time), valueAt(endTime)],
    perWeek: slope * 7 * DAY_MS,
    allData,
    current: valueAt(lastTime),
    lastTime
  };
}

function describeDataTrend(label, trend, unit, goal, windowWeeks) {
  if (!trend) {
    return `${label}: not enough data for a trend.`;
  }
  const sign = trend.perWeek >= 0 ? '+' : '';
  let text = `${label}: ${sign}${trend.perWeek.toFixed(3)} ${unit}/week`;
  if (trend.allData && windowWeeks > 0) {
    text += ' (fitted on all data, too few recent measurements)';
  }
  if (goal !== undefined) {
    if (trend.current >= goal) {
      text += ', goal reached';
    } else if (trend.perWeek > 0) {
      const weeks = Math.ceil((goal - trend.current) / trend.perWeek);
      const date = new Date(trend.lastTime + weeks * 7 * DAY_MS).toISOString().split('T')[0];
      text += `, goal of ${goal} ${unit} in about ${weeks} week(s) (${date})`;
    } else {
      text += ', not moving towards the goal';
    }
  }
  return text + '.';
}

function dataTrendTrace(trend, name, color, yaxis) {
  return {
    x: trend ? trend.dates : [],
    y: trend ? trend.values : [],
    name: name + ' Data Trend',
    type: 'scatter',
    mode: 'lines',
    yaxis,
    opacity: 0.7,
    line: { color, width: 2, dash: 'longdash' },
    hovertemplate: `${name} trend: %{y:.2f}<extra></extra>`
  };
}

function showError(message) {
  const errorMessage = document.getElementById('errorMessage');
  errorMessage.textContent = message;
  errorMessage.style.display = message ? 'block' : 'none';
}

// Generate plots
async function generatePlots() {
  const fileInput = document.getElementById('csvInput');
  const plotsContainer = document.getElementById('plotsContainer');
  const projectionStatus = document.getElementById('projectionStatus');
  const upperArmGoal = parseFloat(document.getElementById('upperArmGoal').value);
  const forearmGoal = parseFloat(document.getElementById('forearmGoal').value);
  const upperWeeklyIncrease = parseFloat(document.getElementById('upperWeeklyIncrease').value);
  const forearmWeeklyIncrease = parseFloat(document.getElementById('forearmWeeklyIncrease').value);
  const trendWeeks = parseInt(document.getElementById('trendWeeks').value, 10);
  const showFutureTrend = document.getElementById('showFutureTrend').checked;
  const showDataTrend = document.getElementById('showDataTrend').checked;
  const dataTrendWeeks = parseInt(document.getElementById('dataTrendWeeks').value, 10);

  // Clear previous plots and errors
  showError('');
  projectionStatus.style.display = 'none';
  projectionStatus.innerHTML = '';
  plotsContainer.innerHTML = '';

  try {
    const file = await AppStorage.readFileInput(fileInput);
    if (file) {
      measurementFile = await AppStorage.saveFile(MEASUREMENTS_KEY, file.name, file.text);
      showSavedFile();
    }
  } catch (error) {
    showError('Error reading file');
    return;
  }

  if (!measurementFile && manualEntries.length === 0) {
    showError('Import a CSV file or add a measurement first');
    return;
  }

  if (Number.isNaN(upperWeeklyIncrease) || upperWeeklyIncrease < 0) {
    showError('Upper weekly increase must be 0 or greater');
    return;
  }

  if (Number.isNaN(forearmWeeklyIncrease) || forearmWeeklyIncrease < 0) {
    showError('Forearm weekly increase must be 0 or greater');
    return;
  }

  if ((showFutureTrend || showDataTrend) && (Number.isNaN(trendWeeks) || trendWeeks < 1)) {
    showError('Trend extension must be at least 1 week');
    return;
  }

  if (showDataTrend && (Number.isNaN(dataTrendWeeks) || dataTrendWeeks < 0)) {
    showError('Trend fit window must be 0 (all data) or more weeks');
    return;
  }

  try {
    const measurementData = getMeasurementData();

    if (Object.keys(measurementData).length === 0) {
      throw new Error('No data found in CSV file');
    }

    // Sort dates
    const dates = Object.keys(measurementData).sort();
    const series = name => dates.map(date => (measurementData[date][name] !== undefined ? measurementData[date][name] : null));
    const bodyweight = series('Bodyweight');
    const upperArmRight = series('Upper Arm (Right)');
    const upperArmLeft = series('Upper Arm (Left)');
    const forearmRight = series('Forearm (Right)');
    const forearmLeft = series('Forearm (Left)');

    // Bodyweight range with 5kg buffer
    const validBodyweights = bodyweight.filter(bw => bw !== null);
    const bodyweightRange = validBodyweights.length
      ? [Math.min(...validBodyweights) - 5, Math.max(...validBodyweights) + 5]
      : undefined;

    let upperArmRightProjection = { dates: [], values: [] };
    let upperArmLeftProjection = { dates: [], values: [] };
    let forearmRightProjection = { dates: [], values: [] };
    let forearmLeftProjection = { dates: [], values: [] };
    const notes = [];
    const extraDates = [];

    if (showFutureTrend) {
      upperArmRightProjection = getFutureProjection(dates, upperArmRight, upperWeeklyIncrease, trendWeeks);
      upperArmLeftProjection = getFutureProjection(dates, upperArmLeft, upperWeeklyIncrease, trendWeeks);
      forearmRightProjection = getFutureProjection(dates, forearmRight, forearmWeeklyIncrease, trendWeeks);
      forearmLeftProjection = getFutureProjection(dates, forearmLeft, forearmWeeklyIncrease, trendWeeks);

      extraDates.push(
        ...upperArmRightProjection.dates,
        ...upperArmLeftProjection.dates,
        ...forearmRightProjection.dates,
        ...forearmLeftProjection.dates
      );

      const lastDate = dates[dates.length - 1];
      const upperRightEval = evaluateGoalProjection(upperArmRight, upperArmGoal, upperWeeklyIncrease, trendWeeks);
      const upperLeftEval = evaluateGoalProjection(upperArmLeft, upperArmGoal, upperWeeklyIncrease, trendWeeks);
      const foreRightEval = evaluateGoalProjection(forearmRight, forearmGoal, forearmWeeklyIncrease, trendWeeks);
      const foreLeftEval = evaluateGoalProjection(forearmLeft, forearmGoal, forearmWeeklyIncrease, trendWeeks);

      notes.push('<strong>Future Trend Notes:</strong>',
        formatGoalSummary('Upper Arm', upperRightEval, upperLeftEval, lastDate),
        formatGoalSummary('Forearm', foreRightEval, foreLeftEval, lastDate));
    }

    let dataTrends = {};
    if (showDataTrend) {
      const fit = values => fitDataTrend(dates, values, dataTrendWeeks, trendWeeks);
      dataTrends = {
        upperRight: fit(upperArmRight),
        upperLeft: fit(upperArmLeft),
        forearmRight: fit(forearmRight),
        forearmLeft: fit(forearmLeft),
        bodyweight: fit(bodyweight)
      };
      Object.values(dataTrends).forEach(trend => {
        if (trend) extraDates.push(trend.dates[1]);
      });

      const windowText = dataTrendWeeks > 0 ? `last ${dataTrendWeeks} week(s)` : 'all data';
      notes.push(`<strong>Trend from your data (${windowText}):</strong>`,
        describeDataTrend('Upper Arm (Right)', dataTrends.upperRight, 'cm', upperArmGoal, dataTrendWeeks),
        describeDataTrend('Upper Arm (Left)', dataTrends.upperLeft, 'cm', upperArmGoal, dataTrendWeeks),
        describeDataTrend('Forearm (Right)', dataTrends.forearmRight, 'cm', forearmGoal, dataTrendWeeks),
        describeDataTrend('Forearm (Left)', dataTrends.forearmLeft, 'cm', forearmGoal, dataTrendWeeks),
        describeDataTrend('Bodyweight', dataTrends.bodyweight, 'kg', undefined, dataTrendWeeks));
    }

    if (notes.length) {
      projectionStatus.innerHTML = notes.join('<br>');
      projectionStatus.style.display = 'block';
    }

    const combinedDates = [...new Set([...dates, ...extraDates])].sort();

    // Goal lines
    const goalTrace = (label, goal) => ({
      x: combinedDates,
      y: combinedDates.map(() => goal),
      name: `${label} Goal (${goal}cm)`,
      type: 'scatter',
      mode: 'lines',
      yaxis: 'y',
      line: {color: '#ff0000', width: 2, dash: 'dash'},
      hovertemplate: `${label} Goal: ${goal}cm<extra></extra>`
    });

    const measuredTrace = (name, values, color, yaxis = 'y') => ({
      x: dates,
      y: values,
      name,
      type: 'scatter',
      mode: 'lines+markers',
      yaxis,
      connectgaps: true,
      line: {color, width: 2},
      marker: {size: 5}
    });

    const projectionTrace = (name, projection, color) => ({
      x: projection.dates,
      y: projection.values,
      name: name + ' Future Trend',
      type: 'scatter',
      mode: 'lines',
      yaxis: 'y',
      line: {color, width: 2, dash: 'dot'}
    });

    const plotLayout = (title, axisTitle, axisColor) => ({
      title,
      xaxis: {
        title: 'Date',
        type: 'date'
      },
      yaxis: {
        title: axisTitle,
        titlefont: {color: axisColor},
        tickfont: {color: axisColor},
        side: 'left'
      },
      yaxis2: {
        title: 'Bodyweight (kgs)',
        titlefont: {color: '#2ca02c'},
        tickfont: {color: '#2ca02c'},
        overlaying: 'y',
        side: 'right',
        range: bodyweightRange
      },
      hovermode: 'x unified',
      showlegend: true,
      legend: {
        x: 0.01,
        y: 0.99
      },
      margin: {
        l: 80,
        r: 80,
        t: 60,
        b: 60
      },
      height: 500
    });

    const addPlot = (id, heading, data, layout) => {
      const section = document.createElement('div');
      section.className = 'plot-section';
      section.innerHTML = `<h2>${heading}</h2>`;
      const plotDiv = document.createElement('div');
      plotDiv.className = 'plot';
      plotDiv.id = id;
      section.appendChild(plotDiv);
      plotsContainer.appendChild(section);
      Plotly.newPlot(id, data, SiteTheme.plotLayout(layout), {responsive: true});
    };

    // First plot: Upper Arm and Bodyweight
    const plot1Data = [
      measuredTrace('Upper Arm (Right)', upperArmRight, '#1f77b4'),
      measuredTrace('Upper Arm (Left)', upperArmLeft, '#ff7f0e'),
      measuredTrace('Bodyweight', bodyweight, '#2ca02c', 'y2'),
      goalTrace('Upper Arm', upperArmGoal)
    ];
    if (showFutureTrend) {
      plot1Data.push(
        projectionTrace('Upper Arm (Right)', upperArmRightProjection, '#1f77b4'),
        projectionTrace('Upper Arm (Left)', upperArmLeftProjection, '#ff7f0e')
      );
    }
    if (showDataTrend) {
      plot1Data.push(
        dataTrendTrace(dataTrends.upperRight, 'Upper Arm (Right)', '#1f77b4', 'y'),
        dataTrendTrace(dataTrends.upperLeft, 'Upper Arm (Left)', '#ff7f0e', 'y'),
        dataTrendTrace(dataTrends.bodyweight, 'Bodyweight', '#2ca02c', 'y2')
      );
    }
    addPlot('plot1', 'Upper Arm Size & Bodyweight', plot1Data,
      plotLayout('Upper Arm Size & Bodyweight Progress', 'Upper Arm Circumference (cm)', '#1f77b4'));

    // Second plot: Forearm and Bodyweight
    const plot2Data = [
      measuredTrace('Forearm (Right)', forearmRight, '#d62728'),
      measuredTrace('Forearm (Left)', forearmLeft, '#9467bd'),
      measuredTrace('Bodyweight', bodyweight, '#2ca02c', 'y2'),
      goalTrace('Forearm', forearmGoal)
    ];
    if (showFutureTrend) {
      plot2Data.push(
        projectionTrace('Forearm (Right)', forearmRightProjection, '#d62728'),
        projectionTrace('Forearm (Left)', forearmLeftProjection, '#9467bd')
      );
    }
    if (showDataTrend) {
      plot2Data.push(
        dataTrendTrace(dataTrends.forearmRight, 'Forearm (Right)', '#d62728', 'y'),
        dataTrendTrace(dataTrends.forearmLeft, 'Forearm (Left)', '#9467bd', 'y'),
        dataTrendTrace(dataTrends.bodyweight, 'Bodyweight', '#2ca02c', 'y2')
      );
    }
    addPlot('plot2', 'Forearm Size & Bodyweight', plot2Data,
      plotLayout('Forearm Size & Bodyweight Progress', 'Forearm Circumference (cm)', '#d62728'));

  } catch (error) {
    showError('Error parsing CSV: ' + error.message);
    console.error(error);
  }
}

// ---------- Saved file and manual entries ----------

function hasData() {
  return measurementFile !== null || manualEntries.length > 0;
}

function showSavedFile() {
  AppStorage.renderSavedFile(document.getElementById('savedFile'), measurementFile, async () => {
    await AppStorage.deleteFile(MEASUREMENTS_KEY);
    measurementFile = null;
    document.getElementById('csvInput').value = '';
    showSavedFile();
    if (hasData()) generatePlots();
    else document.getElementById('plotsContainer').innerHTML = '';
  });
}

function renderManualEntries() {
  const list = document.getElementById('manualList');
  list.textContent = '';
  manualEntries.forEach((entry, index) => {
    const item = document.createElement('li');
    const text = document.createElement('span');
    const date = document.createElement('span');
    date.className = 'entry-date';
    date.textContent = entry.date + ' ';
    text.appendChild(date);
    text.appendChild(document.createTextNode(MEASUREMENTS
      .filter(m => entry.values[m.name] !== undefined)
      .map(m => `${m.name} ${entry.values[m.name]} ${m.unit}`)
      .join(', ')));
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'ghost small';
    remove.textContent = 'Remove';
    remove.addEventListener('click', () => {
      manualEntries.splice(index, 1);
      AppStorage.setJSON(MANUAL_KEY, manualEntries);
      renderManualEntries();
      if (hasData()) generatePlots();
      else document.getElementById('plotsContainer').innerHTML = '';
    });
    item.append(text, remove);
    list.appendChild(item);
  });
}

document.getElementById('manualForm').addEventListener('submit', event => {
  event.preventDefault();
  const values = {};
  MEASUREMENTS.forEach(m => {
    const input = document.getElementById(m.field);
    const value = parseFloat(input.value);
    if (value > 0) {
      values[m.name] = value;
    }
  });
  if (Object.keys(values).length === 0) {
    showError('Enter at least one measurement to add');
    return;
  }
  const date = todayString();
  const existing = manualEntries.find(entry => entry.date === date);
  if (existing) {
    Object.assign(existing.values, values);
  } else {
    manualEntries.push({ date, values });
  }
  AppStorage.setJSON(MANUAL_KEY, manualEntries);
  MEASUREMENTS.forEach(m => { document.getElementById(m.field).value = ''; });
  renderManualEntries();
  generatePlots();
});

document.getElementById('csvInput').addEventListener('change', generatePlots);
AppStorage.persistFields(SETTINGS_KEY, SETTING_IDS);
SETTING_IDS.forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    if (hasData()) generatePlots();
  });
});
renderManualEntries();

AppStorage.loadFile(MEASUREMENTS_KEY).then(record => {
  measurementFile = record;
  showSavedFile();
  if (hasData()) generatePlots();
});
