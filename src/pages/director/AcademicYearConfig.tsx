import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Edit2, Trash2, Check, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AcademicPeriod } from '../../types/bulletin';

const AcademicYearConfig: React.FC = () => {
    const { t } = useTranslation();
    const { academicPeriods, addAcademicPeriod, updateAcademicPeriod, deleteAcademicPeriod } = useData();
    const { user } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Omit<AcademicPeriod, 'id'>>({
        name: '',
        academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        startDate: '',
        endDate: '',
        gradeEntryStartDate: '',
        gradeEntryEndDate: '',
        bulletinPublishDate: '',
        isPublished: false,
        order: 1
    });

    // Only directors can access this page
    if (user?.role !== 'director' && user?.role !== 'superadmin') {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500">Accès réservé aux directeurs</p>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingId) {
                await updateAcademicPeriod(editingId, formData);
                toast.success(t('academicYearConfig.periodUpdated'));
                setEditingId(null);
            } else {
                await addAcademicPeriod(formData);
                toast.success(t('academicYearConfig.periodAdded'));
                setIsAdding(false);
            }
            resetForm();
        } catch (error) {
            toast.error(t('academicYearConfig.saveError'));
            console.error(error);
        }
    };

    const handleEdit = (period: AcademicPeriod) => {
        setFormData({
            name: period.name,
            academicYear: period.academicYear,
            startDate: period.startDate,
            endDate: period.endDate,
            gradeEntryStartDate: period.gradeEntryStartDate,
            gradeEntryEndDate: period.gradeEntryEndDate,
            bulletinPublishDate: period.bulletinPublishDate || '',
            isPublished: period.isPublished,
            order: period.order
        });
        setEditingId(period.id);
        setIsAdding(false);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Êtes-vous sûr de vouloir supprimer cette période ?')) {
            try {
                await deleteAcademicPeriod(id);
                toast.success(t('academicYearConfig.periodDeleted'));
            } catch (error) {
                toast.error(t('academicYearConfig.deleteError'));
                console.error(error);
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            academicYear: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
            startDate: '',
            endDate: '',
            gradeEntryStartDate: '',
            gradeEntryEndDate: '',
            bulletinPublishDate: '',
            isPublished: false,
            order: academicPeriods.length + 1
        });
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        resetForm();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Configuration Année Scolaire</h1>
                    <p className="text-gray-600 mt-2">Gérez les périodes scolaires et les dates de publication des bulletins</p>
                </div>
                {!isAdding && !editingId && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={20} />
                        Nouvelle Période
                    </button>
                )}
            </div>

            {/* Form for adding/editing */}
            {(isAdding || editingId) && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h2 className="text-xl font-semibold mb-4">
                        {editingId ? 'Modifier la période' : 'Nouvelle période scolaire'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nom de la période *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Trimestre 1, Semestre 1..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Année scolaire *
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.academicYear}
                                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                    placeholder="2024-2025"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de début *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de fin *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ouverture saisie notes *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.gradeEntryStartDate}
                                    onChange={(e) => setFormData({ ...formData, gradeEntryStartDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Fermeture saisie notes *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.gradeEntryEndDate}
                                    onChange={(e) => setFormData({ ...formData, gradeEntryEndDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date de publication bulletins
                                </label>
                                <input
                                    type="date"
                                    value={formData.bulletinPublishDate}
                                    onChange={(e) => setFormData({ ...formData, bulletinPublishDate: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Ordre *
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="1"
                                    value={formData.order}
                                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button
                                type="button"
                                onClick={handleCancel}
                                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors flex items-center gap-2"
                            >
                                <X size={18} />
                                Annuler
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                            >
                                <Save size={18} />
                                {editingId ? 'Mettre à jour' : 'Créer'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Periods list */}
            <div className="grid gap-4">
                {academicPeriods.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                        <p className="text-gray-500 text-lg">Aucune période configurée</p>
                        <p className="text-gray-400 mt-2">Créez votre première période scolaire pour commencer</p>
                    </div>
                ) : (
                    academicPeriods.map((period) => (
                        <div
                            key={period.id}
                            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold text-gray-800">{period.name}</h3>
                                        <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                                            {period.academicYear}
                                        </span>
                                        {period.isPublished && (
                                            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                                                <Check size={14} />
                                                Publié
                                            </span>
                                        )}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Période</p>
                                            <p className="font-medium">
                                                {new Date(period.startDate).toLocaleDateString()} - {new Date(period.endDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Saisie des notes</p>
                                            <p className="font-medium">
                                                {new Date(period.gradeEntryStartDate).toLocaleDateString()} - {new Date(period.gradeEntryEndDate).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Publication bulletins</p>
                                            <p className="font-medium">
                                                {period.bulletinPublishDate
                                                    ? new Date(period.bulletinPublishDate).toLocaleDateString()
                                                    : 'Non définie'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => handleEdit(period)}
                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                        title="Modifier"
                                    >
                                        <Edit2 size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(period.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        title="Supprimer"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AcademicYearConfig;
