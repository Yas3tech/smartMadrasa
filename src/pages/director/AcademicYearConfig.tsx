import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAcademics } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Plus, Edit2, Trash2, Check, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AcademicPeriod } from '../../types/bulletin';

const translations = {
  fr: {
    restrictedAccess: 'Acces reserve aux directeurs',
    title: 'Configuration academique',
    subtitle: 'Gerez les periodes scolaires et les dates de publication des bulletins',
    newPeriod: 'Nouvelle periode',
    editPeriod: 'Modifier la periode',
    newAcademicPeriod: 'Nouvelle periode scolaire',
    periodName: 'Nom de la periode',
    periodNamePlaceholder: 'Trimestre 1, Semestre 1...',
    academicYear: 'Annee scolaire',
    startDate: 'Date de debut',
    endDate: 'Date de fin',
    gradeEntryStartDate: 'Ouverture saisie notes',
    gradeEntryEndDate: 'Fermeture saisie notes',
    bulletinPublishDate: 'Date de publication bulletins',
    order: 'Ordre',
    confirmDelete: 'Etes-vous sur de vouloir supprimer cette periode ?',
    update: 'Mettre a jour',
    create: 'Creer',
    noPeriods: 'Aucune periode configuree',
    noPeriodsDescription: 'Creez votre premiere periode scolaire pour commencer',
    published: 'Publie',
    periodRange: 'Periode',
    gradeEntryWindow: 'Saisie des notes',
    bulletinPublication: 'Publication bulletins',
    notDefined: 'Non definie',
    periodUpdated: 'Periode mise a jour',
    periodAdded: 'Periode ajoutee',
    saveError: "Erreur lors de l'enregistrement",
    periodDeleted: 'Periode supprimee',
    deleteError: 'Erreur lors de la suppression',
  },
  nl: {
    restrictedAccess: 'Toegang voorbehouden aan directeurs',
    title: 'Academische configuratie',
    subtitle: 'Beheer schoolperiodes en publicatiedata van rapporten',
    newPeriod: 'Nieuwe periode',
    editPeriod: 'Periode bewerken',
    newAcademicPeriod: 'Nieuwe schoolperiode',
    periodName: 'Periode naam',
    periodNamePlaceholder: 'Trimester 1, Semester 1...',
    academicYear: 'Schooljaar',
    startDate: 'Startdatum',
    endDate: 'Einddatum',
    gradeEntryStartDate: 'Start cijferinvoer',
    gradeEntryEndDate: 'Einde cijferinvoer',
    bulletinPublishDate: 'Publicatiedatum rapporten',
    order: 'Volgorde',
    confirmDelete: 'Weet u zeker dat u deze periode wilt verwijderen?',
    update: 'Bijwerken',
    create: 'Aanmaken',
    noPeriods: 'Geen periodes geconfigureerd',
    noPeriodsDescription: 'Maak uw eerste schoolperiode aan om te beginnen',
    published: 'Gepubliceerd',
    periodRange: 'Periode',
    gradeEntryWindow: 'Cijferinvoer',
    bulletinPublication: 'Publicatie rapporten',
    notDefined: 'Niet ingesteld',
    periodUpdated: 'Periode bijgewerkt',
    periodAdded: 'Periode toegevoegd',
    saveError: 'Fout bij opslaan',
    periodDeleted: 'Periode verwijderd',
    deleteError: 'Fout bij verwijderen',
  },
  ar: {
    restrictedAccess: 'الوصول مخصص للمديرين',
    title: 'الاعداد الاكاديمي',
    subtitle: 'ادارة الفترات الدراسية ومواعيد نشر الكشوف',
    newPeriod: 'فترة جديدة',
    editPeriod: 'تعديل الفترة',
    newAcademicPeriod: 'فترة دراسية جديدة',
    periodName: 'اسم الفترة',
    periodNamePlaceholder: 'الفصل الاول، السمسٹر الاول...',
    academicYear: 'السنة الدراسية',
    startDate: 'تاريخ البدء',
    endDate: 'تاريخ النهاية',
    gradeEntryStartDate: 'بداية ادخال الدرجات',
    gradeEntryEndDate: 'نهاية ادخال الدرجات',
    bulletinPublishDate: 'تاريخ نشر الكشوف',
    order: 'الترتيب',
    confirmDelete: 'هل انت متأكد من حذف هذه الفترة؟',
    update: 'تحديث',
    create: 'انشاء',
    noPeriods: 'لا توجد فترات معدة',
    noPeriodsDescription: 'انشئ اول فترة دراسية للبدء',
    published: 'منشور',
    periodRange: 'الفترة',
    gradeEntryWindow: 'ادخال الدرجات',
    bulletinPublication: 'نشر الكشوف',
    notDefined: 'غير محدد',
    periodUpdated: 'تم تحديث الفترة',
    periodAdded: 'تمت اضافة الفترة',
    saveError: 'خطأ اثناء الحفظ',
    periodDeleted: 'تم حذف الفترة',
    deleteError: 'خطأ اثناء الحذف',
  },
} as const;

