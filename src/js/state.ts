export const state = {
  activeTool: null,
  files: [],
  pdfDoc: null,
  pdfPages: [],
  currentPdfUrl: null,
  watermarkImageBytes: null as ArrayBuffer | null,
  watermarkImageType: null as string | null,
  watermarkImageUrl: null as string | null,
  watermarkImageElement: null as HTMLImageElement | null,
};

// Resets the state when switching views or completing an operation.
export function resetState() {
  state.activeTool = null;
  state.files = [];
  state.pdfDoc = null;
  state.pdfPages = [];
  state.currentPdfUrl = null;
  document.getElementById('tool-content').innerHTML = '';
}
