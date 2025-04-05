const form = document.querySelector("#csvForm");
const csvFileInput = document.querySelector("#csvInput");
const weightText = document.querySelector("#maxValues");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const file = csvFileInput.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    const csvArray = csvToArr(e.target.result, ",");
    //console.log("textarea: ", textArea);
    //textArea.value = JSON.stringify(csvArray, null, 4);
    const csvArrayCleaned = csvArray.map(row => {
      return {
        [Object.keys(row)[0]]: row[Object.keys(row)[0]],
        [Object.keys(row)[1]]: row[Object.keys(row)[1]],
        [Object.keys(row)[3]]: row[Object.keys(row)[3]],
        [Object.keys(row)[5]]: row[Object.keys(row)[5]]
      };
    });
    const filteredArray = csvArrayCleaned.filter(row => 
      row["Exercise"] === "Bench Press" || 
      row["Exercise"] === "Squat" || 
      row["Exercise"] === "Deadlift"
    );
    const enrichedArray = filteredArray.map(row => {
      const weight = parseFloat(row["Weight"]);
      const reps = parseFloat(row["Reps"]);
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
      const exercise = row["Exercise"];
      const weight = parseFloat(row["Weight"]);
      const oneRM = parseFloat(row["1RM Estimate"]);
      switch (exercise) {
        case "Squat":
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
        case "Bench Press":
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
        case "Deadlift":
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
    let firstDate = new Date(enrichedArray[0]["Date"]);
    let lastDate = new Date(enrichedArray[enrichedArray.length - 1]["Date"]);
    const SWeight = squatWeight.map(row => ({ Weight: row["Weight"], Date: row["Date"] }));
    const BPWeight = benchPressWeight.map(row => ({ Weight: row["Weight"], Date: row["Date"] }));
    const DLWeight = deadliftWeight.map(row => ({ Weight: row["Weight"], Date: row["Date"] }));
    const S1RM = squat1RM.map(row => ({ Weight: row["1RM Estimate"], Date: row["Date"] }));
    const BP1RM = benchPress1RM.map(row => ({ Weight: row["1RM Estimate"], Date: row["Date"] }));
    const DL1RM = deadlift1RM.map(row => ({ Weight: row["1RM Estimate"], Date: row["Date"] }));
    const totalWeight = testWeight.map(row => ({ Weight: row["Total"], Date: row["Date"] }));
    const total1RM2 = test1RM.map(row => ({ Weight: row["Total1RM"], Date: row["Date"] }));
    let text = "Squat: " + currentMaxWeightS + "kg\n" +
      "Bench Press: " + currentMaxWeightBP + "kg\n" +
      "Deadlift: " + currentMaxWeightDL + "kg\n" +
      "Squat 1RM Estimate: " + currentMax1RMS + "kg\n" +
      "Bench Press 1RM Estimate: " + currentMax1RMBP + "kg\n" +
      "Deadlift 1RM Estimate: " + currentMax1RMDL + "kg\n" +
      "Total: " + total + "kg\n" +
      "Total Estimate: " + total1RM.toFixed(2) + "kg\n";
    weightText.textContent = text;
    
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
    keys.forEach((key, index) => (object[key] = item.at(index)));
    return object;
  });
  return formedArr;
}
