import {
    collection,
    getDocs,
    deleteDoc,
    doc,
    setDoc,
    collectionGroup
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, deleteUser } from 'firebase/auth';
import { db, auth } from '../config/firebase';
import type { Attendance, Message, Course } from '../types';

/**
 * Script d'initialisation de la base de données Firebase
 * Crée des données de test avec des relations parent-étudiant correctes
 * Nettoie les utilisateurs Auth existants avant de recréer
 */

const DEFAULT_PASSWORD = 'password123';

// Liste des utilisateurs à créer (et à nettoyer)
const teachersData = [
    { id: 'teacher-1', name: 'M. Amine Benjelloun', email: 'amine.benjelloun@school.ma', role: 'teacher', avatar: '👨‍🏫', subjects: ['Math', 'Science'] },
    { id: 'teacher-2', name: 'Mme. Layla El Amrani', email: 'layla.elamrani@school.ma', role: 'teacher', avatar: '👩‍🏫', subjects: ['Français', 'Histoire'] },
    { id: 'teacher-3', name: 'M. Youssef Idrissi', email: 'youssef.idrissi@school.ma', role: 'teacher', avatar: '👨‍🏫', subjects: ['Arabe', 'Religion'] }
];

const parentsData = [
    { id: 'parent-1', name: 'M. et Mme. Alami', email: 'famille.alami@gmail.com', role: 'parent', avatar: '👨‍👩‍👧‍👦' },
    { id: 'parent-2', name: 'M. et Mme. Berrada', email: 'famille.berrada@gmail.com', role: 'parent', avatar: '👨‍👩‍👦' },
    { id: 'parent-3', name: 'Mme. Tazi', email: 'mme.tazi@gmail.com', role: 'parent', avatar: '👩‍👦' },
    { id: 'parent-4', name: 'M. Bennani', email: 'm.bennani@gmail.com', role: 'parent', avatar: '👨‍👧' },
    { id: 'parent-5', name: 'Mme. Chraibi', email: 'mme.chraibi@gmail.com', role: 'parent', avatar: '👩‍👦' },
    { id: 'parent-6', name: 'M. et Mme. Fassi', email: 'famille.fassi@gmail.com', role: 'parent', avatar: '👨‍👩‍👧' },
    { id: 'parent-7', name: 'Mme. Hakimi', email: 'mme.hakimi@gmail.com', role: 'parent', avatar: '👩‍👧' }
];

const studentsData = [
    { id: 'student-1', name: 'Sara Alami', email: 'sara.alami@school.ma', role: 'student', avatar: '👧', classId: 'class-1', parentId: 'parent-1' },
    { id: 'student-2', name: 'Omar Berrada', email: 'omar.berrada@school.ma', role: 'student', avatar: '👦', classId: 'class-1', parentId: 'parent-2' },
    { id: 'student-3', name: 'Karim Tazi', email: 'karim.tazi@school.ma', role: 'student', avatar: '👦', classId: 'class-1', parentId: 'parent-3' },
    { id: 'student-4', name: 'Lina Bennani', email: 'lina.bennani@school.ma', role: 'student', avatar: '👧', classId: 'class-2', parentId: 'parent-4' },
    { id: 'student-5', name: 'Mehdi Chraibi', email: 'mehdi.chraibi@school.ma', role: 'student', avatar: '👦', classId: 'class-2', parentId: 'parent-5' },
    { id: 'student-6', name: 'Nour Fassi', email: 'nour.fassi@school.ma', role: 'student', avatar: '👧', classId: 'class-3', parentId: 'parent-6' },
    { id: 'student-7', name: 'Yassine Alami', email: 'yassine.alami@school.ma', role: 'student', avatar: '👦', classId: 'class-3', parentId: 'parent-1' },
    { id: 'student-8', name: 'Hiba Hakimi', email: 'hiba.hakimi@school.ma', role: 'student', avatar: '👧', classId: 'class-4', parentId: 'parent-7' }
];

const directorsData = [
    { id: 'director-1', name: 'Dr. Hassan El Fassi', email: 'hassan.elfassi@school.ma', role: 'director', avatar: '👨‍💼' },
    { id: 'superadmin-1', name: 'Super Admin', email: 'admin@school.ma', role: 'superadmin', avatar: '👤' }
];

const allUsers = [...teachersData, ...parentsData, ...studentsData, ...directorsData];

