import type { DailyReportReadDto } from "../../reports/types";
import { formatLongArabicDate } from "../../substitutions/dateUtils";
import html2pdf from "html2pdf.js";

export async function downloadDailyReportPdf(
  report: DailyReportReadDto,
  schoolName: string,
  logoSrc: string,
) {
  // 1. Construct the table body mapping the absent teachers and slots
  let tbodyHtml = "";

  report.absentTeachers.forEach((teacher) => {
    const slots = teacher.freedSlots;
    const rowCount = Math.max(slots.length, 1);

    if (slots.length === 0) {
      tbodyHtml += `
        <tr>
          <td class="teacher-cell">
            <div class="teacher-name">${teacher.teacherName}</div>
            <div class="subject-text">${teacher.subjectName ?? "بلا مادة"}</div>
          </td>
          <td colspan="4" class="text-muted bg-gray">لا توجد حصص مسجلة لهذا المعلم اليوم</td>
        </tr>
      `;
      return;
    }

    slots.forEach((slot, index) => {
      tbodyHtml += `<tr>`;

      if (index === 0) {
        tbodyHtml += `
          <td rowspan="${rowCount}" class="teacher-cell">
            <div class="teacher-name">${teacher.teacherName}</div>
            <div class="subject-text">${teacher.subjectName ?? "بلا مادة"}</div>
          </td>
        `;
      }

      tbodyHtml += `<td>الحصة ${slot.periodNumber}</td>`;
      tbodyHtml += `<td>${slot.classDisplayName ?? "—"}</td>`;
      tbodyHtml += `<td class="substitute-cell">${slot.substitute ? slot.substitute.teacherName : "—"}</td>`;

      if (slot.substitute) {
        tbodyHtml += `<td class="signature-cell"></td>`;
      } else {
        tbodyHtml += `<td class="signature-cell bg-gray text-muted">غير مغطاة</td>`;
      }

      tbodyHtml += `</tr>`;
    });
  });

  // 2. Create a temporary invisible DOM element to hold the styled content
  const element = document.createElement("div");

  // We wrap the content in a div with strictly defined inline CSS for the PDF engine
  element.innerHTML = `
    <div dir="rtl" class="pdf-container">
      <style>
        /* Base Strict Reset for Perfect PDF Math */
        * { box-sizing: border-box; margin: 0; padding: 0; }
        
        .pdf-container {
          /* Assumes 'Cairo' is loaded globally in your React app's CSS */
          font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
          color: #111827;
          background: #fff;
          line-height: 1.5;
        }

        /* Header Section - Elegantly Scaled Down */
        .header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          border-bottom: 2px solid #111827; 
          padding-bottom: 12px; 
          margin-bottom: 20px; 
        }
        
        .header-info { text-align: right; width: 33%; }
        .header-info h1 { font-size: 14px; font-weight: 800; color: #111827; line-height: 1.2; }
        .header-info p { margin-top: 4px; font-size: 11px; font-weight: 600; color: #4b5563; }
        
        .header-title { text-align: center; width: 33%; }
        .header-title h2 { font-size: 16px; font-weight: 800; color: #111827; line-height: 1.2; }
        .header-title p { margin-top: 4px; font-size: 12px; font-weight: 700; color: #374151; }
        
        .header-logo { display: flex; justify-content: flex-end; align-items: center; width: 33%; }
        .header-logo img { max-height: 50px; max-width: 80px; object-fit: contain; }
        
        /* Table Styling */
        table { width: 100%; table-layout: fixed; border-collapse: collapse; margin-bottom: 25px; }
        th, td { 
          border: 1px solid #374151; 
          padding: 8px 6px; /* Tighter padding pulls text into absolute center */
          text-align: center; 
          vertical-align: middle; /* Mathematical center */
          word-wrap: break-word; 
          font-size: 12px; /* Base table font size */
          font-weight: 600;
        }
        th { 
          background-color: #f3f4f6; 
          font-weight: 800; 
          font-size: 13px; 
          color: #111827; 
          padding: 10px 6px; 
        }
        
        .teacher-cell { background-color: #f8fafc; }
        .teacher-name { font-weight: 800; font-size: 13px; color: #111827; line-height: 1.3; }
        .substitute-cell { font-weight: 700; font-size: 12px; color: #111827; }
        .subject-text { font-size: 10px; font-weight: 600; color: #6b7280; margin-top: 2px; }
        .signature-cell { height: 35px; }
        .bg-gray { background-color: #f9fafb !important; }
        .text-muted { color: #6b7280; font-size: 11px; font-weight: 700; }
        
        /* Footer Section */
        .footer { margin-top: 35px; display: flex; justify-content: space-between; font-weight: bold; }
        .footer-sig { text-align: center; width: 28%; }
        .footer-sig p { border-top: 1px solid #111827; padding-top: 8px; margin-top: 40px; font-size: 13px; color: #111827; font-weight: 800; }
      </style>

      <div class="header">
        <div class="header-info">
          <h1>${schoolName}</h1>
          <p>إدارة الشؤون الأكاديمية</p>
        </div>
        <div class="header-title">
          <h2>سجل تكليفات الاحتياط اليومي</h2>
          <p>يوم: ${formatLongArabicDate(report.date)}</p>
        </div>
        <div class="header-logo">
          ${logoSrc ? `<img src="${logoSrc}" alt="شعار المدرسة" />` : ""}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 22%">المعلم الغائب</th>
            <th style="width: 11%">الحصة</th>
            <th style="width: 17%">الفصل</th>
            <th style="width: 25%">المعلم البديل</th>
            <th style="width: 25%">التوقيع بالعلم</th>
          </tr>
        </thead>
        <tbody>
          ${tbodyHtml}
        </tbody>
      </table>

      <div class="footer">
        <div class="footer-sig"><p>توقيع المشرف الأكاديمي</p></div>
        <div class="footer-sig"></div>
      </div>
    </div>
  `;

  // 3. Define strict PDF generation options
  const opt = {
    margin: [5, 5, 5, 5] as [number, number, number, number],
    filename: `سجل_الاحتياط_${report.date}.pdf`,
    image: { type: "jpeg" as const, quality: 1.0 },
    html2canvas: {
      scale: 4,
      useCORS: true,
      letterRendering: true,
    },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  // 4. Generate and trigger download instantly
  await (html2pdf() as any).set(opt).from(element).save();
}
