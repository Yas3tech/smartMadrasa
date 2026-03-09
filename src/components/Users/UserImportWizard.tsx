import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Pencil, Upload, Wand2 } from 'lucide-react';
import { Badge, Button, Card, Modal } from '../UI';
import type { User } from '../../types';
import {
  getUserImportSummary,
  importValidatedUserRows,
  parseUserFile,
  parseUserText,
  type UserImportField,
  type UserImportRow,
  type UserImportReviewRow,
  validateUserImportRows,
} from '../../utils/userImport';
import { useTranslation } from 'react-i18next';

interface UserImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  students: User[];
  addUser: (user: User) => Promise<unknown>;
  canImportSuperadmin: boolean;
}

export default function UserImportWizard({
  isOpen,
  onClose,
  users,
  students,
  addUser,
  canImportSuperadmin,
}: UserImportWizardProps) {
  const { t, i18n } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [pastedData, setPastedData] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [rows, setRows] = useState<UserImportReviewRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const copy = i18n.language.startsWith('nl')
    ? {
        fields: ['Naam', 'E-mail', 'Rol', 'Telefoon', 'Geboortedatum', 'Leerling e-mail'],
        stepTitles: ['1. Import', '2. Controle en correctie', '3. Definitieve import'],
        noUsableRows: 'Geen bruikbare rijen gevonden.',
        invalidFile: 'Kan dit bestand niet lezen. Gebruik .xlsx of .csv.',
        pasteSource: 'Plakken',
        noValidRows: 'Geen geldige rijen om te importeren.',
        partialSuccess: (count: number, invalid: number) =>
          `${count} gebruikers geimporteerd. ${invalid} rij(en) genegeerd.`,
        success: (count: number) => `${count} gebruikers succesvol geimporteerd.`,
        importError: 'Import mislukt. Controleer de gegevens en probeer opnieuw.',
        importFile: 'Bestand importeren',
        importFileDesc:
          'Laad een .xlsx- of .csv-bestand. De wizard maakt nog niets aan en opent eerst een controlescherm.',
        readingFile: 'Bestand lezen...',
        chooseFile: 'Bestand kiezen',
        pasteData: 'Gegevens plakken',
        pasteDataDesc:
          'Plak een tabel met headers name,email,role,phone,birthDate,studentEmail.',
        previewPasted: 'Geplakte rijen bekijken',
        source: 'Bron',
        loadedRows: 'Geladen rijen',
        valid: 'Geldig',
        fix: 'Te corrigeren',
        reviewHint: 'Klik in rode cellen om direct te corrigeren zonder terug te gaan naar het bestand.',
        row: 'Rij',
        status: 'Status',
        ready: 'Klaar',
        summaryTitle: 'Samenvatting voor import',
        summaryDesc:
          'Alleen geldige rijen worden aangemaakt. Rijen met fouten blijven zichtbaar voor latere correctie.',
        validRows: 'Geldige rijen',
        excludedRows: 'Uitgesloten rijen',
        controlTitle: 'Controle',
        controlDesc:
          'De wizard valideert rollen, e-mails, doublures en ouder-leerling koppelingen voor het aanmaken.',
        title: 'Wizard gebruikersimport',
        subtitle: 'Importeer, corrigeer direct en start daarna alleen geldige rijen.',
        progressReview: (valid: number, invalid: number) => `${valid} geldig / ${invalid} corrigeren`,
        progressFinalize: (valid: number) => `${valid} rij(en) worden geimporteerd`,
        continueImport: 'Verder naar import',
        importing: 'Import bezig...',
        importRows: (count: number) => `${count} rij(en) importeren`,
        cancel: 'Annuleren',
        back: 'Terug',
        reset: 'Opnieuw instellen',
      }
    : i18n.language.startsWith('ar')
      ? {
          fields: ['الاسم', 'البريد', 'الدور', 'الهاتف', 'تاريخ الميلاد', 'بريد التلميذ'],
          stepTitles: ['1. استيراد', '2. مراجعة وتصحيح', '3. استيراد نهائي'],
          noUsableRows: 'لم يتم العثور على اسطر قابلة للاستعمال.',
          invalidFile: 'تعذر قراءة هذا الملف. استخدم .xlsx او .csv.',
          pasteSource: 'لصق',
          noValidRows: 'لا توجد اسطر صالحة للاستيراد.',
          partialSuccess: (count: number, invalid: number) =>
            `تم استيراد ${count} مستخدمين. تم تجاهل ${invalid} سطر(اسطر).`,
          success: (count: number) => `تم استيراد ${count} مستخدمين بنجاح.`,
          importError: 'فشل الاستيراد. تحقق من البيانات ثم اعد المحاولة.',
          importFile: 'استيراد ملف',
          importFileDesc:
            'حمّل ملف .xlsx او .csv. المعالج لا ينشئ شيئا مباشرة ويفتح اولا خطوة مراجعة.',
          readingFile: 'جار قراءة الملف...',
          chooseFile: 'اختيار ملف',
          pasteData: 'لصق بيانات',
          pasteDataDesc:
            'الصق جدولا بعناوين name,email,role,phone,birthDate,studentEmail.',
          previewPasted: 'معاينة الاسطر الملصقة',
          source: 'المصدر',
          loadedRows: 'الاسطر المحملة',
          valid: 'صالحة',
          fix: 'للتصحيح',
          reviewHint: 'انقر في الخلايا الحمراء للتصحيح مباشرة دون الرجوع الى الملف.',
          row: 'السطر',
          status: 'الحالة',
          ready: 'جاهز',
          summaryTitle: 'ملخص قبل الاستيراد',
          summaryDesc:
            'سيتم انشاء الاسطر الصالحة فقط. وستبقى الاسطر الخاطئة ظاهرة لتصحيحها لاحقا.',
          validRows: 'الاسطر الصالحة',
          excludedRows: 'الاسطر المستبعدة',
          controlTitle: 'التحقق',
          controlDesc:
            'يتحقق المعالج من الادوار والبريد والتكرار وربط الولي بالتلميذ قبل الانشاء.',
          title: 'معالج استيراد المستخدمين',
          subtitle: 'استورد وصحح مباشرة ثم شغل فقط الاسطر الصالحة.',
          progressReview: (valid: number, invalid: number) => `${valid} صالح / ${invalid} للتصحيح`,
          progressFinalize: (valid: number) => `سيتم استيراد ${valid} سطر(اسطر)`,
          continueImport: 'المتابعة الى الاستيراد',
          importing: 'جار الاستيراد...',
          importRows: (count: number) => `استيراد ${count} سطر(اسطر)`,
          cancel: 'الغاء',
          back: 'رجوع',
          reset: 'اعادة ضبط',
        }
      : {
          fields: ['Nom', 'Email', 'Role', 'Telephone', 'Date naissance', 'Email eleve'],
          stepTitles: ['1. Import', '2. Revue et correction', '3. Import final'],
          noUsableRows: 'Aucune ligne exploitable trouvee.',
          invalidFile: 'Impossible de lire ce fichier. Utilisez .xlsx ou .csv.',
          pasteSource: 'Copier-coller',
          noValidRows: 'Aucune ligne valide a importer.',
          partialSuccess: (count: number, invalid: number) =>
            `${count} utilisateurs importes. ${invalid} ligne(s) ignoree(s).`,
          success: (count: number) => `${count} utilisateurs importes avec succes.`,
          importError: "L'import a echoue. Verifiez les donnees puis reessayez.",
          importFile: 'Importer un fichier',
          importFileDesc:
            "Chargez un fichier .xlsx ou .csv. Le wizard ne cree rien tout de suite et ouvre d'abord une etape de revue.",
          readingFile: 'Lecture du fichier...',
          chooseFile: 'Choisir un fichier',
          pasteData: 'Coller des donnees',
          pasteDataDesc:
            'Collez un tableau avec en-tetes name,email,role,phone,birthDate,studentEmail.',
          previewPasted: 'Previsualiser les lignes collees',
          source: 'Source',
          loadedRows: 'Lignes chargees',
          valid: 'Valides',
          fix: 'A corriger',
          reviewHint: 'Cliquez dans les cellules rouges pour corriger directement, sans revenir au fichier.',
          row: 'Ligne',
          status: 'Statut',
          ready: 'Pret',
          summaryTitle: 'Resume avant import',
          summaryDesc:
            'Seules les lignes valides seront creees. Les lignes en erreur resteront dans le tableau pour correction ulterieure.',
          validRows: 'Lignes valides',
          excludedRows: 'Lignes exclues',
          controlTitle: 'Controle',
          controlDesc:
            'Le wizard valide les roles, les emails, les doublons et le lien parent-eleve avant creation.',
          title: "Assistant d'import utilisateurs",
          subtitle: 'Importez, corrigez en direct, puis lancez uniquement les lignes valides.',
          progressReview: (valid: number, invalid: number) => `${valid} valide(s) / ${invalid} a corriger`,
          progressFinalize: (valid: number) => `${valid} ligne(s) seront importees`,
          continueImport: "Continuer vers l'import",
          importing: 'Import en cours...',
          importRows: (count: number) => `Importer ${count} ligne(s)`,
          cancel: 'Annuler',
          back: 'Retour',
          reset: 'Reinitialiser',
        };
  const editableFields: Array<{ key: UserImportField; label: string; placeholder: string }> = [
    { key: 'name', label: copy.fields[0], placeholder: 'Jean Dupont' },
    { key: 'email', label: copy.fields[1], placeholder: 'jean@school.ma' },
    { key: 'role', label: copy.fields[2], placeholder: 'student' },
    { key: 'phone', label: copy.fields[3], placeholder: '+2126...' },
    { key: 'birthDate', label: copy.fields[4], placeholder: '2010-01-01' },
    { key: 'studentEmail', label: copy.fields[5], placeholder: 'eleve@school.ma' },
  ];
  const stepTitles = copy.stepTitles;
  const summary = useMemo(() => getUserImportSummary(rows), [rows]);

  const resetWizard = () => {
    setStep(1);
    setPastedData('');
    setSourceLabel('');
    setRows([]);
    setIsParsing(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetWizard();
    onClose();
  };

  const revalidateRows = (nextRows: UserImportReviewRow[]) => {
    setRows(
      validateUserImportRows(nextRows, {
        existingUsers: users,
        existingStudents: students,
        canImportSuperadmin,
      })
    );
  };

  const loadRows = (nextRows: UserImportRow[], source: string) => {
    const reviewedRows = validateUserImportRows(nextRows, {
      existingUsers: users,
      existingStudents: students,
      canImportSuperadmin,
    });

    if (reviewedRows.length === 0) {
      toast.error(copy.noUsableRows);
      return;
    }

    setRows(reviewedRows);
    setSourceLabel(source);
    setStep(2);
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    try {
      const parsedRows = await parseUserFile(file);
      loadRows(parsedRows, file.name);
    } catch {
      toast.error(copy.invalidFile);
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePastePreview = () => {
    const parsedRows = parseUserText(pastedData);
    loadRows(parsedRows, copy.pasteSource);
  };

  const handleCellChange = (rowNumber: number, field: UserImportField, value: string) => {
    const nextRows = rows.map((row) =>
      row.rowNumber === rowNumber
        ? {
            ...row,
            [field]: value,
          }
        : row
    );
    revalidateRows(nextRows);
  };

  const handleImport = async () => {
    const validCount = rows.filter((row) => row.isValid).length;
    if (validCount === 0) {
      toast.error(copy.noValidRows);
      return;
    }

    setIsImporting(true);
    try {
      const result = await importValidatedUserRows(rows, users, addUser);
      if (summary.invalid > 0) {
        toast.success(copy.partialSuccess(result.count, summary.invalid), {
          duration: 5000,
        });
      } else {
        toast.success(copy.success(result.count));
      }
      handleClose();
    } catch {
      toast.error(copy.importError);
    } finally {
      setIsImporting(false);
    }
  };

  const renderStepImport = () => (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6 border border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
            <Upload size={22} />
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{copy.importFile}</h3>
              <p className="text-sm text-gray-600">
                {copy.importFileDesc}
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.csv"
              onChange={handleFileSelected}
              className="hidden"
            />
            <Button
              variant="primary"
              icon={FileSpreadsheet}
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
            >
              {isParsing ? copy.readingFile : copy.chooseFile}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6 border border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
            <Pencil size={22} />
          </div>
          <div className="w-full space-y-3">
            <div>
              <h3 id="import-paste-data-title" className="text-lg font-semibold text-gray-900">{copy.pasteData}</h3>
              <p className="text-sm text-gray-600">
                {copy.pasteDataDesc}
              </p>
            </div>
            <textarea
              aria-labelledby="import-paste-data-title"
              value={pastedData}
              onChange={(event) => setPastedData(event.target.value)}
              rows={10}
              className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              placeholder={'name,email,role,phone,birthDate,studentEmail\nJean Dupont,jean@school.ma,student,,2010-01-01,'}
            />
            <Button
              variant="secondary"
              icon={Wand2}
              onClick={handlePastePreview}
              disabled={!pastedData.trim()}
            >
              {copy.previewPasted}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderStepReview = () => (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <p className="text-sm text-gray-500">{copy.source}</p>
          <p className="mt-1 font-semibold text-gray-900">{sourceLabel}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">{copy.loadedRows}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</p>
        </Card>
        <Card className="p-4 border border-green-100 bg-green-50">
          <p className="text-sm text-green-700">{copy.valid}</p>
          <p className="mt-1 text-2xl font-bold text-green-800">{summary.valid}</p>
        </Card>
        <Card className="p-4 border border-red-100 bg-red-50">
          <p className="text-sm text-red-700">{copy.fix}</p>
          <p className="mt-1 text-2xl font-bold text-red-800">{summary.invalid}</p>
        </Card>
      </div>

      <div className="rounded-2xl border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          {copy.reviewHint}
        </div>
        <div className="max-h-[48vh] overflow-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {copy.row}
                </th>
                {editableFields.map((field) => (
                  <th
                    key={field.key}
                    className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                  >
                    {field.label}
                  </th>
                ))}
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {copy.status}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.rowNumber} className="border-b border-gray-100 align-top">
                  <td className="px-3 py-3 text-sm font-medium text-gray-700">{row.rowNumber}</td>
                  {editableFields.map((field) => {
                    const hasError = Boolean(row.fieldErrors[field.key]);
                    return (
                      <td key={field.key} className="px-3 py-3">
                        <input
                          value={row[field.key] || ''}
                          onChange={(event) =>
                            handleCellChange(row.rowNumber, field.key, event.target.value)
                          }
                          className={`w-full rounded-xl border px-3 py-2 text-sm outline-none transition ${
                            hasError
                              ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-400 focus:ring-2 focus:ring-red-100'
                              : 'border-gray-200 bg-white text-gray-900 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                          }`}
                          placeholder={field.placeholder}
                        />
                        {hasError && (
                          <p className="mt-1 text-xs text-red-600">{row.fieldErrors[field.key]}</p>
                        )}
                      </td>
                    );
                  })}
                  <td className="px-3 py-3">
                    <Badge variant={row.isValid ? 'success' : 'error'}>
                      {row.isValid ? copy.ready : t('common.error')}
                    </Badge>
                    {row.generalErrors.length > 0 && (
                      <p className="mt-2 text-xs text-red-600">{row.generalErrors[0]}</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderStepFinalize = () => (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-green-100 p-3 text-green-600">
            <CheckCircle2 size={22} />
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{copy.summaryTitle}</h3>
              <p className="text-sm text-gray-600">
                {copy.summaryDesc}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">{copy.validRows}</p>
                <p className="text-3xl font-bold text-gray-900">{summary.valid}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm text-red-700">{copy.excludedRows}</p>
                <p className="text-3xl font-bold text-red-800">{summary.invalid}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
            <AlertTriangle size={22} />
          </div>
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{copy.controlTitle}</h3>
              <p className="text-sm text-gray-600">
                {copy.controlDesc}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(summary.roleCounts).map(([role, count]) => (
                <Badge key={role} variant="neutral">
                  {role}: {count}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-7xl">
      <div className="p-6">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-5">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{copy.title}</h2>
            <p className="mt-1 text-sm text-gray-600">
              {copy.subtitle}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {stepTitles.map((title, index) => {
              const currentStep = index + 1;
              const active = step === currentStep;
              const done = step > currentStep;
              return (
                <div
                  key={title}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                    active
                      ? 'bg-orange-500 text-white'
                      : done
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {title}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          {step === 1 && renderStepImport()}
          {step === 2 && renderStepReview()}
          {step === 3 && renderStepFinalize()}
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
          <div className="text-sm text-gray-500">
            {step === 2 && copy.progressReview(summary.valid, summary.invalid)}
            {step === 3 && copy.progressFinalize(summary.valid)}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleClose}>
              {copy.cancel}
            </Button>
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                {copy.back}
              </Button>
            )}
            {step === 1 && (
              <Button variant="secondary" onClick={resetWizard}>
                {copy.reset}
              </Button>
            )}
            {step === 2 && (
              <Button variant="primary" onClick={() => setStep(3)} disabled={rows.length === 0}>
                {copy.continueImport}
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="primary"
                icon={Upload}
                onClick={handleImport}
                disabled={isImporting || summary.valid === 0}
              >
                {isImporting ? copy.importing : copy.importRows(summary.valid)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
