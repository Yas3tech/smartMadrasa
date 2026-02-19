const { performance } = require('perf_hooks');

// Setup Data
const STUDENTS_COUNT = 30;
const COURSES_COUNT = 10;
const GRADES_COUNT = 5000;

const periodStart = new Date('2023-09-01');
const periodEnd = new Date('2023-12-31');

const students = Array.from({ length: STUDENTS_COUNT }, (_, i) => ({ id: `s${i}` }));
const courses = Array.from({ length: COURSES_COUNT }, (_, i) => ({ id: `c${i}` }));

const grades = [];
for (let i = 0; i < GRADES_COUNT; i++) {
    // Random date between Jan 2023 and Dec 2024
    const date = new Date(2023, 0, 1 + Math.floor(Math.random() * 730));
    grades.push({
        studentId: `s${Math.floor(Math.random() * STUDENTS_COUNT)}`,
        courseId: `c${Math.floor(Math.random() * COURSES_COUNT)}`,
        date: date.toISOString(), // Grades stored as ISO strings
        score: Math.random() * 20
    });
}

console.log(`Benchmark: ${STUDENTS_COUNT} students, ${COURSES_COUNT} courses, ${GRADES_COUNT} grades`);

// 1. Current Implementation (Nested Loop + Find/Some)
function currentImplementation() {
    let total = 0;

    students.forEach((student) => {
        courses.forEach((course) => {
            const hasGrades = grades.some(
                (g) =>
                    g.studentId === student.id &&
                    g.courseId === course.id &&
                    new Date(g.date) >= periodStart &&
                    new Date(g.date) <= periodEnd
            );
            if (hasGrades) total++;
        });
    });
    return total;
}

// 2. Optimized Implementation (Set Lookup)
function optimizedImplementation() {
    let total = 0;

    // Pre-process grades
    const activeKeys = new Set();
    grades.forEach(g => {
        const d = new Date(g.date);
        if (d >= periodStart && d <= periodEnd) {
            activeKeys.add(`${g.studentId}-${g.courseId}`);
        }
    });

    students.forEach((student) => {
        courses.forEach((course) => {
            if (activeKeys.has(`${student.id}-${course.id}`)) {
                total++;
            }
        });
    });
    return total;
}

// Run Benchmark
// Warmup
currentImplementation();
optimizedImplementation();

const start1 = performance.now();
for(let i=0; i<100; i++) currentImplementation();
const end1 = performance.now();
const time1 = end1 - start1;

const start2 = performance.now();
for(let i=0; i<100; i++) optimizedImplementation();
const end2 = performance.now();
const time2 = end2 - start2;

console.log(`Current (100 runs): ${time1.toFixed(2)}ms`);
console.log(`Optimized (100 runs): ${time2.toFixed(2)}ms`);
console.log(`Speedup: ${(time1 / time2).toFixed(2)}x`);

// Verify correctness
const res1 = currentImplementation();
const res2 = optimizedImplementation();
console.log(`Results match: ${res1 === res2} (${res1} vs ${res2})`);