const AcademicYearConfig: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { academicPeriods, addAcademicPeriod, updateAcademicPeriod, deleteAcademicPeriod } =
    useAcademics();
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
    order: 1,
  });

  const copy = useMemo(() => {
    const lang = i18n.language.startsWith('nl')
      ? 'nl'
      : i18n.language.startsWith('ar')
        ? 'ar'
        : 'fr';
    return translations[lang];
  }, [i18n.language]);

  if (user?.role !== 'director' && user?.role !== 'superadmin') {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">{copy.restrictedAccess}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAcademicPeriod(editingId, formData);
        toast.success(copy.periodUpdated);
        setEditingId(null);
      } else {
        await addAcademicPeriod(formData);
        toast.success(copy.periodAdded);
        setIsAdding(false);
      }
      resetForm();
    } catch {
      toast.error(copy.saveError);
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
      order: period.order,
    });
    setEditingId(period.id);
    setIsAdding(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(copy.confirmDelete)) {
      try {
        await deleteAcademicPeriod(id);
        toast.success(copy.periodDeleted);
      } catch {
        toast.error(copy.deleteError);
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
      order: academicPeriods.length + 1,
    });
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    resetForm();
  };

  const formatDate = (date: string) => new Date(date).toLocaleDateString(i18n.language);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">{copy.title}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">{copy.subtitle}</p>
        </div>
        {!isAdding && !editingId && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Plus size={20} />
            {copy.newPeriod}
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">
            {editingId ? copy.editPeriod : copy.newAcademicPeriod}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {copy.periodName} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={copy.periodNamePlaceholder}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {copy.academicYear} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.academicYear}
                  onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                  placeholder="2024-2025"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {copy.startDate} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-slate-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {copy.endDate} *
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
                  {copy.gradeEntryStartDate} *
                </label>
                <input
                  type="date"
                  required
                  value={formData.gradeEntryStartDate}
                  onChange={(e) =>
                    setFormData({ ...formData, gradeEntryStartDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {copy.gradeEntryEndDate} *
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
                  {copy.bulletinPublishDate}
                </label>
                <input
                  type="date"
                  value={formData.bulletinPublishDate}
                  onChange={(e) =>
                    setFormData({ ...formData, bulletinPublishDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {copy.order} *
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
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
              >
                <Save size={18} />
                {editingId ? copy.update : copy.create}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {academicPeriods.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-12 text-center">
            <Calendar size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">{copy.noPeriods}</p>
            <p className="text-gray-400 dark:text-gray-500 mt-2">{copy.noPeriodsDescription}</p>
          </div>
        ) : (
          academicPeriods.map((period) => (
            <div
              key={period.id}
              className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                      {period.name}
                    </h3>
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                      {period.academicYear}
                    </span>
                    {period.isPublished && (
                      <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm font-medium flex items-center gap-1">
                        <Check size={14} />
                        {copy.published}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{copy.periodRange}</p>
                      <p className="font-medium dark:text-white">
                        {formatDate(period.startDate)} - {formatDate(period.endDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{copy.gradeEntryWindow}</p>
                      <p className="font-medium dark:text-white">
                        {formatDate(period.gradeEntryStartDate)} -{' '}
                        {formatDate(period.gradeEntryEndDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">{copy.bulletinPublication}</p>
                      <p className="font-medium dark:text-white">
                        {period.bulletinPublishDate
                          ? formatDate(period.bulletinPublishDate)
                          : copy.notDefined}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(period)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title={t('common.edit')}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(period.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t('common.delete')}
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
