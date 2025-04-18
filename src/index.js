const form = document.querySelector("#csvForm");
const csvFileInput = document.querySelector("#csvInput");
const weightText = document.querySelector("#maxValues");
const weightText2 = document.querySelector("#maxValues2");
const scoreText = document.querySelector("#scores");
const scoreText2 = document.querySelector("#scores2");
let benchName = "Bench Press";
let squatName = "Squat";
let deadliftName = "Deadlift";
let dateName = "Date";
let weightName = "Weight";
let repsName = "Reps";
let exerciseName = "Exercise";
let openPowerliftingData;
fetchOpenPowerliftingData().then(data => {
  openPowerliftingData = data;
  let initialOPLData = openPowerliftingData.filter(row => row["Sex"] === "M" && parseFloat(row["BodyweightKg"]) <= 83);
  initialOPLData.sort((a, b) => parseFloat(a["TotalKg"]) - parseFloat(b["TotalKg"]));
  const data10 = [{
    x: Array.from({ length: initialOPLData.length }, (_, i) => initialOPLData.length - i),
    y: initialOPLData.map(row => row["TotalKg"]),
    name: "Open Powerlifting Data",
  }];
  const layout10 = {
        xaxis: {range: [0, initialOPLData.length + 1], title: "Placement"},
        yaxis: {range: [0, parseFloat(initialOPLData[initialOPLData.length - 1]["TotalKg"]) + 100], title: "Total (kg)"},
        title: "Open Powerlifting Data (05-04-2025, Tested, Raw+Wraps, SBD) " + "Weight Class: 83kg",
  };
  Plotly.newPlot("myPlot9", data10, layout10);
});

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const reader = new FileReader();
  const file = csvFileInput.files[0];

  benchName = document.querySelector("#benchName").value;
  squatName = document.querySelector("#squatName").value;
  deadliftName = document.querySelector("#deadliftName").value;
  dateName = document.querySelector("#dateName").value;
  weightName = document.querySelector("#weightName").value;
  repsName = document.querySelector("#repsName").value;
  exerciseName = document.querySelector("#exerciseName").value;
  let bodyWeight = document.querySelector("#bodyWeight").value;
  const lbConversionRate = 0.45359237;
  let islbs = document.querySelector("#lbs").checked;
  if (islbs) {
    bodyWeight = bodyWeight * lbConversionRate;
  }
  let islbsLifted = document.querySelector("#lbsLifted").checked;
  let isFemale = document.querySelector("#sex").checked;
  let isWeightClassLimited = document.querySelector("#weightClassCheck").checked;
  let maxReps = document.querySelector("#maxReps").value;

  reader.onload = function (e) {
    const csvArray = csvToArr(e.target.result, /[,;]/);
    const csvArrayCleaned = csvArray.map(row => {
      return {
        [dateName]: row[dateName],
        [exerciseName]: row[exerciseName],
        [weightName]: row[weightName],
        [repsName]: row[repsName]
      };
    });
      if (csvArrayCleaned[0][dateName] === undefined) {
        alert("Invalid CSV file. Please check the file format.");
        return;
      }
      if (csvArrayCleaned[0][exerciseName] === undefined) {
        alert("Invalid CSV file. Please check the file format.");
        return;
      }
      if (csvArrayCleaned[0][weightName] === undefined) {
        alert("Invalid CSV file. Please check the file format.");
        return;
      }
      if (csvArrayCleaned[0][repsName] === undefined) {
        alert("Invalid CSV file. Please check the file format.");
        return;
      }
    const filteredArray = csvArrayCleaned.filter(row => 
      row[exerciseName] === benchName || 
      row[exerciseName] === squatName || 
      row[exerciseName] === deadliftName
    );
    if (filteredArray.length === 0) {
      alert("No matching exercises found in the CSV file.");
      return;
    }
    if (islbsLifted) {
      filteredArray.forEach(row => {
        row[weightName] = (parseFloat(row[weightName]) * lbConversionRate).toFixed(2);
      });
    }
    const enrichedArray = filteredArray.map(row => {
      const weight = parseFloat(row[weightName]);
      const reps = Math.min(parseFloat(row[repsName]), maxReps);
      if (reps <=10){
        row["1RM Estimate"] = (weight / (1.0278 - 0.0278 * reps)).toFixed(2);
      }
      else 
      {
        row["1RM Estimate"] = (weight * (1+reps/30)).toFixed(2);
      }
      return row;
    });
    const squatWeight = [];
    const benchPressWeight = [];
    const deadliftWeight = [];
    const testWeight = [];
    const squat1RM = [];
    const benchPress1RM = [];
    const deadlift1RM = [];
    const test1RM = [];
    let currentMaxWeightS = 0;
    let currentMaxWeightBP = 0;
    let currentMaxWeightDL = 0;
    let currentMax1RMS = 0;
    let currentMax1RMBP = 0;
    let currentMax1RMDL = 0;
    let total = 0;
    let total1RM = 0;
    enrichedArray.forEach(function(row, index){
      const exercise = row[exerciseName];
      const weight = parseFloat(row[weightName]);
      const oneRM = parseFloat(row["1RM Estimate"]);
      switch (exercise) {
        case squatName:
          if (weight > currentMaxWeightS) {
            squatWeight.push(row);
            testWeight.push(row);
            total += weight - currentMaxWeightS;
            //console.log("total: "+ total + " weight: " + weight + " currentMaxWeightS: " + currentMaxWeightS);
            row["Total"] = total;
            currentMaxWeightS = weight;
          }
          if (oneRM > currentMax1RMS) {
            squat1RM.push(row);
            test1RM.push(row);
            total1RM += oneRM - currentMax1RMS;
            //console.log("total1RM: "+ total1RM + " oneRM: " + oneRM + " currentMax1RMS: " + currentMax1RMS);
            row["Total1RM"] = total1RM;
            currentMax1RMS = oneRM;
          }
          break;
        case benchName:
          if (weight > currentMaxWeightBP) {
            benchPressWeight.push(row);
            testWeight.push(row);
            total += weight - currentMaxWeightBP;
            //console.log("total: "+ total + " weight: " + weight + " currentMaxWeightBP: " + currentMaxWeightBP);
            row["Total"] = total;
            currentMaxWeightBP = weight;
          }
          if (oneRM > currentMax1RMBP) {
            benchPress1RM.push(row);
            test1RM.push(row);
            total1RM += oneRM - currentMax1RMBP;
            //console.log("total1RM: "+ total1RM + " oneRM: " + oneRM + " currentMax1RMBP: " + currentMax1RMBP);
            row["Total1RM"] = total1RM;
            currentMax1RMBP = oneRM;
          }
          break;
        case deadliftName:
          if (weight > currentMaxWeightDL) {
            deadliftWeight.push(row);
            testWeight.push(row);
            total += weight - currentMaxWeightDL;
            //console.log("total: "+ total + " weight: " + weight + " currentMaxWeightDL: " + currentMaxWeightDL);
            row["Total"] = total;
            currentMaxWeightDL = weight;
          }
          if (oneRM > currentMax1RMDL) {
            deadlift1RM.push(row);
            test1RM.push(row);
            total1RM += oneRM - currentMax1RMDL;
            //console.log("total1RM: "+ total1RM + " oneRM: " + oneRM + " currentMax1RMDL: " + currentMax1RMDL);
            row["Total1RM"] = total1RM;
            currentMax1RMDL = oneRM;
          }
          break;
      }
    });
    let firstDate = new Date(enrichedArray[0][dateName]);
    let lastDate = new Date(enrichedArray[enrichedArray.length - 1][dateName]);
    const SWeight = squatWeight.map(row => ({ Weight: row[weightName], Date: row[dateName] }));
    const BPWeight = benchPressWeight.map(row => ({ Weight: row[weightName], Date: row[dateName] }));
    const DLWeight = deadliftWeight.map(row => ({ Weight: row[weightName], Date: row[dateName] }));
    const S1RM = squat1RM.map(row => ({ Weight: row["1RM Estimate"], Date: row[dateName] }));
    const BP1RM = benchPress1RM.map(row => ({ Weight: row["1RM Estimate"], Date: row[dateName] }));
    const DL1RM = deadlift1RM.map(row => ({ Weight: row["1RM Estimate"], Date: row[dateName] }));
    const totalWeight = testWeight.map(row => ({ Weight: row["Total"], Date: row[dateName] }));
    const total1RM2 = test1RM.map(row => ({ Weight: row["Total1RM"], Date: row[dateName] }));
    let text = "Squat: " + currentMaxWeightS + "kg\n" +
      "Bench Press: " + currentMaxWeightBP + "kg\n" +
      "Deadlift: " + currentMaxWeightDL + "kg\n" +
      "Total: " + total + "kg\n";
      let text4 ="Squat 1RM Estimate: " + currentMax1RMS + "kg\n" +
      "Bench Press 1RM Estimate: " + currentMax1RMBP + "kg\n" +
      "Deadlift 1RM Estimate: " + currentMax1RMDL + "kg\n" +
      "Total Estimate: " + total1RM.toFixed(2) + "kg\n";
    weightText.textContent = text;
    weightText2.textContent = text4;

    const mWeightClass = [53, 59, 66, 74, 83, 93, 105, 120, 1000];
    const fWeightClass = [43, 47, 52, 57, 63, 69, 76, 84, 1000];
    let femaleMaxWeight = 1000;
    let maleMaxWeight = 1000;
    let femaleMinWeight = 0;
    let maleMinWeight = 0;
    if (isFemale) {
      //const fWeightClassIndex = fWeightClass.filter(weight <= bodyWeight);
      const fWeightClassIndex = fWeightClass.findIndex(weight => bodyWeight <= weight);
      let fWeightClassBelow = fWeightClassIndex - 1;
      if (fWeightClassBelow !== -1) {
        femaleMinWeight = parseInt(fWeightClass[fWeightClassBelow], 10);
      }
      if (fWeightClassIndex !== -1) {
        femaleMaxWeight = parseInt(fWeightClass[fWeightClassIndex], 10);
      }
    }
    else {
      const mWeightClassIndex = mWeightClass.findIndex(weight => bodyWeight <= weight);
      let mWeightClassBelow = mWeightClassIndex - 1;
      if (mWeightClassBelow !== -1) {
        maleMinWeight = parseInt(mWeightClass[mWeightClassBelow], 10);
      }
      if (mWeightClassIndex !== -1) {
        maleMaxWeight = parseInt(mWeightClass[mWeightClassIndex], 10);
      }
    }
    let filteredData = [];
    if (isFemale) {
      filteredData = openPowerliftingData.filter(row => row["Sex"] === "F" && parseFloat(row["BodyweightKg"]) <= femaleMaxWeight);
      if (isWeightClassLimited) {
        filteredData = filteredData.filter(row => parseFloat(row["BodyweightKg"]) >= femaleMinWeight);
      }
    }
    else {
      filteredData = openPowerliftingData.filter(row => row["Sex"] === "M" && parseFloat(row["BodyweightKg"]) <= maleMaxWeight);
      if (isWeightClassLimited){
        filteredData = filteredData.filter(row => parseFloat(row["BodyweightKg"]) >= maleMinWeight);
      }
    }
    let oldWilks = calculateOldWilks(bodyWeight, isFemale, total);
    let oldWilks1RM = calculateOldWilks(bodyWeight, isFemale, total1RM);
    let newWilks = Calculate_NewWilks(bodyWeight, isFemale, total);
    let newWilks1RM = Calculate_NewWilks(bodyWeight, isFemale, total1RM);
    let dots = Calculate_DOTS(bodyWeight, isFemale, total);
    let dots1RM = Calculate_DOTS(bodyWeight, isFemale, total1RM);
    let text2 = "Old Wilks Score: " + oldWilks + "\n" +
      "New Wilks Score: " + newWilks + "\n" +
      "DOTS Score: " + dots;
    let text3 ="Old Wilks 1RM Estimate Score: " + oldWilks1RM + "\n" +
      "New Wilks 1RM Estimate Score: " + newWilks1RM + "\n" +
      "DOTS 1RM Estimate Score: " + dots1RM;
    scoreText.textContent = text2;
    scoreText2.textContent = text3;
    filteredData.sort((a, b) => parseFloat(a["TotalKg"]) - parseFloat(b["TotalKg"]));
    let placement = filteredData.findIndex(row => parseFloat(row["TotalKg"]) >= total) + 1;
    let placement1RM = filteredData.findIndex(row => parseFloat(row["TotalKg"]) >= total1RM) + 1;
    let placementPercentile = (placement / filteredData.length) * 100;
    let placement1RMPercentile = (placement1RM / filteredData.length) * 100;
    const data9 = [{
      x: Array.from({ length: filteredData.length }, (_, i) => filteredData.length - i),
      y: filteredData.map(row => row["TotalKg"]),
      name: "Open Powerlifting Data",
    }, {
      x: [filteredData.length + 1 - placement, filteredData.length + 1 - placement],
      y: [0, total],
      mode: "lines",
      line: { dash: "dash", color: "red" },
      name: "Your Placement"
    },
    {
      x: [filteredData.length + 1 - placement1RM, filteredData.length + 1 - placement1RM],
      y: [0, total1RM],
      mode: "lines",
      line: { dash: "dash", color: "blue" },
      name: "Your 1RM Placement Estimate"
    }, {
      x: [filteredData.length + 1, 0],
      y: [total, total],
      mode: "lines",
      line: { dash: "dash", color: "green" },
      name: "Your Total"
    },
    {
      x: [filteredData.length + 1, 0],
      y: [total1RM, total1RM],
      mode: "lines",
      line: { dash: "dash", color: "purple" },
      name: "Your Total 1RM Estimate"
    }];
    let weightClassValue;
    if (isFemale) {
      if (femaleMaxWeight === 1000) {
        weightClassValue = "84+";
      }
      else{weightClassValue = femaleMaxWeight};
    }
    else {
      if (maleMaxWeight === 1000) {
        weightClassValue = "120+";
      }
      else{weightClassValue = maleMaxWeight};
    }
    const layout9 = {
      xaxis: {range: [0, filteredData.length + 1], title: "Placement"},
      yaxis: {range: [0, parseFloat(filteredData[filteredData.length - 1]["TotalKg"]) + 100], title: "Total (kg)"},
      title: "Open Powerlifting Data (05-04-2025, Tested, Raw+Wraps, SBD) " + "Weight Class: " + weightClassValue + "kg" + ' ' + "Percentile: (" + placementPercentile.toFixed(2) + "%)" + ' ' + "Estimate Percentile: (" + placement1RMPercentile.toFixed(2) + "%)",
    };
    Plotly.newPlot("myPlot9", data9, layout9);
    // Define Data
    const data = [{
      x: SWeight.map(row => row.Date),
      y: SWeight.map(row => row.Weight),
      mode:"lines"
    }];
    const data2 = [{
      x: S1RM.map(row => row.Date),
      y: S1RM.map(row => row.Weight),
      mode:"lines"
    }];
    const data3 = [{
      x: BPWeight.map(row => row.Date),
      y: BPWeight.map(row => row.Weight),
      mode:"lines"
    }];
    const data4 = [{
      x: BP1RM.map(row => row.Date),
      y: BP1RM.map(row => row.Weight),
      mode:"lines"
    }];
    const data5 = [{
      x: DLWeight.map(row => row.Date),
      y: DLWeight.map(row => row.Weight),
      mode:"lines"
    }];
    const data6 = [{
      x: DL1RM.map(row => row.Date),
      y: DL1RM.map(row => row.Weight),
      mode:"lines"
    }];
    const data7 = [{
      x: totalWeight.map(row => row.Date),
      y: totalWeight.map(row => row.Weight),
      mode:"lines"
    }];
    const data8 = [{
      x: total1RM2.map(row => row.Date),
      y: total1RM2.map(row => row.Weight),
      mode:"lines"
    }];
    
    // Define Layout
    const layout = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},  
      yaxis: {range: [0, Math.max(...SWeight.map(row => row.Weight)) + 10], title: "Squat (kg)"},
      title: "Squat Personal Records",
    };
    const layout2 = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},
      yaxis: {range: [0, Math.max(...S1RM.map(row => row.Weight)) + 10], title: "Squat (kg)"},
      title: "Squat 1RM Estimate",
    };
    const layout3 = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},
      yaxis: {range: [0, Math.max(...BPWeight.map(row => row.Weight)) + 10], title: "Bench Press (kg)"},
      title: "Bench Press Personal Records",
    };
    const layout4 = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},
      yaxis: {range: [0, Math.max(...BP1RM.map(row => row.Weight)) + 10], title: "Bench Press (kg)"},
      title: "Bench Press 1RM Estimate",
    };
    const layout5 = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},
      yaxis: {range: [0, Math.max(...DLWeight.map(row => row.Weight)) + 10], title: "Deadlift (kg)"},
      title: "Deadlift Personal Records",
    };
    const layout6 = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},
      yaxis: {range: [0, Math.max(...DL1RM.map(row => row.Weight)) + 10], title: "Deadlift (kg)"},
      title: "Deadlift 1RM Estimate",
    };
    const layout7 = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},
      yaxis: {range: [0, Math.max(...totalWeight.map(row => row.Weight)) + 10], title: "Total (kg)"},
      title: "Total Personal Records",
    };
    const layout8 = {
      xaxis: {range: [firstDate, lastDate], title: "Date"},
      yaxis: {range: [0, Math.max(...total1RM2.map(row => row.Weight)) + 10], title: "Total (kg)"},
      title: "Total 1RM Estimate",
    };
    
    // Display using Plotly
    Plotly.newPlot("myPlot", data, layout);
    Plotly.newPlot("myPlot2", data2, layout2);
    Plotly.newPlot("myPlot3", data3, layout3);
    Plotly.newPlot("myPlot4", data4, layout4);
    Plotly.newPlot("myPlot5", data5, layout5);
    Plotly.newPlot("myPlot6", data6, layout6);
    Plotly.newPlot("myPlot7", data7, layout7);
    Plotly.newPlot("myPlot8", data8, layout8);
  };

  reader.readAsText(file);
});

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

