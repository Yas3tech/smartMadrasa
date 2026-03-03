/**
 * Subject color mapping for schedule display.
 * Maps subject names to Tailwind CSS classes for background, text, and border.
 * Can be extended here when new subjects are added.
 */
export const SUBJECT_COLORS: Record<string, string> = {
    Mathématiques: 'bg-blue-500 text-white border-blue-600',
    Français: 'bg-purple-500 text-white border-purple-600',
    Arabe: 'bg-green-500 text-white border-green-600',
    Sciences: 'bg-orange-500 text-white border-orange-600',
    Histoire: 'bg-yellow-500 text-yellow-900 border-yellow-600',
    Sport: 'bg-red-500 text-white border-red-600',
    Arts: 'bg-pink-500 text-white border-pink-600',
    Religion: 'bg-teal-500 text-white border-teal-600',
    Informatique: 'bg-indigo-400 text-indigo-900 border-indigo-500',
    Coran: 'bg-emerald-500 text-white border-emerald-600',
    Sira: 'bg-lime-500 text-lime-900 border-lime-600',
    Fiqh: 'bg-sky-500 text-white border-sky-600',
    Pause: 'bg-gray-400 text-gray-900 border-gray-500',
    Déjeuner: 'bg-gray-400 text-gray-900 border-gray-500',
    Bibliothèque: 'bg-amber-500 text-amber-900 border-amber-600',
    Activités: 'bg-cyan-500 text-white border-cyan-600',
};

/** Default color for subjects not in the map */
export const DEFAULT_SUBJECT_COLOR = 'bg-gray-500 text-white border-gray-600';
