let muscleGroup = document.querySelector("#muscleGroup");
let day = document.querySelector("#day");
let calender = document.querySelector("#calendar");
let monday = document.querySelector("#Monday");
let tuesday = document.querySelector("#Tuesday");
let wednesday = document.querySelector("#Wednesday");
let thursday = document.querySelector("#Thursday");
let friday = document.querySelector("#Friday");
let saturday = document.querySelector("#Saturday");
let sunday = document.querySelector("#Sunday");
let scheduleArray = [];
let totalExercises = document.querySelector("#totalExercises");
let muscleGroupsTargeted = document.querySelector("#muscleGroupsTargeted");
let daysPlanned = document.querySelector("#daysPlanned");
let chestDays = document.querySelector("#chestDays");
let backDays = document.querySelector("#backDays");
let quadDays = document.querySelector("#quadDays");
let hamstringDays = document.querySelector("#hamstringDays");
let shoulderDays = document.querySelector("#shoulderDays");
let bicepDays = document.querySelector("#bicepDays");
let tricepDays = document.querySelector("#tricepDays");
let calvesDays = document.querySelector("#calvesDays");
let coreDays = document.querySelector("#coreDays");
let restDays = document.querySelector("#restDays");
let gluteDays = document.querySelector("#glutesDays");
let forearmDays = document.querySelector("#forearmsDays");
let chestRestDays = document.querySelector("#chestRestDays");
let backRestDays = document.querySelector("#backRestDays");
let quadRestDays = document.querySelector("#quadRestDays");
let hamstringRestDays = document.querySelector("#hamstringRestDays");
let shoulderRestDays = document.querySelector("#shoulderRestDays");
let bicepRestDays = document.querySelector("#bicepRestDays");
let tricepRestDays = document.querySelector("#tricepRestDays");
let calvesRestDays = document.querySelector("#calvesRestDays");
let coreRestDays = document.querySelector("#coreRestDays");
let gluteRestDays = document.querySelector("#glutesRestDays");
let forearmRestDays = document.querySelector("#forearmsRestDays");


function addExercise() {
muscleGroup = document.querySelector("#muscleGroup").value;
day = document.querySelector("#day").value;
if (!scheduleArray.some(entry => entry.muscleGroup === muscleGroup && entry.day === day)) {
    scheduleArray.push({ muscleGroup, day });
} else {
    alert("This muscle group is already scheduled for the selected day.");
    return;
}
statistics();
switch (day) {
    case "Monday":
        monday.innerHTML += muscleGroup + "<br>";
        break;
    case "Tuesday":
        tuesday.innerHTML += muscleGroup + "<br>";
        break;
    case "Wednesday":
        wednesday.innerHTML += muscleGroup + "<br>";
        break;
    case "Thursday":
        thursday.innerHTML += muscleGroup + "<br>";
        break;
    case "Friday":
        friday.innerHTML += muscleGroup + "<br>";
        break;
    case "Saturday":
        saturday.innerHTML += muscleGroup + "<br>";
        break;
    case "Sunday":
        sunday.innerHTML += muscleGroup + "<br>";
        break;
    default:
        alert("Please select a valid day.");
}};

function clearPlan() {
    scheduleArray = [];
    monday.innerHTML = "";
    tuesday.innerHTML = "";
    wednesday.innerHTML = "";
    thursday.innerHTML = "";
    friday.innerHTML = "";
    saturday.innerHTML = "";
    sunday.innerHTML = "";
    statistics();
}

function removeExercise() {
    muscleGroup = document.querySelector("#muscleGroup").value;
    day = document.querySelector("#day").value;
    scheduleArray = scheduleArray.filter(entry => !(entry.muscleGroup === muscleGroup && entry.day === day));
    statistics();
    switch (day) {
        case "Monday":
            monday.innerHTML = monday.innerHTML.replace(muscleGroup + "<br>", "");
            break;
        case "Tuesday":
            tuesday.innerHTML = tuesday.innerHTML.replace(muscleGroup + "<br>", "");
            break;
        case "Wednesday":
            wednesday.innerHTML = wednesday.innerHTML.replace(muscleGroup + "<br>", "");
            break;
        case "Thursday":
            thursday.innerHTML = thursday.innerHTML.replace(muscleGroup + "<br>", "");
            break;
        case "Friday":
            friday.innerHTML = friday.innerHTML.replace(muscleGroup + "<br>", "");
            break;
        case "Saturday":
            saturday.innerHTML = saturday.innerHTML.replace(muscleGroup + "<br>", "");
            break;
        case "Sunday":
            sunday.innerHTML = sunday.innerHTML.replace(muscleGroup + "<br>", "");
            break;
        default:
            alert("Please select a valid day.");
}}
function savePlan() {
    const plan = JSON.stringify(scheduleArray);
    localStorage.setItem("weeklyPlan", plan);
    alert("Plan saved successfully!");
}
function loadPlan() {
    const plan = localStorage.getItem("weeklyPlan");
    if (plan) {
        clearPlan();
        scheduleArray = JSON.parse(plan);
        scheduleArray.forEach(entry => {
            switch (entry.day) {
                case "Monday":
                    monday.innerHTML += entry.muscleGroup + "<br>";
                    break;
                case "Tuesday":
                    tuesday.innerHTML += entry.muscleGroup + "<br>";
                    break;
                case "Wednesday":
                    wednesday.innerHTML += entry.muscleGroup + "<br>";
                    break;
                case "Thursday":
                    thursday.innerHTML += entry.muscleGroup + "<br>";
                    break;
                case "Friday":
                    friday.innerHTML += entry.muscleGroup + "<br>";
                    break;
                case "Saturday":
                    saturday.innerHTML += entry.muscleGroup + "<br>";
                    break;
                case "Sunday":
                    sunday.innerHTML += entry.muscleGroup + "<br>";
                    break;
            }
        });
        statistics();
    } else {
        alert("No saved plan found.");
    }
}

