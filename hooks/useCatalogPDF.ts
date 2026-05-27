'use client';

/**
 * PDF catálogo estilo feed (1 producto / página, imagen ancho completo).
 * Se guarda en IndexedDB; solo se regenera si cambia el catálogo (nuevos/editados productos).
 */

import { useState, useCallback } from 'react';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';
import {
  buildCatalogPdfFingerprint,
  idbGetCatalogPdf,
  idbSetCatalogPdf,
} from '@/lib/catalog-pdf';

const MARGIN = 12;
const FOOTER_H = 10;

type CatalogRow = {
  id: string;
  updated_at?: string;
  images?: unknown;
};

export function useCatalogPDF() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const openCatalogPdf = useCallback(
    async (
      profile: Partial<BusinessProfile>,
      products: Adiso[],
      catalogRows?: CatalogRow[]
    ) => {
      if (!profile?.id || products.length === 0) return;

      setGenerating(true);
      setProgress(2);

      try {
        const fingerprint = buildCatalogPdfFingerprint(
          profile.id,
          profile.updated_at,
          catalogRows ?? products
        );

        const cached = await idbGetCatalogPdf(profile.id, fingerprint);
        if (cached) {
          setProgress(100);
          openPdfBlob(cached, profile);
          return;
        }

        setProgress(8);
        const blob = await buildInstagramFeedPdfBlob(profile, products, (p) => {
          setProgress(8 + Math.round(p * 85));
        });

        await idbSetCatalogPdf(profile.id, fingerprint, blob);
        setProgress(100);
        openPdfBlob(blob, profile);
      } catch (error) {
        console.error('[useCatalogPDF] Error:', error);
        throw error;
      } finally {
        setGenerating(false);
        setTimeout(() => setProgress(0), 2000);
      }
    },
    []
  );

  /** @deprecated usar openCatalogPdf */
  const generatePDF = openCatalogPdf;

  return { openCatalogPdf, generatePDF, generating, progress };
}

