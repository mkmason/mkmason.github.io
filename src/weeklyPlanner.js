const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const muscleGroups = [
  { name: "Back", color: "#6bc5f8" },
  { name: "Bicep", color: "#6ef7a7" },
  { name: "Calves", color: "#f1c40f" },
  { name: "Chest", color: "#ff8f70" },
  { name: "Core", color: "#8d99ae" },
  { name: "Forearms", color: "#8eecf5" },
  { name: "Glutes", color: "#f7aef8" },
  { name: "Hamstring", color: "#c0f0b2" },
  { name: "Quad", color: "#ffd166" },
  { name: "Shoulder", color: "#a29bfe" },
  { name: "Tricep", color: "#f497da" },
];
const splitMap = {
  "Lower": ["Calves", "Glutes", "Hamstring", "Quad"],
  "Full Body": ["Back", "Bicep", "Calves", "Chest", "Core", "Forearms", "Glutes", "Hamstring", "Quad", "Shoulder", "Tricep"],
  "Push": ["Chest", "Shoulder", "Tricep"],
  "Pull": ["Back", "Bicep", "Forearms"],
  "Upper": ["Back", "Bicep", "Chest", "Forearms", "Shoulder", "Tricep"],
  "Arms": ["Bicep", "Forearms", "Tricep"],
};

let scheduleArray = [];

const paletteEl = document.querySelector("#musclePalette");
const calendarEl = document.querySelector("#calendar");
const splitSelect = document.querySelector("#splitSelect");
const splitDaySelect = document.querySelector("#splitDaySelect");
const saveBtn = document.querySelector("#savePlan");
const loadBtn = document.querySelector("#loadPlan");
const clearBtn = document.querySelector("#clearPlan");

const statsRefs = {
  totalExercises: document.querySelector("#totalExercises"),
  muscleGroupsTargeted: document.querySelector("#muscleGroupsTargeted"),
  daysPlanned: document.querySelector("#daysPlanned"),
  chestDays: document.querySelector("#chestDays"),
  backDays: document.querySelector("#backDays"),
  quadDays: document.querySelector("#quadDays"),
  hamstringDays: document.querySelector("#hamstringDays"),
  shoulderDays: document.querySelector("#shoulderDays"),
  bicepDays: document.querySelector("#bicepDays"),
  tricepDays: document.querySelector("#tricepDays"),
  calvesDays: document.querySelector("#calvesDays"),
  coreDays: document.querySelector("#coreDays"),
  gluteDays: document.querySelector("#glutesDays"),
  forearmDays: document.querySelector("#forearmsDays"),
  restDays: document.querySelector("#restDays"),
  chestRestDays: document.querySelector("#chestRestDays"),
  backRestDays: document.querySelector("#backRestDays"),
  quadRestDays: document.querySelector("#quadRestDays"),
  hamstringRestDays: document.querySelector("#hamstringRestDays"),
  shoulderRestDays: document.querySelector("#shoulderRestDays"),
  bicepRestDays: document.querySelector("#bicepRestDays"),
  tricepRestDays: document.querySelector("#tricepRestDays"),
  calvesRestDays: document.querySelector("#calvesRestDays"),
  coreRestDays: document.querySelector("#coreRestDays"),
  gluteRestDays: document.querySelector("#glutesRestDays"),
  forearmRestDays: document.querySelector("#forearmsRestDays"),
};

init();

function init() {
  buildDaySelect();
  buildCalendar();
  renderPalette();
  attachEvents();
  statistics();
}

function renderPalette() {
  paletteEl.innerHTML = "";
  muscleGroups.forEach((group) => {
    const btn = document.createElement("button");
    btn.className = "muscle-chip";
    btn.textContent = group.name;
    btn.style.background = group.color;
    btn.setAttribute("draggable", "true");
    btn.dataset.muscle = group.name;
    paletteEl.appendChild(btn);
  });
}

