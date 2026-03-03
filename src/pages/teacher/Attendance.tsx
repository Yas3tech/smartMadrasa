import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useUsers, useAcademics, usePerformance } from '../../context/DataContext';
import StudentAttendance from '../../components/Attendance/StudentAttendance';
import TeacherAttendance from '../../components/Attendance/TeacherAttendance';

const Attendance = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const { students } = useUsers();
  const { courses, classes } = useAcademics();
  const { attendance, markAttendance, updateAttendance } = usePerformance();
  const isRTL = i18n.language === 'ar';

  const [selectedChild, setSelectedChild] = useState<{
    id: string;
    name: string;
    classId: string;
  } | null>(null);

  if (user?.role === 'student' || user?.role === 'parent') {
    return (
      <StudentAttendance
        user={user as any}
        attendance={attendance}
        courses={courses as any}
        selectedChild={selectedChild}
        setSelectedChild={setSelectedChild}
        t={t}
        i18n={i18n}
      />
    );
  }

  if (user?.role === 'teacher' || user?.role === 'director' || user?.role === 'superadmin') {
    return (
      <TeacherAttendance
        user={user as any}
        students={students as any}
        courses={courses as any}
        classes={classes}
        attendance={attendance}
        markAttendance={markAttendance}
        updateAttendance={updateAttendance}
        t={t}
        isRTL={isRTL}
      />
    );
  }

  return null;
};

export default Attendance;
