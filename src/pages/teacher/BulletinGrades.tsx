import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { subscribeToTeacherCommentsByStudent, subscribeToTeacherCommentsByTeacher, createTeacherComment, validateTeacherComment, updateTeacherComment, batchCreateTeacherComments } from '../../services/teacherComments';
import { MessageSquare, Save, BookOpen, ArrowLeft, TrendingUp, CheckCircle, Users, CheckSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import type { TeacherComment } from '../../types/bulletin';

const TeacherBulletinGrades: React.FC = () => {
    const {
        academicPeriods,
        courses,
        students,
        grades,
        classes
    } = useData();
    const { user } = useAuth();

    const [selectedPeriod, setSelectedPeriod] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<string>('');
    const [comments, setComments] = useState<Record<string, string>>({});
    const [teacherComments, setTeacherComments] = useState<TeacherComment[]>([]);
    const [classComments, setClassComments] = useState<TeacherComment[]>([]);

    // Only teachers can access
    if (user?.role !== 'teacher') {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Accès réservé aux professeurs</p>
            </div>
        );
    }

    // Subscribe to teacher comments for selected student (Detail View)
    useEffect(() => {
        if (selectedStudent) {
            const unsubscribe = subscribeToTeacherCommentsByStudent(selectedStudent, (fetchedComments) => {
                setTeacherComments(fetchedComments);
            });
            return () => unsubscribe();
        } else {
            setTeacherComments([]);
        }
    }, [selectedStudent]);

    // Subscribe to teacher comments for selected class (Overview View)
    useEffect(() => {
        if (selectedPeriod && user?.id) {
            const unsubscribe = subscribeToTeacherCommentsByTeacher(user.id, selectedPeriod, (fetchedComments) => {
                setClassComments(fetchedComments);
            });
            return () => unsubscribe();
        }
    }, [selectedPeriod, user?.id]);

    const selectedPeriodData = academicPeriods.find(p => p.id === selectedPeriod);
    const selectedClassData = classes.find(c => c.id === selectedClassId);
    const selectedStudentData = students.find(s => s.id === selectedStudent);

    // Get classes that the teacher teaches
    const teacherClasses = useMemo(() => {
        if (!user?.id) return [];
        const teacherCourseClassIds = courses
            .filter(c => c.teacherId === user.id)
            .map(c => c.classId);
        const uniqueClassIds = Array.from(new Set(teacherCourseClassIds));
        return classes.filter(c => uniqueClassIds.includes(c.id));
    }, [courses, classes, user?.id]);

    // Get students in the selected class
    const classStudents = useMemo(() => {
        if (!selectedClassId) return [];
        return students.filter(s => (s as any).classId === selectedClassId);
    }, [selectedClassId, students]);

    // Calculate validation status for the class
    const classValidationStats = useMemo(() => {
        if (!selectedClassId || !user?.id) return { total: 0, validated: 0 };

        const teacherCoursesInClass = courses.filter(c => c.teacherId === user.id && c.classId === selectedClassId);
        let total = 0;
        let validated = 0;

        classStudents.forEach(student => {
            teacherCoursesInClass.forEach(course => {
                total++;
                const comment = classComments.find(c =>
                    c.studentId === student.id &&
                    c.courseId === course.id &&
                    c.periodId === selectedPeriod
                );
                if (comment?.isValidated) {
                    validated++;
                }
            });
        });

        return { total, validated };
    }, [selectedClassId, classStudents, courses, user?.id, classComments, selectedPeriod]);

    // Calculate course averages for selected student (Detail View)
    const studentCourseAverages = useMemo(() => {
        if (!selectedStudent || !selectedPeriod || !selectedPeriodData || !user) return [];

        const teacherCourses = courses.filter(c => c.teacherId === user.id);

        return teacherCourses.map(course => {
            // Get grades for this student in this course
            const studentGrades = grades.filter(g =>
                g.studentId === selectedStudent &&
                g.courseId === course.id
            );

            // Filter by period
            const periodGrades = studentGrades.filter(g => {
                const gradeDate = new Date(g.date);
                const periodStart = new Date(selectedPeriodData.startDate);
                const periodEnd = new Date(selectedPeriodData.endDate);
                return gradeDate >= periodStart && gradeDate <= periodEnd;
            });

            // Calculate average
            let average = 0;
            if (periodGrades.length > 0) {
                const sum = periodGrades.reduce((acc, g) => acc + g.score, 0);
                average = sum / periodGrades.length;
            }

            // Get existing comment
            const existingComment = teacherComments.find(tc =>
                tc.studentId === selectedStudent &&
                tc.courseId === course.id &&
                tc.periodId === selectedPeriod
            );

            return {
                course,
                gradeCount: periodGrades.length,
                average,
                existingComment
            };
        }).filter(item => item.gradeCount > 0); // Only show courses with grades
    }, [selectedStudent, selectedPeriod, selectedPeriodData, courses, user?.id, grades, teacherComments]);

    // Calculate overall average for student
    const overallAverage = useMemo(() => {
        if (studentCourseAverages.length === 0) return 0;
        const sum = studentCourseAverages.reduce((acc, item) => acc + item.average, 0);
        return sum / studentCourseAverages.length;
    }, [studentCourseAverages]);

    const isValidationAllowed = useMemo(() => {
        if (!selectedPeriodData) return false;
        const now = new Date();
        const startDate = new Date(selectedPeriodData.startDate);
        return now >= startDate;
    }, [selectedPeriodData]);

    const handleSaveComment = async (courseId: string) => {
        const commentText = comments[courseId];
        const course = courses.find(c => c.id === courseId);
        const student = students.find(s => s.id === selectedStudent);
        const period = academicPeriods.find(p => p.id === selectedPeriod);

        if (!course || !student || !period || !user) return;

        const existingComment = teacherComments.find(tc =>
            tc.studentId === selectedStudent &&
            tc.courseId === courseId &&
            tc.periodId === selectedPeriod
        );

        try {
            if (existingComment) {
                if (commentText !== undefined && commentText !== existingComment.comment) {
                    await updateTeacherComment(existingComment.id, {
                        comment: commentText,
                        isValidated: false
                    });
                    toast.success('Commentaire mis à jour');
                }
            } else {
                if (!commentText || !commentText.trim()) {
                    toast.error('Veuillez écrire un commentaire');
                    return;
                }

                const comment: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'> = {
                    teacherId: user.id,
                    teacherName: user.name,
                    studentId: selectedStudent,
                    studentName: student.name,
                    courseId: courseId,
                    courseName: course.subject,
                    periodId: selectedPeriod,
                    periodName: period.name,
                    comment: commentText,
                    isValidated: false
                };
                await createTeacherComment(comment);
                toast.success('Commentaire enregistré');
            }
        } catch (error) {
            toast.error('Erreur lors de l\'enregistrement');
            console.error(error);
        }
    };

    const handleValidateAll = async () => {
        if (!selectedClassId || !user?.id || !selectedPeriod || !selectedPeriodData) return;

        if (!isValidationAllowed) {
            toast.error(`La validation n'est pas encore ouverte pour cette période (début : ${new Date(selectedPeriodData.startDate).toLocaleDateString()})`);
            return;
        }

        const teacherCoursesInClass = courses.filter(c => c.teacherId === user.id && c.classId === selectedClassId);
        const commentsToCreate: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        const commentsToUpdateIds: string[] = [];
        let count = 0;

        classStudents.forEach(student => {
            teacherCoursesInClass.forEach(course => {
                const comment = classComments.find(c =>
                    c.studentId === student.id &&
                    c.courseId === course.id &&
                    c.periodId === selectedPeriod
                );

                if (comment) {
                    if (!comment.isValidated) {
                        commentsToUpdateIds.push(comment.id);
                        count++;
                    }
                } else {
                    // Create empty validated comment
                    commentsToCreate.push({
                        teacherId: user.id,
                        teacherName: user.name,
                        studentId: student.id,
                        studentName: student.name,
                        courseId: course.id,
                        courseName: course.subject,
                        periodId: selectedPeriod,
                        periodName: selectedPeriodData.name,
                        comment: '', // Empty comment allowed
                        isValidated: true
                    });
                    count++;
                }
            });
        });

        if (count === 0) {
            toast.success('Tout est déjà validé');
            return;
        }

        if (confirm(`Voulez-vous valider ${count} entrées pour cette classe (y compris les commentaires vides) ?`)) {
            try {
                // 1. Batch create new comments
                if (commentsToCreate.length > 0) {
                    await batchCreateTeacherComments(commentsToCreate);
                }

                // 2. Update existing comments (still individual for now as update logic is simpler this way, or could be batched too but let's stick to create batch first)
                // Actually, let's just use Promise.all for updates as they are likely fewer
                const updatePromises = commentsToUpdateIds.map(id => validateTeacherComment(id));
                await Promise.all(updatePromises);

                // Wait a bit for Firebase to sync
                await new Promise(resolve => setTimeout(resolve, 500));
                toast.success('Validation en masse réussie');
            } catch (error) {
                toast.error('Erreur lors de la validation en masse');
                console.error(error);
            }
        }
    };

    const handleValidateStudentBulletin = async () => {
        if (!selectedStudent || !user?.id || !selectedPeriod || !selectedPeriodData) return;

        if (!isValidationAllowed) {
            toast.error(`La validation n'est pas encore ouverte pour cette période (début : ${new Date(selectedPeriodData.startDate).toLocaleDateString()})`);
            return;
        }

        const teacherCourses = courses.filter(c => c.teacherId === user.id);
        const commentsToCreate: Omit<TeacherComment, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        const commentsToUpdateIds: string[] = [];
        let count = 0;

        teacherCourses.forEach(course => {
            const comment = teacherComments.find(c =>
                c.courseId === course.id &&
                c.periodId === selectedPeriod
            );

            if (comment) {
                if (!comment.isValidated) {
                    commentsToUpdateIds.push(comment.id);
                    count++;
                }
            } else {
                // Create empty validated comment
                commentsToCreate.push({
                    teacherId: user.id,
                    teacherName: user.name,
                    studentId: selectedStudent,
                    studentName: selectedStudentData?.name || '',
                    courseId: course.id,
                    courseName: course.subject,
                    periodId: selectedPeriod,
                    periodName: selectedPeriodData.name,
                    comment: '',
                    isValidated: true
                });
                count++;
            }
        });

        if (count === 0) {
            toast.success('Bulletin déjà validé pour vos matières');
            return;
        }

        if (confirm(`Valider le bulletin de ${selectedStudentData?.name} pour vos matières ?`)) {
            try {
                // 1. Batch create new comments
                if (commentsToCreate.length > 0) {
                    await batchCreateTeacherComments(commentsToCreate);
                }

                // 2. Update existing comments
                const updatePromises = commentsToUpdateIds.map(id => validateTeacherComment(id));
                await Promise.all(updatePromises);

                // Wait a bit for Firebase to sync
                await new Promise(resolve => setTimeout(resolve, 500));
                toast.success('Bulletin validé');
            } catch (error) {
                toast.error('Erreur lors de la validation');
                console.error(error);
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Bulletins - Commentaires</h1>
                <p className="text-gray-600 mt-2">Validation des notes et commentaires pour les bulletins</p>
            </div>

            {/* Step 1: Select Period */}
            {!selectedPeriod && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">Étape 1 : Sélectionner une période</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {academicPeriods.map(period => (
                            <button
                                key={period.id}
                                onClick={() => setSelectedPeriod(period.id)}
                                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left"
                            >
                                <h3 className="font-bold text-lg text-gray-800">{period.name}</h3>
                                <p className="text-sm text-gray-600">{period.academicYear}</p>
                                <p className="text-xs text-gray-500 mt-2">
                                    Du {new Date(period.startDate).toLocaleDateString()} au {new Date(period.endDate).toLocaleDateString()}
                                </p>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Select Class */}
            {selectedPeriod && !selectedClassId && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <button onClick={() => setSelectedPeriod('')} className="p-2 hover:bg-gray-100 rounded-lg">
                            <ArrowLeft size={20} />
                        </button>
                        <h2 className="text-xl font-semibold">Étape 2 : Sélectionner une classe</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {teacherClasses.map(cls => (
                            <button
                                key={cls.id}
                                onClick={() => setSelectedClassId(cls.id)}
                                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-all text-left flex items-center gap-4"
                            >
                                <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                                    <Users size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-gray-800">{cls.name}</h3>
                                    <p className="text-sm text-gray-500">{cls.grade}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 3: Class Overview */}
            {selectedPeriod && selectedClassId && !selectedStudent && (
                <div className="space-y-6">
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setSelectedClassId('')} className="p-2 hover:bg-gray-100 rounded-lg">
                                    <ArrowLeft size={20} />
                                </button>
                                <div>
                                    <h2 className="text-xl font-semibold">{selectedClassData?.name} - Vue d'ensemble</h2>
                                    <p className="text-sm text-gray-500">{selectedPeriodData?.name}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-sm text-gray-500">Progression Validation</p>
                                    <p className="font-bold text-indigo-600">
                                        {classValidationStats.validated} / {classValidationStats.total}
                                    </p>
                                </div>
                                <button
                                    onClick={handleValidateAll}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                                >
                                    <CheckSquare size={18} />
                                    Tout Valider
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {classStudents.map(student => {
                                // Check if this student has all courses validated
                                const teacherCoursesInClass = courses.filter(c => c.teacherId === user?.id && c.classId === selectedClassId);
                                const studentComments = classComments.filter(c => c.studentId === student.id && c.periodId === selectedPeriod);

                                const totalCourses = teacherCoursesInClass.length;
                                const validatedCourses = teacherCoursesInClass.filter(course =>
                                    studentComments.some(c => c.courseId === course.id && c.isValidated)
                                ).length;

                                const isFullyValidated = totalCourses > 0 && totalCourses === validatedCourses;

                                return (
                                    <button
                                        key={student.id}
                                        onClick={() => setSelectedStudent(student.id)}
                                        className={`p-4 border-2 rounded-lg transition-all flex items-center gap-3 ${isFullyValidated
                                            ? 'border-green-200 bg-green-50 hover:border-green-300'
                                            : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${isFullyValidated ? 'bg-green-500' : 'bg-orange-500'
                                            }`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div className="text-left flex-1">
                                            <p className="font-medium text-gray-800">{student.name}</p>
                                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                                {isFullyValidated ? (
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <CheckCircle size={12} /> Validé
                                                    </span>
                                                ) : (
                                                    <span>{validatedCourses}/{totalCourses} validés</span>
                                                )}
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            {/* Step 4: Student Detail (Existing Logic) */}
            {selectedPeriod && selectedStudent && (
                <>
                    {/* Header with student info */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedStudent('')}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                                <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                                    {selectedStudentData?.name.charAt(0)}
                                </div>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800">{selectedStudentData?.name}</h2>
                                    <p className="text-gray-600">{selectedPeriodData?.name} - {selectedPeriodData?.academicYear}</p>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
                                <p className="text-indigo-100 text-sm">Moyenne Générale</p>
                                <p className="text-4xl font-bold">{overallAverage.toFixed(2)}</p>
                                <p className="text-indigo-100 text-sm">/ 20</p>
                            </div>
                        </div>
                    </div>

                    {/* Course Averages and Comments */}
                    <div className="space-y-4">
                        {studentCourseAverages.length === 0 ? (
                            <div className="bg-white rounded-lg shadow-md p-12 text-center">
                                <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-500">Aucune note pour cette période</p>
                            </div>
                        ) : (
                            studentCourseAverages.map(({ course, gradeCount, average, existingComment }) => (
                                <div key={course.id} className="bg-white rounded-lg shadow-md p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <BookOpen size={24} className="text-indigo-600" />
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-800">{course.subject}</h3>
                                                <p className="text-sm text-gray-500">{gradeCount} note{gradeCount > 1 ? 's' : ''}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 bg-gradient-to-br from-green-50 to-green-100 px-6 py-3 rounded-lg">
                                            <TrendingUp className="text-green-600" size={20} />
                                            <div className="text-right">
                                                <p className="text-2xl font-bold text-green-700">{average.toFixed(2)}</p>
                                                <p className="text-xs text-green-600">/ 20</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Existing comment (validated) or Edit Form */}
                                    {existingComment && existingComment.isValidated ? (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <p className="text-sm font-medium text-green-800">
                                                    Commentaire validé ✓
                                                </p>
                                            </div>
                                            <p className="text-gray-700">{existingComment.comment}</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Validé le {new Date(existingComment.validationDate!).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <label className="block text-sm font-medium text-gray-700">
                                                <MessageSquare size={16} className="inline mr-2" />
                                                {existingComment ? 'Modifier le commentaire' : 'Ajouter un commentaire'}
                                            </label>

                                            <textarea
                                                value={comments[course.id] !== undefined ? comments[course.id] : (existingComment?.comment || '')}
                                                onChange={(e) => setComments(prev => ({ ...prev, [course.id]: e.target.value }))}
                                                rows={3}
                                                placeholder="Votre commentaire sur l'élève pour ce cours..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                            />
                                            <button
                                                onClick={() => handleSaveComment(course.id)}
                                                disabled={
                                                    (comments[course.id] !== undefined && !comments[course.id].trim()) ||
                                                    (comments[course.id] === undefined && !existingComment)
                                                }
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                <Save size={18} />
                                                {existingComment ? 'Mettre à jour' : 'Enregistrer'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Validate Bulletin Button */}
                    <div className="mt-8 flex justify-end">
                        <button
                            onClick={handleValidateStudentBulletin}
                            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 shadow-md"
                        >
                            <CheckSquare size={20} />
                            Valider le bulletin de {selectedStudentData?.name}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default TeacherBulletinGrades;
