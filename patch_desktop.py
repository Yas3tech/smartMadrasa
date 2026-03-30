import re

with open('src/components/Schedule/ScheduleDesktop.tsx', 'r') as f:
    content = f.read()

# 1. ChevronLeft button
content = content.replace(
    '<Button\n                        variant="secondary"\n                        icon={ChevronLeft}\n                        onClick={() => schedule.setWeekOffset(schedule.weekOffset - 1)}\n                        className="px-3"\n                    />',
    '<Button\n                        variant="secondary"\n                        icon={ChevronLeft}\n                        onClick={() => schedule.setWeekOffset(schedule.weekOffset - 1)}\n                        className="px-3"\n                        aria-label={t(\'common.previous\')}\n                    />'
)

# 2. ChevronRight button
content = content.replace(
    '<Button\n                        variant="secondary"\n                        icon={ChevronRight}\n                        onClick={() => schedule.setWeekOffset(schedule.weekOffset + 1)}\n                        className="px-3"\n                    />',
    '<Button\n                        variant="secondary"\n                        icon={ChevronRight}\n                        onClick={() => schedule.setWeekOffset(schedule.weekOffset + 1)}\n                        className="px-3"\n                        aria-label={t(\'common.next\')}\n                    />'
)

# 3. Trash2 button
content = content.replace(
    '<button\n                                                                        className="absolute -top-1 -right-1 p-1 bg-white dark:bg-slate-700 rounded-full shadow opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"\n                                                                        onClick={(e) => schedule.showDeleteMenu(e, ci.course.id, dateStr)}\n                                                                    >',
    '<button\n                                                                        className="absolute -top-1 -right-1 p-1 bg-white dark:bg-slate-700 rounded-full shadow opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-500"\n                                                                        onClick={(e) => schedule.showDeleteMenu(e, ci.course.id, dateStr)}\n                                                                        aria-label={t(\'common.delete\')}\n                                                                    >'
)

with open('src/components/Schedule/ScheduleDesktop.tsx', 'w') as f:
    f.write(content)
