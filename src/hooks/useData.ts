import { useMemo } from 'react';
import type { DataContextType } from '../hooks/useData';
import { useUsers } from '../context/slices/UserContext';
import { useAcademics } from '../context/slices/AcademicContext';
import { useCommunication } from '../context/slices/CommunicationContext';
import { usePerformance } from '../context/slices/PerformanceContext';
import { isFirebaseConfigured } from '../config/firebase';

/**
 * @deprecated usage of useData causes re-renders on any data change.
 * Please use specific hooks instead: useUsers, useAcademics, useCommunication, usePerformance.
 */
export const useData = (): DataContextType => {
  const userContext = useUsers();
  const academicContext = useAcademics();
  const communicationContext = useCommunication();
  const performanceContext = usePerformance();

  const useFirebase = isFirebaseConfigured;

  return useMemo(() => {
    // Aggregate loading state
    const isLoading =
      userContext.isLoading ||
      academicContext.isLoading ||
      communicationContext.isLoading ||
      performanceContext.isLoading;

    return {
      // User Context
      users: userContext.users,
      students: userContext.students,
      addUser: userContext.addUser,
      updateUser: userContext.updateUser,
      deleteUser: userContext.deleteUser,

      // Academic Context
      classes: academicContext.classes,
      courses: academicContext.courses,
      academicPeriods: academicContext.academicPeriods,
      gradeCategories: academicContext.gradeCategories,
      addClass: academicContext.addClass,
      updateClass: academicContext.updateClass,
      deleteClass: academicContext.deleteClass,
      addCourse: academicContext.addCourse,
      updateCourse: academicContext.updateCourse,
      deleteCourse: academicContext.deleteCourse,
      addAcademicPeriod: academicContext.addAcademicPeriod,
      updateAcademicPeriod: academicContext.updateAcademicPeriod,
      deleteAcademicPeriod: academicContext.deleteAcademicPeriod,
      publishPeriodBulletins: academicContext.publishPeriodBulletins,
      addGradeCategory: academicContext.addGradeCategory,
      updateGradeCategory: academicContext.updateGradeCategory,
      deleteGradeCategory: academicContext.deleteGradeCategory,

      // Communication Context
      messages: communicationContext.messages,
      events: communicationContext.events,
      sendMessage: communicationContext.sendMessage,
      deleteMessage: communicationContext.deleteMessage,
      markMessageAsRead: communicationContext.markMessageAsRead,
      updateMessage: communicationContext.updateMessage,
      addEvent: communicationContext.addEvent,
      updateEvent: communicationContext.updateEvent,
      deleteEvent: communicationContext.deleteEvent,

      // Performance Context
      grades: performanceContext.grades,
      attendance: performanceContext.attendance,
      homeworks: performanceContext.homeworks,
      addGrade: performanceContext.addGrade,
      updateGrade: performanceContext.updateGrade,
      markAttendance: performanceContext.markAttendance,
      updateAttendance: performanceContext.updateAttendance,
      addHomework: performanceContext.addHomework,
      updateHomework: performanceContext.updateHomework,
      deleteHomework: performanceContext.deleteHomework,

      // Global
      isLoading,
      useFirebase,
    };
  }, [userContext, academicContext, communicationContext, performanceContext, useFirebase]);
};
