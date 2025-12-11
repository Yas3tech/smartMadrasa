/**
 * Mock Data Generators
 * 
 * Fallback data when Firebase is not configured.
 * Used by DataContext for development/demo purposes.
 */

import type { User, Student, ClassGroup, Message, Event, Grade, Attendance, Homework } from '../types';

export const generateMockUsers = (): User[] => [
    { id: '1', name: 'Dr. Hassan El Fassi', email: 'hassan.elfassi@school.ma', role: 'director', avatar: '👨‍💼' },
    { id: '2', name: 'Mme. Layla El Amrani', email: 'layla.elamrani@school.ma', role: 'teacher', avatar: '👩‍🏫' },
    { id: '3', name: 'Karim Tazi', email: 'karim.tazi@school.ma', role: 'student', avatar: '👨‍🎓', classId: 'c1' } as Student,
    { id: '4', name: 'Mme. Tazi', email: 'mme.tazi@gmail.com', role: 'parent', avatar: '👩' },
    { id: '5', name: 'M. Amine Benjelloun', email: 'amine.benjelloun@school.ma', role: 'teacher', avatar: '👨‍🏫' },
];

export const generateMockClasses = (): ClassGroup[] => [
    { id: 'c1', name: 'Classe 1A', grade: '1ère année', teacherId: '2' },
    { id: 'c2', name: 'Classe 2B', grade: '2ème année', teacherId: '5' },
    { id: 'c3', name: 'Classe 3A', grade: '3ème année', teacherId: '2' },
];

export const generateMockMessages = (): Message[] => [
    {
        id: 1,
        senderId: 1,
        senderName: 'Dr. Hassan El Fassi',
        senderRole: 'director',
        receiverId: 2,
        subject: 'Réunion pédagogique',
        content: 'Bonjour,\n\nJe vous invite à la réunion pédagogique de demain à 14h.\n\nCordialement,\nHassan',
        read: false,
        timestamp: new Date().toISOString(),
        type: 'individual'
    },
    {
        id: 2,
        senderId: 2,
        senderName: 'Mme. Layla El Amrani',
        senderRole: 'teacher',
        receiverId: 'all',
        subject: 'Devoirs pour la semaine',
        content: 'Chers parents,\n\nVoici les devoirs pour cette semaine...',
        read: true,
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'broadcast'
    }
];

export const generateMockEvents = (): Event[] => [
    {
        id: 'e1',
        title: 'Cours de Mathématiques',
        description: 'Algèbre linéaire',
        start: new Date(2025, 10, 20, 9, 0).toISOString(),
        end: new Date(2025, 10, 20, 10, 0).toISOString(),
        type: 'lesson',
        classId: 'c1'
    },
    {
        id: 'e2',
        title: "Examen d'Arabe",
        description: 'Grammaire et vocabulaire',
        start: new Date(2025, 10, 22, 10, 0).toISOString(),
        end: new Date(2025, 10, 22, 12, 0).toISOString(),
        type: 'exam',
        classId: 'c1'
    }
];

export const generateMockGrades = (): Grade[] => [
    {
        id: 'g1',
        studentId: '3',
        subject: 'Mathématiques',
        score: 85,
        maxScore: 100,
        type: 'exam',
        date: new Date(2025, 10, 15).toISOString(),
        feedback: 'Très bon travail!'
    },
    {
        id: 'g2',
        studentId: '3',
        subject: 'Arabe',
        score: 92,
        maxScore: 100,
        type: 'homework',
        date: new Date(2025, 10, 18).toISOString()
    }
];

export const generateMockAttendance = (): Attendance[] => [
    {
        id: 'a1',
        date: new Date().toISOString().split('T')[0],
        studentId: '3',
        status: 'present',
        classId: 'c1'
    }
];

export const generateMockHomeworks = (): Homework[] => [
    {
        id: 'h1',
        title: 'Exercices de Mathématiques',
        subject: 'Mathématiques',
        description: 'Page 42, exercices 1 à 5',
        dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
        assignedBy: 'Mme. Layla El Amrani',
        classId: 'c1',
        maxGrade: 20
    }
];
