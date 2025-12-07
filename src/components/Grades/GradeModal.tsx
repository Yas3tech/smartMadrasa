import { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../UI';
import { X, Plus } from 'lucide-react';
import type { Grade } from '../../types';
import { useData } from '../../context/DataContext';

interface GradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (grade: Omit<Grade, 'id'>) => Promise<void>;
    editingGrade?: Grade | null;
    classId?: string;
}

const SUBJECTS = [
    'Mathématiques',
    'Français',
    'Arabe',
    'Sciences',
    'Histoire',
    'Sport',
    'Arts',
    'Religion',
    'Informatique'
];

const GRADE_TYPES = [
    { value: 'exam', label: 'Examen' },
    { value: 'homework', label: 'Devoir' },
    { value: 'participation', label: 'Participation' }
];

const GradeModal = ({ isOpen, onClose, onSave, editingGrade, classId }: GradeModalProps) => {
    const { students } = useData();
    const [studentId, setStudentId] = useState('');
    const [subject, setSubject] = useState('');
    const [type, setType] = useState<'exam' | 'homework' | 'participation'>('exam');
    const [score, setScore] = useState('');
    const [maxScore, setMaxScore] = useState('20');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [feedback, setFeedback] = useState('');
    const [loading, setLoading] = useState(false);

    // Filter students by class if classId is provided
    const classStudents = classId
        ? students.filter(s => (s as any).classId === classId)
        : students;

    useEffect(() => {
        if (editingGrade) {
            setStudentId(editingGrade.studentId);
            setSubject(editingGrade.subject);
            setType(editingGrade.type);
            setScore(editingGrade.score.toString());
            setMaxScore(editingGrade.maxScore.toString());
            setDate(new Date(editingGrade.date).toISOString().split('T')[0]);
            setFeedback(editingGrade.feedback || '');
        } else {
            // Reset form
            setStudentId('');
            setSubject('');
            setType('exam');
            setScore('');
            setMaxScore('20');
            setDate(new Date().toISOString().split('T')[0]);
            setFeedback('');
        }
    }, [editingGrade, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!studentId || !subject || !score || !maxScore) return;

        setLoading(true);
        try {
            await onSave({
                studentId,
                subject,
                type,
                score: parseFloat(score),
                maxScore: parseFloat(maxScore),
                date: new Date(date).toISOString(),
                feedback: feedback || undefined
            });
            onClose();
        } catch (error) {
            console.error('Error saving grade:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                        {editingGrade ? 'Modifier la note' : 'Ajouter une note'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Student */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Élève *</label>
                        <select
                            value={studentId}
                            onChange={(e) => setStudentId(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            required
                        >
                            <option value="">Sélectionner un élève</option>
                            {classStudents.map(student => (
                                <option key={student.id} value={student.id}>
                                    {student.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Subject */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                        <select
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            required
                        >
                            <option value="">Sélectionner une matière</option>
                            {SUBJECTS.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>

                    {/* Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                        <select
                            value={type}
                            onChange={(e) => setType(e.target.value as 'exam' | 'homework' | 'participation')}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            required
                        >
                            {GRADE_TYPES.map(t => (
                                <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                        </select>
                    </div>

                    {/* Score and Max Score */}
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Note obtenue *"
                            type="number"
                            step="0.5"
                            min="0"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            required
                        />
                        <Input
                            label="Note maximale *"
                            type="number"
                            step="0.5"
                            min="0"
                            value={maxScore}
                            onChange={(e) => setMaxScore(e.target.value)}
                            required
                        />
                    </div>

                    {/* Date */}
                    <Input
                        label="Date *"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                    />

                    {/* Feedback */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (optionnel)</label>
                        <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            placeholder="Commentaire sur la performance de l'élève..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Annuler
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading} icon={Plus}>
                            {loading ? 'Enregistrement...' : (editingGrade ? 'Modifier' : 'Ajouter')}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    );
};

export default GradeModal;
