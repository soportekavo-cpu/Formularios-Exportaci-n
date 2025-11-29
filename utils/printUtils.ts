
import React from 'react';
import { renderToString } from 'react-dom/server';
import type { CompanyInfo } from './companyData';

export const printComponent = (
  component: React.ReactElement, 
  title: string, 
  options: { saveOnly?: boolean, orientation?: 'portrait' | 'landscape', showFooter?: boolean, companyInfo?: CompanyInfo } = {}
) => {
  const { saveOnly = false, orientation = 'portrait', showFooter = true, companyInfo } = options;
  const componentHtml = renderToString(component);

  // Abrimos una ventana temporal para ejecutar el script de html2pdf.
  // Esta ventana se cerrará después de iniciar la descarga o se convertirá en el visor de PDF.
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Por favor, habilita las ventanas emergentes para esta acción.');
    return;
  }

  const scriptContent = `
    document.addEventListener('DOMContentLoaded', function() {
        // Un pequeño retraso para asegurar que Tailwind se inicialice completamente
        setTimeout(() => {
            const element = document.getElementById('element-to-print');
            const company = ${JSON.stringify(companyInfo)};

            // Tighter margins for better single-page fit (Top, Right, Bottom, Left in mm)
            const pdfOptions = {
                margin: ${showFooter ? '[10, 10, 20, 10]' : '[5, 10, 5, 10]'}, 
                filename: '${title}.pdf',
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, letterRendering: true },
                jsPDF: { unit: 'mm', format: 'letter', orientation: '${orientation}' },
                pagebreak: { mode: ['css', 'legacy'] }
            };
            
            let pdfPromise = html2pdf().from(element).set(pdfOptions);
            
            if (${showFooter} && company) {
                 pdfPromise = pdfPromise.toPdf().get('pdf').then(function(pdf) {
                    const totalPages = pdf.internal.getNumberOfPages();
                    const addressLine1 = company.fullAddress;
                    const addressLine2 = 'PBX: ' + company.phone + ' - e-mail: ' + company.email;

                    for (let i = 1; i <= totalPages; i++) {
                        pdf.setPage(i);
                        pdf.setFontSize(8);
                        pdf.setTextColor(100);
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();

                        // Dibujar la línea naranja
                        pdf.setDrawColor(249, 115, 22); // Un color naranja similar a la imagen (Tailwind orange-500)
                        pdf.setLineWidth(0.5);
                        pdf.line(15, pageHeight - 20, pageWidth - 15, pageHeight - 20); // Dibuja la línea horizontal

                        // Agregar el texto del pie de página
                        pdf.text(addressLine1, pageWidth / 2, pageHeight - 15, { align: 'center' });
                        pdf.text(addressLine2, pageWidth / 2, pageHeight - 11, { align: 'center' });
                    }
                    return pdf;
                });
            }


            if (${saveOnly}) {
                // Inicia la descarga y cierra la ventana temporal.
                pdfPromise.save().then(() => {
                    setTimeout(() => window.close(), 500);
                }).catch(err => {
                    console.error('Error al guardar el PDF:', err);
                    window.alert('Hubo un error al guardar el PDF.');
                    window.close();
                });
            } else {
                // Genera una URL de tipo blob y navega la nueva pestaña a esa URL,
                // convirtiéndola en un visor de PDF sin activar el diálogo de impresión del navegador.
                 pdfPromise.output('bloburl').then((blobUrl) => {
                    window.location.href = blobUrl;
                }).catch(err => {
                    console.error('Error al generar el PDF:', err);
                    window.alert('Hubo un error al generar el PDF.');
                    window.close();
                });
            }
        }, 100);
    });
  `;

  printWindow.document.write(`
    <html>
      <head>
        <title>Generando PDF...</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {
                fontFamily: {
                  sans: ['Inter', 'sans-serif'],
                  serif: ['Georgia', 'serif'],
                },
              }
            }
          }
        </script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css">
        <style>
          body { font-family: 'Inter', sans-serif; }
        </style>
      </head>
      <body>
        <div id="element-to-print">${componentHtml}</div>
        <script>${scriptContent}</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