function calculateOldWilks(bodyWeight, isFemale, weightLifted) {
  const maleCoeff = [
    -216.0475144,
    16.2606339,
    -0.002388645,
    -0.00113732,
    7.01863e-6,
    -1.291e-8,
  ];
  const femaleCoeff = [
    594.31747775582,
    -27.23842536447,
    0.82112226871,
    -0.00930733913,
    4.731582e-5,
    -9.054e-8,
  ];
  let denominator = isFemale ? femaleCoeff[0] : maleCoeff[0];
  let coeff = isFemale ? femaleCoeff : maleCoeff;
  let minbw = isFemale ? 26.51 : 40;
  let maxbw = isFemale ? 154.53 : 201.9;
  let bw = Math.min(Math.max(bodyWeight, minbw), maxbw);
  for (let i = 1; i < coeff.length; i++) {
    denominator += coeff[i] * Math.pow(bw, i);
  }

  let score = (500 / denominator) * weightLifted;
  return score.toFixed(2);
}

function Calculate_NewWilks(bodyWeight, isFemale, weightLifted) {
  const maleCoeff = [
    47.4617885411949,
    8.47206137941125,
    0.073694103462609,
    -1.39583381094385e-3,
    7.07665973070743e-6,
    -1.20804336482315e-8,
  ];
  const femaleCoeff = [
    -125.425539779509,
    13.7121941940668,
    -0.0330725063103405,
    -1.0504000506583e-3,
    9.38773881462799e-6,
    -2.3334613884954e-8,
  ];
  let denominator = isFemale ? femaleCoeff[0] : maleCoeff[0];
  let coeff = isFemale ? femaleCoeff : maleCoeff;
  let minbw = 40;
  let maxbw = isFemale ? 150.95 : 200.95;
  let bw = Math.min(Math.max(bodyWeight, minbw), maxbw);

  for (let i = 1; i < coeff.length; i++) {
    denominator += coeff[i] * Math.pow(bw, i);
  }

  let score = (600 / denominator) * weightLifted;
  return score.toFixed(2);
}

function Calculate_DOTS(bodyWeight, isFemale, weightLifted) {
  const maleCoeff = [
    -307.75076,
    24.0900756,
    -0.1918759221,
    0.0007391293,
    -0.000001093,
  ];
  const femaleCoeff = [
    -57.96288,
    13.6175032,
    -0.1126655495,
    0.0005158568,
    -0.0000010706,
  ];

  let denominator = isFemale ? femaleCoeff[0] : maleCoeff[0];
  let coeff = isFemale ? femaleCoeff : maleCoeff;
  let maxbw = isFemale ? 150 : 210;
  let bw = Math.min(Math.max(bodyWeight, 40), maxbw);

  for (let i = 1; i < coeff.length; i++) {
    denominator += coeff[i] * Math.pow(bw, i);
  }

  let score = (500 / denominator) * weightLifted;
  return score.toFixed(2);
}


async function fetchOpenPowerliftingData() {
  try {
    const response = await fetch("data/cleaned_data.csv");
    const data = await response.text();
    const parsedData = csvToArr(data, ',');
    return parsedData;
  }
  catch (error) {
    console.error("Error fetching Open Powerlifting data:", error);
  }
}