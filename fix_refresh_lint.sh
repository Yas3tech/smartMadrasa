for file in src/context/DataContext.tsx src/context/slices/AcademicContext.tsx src/context/slices/CommunicationContext.tsx src/context/slices/PerformanceContext.tsx; do
  sed -i 's/export const useData/\/\/ eslint-disable-next-line react-refresh\/only-export-components\nexport const useData/g' $file
  sed -i 's/export const useUsers/\/\/ eslint-disable-next-line react-refresh\/only-export-components\nexport const useUsers/g' $file
  sed -i 's/export const useAcademics/\/\/ eslint-disable-next-line react-refresh\/only-export-components\nexport const useAcademics/g' $file
  sed -i 's/export const useCommunication/\/\/ eslint-disable-next-line react-refresh\/only-export-components\nexport const useCommunication/g' $file
  sed -i 's/export const usePerformance/\/\/ eslint-disable-next-line react-refresh\/only-export-components\nexport const usePerformance/g' $file
done
