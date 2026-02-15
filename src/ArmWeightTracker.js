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

// Generate plots
function generatePlots() {
  const fileInput = document.getElementById('csvInput');
  const errorMessage = document.getElementById('errorMessage');
  const plotsContainer = document.getElementById('plotsContainer');
  const upperArmGoal = parseFloat(document.getElementById('upperArmGoal').value);
  const forearmGoal = parseFloat(document.getElementById('forearmGoal').value);
  
  // Clear previous plots and errors
  errorMessage.style.display = 'none';
  errorMessage.textContent = '';
  plotsContainer.innerHTML = '';
  
  if (!fileInput.files || !fileInput.files[0]) {
    errorMessage.textContent = 'Please select a CSV file first';
    errorMessage.style.display = 'block';
    return;
  }
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const csvText = e.target.result;
      const measurementData = parseCSV(csvText);
      
      if (Object.keys(measurementData).length === 0) {
        throw new Error('No data found in CSV file');
      }
      
      // Sort dates
      const sortedDates = Object.keys(measurementData).sort();
      
      // Extract data for plotting
      const dates = sortedDates;
      const bodyweight = [];
      const upperArmRight = [];
      const upperArmLeft = [];
      const forearmRight = [];
      const forearmLeft = [];
      
      for (const date of dates) {
        const dateData = measurementData[date];
        bodyweight.push(dateData['Bodyweight'] !== undefined ? dateData['Bodyweight'] : null);
        upperArmRight.push(dateData['Upper Arm (Right)'] !== undefined ? dateData['Upper Arm (Right)'] : null);
        upperArmLeft.push(dateData['Upper Arm (Left)'] !== undefined ? dateData['Upper Arm (Left)'] : null);
        forearmRight.push(dateData['Forearm (Right)'] !== undefined ? dateData['Forearm (Right)'] : null);
        forearmLeft.push(dateData['Forearm (Left)'] !== undefined ? dateData['Forearm (Left)'] : null);
      }
      
      // Calculate bodyweight range with 5kg buffer
      const validBodyweights = bodyweight.filter(bw => bw !== null);
      const minBodyweight = Math.min(...validBodyweights);
      const maxBodyweight = Math.max(...validBodyweights);
      const bodyweightRange = [minBodyweight - 5, maxBodyweight + 5];
      
      // Create goal line traces
      const upperArmGoalTrace = {
        x: dates,
        y: dates.map(() => upperArmGoal),
        name: `Upper Arm Goal (${upperArmGoal}cm)`,
        type: 'scatter',
        mode: 'lines',
        yaxis: 'y',
        line: {color: '#ff0000', width: 2, dash: 'dash'},
        hovertemplate: `Upper Arm Goal: ${upperArmGoal}cm<extra></extra>`
      };
      
      const forearmGoalTrace = {
        x: dates,
        y: dates.map(() => forearmGoal),
        name: `Forearm Goal (${forearmGoal}cm)`,
        type: 'scatter',
        mode: 'lines',
        yaxis: 'y',
        line: {color: '#ff0000', width: 2, dash: 'dash'},
        hovertemplate: `Forearm Goal: ${forearmGoal}cm<extra></extra>`
      };
      
      // Create first plot: Upper Arm and Bodyweight
      const trace1_arm_right = {
        x: dates,
        y: upperArmRight,
        name: 'Upper Arm (Right)',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y',
        line: {color: '#1f77b4', width: 2},
        marker: {size: 5}
      };
      
      const trace1_arm_left = {
        x: dates,
        y: upperArmLeft,
        name: 'Upper Arm (Left)',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y',
        line: {color: '#ff7f0e', width: 2},
        marker: {size: 5}
      };
      
      const trace1_bodyweight = {
        x: dates,
        y: bodyweight,
        name: 'Bodyweight',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y2',
        line: {color: '#2ca02c', width: 2},
        marker: {size: 5}
      };
      
      const layout1 = {
        title: 'Upper Arm Size & Bodyweight Progress',
        xaxis: {
          title: 'Date',
          type: 'date'
        },
        yaxis: {
          title: 'Upper Arm Circumference (cm)',
          titlefont: {color: '#1f77b4'},
          tickfont: {color: '#1f77b4'},
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
          y: 0.99,
          bgcolor: 'rgba(255, 255, 255, 0.8)'
        },
        margin: {
          l: 80,
          r: 80,
          t: 60,
          b: 60
        },
        height: 500
      };
      
      const plotSection1 = document.createElement('div');
      plotSection1.className = 'plot-section';
      plotSection1.innerHTML = '<h2>Upper Arm Size & Bodyweight</h2>';
      const plot1Div = document.createElement('div');
      plot1Div.className = 'plot';
      plot1Div.id = 'plot1';
      plotSection1.appendChild(plot1Div);
      plotsContainer.appendChild(plotSection1);
      
      Plotly.newPlot('plot1', [trace1_arm_right, trace1_arm_left, trace1_bodyweight, upperArmGoalTrace], layout1, {responsive: true});
      
      // Create second plot: Forearm and Bodyweight
      const trace2_forearm_right = {
        x: dates,
        y: forearmRight,
        name: 'Forearm (Right)',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y',
        line: {color: '#d62728', width: 2},
        marker: {size: 5}
      };
      
      const trace2_forearm_left = {
        x: dates,
        y: forearmLeft,
        name: 'Forearm (Left)',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y',
        line: {color: '#9467bd', width: 2},
        marker: {size: 5}
      };
      
      const trace2_bodyweight = {
        x: dates,
        y: bodyweight,
        name: 'Bodyweight',
        type: 'scatter',
        mode: 'lines+markers',
        yaxis: 'y2',
        line: {color: '#2ca02c', width: 2},
        marker: {size: 5}
      };
      
      const layout2 = {
        title: 'Forearm Size & Bodyweight Progress',
        xaxis: {
          title: 'Date',
          type: 'date'
        },
        yaxis: {
          title: 'Forearm Circumference (cm)',
          titlefont: {color: '#d62728'},
          tickfont: {color: '#d62728'},
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
          y: 0.99,
          bgcolor: 'rgba(255, 255, 255, 0.8)'
        },
        margin: {
          l: 80,
          r: 80,
          t: 60,
          b: 60
        },
        height: 500
      };
      
      const plotSection2 = document.createElement('div');
      plotSection2.className = 'plot-section';
      plotSection2.innerHTML = '<h2>Forearm Size & Bodyweight</h2>';
      const plot2Div = document.createElement('div');
      plot2Div.className = 'plot';
      plot2Div.id = 'plot2';
      plotSection2.appendChild(plot2Div);
      plotsContainer.appendChild(plotSection2);
      
      Plotly.newPlot('plot2', [trace2_forearm_right, trace2_forearm_left, trace2_bodyweight, forearmGoalTrace], layout2, {responsive: true});
      
    } catch (error) {
      errorMessage.textContent = 'Error parsing CSV: ' + error.message;
      errorMessage.style.display = 'block';
      console.error(error);
    }
  };
  
  reader.onerror = function() {
    errorMessage.textContent = 'Error reading file';
    errorMessage.style.display = 'block';
  };
  
  reader.readAsText(fileInput.files[0]);
}