// Fonction pour supprimer les utilisateurs Auth existants
const clearAuthUsers = async () => {
    console.log('🧹 Cleaning up existing Auth users...');
    if (!auth) return;

    for (const user of allUsers) {
        try {
            // Tentative de connexion
            const userCredential = await signInWithEmailAndPassword(auth, user.email, DEFAULT_PASSWORD);
            const currentUser = userCredential.user;

            // Suppression de l'utilisateur
            await deleteUser(currentUser);
            console.log(`🗑️ Deleted Auth user: ${user.email}`);
        } catch (error: any) {
            // Ignorer si l'utilisateur n'existe pas ou mot de passe incorrect (déjà supprimé ou jamais créé)
            if (error.code !== 'auth/user-not-found' && error.code !== 'auth/wrong-password' && error.code !== 'auth/invalid-credential') {
                console.warn(`⚠️ Could not delete user ${user.email}:`, error.code);
            }
        }
    }
    // S'assurer qu'on est déconnecté à la fin
    await signOut(auth);
};

// Fonction pour supprimer toutes les données Firestore existantes
export const clearAllData = async () => {
    if (!db) {
        console.error('Firebase not configured');
        return;
    }

    // Clear top-level collections
    const collections = ['users', 'classes', 'messages', 'events', 'academicPeriods', 'gradeCategories', 'courseGrades', 'teacherComments'];

    for (const collectionName of collections) {
        const querySnapshot = await getDocs(collection(db!, collectionName));
        const deletePromises = querySnapshot.docs.map(document =>
            deleteDoc(doc(db!, collectionName, document.id))
        );
        await Promise.all(deletePromises);
        console.log(`✅ Cleared Firestore collection: ${collectionName}`);
    }

    // Clear subcollections via Collection Group Queries
    // Note: This is a best-effort clear. In a real app, you'd need recursive deletion.
    const subcollections = ['grades', 'attendance', 'courses'];
    for (const subcol of subcollections) {
        const querySnapshot = await getDocs(collectionGroup(db!, subcol));
        const deletePromises = querySnapshot.docs.map(document =>
            deleteDoc(document.ref)
        );
        await Promise.all(deletePromises);
        console.log(`✅ Cleared Subcollection Group: ${subcol}`);
    }
};

