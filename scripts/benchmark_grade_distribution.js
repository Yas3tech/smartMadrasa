const { performance } = require('perf_hooks');

// Mock data generation
function generateGrades(count) {
  const grades = [];
  for (let i = 0; i < count; i++) {
    grades.push({
      score: Math.random() * 100,
      maxScore: 100,
    });
  }
  return grades;
}

const N = 1000000;
const grades = generateGrades(N);

console.log(`Running benchmark with ${N} grades...`);

// 1. Inefficient Implementation (Filter per range)
function inefficient(grades) {
  const ranges = [
    { name: 'Excellent (90-100)', min: 90, max: 100, count: 0 },
    { name: 'Bien (70-89)', min: 70, max: 89, count: 0 },
    { name: 'Moyen (50-69)', min: 50, max: 69, count: 0 },
    { name: 'Faible (<50)', min: 0, max: 49, count: 0 },
  ];

  return ranges.map((range) => ({
    name: range.name,
    value: grades.filter((g) => {
      const percentage = (g.score / g.maxScore) * 100;
      return percentage >= range.min && percentage <= range.max;
    }).length,
  }));
}

const startInefficient = performance.now();
inefficient(grades);
const endInefficient = performance.now();
const timeInefficient = endInefficient - startInefficient;
console.log(`Inefficient: ${timeInefficient.toFixed(2)} ms`);

// 2. Current Optimized Implementation (Single pass with inner loop)
function currentOptimized(grades) {
  const ranges = [
    { name: 'Excellent (90-100)', min: 90, max: 100, count: 0 },
    { name: 'Bien (70-89)', min: 70, max: 89, count: 0 },
    { name: 'Moyen (50-69)', min: 50, max: 69, count: 0 },
    { name: 'Faible (<50)', min: 0, max: 49, count: 0 },
  ];

  grades.forEach((g) => {
    const percentage = (g.score / g.maxScore) * 100;
    for (const range of ranges) {
      if (percentage >= range.min && percentage <= range.max) {
        range.count++;
        break;
      }
    }
  });

  return ranges.map((range) => ({
    name: range.name,
    value: range.count,
  }));
}

const startCurrent = performance.now();
currentOptimized(grades);
const endCurrent = performance.now();
const timeCurrent = endCurrent - startCurrent;
console.log(`Current Optimized: ${timeCurrent.toFixed(2)} ms`);

// 3. Better Optimized Implementation (Single pass with direct checks - fixes gaps)
function betterOptimized(grades) {
  const ranges = [
    { name: 'Excellent (90-100)', min: 90, max: 100, count: 0 },
    { name: 'Bien (70-89)', min: 70, max: 89, count: 0 },
    { name: 'Moyen (50-69)', min: 50, max: 69, count: 0 },
    { name: 'Faible (<50)', min: 0, max: 49, count: 0 },
  ];

  grades.forEach((g) => {
    const percentage = (g.score / g.maxScore) * 100;
    if (percentage >= 90) ranges[0].count++;
    else if (percentage >= 70) ranges[1].count++;
    else if (percentage >= 50) ranges[2].count++;
    else ranges[3].count++;
  });

  return ranges.map((range) => ({
    name: range.name,
    value: range.count,
  }));
}

const startBetter = performance.now();
betterOptimized(grades);
const endBetter = performance.now();
const timeBetter = endBetter - startBetter;
console.log(`Better Optimized: ${timeBetter.toFixed(2)} ms`);

// 4. Dynamic Loop Fix (Cleaner, maintainable)
function dynamicLoopFix(grades) {
  const ranges = [
    { name: 'Excellent (90-100)', min: 90, max: 100, count: 0 },
    { name: 'Bien (70-89)', min: 70, max: 89, count: 0 },
    { name: 'Moyen (50-69)', min: 50, max: 69, count: 0 },
    { name: 'Faible (<50)', min: 0, max: 49, count: 0 },
  ];

  grades.forEach((g) => {
    const percentage = (g.score / g.maxScore) * 100;
    for (const range of ranges) {
      if (percentage >= range.min) {
        range.count++;
        break;
      }
    }
  });

  return ranges.map((range) => ({
    name: range.name,
    value: range.count,
  }));
}

const startDynamic = performance.now();
dynamicLoopFix(grades);
const endDynamic = performance.now();
const timeDynamic = endDynamic - startDynamic;
console.log(`Dynamic Fix: ${timeDynamic.toFixed(2)} ms`);

console.log(`Speedup (Inefficient -> Current): ${(timeInefficient / timeCurrent).toFixed(2)}x`);
console.log(`Speedup (Current -> Better): ${(timeCurrent / timeBetter).toFixed(2)}x`);
console.log(`Speedup (Current -> Dynamic): ${(timeCurrent / timeDynamic).toFixed(2)}x`);
console.log(`Total Speedup (Dynamic): ${(timeInefficient / timeDynamic).toFixed(2)}x`);