function statistics() {
    const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    totalExercises.innerHTML = scheduleArray.length;
    let muscleGroups = new Set(scheduleArray.map(entry => entry.muscleGroup));
    muscleGroupsTargeted.innerHTML = muscleGroups.size;
    daysPlanned.innerHTML = scheduleArray.map(entry => entry.day).filter((value, index, self) => self.indexOf(value) === index).length;
    chestDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Chest").length;
    backDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Back").length;
    quadDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Quad").length;
    hamstringDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Hamstring").length;
    shoulderDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Shoulder").length;
    bicepDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Bicep").length;
    tricepDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Tricep").length;
    calvesDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Calves").length;
    coreDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Core").length;
    gluteDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Glutes").length;
    forearmDays.innerHTML = scheduleArray.filter(entry => entry.muscleGroup === "Forearms").length;
    restDays.innerHTML = allDays.filter(day => !scheduleArray.some(entry => entry.day === day)).length;
    let minChestRestDays = calculateMinRestDays("Chest");
    let minBackRestDays = calculateMinRestDays("Back");
    let minQuadRestDays = calculateMinRestDays("Quad");
    let minHamstringRestDays = calculateMinRestDays("Hamstring");
    let minShoulderRestDays = calculateMinRestDays("Shoulder");
    let minBicepRestDays = calculateMinRestDays("Bicep");
    let minTricepRestDays = calculateMinRestDays("Tricep");
    let minCalvesRestDays = calculateMinRestDays("Calves");
    let minCoreRestDays = calculateMinRestDays("Core");
    let minGluteRestDays = calculateMinRestDays("Glutes");
    let minForearmRestDays = calculateMinRestDays("Forearms");
    chestRestDays.innerHTML = minChestRestDays;
    backRestDays.innerHTML = minBackRestDays;
    quadRestDays.innerHTML = minQuadRestDays;
    hamstringRestDays.innerHTML = minHamstringRestDays;
    shoulderRestDays.innerHTML = minShoulderRestDays;
    bicepRestDays.innerHTML = minBicepRestDays;
    tricepRestDays.innerHTML = minTricepRestDays;
    calvesRestDays.innerHTML = minCalvesRestDays;
    coreRestDays.innerHTML = minCoreRestDays;
    gluteRestDays.innerHTML = minGluteRestDays;
    forearmRestDays.innerHTML = minForearmRestDays;

}


function calculateMinRestDays(group) {
    const days = scheduleArray
        .filter(entry => entry.muscleGroup === group)
        .map(entry => entry.day);
    if (days.length === 0 || days.length === 7) return 7;
    else if (days.length === 1) return 6;
    else{
        return daysBetweenWeekdaysArray(days);
    }
}

function daysBetweenWeekdaysArray(weekdays) {
    const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    if (!Array.isArray(weekdays) || weekdays.length < 2 || weekdays.length > 7) {
        throw new Error("Please provide an array with 2 to 7 weekdays.");
    }

    const weekdayIndices = weekdays.map(day => daysOfWeek.indexOf(day)).sort((a, b) => a - b);
    const adjustedIndices = weekdayIndices.map(day => day - 7);
    const allIndices = [...weekdayIndices, ...adjustedIndices];
    allIndices.sort((a, b) => a - b);
    let minDiff = 7;
    for (let i = 0; i < allIndices.length - 1; i++) {
        let diff = Math.abs(allIndices[i] - allIndices[i+1]) - 1;
        if (diff < minDiff) {
            minDiff = (diff);
        }
    }

    return minDiff;
}
