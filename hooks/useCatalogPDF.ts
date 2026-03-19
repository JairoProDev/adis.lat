'use client';

/**
 * 📄 useCatalogPDF - Genera un PDF profesional del catálogo de productos
 *
 * Estrategia: Genera el PDF directamente con jsPDF dibujando los datos,
 * sin depender de html2canvas (más rápido y mejor para catálogos grandes).
 * Soporta múltiples páginas, imágenes, logo y toda la info del negocio.
 */

import { useState, useCall3back } from 'react';
import { BusinessProfile } from '@/types/business';
import { Adiso } from '@/types';

interface PDFOptions {
  includeImages?: boolean;
  includeDescription?: boolean;
  productsPerPage?: number; // default: 12 (grid 3x4)
  orientation?: 'portrait' | 'landscape';
}

export function useCatalogPDF() {
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generatePDF = useCallback(async (
    profile: Partial<BusinessProfile>,
    products: Adiso[],
    options: PDFOptions = {}
  ) => {
    const {
      includeImages = true,
      includeDescription = true,
      productsPerPage = 12,
      orientation = 'portrait',
    } = options;

    setGenerating(true);
    setProgress(5);

    try {
      // Dynamic import to avoid SSR issues
      const jsPDFModule = await import('jspdf');
      const jsPDF = jsPDFModule.default;

      setProgress(10);

      const doc = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4',
      });

      const pageW = orientation === 'portrait' ? 210 : 297;
      const pageH = orientation === 'portrait' ? 297 : 210;
      const margin = 14;
      const contentW = pageW - margin * 2;

      // ─── Colores del negocio ─────────────────────────────────────
      const brandHex = profile.theme_color || '#3c6997';
      const brandRgb = hexToRgb(brandHex) || { r: 60, g: 105, b: 151 };

      // ─── PORTADA ─────────────────────────────────────────────────
      // Fondo header
      doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
      doc.rect(0, 0, pageW, 55, 'F');

      // Logo del negocio (si existe)
      let logoLoaded = false;
      if (profile.logo_url && includeImages) {
        try {
          const logoData = await loadImageAsBase64(profile.logo_url);
          if (logoData) {
            doc.addImage(logoData, 'JPEG', margin, 8, 35, 35, undefined, 'FAST');
            logoLoaded = true;
          }
        } catch (e) {
          // Logo failed to load, skip
        }
      }

      const nameX = logoLoaded ? margin + 40 : margin;

      // Nombre del negocio
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text(profile.name || 'Catálogo', nameX, 24);

      // Descripción corta
      if (profile.description) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const descLines = doc.splitTextToSize(profile.description.substring(0, 120), contentW - (logoLoaded ? 40 : 0));
        doc.text(descLines.slice(0, 2), nameX, 33);
      }

      // Contacto en el header
      let contactY = 43;
      doc.setFontSize(8);
      if (profile.contact_phone) {
        doc.text(`📞 ${profile.contact_phone}`, nameX, contactY);
        contactY += 5;
      }
      if (profile.contact_address) {
        doc.text(`📍 ${profile.contact_address}`, nameX, contactY);
      }

      // Etiqueta CATÁLOGO (derecha)
      doc.setFillColor(255, 255, 255, 0.2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CATÁLOGO DE PRODUCTOS', pageW - margin, 18, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(220, 230, 255);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, pageW - margin, 25, { align: 'right' });
      doc.text(`${products.length} productos`, pageW - margin, 31, { align: 'right' });

      setProgress(20);

      // ─── GRID DE PRODUCTOS ───────────────────────────────────────
      const cols = orientation === 'landscape' ? 4 : 3;
      const cardW = (contentW - (cols - 1) * 4) / cols;
      const imgH = includeImages ? 35 : 0;
      const textH = includeDescription ? 28 : 18;
      const cardH = imgH + textH + 4;
      const rowsPerPage = Math.floor((pageH - 70) / (cardH + 5));
      const prodsPerPage = cols * rowsPerPage;

      let currentY = 65;
      let productIndex = 0;
      let pageNum = 1;

      const totalPages = Math.ceil(products.length / prodsPerPage);

      for (let i = 0; i < products.length; i++) {
        const product = products[i];

        // Calcular posición en la rejilla
        const posInPage = productIndex % prodsPerPage;
        const col = posInPage % cols;
        const row = Math.floor(posInPage / cols);

        // ¿Nueva página?
        if (posInPage === 0 && productIndex > 0) {
          // Footer de página
          drawPageFooter(doc, pageNum, totalPages, pageW, pageH, profile.name || '');
          doc.addPage();
          pageNum++;
          currentY = 20;

          // Mini header en páginas subsiguientes
          doc.setFillColor(brandRgb.r, brandRgb.g, brandRgb.b);
          doc.rect(0, 0, pageW, 14, 'F');
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(profile.name || 'Catálogo', margin, 9);
          doc.text('CATÁLOGO', pageW - margin, 9, { align: 'right' });
        }

        const cardX = margin + col * (cardW + 4);
        const cardY = currentY + row * (cardH + 5);

        // Fondo de tarjeta
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'FD');

        let innerY = cardY + 2;

        // Imagen del producto
        if (includeImages) {
          const imgUrl = product.imagenesUrls?.[0] || product.imagenUrl;
          if (imgUrl) {
            try {
              const imgData = await loadImageAsBase64(imgUrl);
              if (imgData) {
                doc.addImage(imgData, 'JPEG', cardX + 1, innerY, cardW - 2, imgH - 1, undefined, 'FAST');
              } else {
                drawNoImagePlaceholder(doc, cardX, innerY, cardW, imgH - 1);
              }
            } catch (e) {
              drawNoImagePlaceholder(doc, cardX, innerY, cardW, imgH - 1);
            }
          } else {
            drawNoImagePlaceholder(doc, cardX, innerY, cardW, imgH - 1);
          }
          innerY += imgH;
        }

        // Nombre del producto
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        const titleLines = doc.splitTextToSize(product.titulo, cardW - 3);
        doc.text(titleLines.slice(0, 2), cardX + 1.5, innerY + 4);
        innerY += titleLines.slice(0, 2).length * 3.5 + 2;

        // Descripción (opcional)
        if (includeDescription && product.descripcion) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(5.5);
          doc.setTextColor(100, 116, 139);
          const desc = product.descripcion.replace('Precio:', '').trim().substring(0, 80);
          const descLines = doc.splitTextToSize(desc, cardW - 3);
          doc.text(descLines.slice(0, 2), cardX + 1.5, innerY + 1);
          innerY += Math.min(descLines.length, 2) * 3 + 1;
        }

        // Precio
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        if (product.precio) {
          doc.setTextColor(brandRgb.r, brandRgb.g, brandRgb.b);
          doc.text(`S/ ${product.precio}`, cardX + 1.5, cardY + cardH - 3);
        } else {
          doc.setTextColor(148, 163, 184);
          doc.text('Consultar', cardX + 1.5, cardY + cardH - 3);
        }

        // Categoría (badge derecha)
        if (product.categoria) {
          doc.setFontSize(5);
          doc.setTextColor(100, 116, 139);
          doc.text(product.categoria.toUpperCase(), cardX + cardW - 1.5, cardY + cardH - 3, { align: 'right' });
        }

        productIndex++;

        // Update progress
        setProgress(20 + Math.round((i / products.length) * 70));
      }

      // Footer última página
      drawPageFooter(doc, pageNum, totalPages, pageW, pageH, profile.name || '');

      setProgress(95);

      // Guardar PDF
      const filename = `catalogo-${(profile.slug || profile.name || 'negocio').toLowerCase().replace(/\s+/g, '-')}-${new Date().toLocaleDateString('es-PE').replace(/\//g,'-')}.pdf`;
      doc.save(filename);

      setProgress(100);
      setTimeout(() => setProgress(0), 2000);

    } catch (error) {
      console.error('[useCatalogPDF] Error generando PDF:', error);
      throw error;
    } finally {
      setGenerating(false);
    }
  }, []);

  return { generatePDF, generating, progress };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

async function loadImageAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, { mode: 'cors' });
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

function drawNoImagePlaceholder(doc: any, x: number, y: number, w: number, h: number) {
  doc.setFillColor(241, 245, 249);
  doc.rect(x + 1, y, w - 2, h, 'F');
  doc.setTextColor(203, 213, 225);
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.text('SIN FOTO', x + w / 2, y + h / 2 + 1, { align: 'center' });
}

function drawPageFooter(doc: any, pageNum: number, totalPages: number, pageW: number, pageH: number, businessName: string) {
  doc.setDrawColor(226, 232, 240);
  doc.line(14, pageH - 10, pageW - 14, pageH - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(148, 163, 184);
  doc.text(`${businessName} • Precios sujetos a cambios sin previo aviso`, 14, pageH - 6);
  doc.text(`Pág. ${pageNum} / ${totalPages}`, pageW - 14, pageH - 6, { align: 'right' });
}
