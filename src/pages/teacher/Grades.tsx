import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import StudentGradesView from '../../components/Grades/StudentGradesView';
import ParentGradesView from '../../components/Grades/ParentGradesView';
import TeacherGradesView from '../../components/Grades/TeacherGradesView';

const Grades = () => {
    useTranslation();
    const { user } = useAuth();

    if (!user) return null;

    if (user.role === 'student') {
        return <StudentGradesView />;
    }

    if (user.role === 'parent') {
        return <ParentGradesView />;
    }

    // Default to teacher view for teacher, admin, director, superadmin
    return <TeacherGradesView />;
};

export default Grades;