// Fonction pour initialiser les données
export const initializeFirebaseData = async () => {
    if (!db || !auth) {
        console.error('Firebase not configured');
        return;
    }

    console.log('🔄 Initializing Firebase data...');

    // 1. Nettoyer Auth et Firestore
    await clearAuthUsers();
    await clearAllData();

    const idMap = new Map<string, string>(); // Map old ID -> New Auth UID

    try {
        // Helper to create user in Auth and Firestore
        const createUser = async (userData: any, oldId: string) => {
            try {
                // Create in Auth
                const userCredential = await createUserWithEmailAndPassword(auth!, userData.email, DEFAULT_PASSWORD);
                const uid = userCredential.user.uid;

                // Store mapping
                idMap.set(oldId, uid);

                // Update ID
                const newUser = { ...userData, id: uid };

                // Save to Firestore
                await setDoc(doc(db!, 'users', uid), newUser);
                console.log(`✅ Created user: ${userData.email} (${userData.role})`);
                return uid;
            } catch (error: any) {
                console.error(`Error creating user ${userData.email}:`, error);
                return null;
            }
        };

        // 2. Créer les utilisateurs (sauf étudiants pour l'instant)
        for (const t of teachersData) await createUser(t, t.id);
        for (const p of parentsData) await createUser(p, p.id);
        for (const d of directorsData) await createUser(d, d.id);

        // 3. Créer les classes (pour avoir les noms pour la dénormalisation)
        const classesData = [
            { id: 'class-1', name: '6ème A', grade: '6ème', teacherId: 'teacher-1' },
            { id: 'class-2', name: '5ème B', grade: '5ème', teacherId: 'teacher-2' },
            { id: 'class-3', name: '4ème C', grade: '4ème', teacherId: 'teacher-1' },
            { id: 'class-4', name: '3ème A', grade: '3ème', teacherId: 'teacher-3' }
        ];

        console.log('📝 Adding classes...');
        for (const c of classesData) {
            const teacherUid = idMap.get(c.teacherId);
            const teacher = teachersData.find(t => t.id === c.teacherId);
            const newClass = {
                ...c,
                teacherId: teacherUid || c.teacherId,
                teacherName: teacher?.name // Denormalized
            };
            await setDoc(doc(db, 'classes', c.id), newClass);
        }

        // 4. Créer les étudiants (avec className dénormalisé)
        for (const s of studentsData) {
            const parentUid = idMap.get(s.parentId);
            const classInfo = classesData.find(c => c.id === s.classId);

            const studentWithUid = {
                ...s,
                parentId: parentUid || s.parentId,
                className: classInfo?.name // Denormalized
            };
            await createUser(studentWithUid, s.id);
        }

        // 5. Update Parents with children details (Denormalized)
        const parentChildrenMap: Record<string, string[]> = {
            'parent-1': ['student-1', 'student-7'],
            'parent-2': ['student-2'],
            'parent-3': ['student-3'],
            'parent-4': ['student-4'],
            'parent-5': ['student-5'],
            'parent-6': ['student-6'],
            'parent-7': ['student-8']
        };

        console.log('📝 Updating parents with children details...');
        for (const [oldParentId, oldChildrenIds] of Object.entries(parentChildrenMap)) {
            const parentUid = idMap.get(oldParentId);
            if (parentUid) {
                const childrenDetails = oldChildrenIds.map(id => {
                    const student = studentsData.find(s => s.id === id);
                    const studentUid = idMap.get(id);
                    const classInfo = classesData.find(c => c.id === student?.classId);
                    return student && studentUid ? {
                        id: studentUid,
                        name: student.name,
                        classId: student.classId,
                        className: classInfo?.name
                    } : null;
                }).filter(Boolean);

                const childrenIds = childrenDetails.map(c => c!.id);

                await setDoc(doc(db, 'users', parentUid), {
                    childrenIds,
                    children: childrenDetails // Denormalized
                }, { merge: true });
            }
        }

        // 6. Update Teachers with classes details (Denormalized)
        console.log('📝 Updating teachers with classes details...');
        for (const t of teachersData) {
            const teacherUid = idMap.get(t.id);
            if (teacherUid) {
                const teacherClasses = classesData.filter(c => c.teacherId === t.id);
                const classesDetails = teacherClasses.map(c => ({
                    id: c.id,
                    name: c.name
                }));
                const classIds = teacherClasses.map(c => c.id);

                await setDoc(doc(db, 'users', teacherUid), {
                    classIds,
                    classes: classesDetails // Denormalized
                }, { merge: true });
            }
        }

        // 6. Créer les périodes académiques
        console.log('📅 Adding academic periods...');
        const periods = [
            {
                id: 'period-2024-2025-t1',
                name: 'Trimestre 1',
                academicYear: '2024-2025',
                startDate: '2024-09-01',
                endDate: '2024-12-20',
                gradeEntryStartDate: '2024-09-01',
                gradeEntryEndDate: '2024-12-25',
                isPublished: false,
                order: 1
            },
            {
                id: 'period-2024-2025-t2',
                name: 'Trimestre 2',
                academicYear: '2024-2025',
                startDate: '2025-01-06',
                endDate: '2025-03-28',
                gradeEntryStartDate: '2025-01-06',
                gradeEntryEndDate: '2025-04-02',
                isPublished: false,
                order: 2
            },
            {
                id: 'period-2024-2025-t3',
                name: 'Trimestre 3',
                academicYear: '2024-2025',
                startDate: '2025-04-14',
                endDate: '2025-06-30',
                gradeEntryStartDate: '2025-04-14',
                gradeEntryEndDate: '2025-07-05',
                isPublished: false,
                order: 3
            }
        ];

        for (const period of periods) {
            await setDoc(doc(db, 'academicPeriods', period.id), period);
        }

        // 7. Créer les catégories de notes
        console.log('📝 Adding grade categories...');
        const categories = [
            { id: 'cat-test', name: 'Test', code: 'TEST', weight: 20, color: '#3B82F6', description: '20% de la note finale' },
            { id: 'cat-exam', name: 'Examen', code: 'EXAM', weight: 50, color: '#EF4444', description: '50% de la note finale' },
            { id: 'cat-homework', name: 'Devoir', code: 'HW', weight: 20, color: '#10B981', description: '20% de la note finale' },
            { id: 'cat-participation', name: 'Participation', code: 'PART', weight: 10, color: '#F59E0B', description: '10% de la note finale' }
        ];

        for (const cat of categories) {
            await setDoc(doc(db, 'gradeCategories', cat.id), cat);
        }

        // 8. Créer les Cours (Schedule) -> Subcollection of Classes
        console.log('📅 Adding courses (schedule)...');

        // Matières alignées avec subjectColors du composant Schedule
        const subjects: string[] = [
            'Mathématiques', 'Français', 'Arabe', 'Sciences',
            'Histoire', 'Sport', 'Informatique',
            'Coran', 'Sira', 'Fiqh'  // Matières religieuses
        ];

        // Année scolaire dynamique pour la récurrence
        const today = new Date();
        const schoolYearStart = new Date(today.getFullYear(), 8, 1); // 1 septembre année courante
        const schoolYearEnd = new Date(today.getFullYear() + 1, 5, 30); // 30 juin année suivante

        const recurrenceStart = schoolYearStart.toISOString();
        const recurrenceEnd = schoolYearEnd.toISOString();

        // Jours d'école (1 = lundi, 5 = vendredi)
        const days = [1, 2, 3, 4, 5] as const;

        // Créneaux alignés avec ScheduleSlot.time
        const timeSlots: Array<{ start: string; end: string }> = [
            { start: '08:00', end: '09:00' },
            { start: '09:00', end: '10:00' },
            { start: '10:15', end: '11:15' },
            { start: '11:15', end: '12:15' },
            { start: '13:30', end: '14:30' },
            { start: '14:30', end: '15:30' }
        ];

        for (const c of classesData) {
            const teacherUid = idMap.get(c.teacherId) || c.teacherId;
            const teacherName = teachersData.find(t => t.id === c.teacherId)?.name;

            for (const day of days) {
                // Exemple : 4 cours par jour (2 matin, 2 après-midi)
                const slotIndexesForDay = [0, 1, 3, 4]; // indices dans timeSlots

                for (let i = 0; i < slotIndexesForDay.length; i++) {
                    const slot = timeSlots[slotIndexesForDay[i]];
                    const courseId = `course-${c.id}-${day}-${i + 1}`;

                    const course: Course = {
                        id: courseId,
                        classId: c.id,
                        className: c.name,
                        teacherId: teacherUid,
                        teacherName,
                        subject: subjects[(i + day) % subjects.length],
                        dayOfWeek: day,                  // 1 = lundi ... 5 = vendredi
                        startTime: slot.start,           // ex: '08:00'
                        endTime: slot.end,               // ex: '09:00'
                        isRecurring: true,
                        recurrenceStart,                 // ✅ utile pour le filtre de la semaine
                        recurrenceEnd,
                        room: `Salle ${Math.floor(Math.random() * 20) + 1}`
                    };

                    // Ajout dans classes/{classId}/courses
                    await setDoc(
                        doc(db, 'classes', c.id, 'courses', courseId),
                        course
                    );
                }
            }
        }


        // 9. Créer les notes (CourseGrades) - Subcollection liées aux cours
        console.log('🎓 Adding course grades...');

        // Utiliser la période actuelle (Trimestre 1)
        const currentPeriod = periods[0];

        // Collecter tous les cours créés depuis Firestore pour chaque classe
        const coursesByClass: Record<string, any[]> = {};

        for (const c of classesData) {
            // Récupérer les cours de cette classe depuis Firestore
            const coursesSnapshot = await getDocs(collection(db, 'classes', c.id, 'courses'));
            coursesByClass[c.id] = [];

            coursesSnapshot.forEach((courseDoc) => {
                const courseData = courseDoc.data();
                coursesByClass[c.id].push({
                    id: courseDoc.id,
                    subject: courseData.subject,
                    teacherId: courseData.teacherId,
                    teacherName: courseData.teacherName
                });
            });
        }

        for (const s of studentsData) {
            const studentUid = idMap.get(s.id);
            if (!studentUid) continue;

            const classInfo = classesData.find(c => c.id === s.classId);
            if (!classInfo) continue;

            // Récupérer les cours de cette classe
            const classCourses = coursesByClass[s.classId] || [];
            if (classCourses.length === 0) continue;

            // Générer 10-15 notes par étudiant
            const gradeCount = 10 + Math.floor(Math.random() * 6);

            for (let i = 0; i < gradeCount; i++) {
                // Choisir un cours aléatoire de la classe
                const course = classCourses[Math.floor(Math.random() * classCourses.length)];

                // Choisir une catégorie aléatoire
                const category = categories[Math.floor(Math.random() * categories.length)];

                // Date aléatoire dans la période du trimestre 1
                const start = new Date(currentPeriod.startDate).getTime();
                const end = new Date(currentPeriod.endDate).getTime();
                const randomTime = start + Math.random() * (end - start);
                const gradeDate = new Date(randomTime);

                const score = 10 + Math.floor(Math.random() * 11); // 10-20
                const gradeId = `cgrade-${s.id}-${i}`;

                const courseGrade = {
                    id: gradeId,
                    studentId: studentUid,
                    studentName: s.name,
                    courseId: course.id,
                    courseName: course.subject,
                    periodId: currentPeriod.id,
                    categoryId: category.id,
                    categoryName: category.name,
                    title: `${category.name} ${i + 1}`,
                    score: score,
                    maxScore: 20,
                    date: gradeDate.toISOString().split('T')[0],
                    weight: category.weight,
                    teacherId: course.teacherId,
                    teacherName: course.teacherName
                };

                await setDoc(doc(db, 'courseGrades', gradeId), courseGrade);
            }
        }

        // 10. Créer les Présences (Attendance) -> Subcollection of Users - 30 derniers jours
        console.log('📋 Adding attendance...');
        for (const s of studentsData) {
            const studentUid = idMap.get(s.id);
            if (!studentUid) continue;

            // Créer 30 jours de présences
            for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
                const date = new Date();
                date.setDate(date.getDate() - dayOffset);

                // Ignorer les weekends (samedi = 6, dimanche = 0)
                if (date.getDay() === 0 || date.getDay() === 6) continue;

                const dateStr = date.toISOString().split('T')[0];
                const attendanceId = `att-${s.id}-${dateStr}`;

                // 90% présent, 5% absent, 5% retard
                const rand = Math.random();
                let status: 'present' | 'absent' | 'late';
                if (rand < 0.9) status = 'present';
                else if (rand < 0.95) status = 'absent';
                else status = 'late';

                // Construire l'objet attendance sans valeurs undefined
                const attendance: Attendance = {
                    id: attendanceId,
                    date: dateStr,
                    studentId: studentUid,
                    studentName: s.name, // Denormalized
                    status: status,
                    classId: s.classId
                };

                // Ajouter les champs optionnels seulement s'ils ont une valeur
                if (status === 'absent') {
                    const isJust = Math.random() > 0.5;
                    attendance.isJustified = isJust;
                    if (isJust) {
                        attendance.justification = 'Maladie';
                    }
                }

                // Add to users/{studentId}/attendance
                await setDoc(doc(db, 'users', studentUid, 'attendance', attendanceId), attendance);
            }
        }

        // 11. Créer les Messages
        console.log('💬 Adding messages...');
        const adminUid = idMap.get('superadmin-1');
        if (adminUid) {
            // Broadcast message
            const msgId = 'msg-broadcast-1';
            const message: Message = {
                id: msgId,
                senderId: adminUid,
                senderName: 'Super Admin',
                senderRole: 'superadmin',
                receiverId: 'all',
                subject: 'Welcome to SmartMadrassa',
                content: 'Welcome to the new school year! Please check your schedule.',
                read: false,
                timestamp: new Date().toISOString(),
                type: 'broadcast'
            };
            await setDoc(doc(db, 'messages', msgId), message);
        }

        // Sign out
        await signOut(auth);

        console.log('✨ Firebase initialization complete!');
        console.log(`
📊 Summary:
- Auth users cleaned and recreated
- Firestore cleared (including subcollections)
- Users, Classes, Messages populated
- Academic Periods: 3 trimestres (2024-2025)
- Grade Categories: Test, Examen, Devoir, Participation
- Top-level collections populated:
  - academicPeriods (3 periods)
  - gradeCategories (4 categories)
  - courseGrades (${studentsData.length * 12} notes liées aux cours)
- Subcollections populated:
  - classes/{id}/courses (${classesData.length * 20} cours)
  - users/{id}/attendance (~${studentsData.length * 20} présences sur 30 jours)
- Denormalized data included (children, classes, names)
        `);

    } catch (error) {
        console.error('❌ Error initializing Firebase:', error);
        throw error;
    }
};

export const resetFirebaseData = async () => {
    await initializeFirebaseData();
};
