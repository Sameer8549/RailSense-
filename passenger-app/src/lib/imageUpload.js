function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Unable to read image."));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to process image."));
    image.src = dataUrl;
  });
}

// Keep camera uploads fast enough for cellular networks and Catalyst payload storage.
export async function imageFileToUploadDataUrl(file, { maxDimension = 1280, quality = 0.76 } = {}) {
  if (!file?.type?.startsWith("image/")) throw new Error("Please choose an image file.");

  const source = await readAsDataUrl(file);
  const image = await loadImage(source);
  const largestSide = Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height);
  const scale = largestSide > maxDimension ? maxDimension / largestSide : 1;
  const width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
  const height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image processing is unavailable in this browser.");
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function ticketFileToUploadDataUrl(file) {
  const isPdf = file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
  if (!isPdf) return imageFileToUploadDataUrl(file, { maxDimension: 1440, quality: 0.84 });

  // Load PDF.js only for ticket PDFs so the normal camera flow remains lightweight.
  const pdfjs = await import(/* @vite-ignore */ "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
  const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const page = await document.getPage(1);
  const baseViewport = page.getViewport({ scale: 1 });
  const scale = Math.min(2, 1440 / Math.max(baseViewport.width, baseViewport.height));
  const viewport = page.getViewport({ scale: Math.max(scale, 1) });
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(viewport.width);
  canvas.height = Math.round(viewport.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PDF rendering is unavailable in this browser.");
  await page.render({ canvasContext: context, viewport }).promise;
  return canvas.toDataURL("image/jpeg", 0.84);
}
