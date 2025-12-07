import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Card, Button, Modal, Input } from '../../components/UI';
import { Plus, Edit2, Users, GraduationCap, X } from 'lucide-react';
import type { ClassGroup } from '../../types';

const Classes = () => {
    const { user } = useAuth();
    const { classes, users, students, addClass, updateClass, deleteClass } = useData();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState<ClassGroup | null>(null);
    const [deletingClass, setDeletingClass] = useState<ClassGroup | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [grade, setGrade] = useState('');
    const [teacherId, setTeacherId] = useState('');

    const teachers = users.filter(u => u.role === 'teacher');

    const handleOpenNew = () => {
        setEditingClass(null);
        setName('');
        setGrade('');
        setTeacherId('');
        setIsModalOpen(true);
    };

    const handleEdit = (classGroup: ClassGroup) => {
        setEditingClass(classGroup);
        setName(classGroup.name);
        setGrade(classGroup.grade);
        setTeacherId(classGroup.teacherId || '');
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        if (!name || !grade) return;

        if (editingClass) {
            await updateClass(editingClass.id, { name, grade, teacherId });
        } else {
            const newClass: ClassGroup = {
                id: `c${Date.now()}`,
                name,
                grade,
                teacherId
            };
            await addClass(newClass);
        }
        setIsModalOpen(false);
    };

    const getClassTeacher = (teacherId: string) => {
        return users.find(u => u.id === teacherId);
    };

    const getClassStudents = (classId: string) => {
        return students.filter(s => (s as any).classId === classId);
    };

    if (user?.role !== 'teacher' && user?.role !== 'director' && user?.role !== 'superadmin') {
        return (
            <div className="flex items-center justify-center h-96">
                <Card className="p-8 text-center">
                    <GraduationCap size={48} className="mx-auto mb-4 text-gray-300" />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Accès restreint</h2>
                    <p className="text-gray-600">Cette page est réservée aux enseignants et directeurs.</p>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Gestion des Classes</h1>
                <Button variant="primary" icon={Plus} onClick={handleOpenNew}>
                    Nouvelle Classe
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <GraduationCap className="text-orange-600" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Classes</p>
                            <p className="text-3xl font-bold text-gray-900">{classes.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Users className="text-blue-600" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Total Élèves</p>
                            <p className="text-3xl font-bold text-gray-900">{students.length}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <GraduationCap className="text-green-600" size={28} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Enseignants</p>
                            <p className="text-3xl font-bold text-gray-900">{teachers.length}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Classes Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(classGroup => {
                    const teacher = getClassTeacher(classGroup.teacherId || '');
                    const classStudents = getClassStudents(classGroup.id);

                    return (
                        <Card key={classGroup.id} className="p-6 hover:shadow-lg transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">{classGroup.name}</h3>
                                    <p className="text-sm text-gray-500">{classGroup.grade}</p>
                                </div>
                                <button
                                    onClick={() => handleEdit(classGroup)}
                                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                                >
                                    <Edit2 size={18} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                {/* Teacher */}
                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        {teacher ? teacher.name.charAt(0) : '?'}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-gray-500">Enseignant</p>
                                        <p className="font-semibold text-sm text-gray-900">
                                            {teacher ? teacher.name : 'Non assigné'}
                                        </p>
                                    </div>
                                </div>

                                {/* Students Count */}
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center gap-2">
                                        <Users className="text-blue-600" size={18} />
                                        <span className="text-sm font-medium text-gray-700">Élèves</span>
                                    </div>
                                    <span className="text-xl font-bold text-blue-600">{classStudents.length}</span>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleEdit(classGroup)}
                                    >
                                        Modifier
                                    </Button>
                                    <Button
                                        variant="danger"
                                        size="sm"
                                        className="flex-1"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDeletingClass(classGroup);
                                        }}
                                    >
                                        Supprimer
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            {/* Create/Edit Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            {editingClass ? 'Modifier la Classe' : 'Nouvelle Classe'}
                        </h2>
                        <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Nom de la classe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Classe 1A"
                        />

                        <Input
                            label="Niveau"
                            value={grade}
                            onChange={(e) => setGrade(e.target.value)}
                            placeholder="1ère année"
                        />

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Enseignant</label>
                            <select
                                value={teacherId}
                                onChange={(e) => setTeacherId(e.target.value)}
                                className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-100 focus:border-orange-500 outline-none"
                            >
                                <option value="">Sélectionner un enseignant</option>
                                {teachers.map(teacher => (
                                    <option key={teacher.id} value={teacher.id}>
                                        {teacher.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-3 pt-4">
                            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                                Annuler
                            </Button>
                            <Button variant="primary" onClick={handleSave}>
                                {editingClass ? 'Enregistrer' : 'Créer'}
                            </Button>
                        </div>
                    </div>
                </div>
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal isOpen={!!deletingClass} onClose={() => setDeletingClass(null)}>
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-2xl">⚠️</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Confirmer la suppression</h2>
                            <p className="text-sm text-gray-500">Cette action est irréversible</p>
                        </div>
                    </div>

                    <p className="text-gray-700 mb-6">
                        Êtes-vous sûr de vouloir supprimer la classe <strong>{deletingClass?.name}</strong> ?
                        Tous les cours et données associés seront également supprimés.
                    </p>

                    <div className="flex justify-end gap-3">
                        <Button variant="secondary" onClick={() => setDeletingClass(null)}>
                            Annuler
                        </Button>
                        <Button
                            variant="danger"
                            onClick={async () => {
                                if (deletingClass) {
                                    await deleteClass(deletingClass.id);
                                    setDeletingClass(null);
                                }
                            }}
                        >
                            Supprimer définitivement
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default Classes;
