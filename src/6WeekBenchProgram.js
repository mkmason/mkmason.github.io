/**
 * Rounds a value to the nearest 2.5 increment
 * When at 0.5 (exactly halfway), rounds down
 * @param {number} value - The value to round
 * @returns {number} - The rounded value
 */
function roundTo2Point5(value) {
    // Divide by 2.5, round (with 0.5 going down), then multiply by 2.5
    const divided = value / 2.5;
    const rounded = divided === Math.floor(divided) + 0.5 ? Math.floor(divided) : Math.round(divided);
    return rounded * 2.5;
}

/**
 * Calculates weight for a given intensity and rounds to nearest 2.5
 * @param {number} max - The 1 rep max weight
 * @param {number} intensity - The intensity as a percentage (e.g., 65 for 65%)
 * @returns {number} - The calculated and rounded weight
 */
function calculateWeight(max, intensity) {
    const weight = (max * intensity) / 100;
    return roundTo2Point5(weight);
}

/**
 * Formats a set as "weight x reps"
 * @param {number} weight - The weight for the set
 * @param {string|number} reps - The number of reps (can be a single number or range like "4-6")
 * @returns {string} - Formatted string
 */
function formatSet(weight, reps) {
    return `${weight} x ${reps}`;
}

/**
 * Formats multiple sets into a workout string
 * @param {Array<Object>} sets - Array of {weight, reps} objects
 * @returns {string} - Formatted workout text
 */
function formatWorkout(sets) {
    return sets.map((set, index) => `Set ${index + 1}: ${formatSet(set.weight, set.reps)}`).join('\n');
}

// ============================================
// INDIVIDUAL DAY FUNCTIONS - Add intensity and reps here
// ============================================

/**
 * Week 1 - Day 1
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek1Day1(max) {
    // TODO: Add your intensity (%) and rep scheme here
    // Example format:
    // const sets = [
    //     { weight: calculateWeight(max, 65), reps: "5" },
    //     { weight: calculateWeight(max, 65), reps: "5" },
    //     { weight: calculateWeight(max, 65), reps: "5" },
    // ];
    // Or with rep ranges:
    // const sets = [
    //     { weight: calculateWeight(max, 65), reps: "4-6" },
    //     { weight: calculateWeight(max, 70), reps: "5-9" },
    // ];
    const sets = [{ weight: calculateWeight(max, 75), reps: 3 },
                    { weight: calculateWeight(max, 80), reps: 3 },
                    { weight: calculateWeight(max, 85), reps: 2 },
                     { weight: calculateWeight(max, 88), reps: 1 },
                        { weight: calculateWeight(max, 90), reps: 1 },
                            { weight: calculateWeight(max, 80), reps: "4-6"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 1 - Day 2
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek1Day2(max) {
    const sets = [{ weight: calculateWeight(max, 73), reps: 3 },
                    { weight: calculateWeight(max, 83), reps: 2 },
                    { weight: calculateWeight(max, 90), reps: 2 },
                     { weight: calculateWeight(max, 90), reps: 2 },
                        { weight: calculateWeight(max, 90), reps: 2 },
                            { weight: calculateWeight(max, 80), reps: "5-9"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 2 - Day 1
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek2Day1(max) {
    const sets = [{ weight: calculateWeight(max, 75), reps: 3 },
                    { weight: calculateWeight(max, 80), reps: 2 },
                    { weight: calculateWeight(max, 85), reps: 1 },
                     { weight: calculateWeight(max, 90), reps: 1 },
                        { weight: calculateWeight(max, 92), reps: 1 },
                            { weight: calculateWeight(max, 80), reps: "4-6"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 2 - Day 2
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek2Day2(max) {
    const sets = [{ weight: calculateWeight(max, 75), reps: 3 },
                    { weight: calculateWeight(max, 83), reps: 2 },
                    { weight: calculateWeight(max, 92), reps: 2 },
                     { weight: calculateWeight(max, 92), reps: 2 },
                        { weight: calculateWeight(max, 92), reps: 2 },
                            { weight: calculateWeight(max, 80), reps: "5-9"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 3 - Day 1
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek3Day1(max) {
    const sets = [{ weight: calculateWeight(max, 70), reps: 3 },
                    { weight: calculateWeight(max, 75), reps: 2 },
                    { weight: calculateWeight(max, 80), reps: 1 },
                     { weight: calculateWeight(max, 85), reps: 1 },
                        { weight: calculateWeight(max, 90), reps: 1 },
                            { weight: calculateWeight(max, 95), reps: 1}
    ];
    return formatWorkout(sets);
}

/**
 * Week 3 - Day 2
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek3Day2(max) {
    const sets = [{ weight: calculateWeight(max, 73), reps: 3 },
                    { weight: calculateWeight(max, 78), reps: 2 },
                    { weight: calculateWeight(max, 88), reps: 2 },
                     { weight: calculateWeight(max, 88), reps: 2 },
                        { weight: calculateWeight(max, 88), reps: 2 }
    ];
    return formatWorkout(sets);
}

/**
 * Week 4 - Day 1
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek4Day1(max) {
    const sets = [{ weight: calculateWeight(max, 75), reps: 2 },
                    { weight: calculateWeight(max, 82), reps: 1 },
                    { weight: calculateWeight(max, 90), reps: 2 },
                     { weight: calculateWeight(max, 90), reps: 2 },
                        { weight: calculateWeight(max, 93), reps: 2 },
                            { weight: calculateWeight(max, 80), reps: "5-9"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 4 - Day 2
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek4Day2(max) {
    const sets = [{ weight: calculateWeight(max, 75), reps: 3 },
                    { weight: calculateWeight(max, 85), reps: 2 },
                    { weight: calculateWeight(max, 91), reps: 2 },
                     { weight: calculateWeight(max, 95), reps: 1 },
                        { weight: calculateWeight(max, 97), reps: 1 },
                            { weight: calculateWeight(max, 80), reps: "5-9"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 5 - Day 1
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek5Day1(max) {
    const sets = [{ weight: calculateWeight(max, 75), reps: 3 },
                    { weight: calculateWeight(max, 82), reps: 2 },
                    { weight: calculateWeight(max, 93), reps: 2 },
                     { weight: calculateWeight(max, 93), reps: 2 },
                        { weight: calculateWeight(max, 93), reps: 2 },
                            { weight: calculateWeight(max, 80), reps: "5-9"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 5 - Day 2
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek5Day2(max) {
    const sets = [{ weight: calculateWeight(max, 75), reps: 3 },
                    { weight: calculateWeight(max, 85), reps: 2 },
                    { weight: calculateWeight(max, 93), reps: 1 },
                     { weight: calculateWeight(max, 95), reps: 1 },
                        { weight: calculateWeight(max, 97), reps: 1 },
                        { weight: calculateWeight(max, 99), reps: 1 },
                            { weight: calculateWeight(max, 80), reps: "5-9"}
    ];
    return formatWorkout(sets);
}

/**
 * Week 6 - Day 1
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek6Day1(max) {
    const sets = [{ weight: calculateWeight(max, 72), reps: 2 },
                    { weight: calculateWeight(max, 80), reps: 2 },
                    { weight: calculateWeight(max, 90), reps: 2 },
                     { weight: calculateWeight(max, 90), reps: 2 }
    ];
    return formatWorkout(sets);
}

/**
 * Week 6 - Day 2
 * @param {number} max - The 1 rep max weight
 * @returns {string} - Formatted workout
 */
