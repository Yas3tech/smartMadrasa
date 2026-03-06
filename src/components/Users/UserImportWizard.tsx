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

interface UserImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  students: User[];
  addUser: (user: User) => Promise<unknown>;
  canImportSuperadmin: boolean;
}

const editableFields: Array<{ key: UserImportField; label: string; placeholder: string }> = [
  { key: 'name', label: 'Nom', placeholder: 'Jean Dupont' },
  { key: 'email', label: 'Email', placeholder: 'jean@school.ma' },
  { key: 'role', label: 'Role', placeholder: 'student' },
  { key: 'phone', label: 'Telephone', placeholder: '+2126...' },
  { key: 'birthDate', label: 'Date naissance', placeholder: '2010-01-01' },
  { key: 'studentEmail', label: 'Email eleve', placeholder: 'eleve@school.ma' },
];

const stepTitles = [
  '1. Import',
  '2. Revue et correction',
  '3. Import final',
];

export default function UserImportWizard({
  isOpen,
  onClose,
  users,
  students,
  addUser,
  canImportSuperadmin,
}: UserImportWizardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [pastedData, setPastedData] = useState('');
  const [sourceLabel, setSourceLabel] = useState('');
  const [rows, setRows] = useState<UserImportReviewRow[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

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
      toast.error('Aucune ligne exploitable trouvee.');
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
      toast.error("Impossible de lire ce fichier. Utilisez .xlsx ou .csv.");
    } finally {
      setIsParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePastePreview = () => {
    const parsedRows = parseUserText(pastedData);
    loadRows(parsedRows, 'Copier-coller');
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
      toast.error('Aucune ligne valide a importer.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await importValidatedUserRows(rows, users, addUser);
      if (summary.invalid > 0) {
        toast.success(`${result.count} utilisateurs importes. ${summary.invalid} ligne(s) ignoree(s).`, {
          duration: 5000,
        });
      } else {
        toast.success(`${result.count} utilisateurs importes avec succes.`);
      }
      handleClose();
    } catch {
      toast.error("L'import a echoue. Verifiez les donnees puis reessayez.");
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
              <h3 className="text-lg font-semibold text-gray-900">Importer un fichier</h3>
              <p className="text-sm text-gray-600">
                Chargez un fichier `.xlsx` ou `.csv`. Le wizard ne cree rien tout de suite: il
                ouvre d'abord une etape de revue.
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
              {isParsing ? 'Lecture du fichier...' : 'Choisir un fichier'}
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
              <h3 className="text-lg font-semibold text-gray-900">Coller des donnees</h3>
              <p className="text-sm text-gray-600">
                Collez un tableau avec en-tetes `name,email,role,phone,birthDate,studentEmail`.
              </p>
            </div>
            <textarea
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
              Previsualiser les lignes collees
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
          <p className="text-sm text-gray-500">Source</p>
          <p className="mt-1 font-semibold text-gray-900">{sourceLabel}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Lignes chargees</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{summary.total}</p>
        </Card>
        <Card className="p-4 border border-green-100 bg-green-50">
          <p className="text-sm text-green-700">Valides</p>
          <p className="mt-1 text-2xl font-bold text-green-800">{summary.valid}</p>
        </Card>
        <Card className="p-4 border border-red-100 bg-red-50">
          <p className="text-sm text-red-700">A corriger</p>
          <p className="mt-1 text-2xl font-bold text-red-800">{summary.invalid}</p>
        </Card>
      </div>

      <div className="rounded-2xl border border-gray-200">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
          Cliquez dans les cellules rouges pour corriger directement, sans revenir au fichier.
        </div>
        <div className="max-h-[48vh] overflow-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="sticky top-0 bg-white shadow-sm">
              <tr className="border-b border-gray-200">
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Ligne
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
                  Statut
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
                      {row.isValid ? 'Pret' : 'Erreur'}
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
              <h3 className="text-lg font-semibold text-gray-900">Resume avant import</h3>
              <p className="text-sm text-gray-600">
                Seules les lignes valides seront creees. Les lignes en erreur resteront dans le
                tableau pour correction ulterieure.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm text-gray-500">Lignes valides</p>
                <p className="text-3xl font-bold text-gray-900">{summary.valid}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4">
                <p className="text-sm text-red-700">Lignes exclues</p>
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
              <h3 className="text-lg font-semibold text-gray-900">Controle</h3>
              <p className="text-sm text-gray-600">
                Le wizard valide les roles, les emails, les doublons et le lien parent-eleve avant
                creation.
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
            <h2 className="text-2xl font-bold text-gray-900">Assistant d'import utilisateurs</h2>
            <p className="mt-1 text-sm text-gray-600">
              Importez, corrigez en direct, puis lancez uniquement les lignes valides.
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
            {step === 2 && `${summary.valid} valide(s) / ${summary.invalid} a corriger`}
            {step === 3 && `${summary.valid} ligne(s) seront importees`}
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={handleClose}>
              Annuler
            </Button>
            {step > 1 && (
              <Button variant="secondary" onClick={() => setStep(step - 1)}>
                Retour
              </Button>
            )}
            {step === 1 && (
              <Button variant="secondary" onClick={resetWizard}>
                Reinitialiser
              </Button>
            )}
            {step === 2 && (
              <Button variant="primary" onClick={() => setStep(3)} disabled={rows.length === 0}>
                Continuer vers l'import
              </Button>
            )}
            {step === 3 && (
              <Button
                variant="primary"
                icon={Upload}
                onClick={handleImport}
                disabled={isImporting || summary.valid === 0}
              >
                {isImporting ? 'Import en cours...' : `Importer ${summary.valid} ligne(s)`}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