function buildCalendar() {
  calendarEl.innerHTML = "";
  daysOfWeek.forEach((day) => {
    const card = document.createElement("div");
    card.className = "day-card";
    card.dataset.day = day;

    const header = document.createElement("div");
    header.className = "day-header";
    header.textContent = day;

    const dropzone = document.createElement("div");
    dropzone.className = "day-dropzone";
    dropzone.dataset.day = day;

    const footer = document.createElement("div");
    footer.className = "day-footer";
    const select = createMuscleSelect();
    select.classList.add("day-select");
    select.dataset.day = day;
    const addBtn = document.createElement("button");
    addBtn.textContent = "Add";
    addBtn.type = "button";
    addBtn.className = "primary day-add";
    addBtn.dataset.day = day;
    const clearBtn = document.createElement("button");
    clearBtn.textContent = "Clear";
    clearBtn.type = "button";
    clearBtn.className = "ghost day-clear";
    clearBtn.dataset.day = day;
    footer.append(select, addBtn, clearBtn);

    card.append(header, dropzone, footer);
    calendarEl.appendChild(card);
  });
}

function buildDaySelect() {
  splitDaySelect.innerHTML = "";
  daysOfWeek.forEach((day) => {
    const option = document.createElement("option");
    option.value = day;
    option.textContent = day;
    splitDaySelect.appendChild(option);
  });
}

function createMuscleSelect() {
  const select = document.createElement("select");
  muscleGroups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.name;
    option.textContent = group.name;
    select.appendChild(option);
  });
  return select;
}

function attachEvents() {
  document.addEventListener("dragstart", (e) => {
    const target = e.target;
    if (target.classList.contains("muscle-chip")) {
      e.dataTransfer.setData("text/plain", target.dataset.muscle);
      e.dataTransfer.effectAllowed = "copy";
    }
  });

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("muscle-chip")) {
      const muscle = e.target.dataset.muscle;
      const day = splitDaySelect.value;
      const exists = scheduleArray.some((entry) => entry.muscleGroup === muscle && entry.day === day);
      if (exists) {
        removeFromPlan(day, muscle);
      } else {
        addToPlan(day, muscle);
      }
    }
  });

  calendarEl.addEventListener("dragover", (e) => {
    const zone = e.target.closest(".day-dropzone");
    if (zone) {
      e.preventDefault();
      zone.classList.add("drag-over");
    }
  });

  calendarEl.addEventListener("dragleave", (e) => {
    const zone = e.target.closest(".day-dropzone");
    if (zone) {
      zone.classList.remove("drag-over");
    }
  });

  calendarEl.addEventListener("drop", (e) => {
    const zone = e.target.closest(".day-dropzone");
    if (!zone) return;
    e.preventDefault();
    zone.classList.remove("drag-over");
    const muscle = e.dataTransfer.getData("text/plain");
    const day = zone.dataset.day;
    if (muscle) {
      addToPlan(day, muscle);
    }
  });

  calendarEl.addEventListener("click", (e) => {
    if (e.target.classList.contains("day-add")) {
      const day = e.target.dataset.day;
      const select = e.target.parentElement.querySelector(".day-select");
      addToPlan(day, select.value);
    }
    if (e.target.classList.contains("day-clear")) {
      clearDay(e.target.dataset.day);
    }
    const tag = e.target.closest(".tag");
    if (tag) {
      removeFromPlan(tag.dataset.day, tag.dataset.muscle);
    }
  });

  saveBtn.addEventListener("click", savePlan);
  loadBtn.addEventListener("click", loadPlan);
  clearBtn.addEventListener("click", clearPlan);

  document.querySelector("#applySplit").addEventListener("click", () => {
    const day = splitDaySelect.value;
    const split = splitSelect.value;
    splitMap[split].forEach((group) => addToPlan(day, group));
  });

  document.querySelector("#removeSplit").addEventListener("click", () => {
    const day = splitDaySelect.value;
    const split = splitSelect.value;
    splitMap[split].forEach((group) => removeFromPlan(day, group));
  });
}

function renderDay(day) {
  const zone = calendarEl.querySelector(`.day-dropzone[data-day="${day}"]`);
  if (!zone) return;
  zone.innerHTML = "";
  const items = scheduleArray.filter((entry) => entry.day === day);
  items.forEach((entry) => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.dataset.day = entry.day;
    tag.dataset.muscle = entry.muscleGroup;
    const color = muscleGroups.find((m) => m.name === entry.muscleGroup)?.color;
    if (color) {
      tag.style.background = color;
    }
    tag.textContent = entry.muscleGroup;
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "×";
    removeBtn.className = "remove-tag";
    tag.appendChild(removeBtn);
    zone.appendChild(tag);
  });
}

function renderBoard() {
  daysOfWeek.forEach(renderDay);
}

