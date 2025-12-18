import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Users, ChevronDown } from 'lucide-react';
import type { Parent } from '../../types';

interface Student {
  id: string;
  name: string;
  classId: string;
  className?: string;
}

interface StudentSelectorProps {
  onSelect: (student: Student) => void;
  selectedStudentId?: string;
}

const StudentSelector = ({ onSelect, selectedStudentId }: StudentSelectorProps) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  // Safety check: ensure user is parent
  if (!user || user.role !== 'parent') return null;

  const parent = user as Parent;
  const children = parent.children || [];

  // Auto-select first child if none selected
  useEffect(() => {
    if (children.length > 0 && !selectedStudentId) {
      onSelect(children[0]);
    }
  }, [children, selectedStudentId, onSelect]);

  if (children.length === 0) return null;

  // If only one child, maybe just show their name or nothing?
  // Showing name is good for context.
  const selectedChild = children.find((c) => c.id === selectedStudentId) || children[0];

  return (
    <div className="relative mb-6">
      <div
        className="flex items-center gap-2 bg-white dark:bg-slate-800 p-3 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm cursor-pointer hover:border-orange-200 transition-colors"
        onClick={() => children.length > 1 && setIsOpen(!isOpen)}
      >
        <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400">
          <Users size={20} />
        </div>
        <div className="flex-1">
          <p className="text-xs text-gray-500 dark:text-slate-400 font-medium uppercase tracking-wider">
            {t('common.student')}
          </p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{selectedChild?.name}</p>
        </div>
        {children.length > 1 && (
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </div>

      {isOpen && children.length > 1 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-xl z-50 overflow-hidden animation-slide-down">
          {children.map((child) => (
            <div
              key={child.id}
              className={`p-3 hover:bg-orange-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors ${
                child.id === selectedStudentId ? 'bg-orange-50 dark:bg-slate-700/50' : ''
              }`}
              onClick={() => {
                onSelect(child);
                setIsOpen(false);
              }}
            >
              <p className="font-medium text-gray-900 dark:text-white">{child.name}</p>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {child.className || 'Class Unknown'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentSelector;