function openPdfBlob(blob: Blob, profile: Partial<BusinessProfile>) {
  const url = URL.createObjectURL(blob);
  const slug = (profile.slug || profile.name || 'catalogo').toLowerCase().replace(/\s+/g, '-');
  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (!opened) {
    const a = document.createElement('a');
    a.href = url;
    a.download = `catalogo-${slug}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 120_000);
}

async function buildInstagramFeedPdfBlob(
  profile: Partial<BusinessProfile>,
  products: Adiso[],
  onProgress: (ratio: number) => void
): Promise<Blob> {
  const jsPDFModule = await import('jspdf');
  const jsPDF = jsPDFModule.default;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = 210;
  const pageH = 297;
  const contentW = pageW - MARGIN * 2;
  const brandRgb = hexToRgb(profile.theme_color || '#3c6997') || { r: 60, g: 105, b: 151 };

  await drawCoverPage(doc, profile, products.length, pageW, pageH, contentW, MARGIN, brandRgb);

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    doc.addPage();
    await drawProductPage(doc, product, profile, pageW, pageH, contentW, MARGIN, brandRgb, i + 1, products.length);
    onProgress((i + 1) / products.length);
  }

  return doc.output('blob') as Blob;
}

async function drawCoverPage(
  doc: any,
  profile: Partial<BusinessProfile>,
  count: number,
  pageW: number,
  pageH: number,
  contentW: number,
  margin: number,
  brandRgb: { r: number; g: number; b: number }
) {
  doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
  doc.rect(0, 0, pageW, pageH, 'F');

  let y = 40;
  if (profile.logo_url) {
    const logo = await loadImageAsBase64(profile.logo_url);
    if (logo) {
      try {
        doc.addImage(logo, getImageFormatFromDataUrl(logo), margin, 30, 40, 40, undefined, 'FAST');
        y = 78;
      } catch {
        // ignore
      }
    }
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(profile.name || 'Catálogo', margin, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  if (profile.description) {
    const lines = doc.splitTextToSize(profile.description.substring(0, 200), contentW);
    doc.text(lines.slice(0, 4), margin, y);
    y += lines.slice(0, 4).length * 5 + 4;
  }

  doc.setFontSize(9);
  if (profile.contact_phone) {
    doc.text(`Tel: ${profile.contact_phone}`, margin, y);
    y += 5;
  }
  if (profile.contact_address) {
    doc.text(`Dir: ${profile.contact_address}`, margin, y);
    y += 5;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(`${count} productos`, margin, pageH - 30);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, margin, pageH - 22);
}

async function drawProductPage(
  doc: any,
  product: Adiso,
  profile: Partial<BusinessProfile>,
  pageW: number,
  pageH: number,
  contentW: number,
  margin: number,
  brandRgb: { r: number; g: number; b: number },
  index: number,
  total: number
) {
  const imgUrl = product.imagenesUrls?.[0] || product.imagenUrl;
  let y = 14;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(profile.name || 'Catálogo', margin, 10);
  doc.text(`${index} / ${total}`, pageW - margin, 10, { align: 'right' });

  const textBlockMm = measureTextBlockMm(doc, product, contentW);
  const maxImgH = pageH - MARGIN - FOOTER_H - textBlockMm - y - 4;

  if (imgUrl) {
    const imgData = await loadImageAsBase64(imgUrl);
    if (imgData) {
      const naturalH = await naturalHeightMmForFullWidth(imgData, contentW);
      let drawH = Math.min(naturalH, Math.max(40, maxImgH));
      const drawW = contentW;
      const drawX = margin;
      let drawY = y;

      if (naturalH > drawH) {
        drawH = maxImgH;
      } else {
        drawH = naturalH;
      }

      const format = getImageFormatFromDataUrl(imgData);
      doc.addImage(imgData, format, drawX, drawY, drawW, drawH, undefined, 'FAST');
      y = drawY + drawH + 5;
    } else {
      drawNoImage(doc, margin, y, contentW, 30);
      y += 35;
    }
  } else {
    drawNoImage(doc, margin, y, contentW, 30);
    y += 35;
  }

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(product.titulo || 'Producto', contentW).slice(0, 3);
  for (const line of titleLines) {
    doc.text(line, margin, y);
    y += 5.5;
  }

  if (product.descripcion) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    const desc = (product.descripcion || '').replace('Precio:', '').trim().substring(0, 280);
    const descLines = doc.splitTextToSize(desc, contentW).slice(0, 5);
    y += 2;
    for (const line of descLines) {
      doc.text(line, margin, y);
      y += 4;
    }
  }

  if (product.precio) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
    doc.text(`S/ ${product.precio}`, margin, pageH - FOOTER_H - 4);
  }

  doc.setDrawColor(226, 232, 240);
  doc.line(margin, pageH - FOOTER_H, pageW - margin, pageH - FOOTER_H);
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Precios sujetos a cambios sin previo aviso', margin, pageH - 5);
}

function measureTextBlockMm(doc: any, product: Adiso, contentW: number): number {
  let h = 5.5 * Math.min(3, doc.splitTextToSize(product.titulo || 'Producto', contentW).length) + 4;
  if (product.descripcion) {
    const desc = (product.descripcion || '').substring(0, 280);
    h += 2 + 4 * Math.min(5, doc.splitTextToSize(desc, contentW).length);
  }
  if (product.precio) h += 10;
  return h;
}

function drawNoImage(doc: any, x: number, y: number, w: number, h: number) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x, y, w, h, 'F');
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(8);
  doc.text('Sin imagen', x + w / 2, y + h / 2, { align: 'center' });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  const proxyUrl = `/api/catalog/image-proxy?url=${encodeURIComponent(url)}`;
  try {
    const res = await fetch(proxyUrl);
    if (res.ok) {
      const blob = await res.blob();
      return blobToDataUrl(blob);
    }
  } catch {
    // fallback
  }

  try {
    const res = await fetch(url, { mode: 'cors' });
    if (res.ok) {
      const blob = await res.blob();
      return blobToDataUrl(blob);
    }
  } catch {
    // canvas
  }

  return loadImageViaCanvas(url);
}

function loadImageViaCanvas(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || 1;
        canvas.height = img.naturalHeight || 1;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function blobToDataUrl(blob: Blob): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(blob);
  });
}

function getImageFormatFromDataUrl(dataUrl: string): 'PNG' | 'JPEG' {
  const mime = dataUrl.split(';')[0].toLowerCase();
  return mime.includes('png') ? 'PNG' : 'JPEG';
}

function getImageDimensionsFromDataUrl(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width || 1, height: img.height || 1 });
    img.onerror = () => resolve({ width: 1, height: 1 });
    img.src = dataUrl;
  });
}

async function naturalHeightMmForFullWidth(dataUrl: string, innerWmm: number): Promise<number> {
  const { width, height } = await getImageDimensionsFromDataUrl(dataUrl);
  if (width <= 0 || height <= 0) return 40;
  return innerWmm * (height / width);
}
