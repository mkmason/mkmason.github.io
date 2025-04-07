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
}

function removeExercise() {
    muscleGroup = document.querySelector("#muscleGroup").value;
    day = document.querySelector("#day").value;
    scheduleArray = scheduleArray.filter(entry => !(entry.muscleGroup === muscleGroup && entry.day === day));
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
    let totalExercises = scheduleArray.length;
    let exercisesPerDay = {};
    scheduleArray.forEach(entry => {
        if (!exercisesPerDay[entry.day]) {
            exercisesPerDay[entry.day] = 0;
        }
        exercisesPerDay[entry.day]++;
    });
    let stats = `Total Exercises: ${totalExercises}\nExercises Per Day:\n`;
    for (let day in exercisesPerDay) {
        stats += `${day}: ${exercisesPerDay[day]}\n`;
    }
    console.log(stats);
}