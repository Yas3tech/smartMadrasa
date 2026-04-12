#!/bin/bash
echo "Testing ScheduleDesktop.tsx:"
grep -n "Trash2" src/components/Schedule/ScheduleDesktop.tsx -C 2

echo -e "\nTesting ScheduleMobile.tsx:"
grep -n "Trash2" src/components/Schedule/ScheduleMobile.tsx -C 2
