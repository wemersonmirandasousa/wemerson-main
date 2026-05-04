import { ToolExportData } from "@/types/tool";
import { normalizeToolData } from "./tool-normalizer";
import { validateToolExportCompleteness } from "./tool-validation";

export function buildToolExportData(toolState: Partial<ToolExportData>): ToolExportData {
  console.log('[ToolExport:input]', toolState);
  
  const normalizedData = normalizeToolData(toolState);
  console.log('[ToolExport:normalized]', normalizedData);
  
  const isValid = validateToolExportCompleteness(normalizedData);
  if (!isValid) {
    console.warn('[ToolExport:validation] Data might be incomplete, but proceeding with export');
  } else {
    console.log('[ToolExport:validated]', normalizedData);
  }
  
  return normalizedData;
}