function calculateWeek6Day2(max) {
    const sets = [{ weight: calculateWeight(max, 82), reps: 1 },
                    { weight: calculateWeight(max, 90), reps: 1 },
                    { weight: calculateWeight(max, 95), reps: 1 },
                     { weight: calculateWeight(max, 100), reps: 1 },
                        { weight: calculateWeight(max, 103), reps: 1 },
                        { weight: calculateWeight(max, 105), reps: 1 },
                        { weight: calculateWeight(max, 108), reps: 1 },
                        { weight: calculateWeight(max, 110), reps: 1 }
    ];
    return formatWorkout(sets);
}

// ============================================
// MAIN CALCULATION FUNCTION
// ============================================

/**
 * Calculates and displays all 12 workouts
 */
function calculateAllWorkouts() {
    const maxInput = document.querySelector("#maxInput").value;
    
    if (!maxInput || maxInput <= 0) {
        alert('Please enter a valid max weight');
        return;
    }

    const max = parseFloat(maxInput);

    // Update all 12 workout blocks
    document.querySelector("#w1d1-output").textContent = calculateWeek1Day1(max);
    document.querySelector("#w1d2-output").textContent = calculateWeek1Day2(max);
    document.querySelector("#w2d1-output").textContent = calculateWeek2Day1(max);
    document.querySelector("#w2d2-output").textContent = calculateWeek2Day2(max);
    document.querySelector("#w3d1-output").textContent = calculateWeek3Day1(max);
    document.querySelector("#w3d2-output").textContent = calculateWeek3Day2(max);
    document.querySelector("#w4d1-output").textContent = calculateWeek4Day1(max);
    document.querySelector("#w4d2-output").textContent = calculateWeek4Day2(max);
    document.querySelector("#w5d1-output").textContent = calculateWeek5Day1(max);
    document.querySelector("#w5d2-output").textContent = calculateWeek5Day2(max);
    document.querySelector("#w6d1-output").textContent = calculateWeek6Day1(max);
    document.querySelector("#w6d2-output").textContent = calculateWeek6Day2(max);
}

// Load on page load
window.addEventListener('load', function() {
    calculateAllWorkouts();
});