function addToPlan(day, muscleGroup) {
  if (!scheduleArray.some((entry) => entry.muscleGroup === muscleGroup && entry.day === day)) {
    scheduleArray.push({ muscleGroup, day });
    renderDay(day);
    statistics();
  }
}

function removeFromPlan(day, muscleGroup) {
  const before = scheduleArray.length;
  scheduleArray = scheduleArray.filter((entry) => !(entry.muscleGroup === muscleGroup && entry.day === day));
  if (scheduleArray.length !== before) {
    renderDay(day);
    statistics();
  }
}

function clearDay(day) {
  const before = scheduleArray.length;
  scheduleArray = scheduleArray.filter((entry) => entry.day !== day);
  if (scheduleArray.length !== before) {
    renderDay(day);
    statistics();
  }
}

function clearPlan() {
  scheduleArray = [];
  renderBoard();
  statistics();
}

function savePlan() {
  const plan = JSON.stringify(scheduleArray);
  localStorage.setItem("weeklyPlan", plan);
  alert("Plan saved successfully!");
}

function loadPlan() {
  const plan = localStorage.getItem("weeklyPlan");
  if (plan) {
    scheduleArray = JSON.parse(plan);
    renderBoard();
    statistics();
  } else {
    alert("No saved plan found.");
  }
}

function statistics() {
  const allDays = [...daysOfWeek];
  statsRefs.totalExercises.textContent = scheduleArray.length;
  const muscles = new Set(scheduleArray.map((entry) => entry.muscleGroup));
  statsRefs.muscleGroupsTargeted.textContent = muscles.size;
  statsRefs.daysPlanned.textContent = new Set(scheduleArray.map((entry) => entry.day)).size;
  statsRefs.chestDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Chest").length;
  statsRefs.backDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Back").length;
  statsRefs.quadDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Quad").length;
  statsRefs.hamstringDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Hamstring").length;
  statsRefs.shoulderDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Shoulder").length;
  statsRefs.bicepDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Bicep").length;
  statsRefs.tricepDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Tricep").length;
  statsRefs.calvesDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Calves").length;
  statsRefs.coreDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Core").length;
  statsRefs.gluteDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Glutes").length;
  statsRefs.forearmDays.textContent = scheduleArray.filter((entry) => entry.muscleGroup === "Forearms").length;
  statsRefs.restDays.textContent = allDays.filter((day) => !scheduleArray.some((entry) => entry.day === day)).length;

  statsRefs.chestRestDays.textContent = calculateMinRestDays("Chest");
  statsRefs.backRestDays.textContent = calculateMinRestDays("Back");
  statsRefs.quadRestDays.textContent = calculateMinRestDays("Quad");
  statsRefs.hamstringRestDays.textContent = calculateMinRestDays("Hamstring");
  statsRefs.shoulderRestDays.textContent = calculateMinRestDays("Shoulder");
  statsRefs.bicepRestDays.textContent = calculateMinRestDays("Bicep");
  statsRefs.tricepRestDays.textContent = calculateMinRestDays("Tricep");
  statsRefs.calvesRestDays.textContent = calculateMinRestDays("Calves");
  statsRefs.coreRestDays.textContent = calculateMinRestDays("Core");
  statsRefs.gluteRestDays.textContent = calculateMinRestDays("Glutes");
  statsRefs.forearmRestDays.textContent = calculateMinRestDays("Forearms");
}

function calculateMinRestDays(group) {
  const days = scheduleArray
    .filter((entry) => entry.muscleGroup === group)
    .map((entry) => entry.day);
  if (days.length === 0) return 7;
  if (days.length === 7) return 0;
  if (days.length === 1) return 6;
  return daysBetweenWeekdaysArray(days);
}

function daysBetweenWeekdaysArray(weekdays) {
  if (!Array.isArray(weekdays) || weekdays.length < 2 || weekdays.length > 7) {
    return 7;
  }
  const indices = weekdays
    .map((day) => daysOfWeek.indexOf(day))
    .sort((a, b) => a - b);
  const adjusted = indices.map((day) => day - 7);
  const all = [...indices, ...adjusted].sort((a, b) => a - b);
  let minDiff = 7;
  for (let i = 0; i < all.length - 1; i++) {
    const diff = Math.abs(all[i] - all[i + 1]) - 1;
    if (diff < minDiff) {
      minDiff = diff;
    }
  }
  return minDiff;
}
