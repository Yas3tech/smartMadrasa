import re

with open('src/components/Schedule/ScheduleMobile.tsx', 'r') as f:
    content = f.read()

# 1. CalendarIcon button
content = content.replace(
    '<button\n            className="text-white/80 hover:text-white p-2"\n            onClick={() => schedule.setShowUpcomingModal(true)}\n          >',
    '<button\n            className="text-white/80 hover:text-white p-2"\n            onClick={() => schedule.setShowUpcomingModal(true)}\n            aria-label={t(\'schedule.upcoming\')}\n          >'
)

# 2. ChevronLeft button
content = content.replace(
    '<button\n          onClick={schedule.handlePrevDay}\n          className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600"\n        >',
    '<button\n          onClick={schedule.handlePrevDay}\n          className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600"\n          aria-label={t(\'common.previous\')}\n        >'
)

# 3. ChevronRight button
content = content.replace(
    '<button\n          onClick={schedule.handleNextDay}\n          className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600"\n        >',
    '<button\n          onClick={schedule.handleNextDay}\n          className="p-3 bg-white dark:bg-slate-800 shadow-sm rounded-full text-gray-600 dark:text-slate-300 hover:text-orange-600"\n          aria-label={t(\'common.next\')}\n        >'
)

# 4. Trash2 button
content = content.replace(
    '<button\n                            className="absolute right-2 top-2 p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"\n                            onClick={(e) =>\n                              schedule.showDeleteMenu(\n                                e,\n                                course.id,\n                                schedule.mobileDate.toISOString().split(\'T\')[0]\n                              )\n                            }\n                          >',
    '<button\n                            className="absolute right-2 top-2 p-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"\n                            onClick={(e) =>\n                              schedule.showDeleteMenu(\n                                e,\n                                course.id,\n                                schedule.mobileDate.toISOString().split(\'T\')[0]\n                              )\n                            }\n                            aria-label={t(\'common.delete\')}\n                          >'
)

# 5. Plus FAB button
content = content.replace(
    '<button\n            onClick={() => schedule.setIsFabOpen(!schedule.isFabOpen)}\n            className={`w-14 h-14 ${schedule.isFabOpen ? \'bg-gray-800\' : \'bg-orange-600\'} text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90`}\n          >',
    '<button\n            onClick={() => schedule.setIsFabOpen(!schedule.isFabOpen)}\n            className={`w-14 h-14 ${schedule.isFabOpen ? \'bg-gray-800\' : \'bg-orange-600\'} text-white rounded-full shadow-lg flex items-center justify-center hover:opacity-90`}\n            aria-label={schedule.isFabOpen ? t(\'common.close\') : t(\'common.add\')}\n          >'
)

with open('src/components/Schedule/ScheduleMobile.tsx', 'w') as f:
    f.write(content)
