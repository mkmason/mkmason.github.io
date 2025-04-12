const form = document.querySelector("#csvForm");
const csvFileInput = document.querySelector("#csvInput");
let dateName = document.querySelector("#dateName").value;
let exerciseName = document.querySelector("#exerciseName").value;
let filteredCSVTest = [];
let weeklyVolumeTest = [];


function submitClicked(){
    console.log("Submit button clicked");
    readCSV().then((filteredCSV) => {
        const exerciseList = filteredCSV.map((item) => item.exercise);
        let uniqueExercises = [...new Set(exerciseList)];
        uniqueExercises.sort();
        populateGrid(uniqueExercises);
    }).catch((error) => {
        console.error("Error reading CSV:", error);
    });
}


function csvToArr(stringVal, splitter) {
    const [keys, ...rest] = stringVal
      .trim()
      .split("\n")
      .map((item) => item.split(splitter));
  
    const formedArr = rest.map((item) => {
      const object = {};
      keys.forEach((key, index) => {
        const cleanedKey = key.trim().replace(/\r/g, "");
        const cleanedValue = item.at(index)?.trim().replace(/\r/g, "");
        object[cleanedKey] = cleanedValue;
      });
      return object;
    });
    return formedArr;
  }

function calculateWeeklyVolume() {
    let gridData = readGrid();
    let gridHeaders = ['Back', 'Bicep', 'Forearm', 'Chest', 'Tricep', 'Shoulder', 'Quad', 'Glutes', 'Hamstring', 'Calves', 'Core'];
    let csvData = filteredCSVTest;
    let weeklyVolume = {};
    let startYear = new Date(csvData[0].date).getFullYear();

    csvData.forEach((entry) => {
        const exerciseDate = new Date(entry.date);
        let weekNumber = Math.ceil((exerciseDate - new Date(exerciseDate.getFullYear(), 0, 1)) / (1000 * 60 * 60 * 24 * 7));
        let year = exerciseDate.getFullYear();
        let extraWeeks = (year - startYear) * 52;
        weekNumber += extraWeeks;
        entry.weekNumber = weekNumber;
    });


    csvData.forEach((entry) => {
        const exercise = entry.exercise;
        const weekNumber = entry.weekNumber;
        gridValues = gridData.find((item) => item.exercise === exercise).values;
        weeklyVolume[weekNumber] = weeklyVolume[weekNumber] || {};
        gridHeaders.forEach((header, index) => {
            if (index < gridValues.length - 1) { // Ignore the 12th value
            weeklyVolume[weekNumber][header] = (weeklyVolume[weekNumber][header] || 0) + parseFloat(gridValues[index]);
            }
        });
    });
    weeklyVolumeTest = weeklyVolume;
    drawWeeklyPlots();
}

function populateGrid(uniqueExercises) {
    const grid = document.querySelector("#dataGridBody");
    grid.innerHTML = ""; // Clear existing content
    uniqueExercises.forEach((exercise) => {
        const row = document.createElement("tr");
        const exerciseCell = document.createElement("td");
        const repeatCell = document.createElement("td");
        exerciseCell.textContent = exercise;
        row.appendChild(exerciseCell);
        for (let i = 2; i <= 12; i++) {
            const inputCell = document.createElement("td");
            const selectField = document.createElement("select");
            const options = ["0", "0.5", "1"];
            options.forEach((value) => {
                const option = document.createElement("option");
                option.value = value;
                option.textContent = value;
                selectField.appendChild(option);
            });
            selectField.value = "0";
            inputCell.appendChild(selectField);
            row.appendChild(inputCell);
            repeatCell.textContent = exercise;
            row.appendChild(repeatCell);
        }
        grid.appendChild(row);
    });
}

function readGrid() {
    const grid = document.querySelector("#dataGridBody");
    let data = Array.from(grid.querySelectorAll("tr")).map((row) => {
        const cells = Array.from(row.querySelectorAll("td"));
        return {
            exercise: cells[0].textContent,
            values: cells.slice(1).map((cell) => {
                let select = cell.querySelector("select");
                if (select) {
                    return select.value;
                }
                return -1; // Handle case where select is not found
            })
        };
    });
    return data;
}

function saveGrid() {
    const data = readGrid();
    const csvContent = data.map(e => e.exercise + "," + e.values.join(",")).join("\n");
    localStorage.setItem("gridData", csvContent);
}
function loadGrid() {
    const csvContent = localStorage.getItem("gridData");
    if (csvContent) {
        const rows = csvContent.split("\n").map(row => row.split(","));
        const grid = document.querySelector("#dataGridBody");
        grid.innerHTML = ""; // Clear existing content
        rows.forEach((row) => {
            const tr = document.createElement("tr");
            const exerciseCell = document.createElement("td");
            exerciseCell.textContent = row[0]; // First column is the exercise name
            tr.appendChild(exerciseCell);
            row.slice(1).forEach((value) => { // Remaining columns are dropdown values
                if (value == -1){
                        const repeatCell = document.createElement("td");
                        repeatCell.textContent = row[0]; // Repeat exercise name
                        tr.appendChild(repeatCell);
                        return;
                }
                const inputCell = document.createElement("td");
                const selectField = document.createElement("select");
                const options = ["0", "0.5", "1"];
                options.forEach((optionValue) => {
                    const option = document.createElement("option");
                    option.value = optionValue;
                    option.textContent = optionValue;
                    if (optionValue === value) {
                        option.selected = true;
                    }
                    selectField.appendChild(option);
                });
                inputCell.appendChild(selectField);
                tr.appendChild(inputCell);
            });
            grid.appendChild(tr);
        });
    } else {
        console.log("No saved data found.");
    }
}
function readCSV() {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        const file = csvFileInput.files[0];
        if (!file) {
            reject("No file selected");
            return;
        }
        reader.onload = function(event) {
            const fileContent = event.target.result;
            const csvData = csvToArr(fileContent, ",");
            let filteredCSV = csvData.map((item) => {
                return {date: item[dateName], exercise: item[exerciseName]};
            });
            filteredCSVTest = filteredCSV;
            resolve(filteredCSV);
        };
        reader.onerror = function() {
            reject("Error reading file");
        };
        reader.readAsText(file);
    });
}

function drawWeeklyPlots(){
    const weeklyVolume = weeklyVolumeTest;
    const muscleGroups = ['Back', 'Bicep', 'Forearm', 'Chest', 'Tricep', 'Shoulder', 'Quad', 'Glutes', 'Hamstring', 'Calves', 'Core'];
    const plotContainer = document.querySelector("#plotsContainer");
    plotContainer.innerHTML = ""; // Clear existing plots

    muscleGroups.forEach((muscle, index) => {
        const plotId = `myplot${index + 1}`;
        const plotDiv = document.createElement("div");
        plotDiv.id = plotId;
        plotContainer.appendChild(plotDiv);

        const xValues = Object.keys(weeklyVolume).map(week => `Week ${week}`);
        const yValues = Object.keys(weeklyVolume).map(week => weeklyVolume[week][muscle] || 0);

        const trace = {
            x: xValues,
            y: yValues,
            type: 'bar',
            name: muscle
        };

        const layout = {
            title: `${muscle} Weekly Volume`,
            xaxis: { title: 'Week' },
            yaxis: { title: 'Volume' }
        };

        Plotly.newPlot(plotId, [trace], layout);
    });
}