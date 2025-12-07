import { useState, useEffect } from 'react';
import { Modal, Button } from '../UI';
import { X, Save } from 'lucide-react';
import type { Grade, Student } from '../../types';

export interface BulkGradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    className: string;
    students: Student[];
    onSave: (grades: Omit<Grade, 'id'>[]) => Promise<void>;
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

const BulkGradeModal = ({ isOpen, onClose, onSave, className, students }: BulkGradeModalProps) => {
    // Plus besoin de classId ici : la classe est déjà choisie à l'extérieur

    const [subject, setSubject] = useState('');
    const [type, setType] = useState<'exam' | 'homework' | 'participation'>('exam');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [maxScore, setMaxScore] = useState(20);

    // Grades state: map of studentId -> score
    const [scores, setScores] = useState<Record<string, string>>({});
    const [feedback, setFeedback] = useState<Record<string, string>>({});
    const [absences, setAbsences] = useState<Record<string, boolean>>({});

    const [loading, setLoading] = useState(false);

    // Reset form when modal opens
    useEffect(() => {
        if (isOpen) {
            setSubject('');
            setType('exam');
            setDate(new Date().toISOString().split('T')[0]);
            setMaxScore(20);
            setScores({});
            setFeedback({});
            setAbsences({});
        }
    }, [isOpen]);

    const handleScoreChange = (studentId: string, value: string) => {
        if (value === '' || (!isNaN(Number(value)) && Number(value) >= 0 && Number(value) <= maxScore)) {
            setScores(prev => ({ ...prev, [studentId]: value }));
        }
    };

    const handleFeedbackChange = (studentId: string, value: string) => {
        setFeedback(prev => ({ ...prev, [studentId]: value }));
    };

    const toggleAbsence = (studentId: string) => {
        setAbsences(prev => {
            const isAbsent = !prev[studentId];
            if (isAbsent) {
                setScores(prevScores => {
                    const newScores = { ...prevScores };
                    delete newScores[studentId];
                    return newScores;
                });
            }
            return { ...prev, [studentId]: isAbsent };
        });
    };

    const handleSubmit = async () => {
        if (!subject || !date) return;

        setLoading(true);
        try {
            const gradesToSave: Omit<Grade, 'id'>[] = [];

            students.forEach(student => {
                const isAbsent = absences[student.id];
                const scoreStr = scores[student.id];

                if (isAbsent || (scoreStr !== undefined && scoreStr !== '')) {
                    gradesToSave.push({
                        studentId: student.id,
                        subject,
                        score: isAbsent ? 0 : Number(scoreStr),
                        maxScore,
                        type,
                        date: new Date(date).toISOString(),
                        feedback: feedback[student.id],
                        status: isAbsent ? 'absent' : 'present',
                        studentName: student.name,
                        className: className,
                    });
                }
            });

            if (gradesToSave.length > 0) {
                await onSave(gradesToSave);
            } else {
                console.warn('No grades to save');
            }
        } catch (error) {
            console.error('Error saving bulk grades:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 max-w-4xl w-full mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Saisie groupée des notes</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Configuration Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                        <div>
                            <p className="block text-sm font-medium text-gray-700 mb-1">Classe</p>
                            <p className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-900">
                                {className}
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Matière *</label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            >
                                <option value="">Sélectionner une matière</option>
                                {SUBJECTS.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            >
                                <option value="exam">Examen</option>
                                <option value="homework">Devoir</option>
                                <option value="participation">Participation</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Note sur *</label>
                            <input
                                type="number"
                                value={maxScore}
                                onChange={(e) => setMaxScore(Number(e.target.value))}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                min="1"
                            />
                        </div>
                    </div>

                    {/* Students List */}
                    {students.length > 0 && (
                        <div className="border rounded-xl overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Élève</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-32">Note (/{maxScore})</th>
                                        <th className="px-4 py-3 text-center text-sm font-medium text-gray-500 w-24">Absent</th>
                                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Commentaire</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {students.map(student => (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-gray-900">{student.name}</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="number"
                                                    value={scores[student.id] || ''}
                                                    onChange={(e) => handleScoreChange(student.id, e.target.value)}
                                                    disabled={absences[student.id]}
                                                    className="w-full px-3 py-1 text-center rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none disabled:bg-gray-100 disabled:text-gray-400"
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={!!absences[student.id]}
                                                    onChange={() => toggleAbsence(student.id)}
                                                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="text"
                                                    value={feedback[student.id] || ''}
                                                    onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                                                    className="w-full px-3 py-1 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                                                    placeholder="Appréciation..."
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {students.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    Aucun élève dans cette classe.
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <Button variant="secondary" onClick={onClose} type="button">
                            Annuler
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSubmit}
                            disabled={loading || students.length === 0}
                            icon={Save}
                            type="button"
                        >
                            {loading ? 'Enregistrement...' : 'Enregistrer les notes'}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default BulkGradeModal;
