import { SchoolSetup, SessionCalculation, SdA } from "../types";

// Helper to trigger file download in the browser
function downloadFile(content: string, mimeType: string, filename: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// DOCX (HTML MSWord format) Generator
export function exportToWord(
  setup: SchoolSetup,
  calc: SessionCalculation,
  sdas: SdA[],
  observations: string,
  justificationText: string
) {
  const dateStr = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const langTitle = setup.language === "es" ? "Castellano" : setup.language === "ca" ? "Valencià" : "English";

  const trimesterColors = {
    1: "#F97316", // Amber/Orange
    2: "#06B6D4", // Cyan
    3: "#10B981", // Emerald
  };

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Programación Anual - PlanIA CV</title>
      <style>
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          color: #333333;
          line-height: 1.6;
        }
        @page {
          size: A4;
          margin: 2.5cm;
        }
        .cover-page {
          text-align: center;
          padding-top: 5cm;
          page-break-after: always;
        }
        .cover-title {
          font-size: 28pt;
          font-weight: bold;
          color: #1A365D;
          margin-bottom: 0.5cm;
        }
        .cover-subtitle {
          font-size: 16pt;
          color: #4A5568;
          margin-bottom: 2cm;
        }
        .cover-details {
          font-size: 12pt;
          color: #718096;
          margin-top: 5cm;
          border-top: 1px solid #E2E8F0;
          padding-top: 1cm;
        }
        .section-title {
          font-size: 18pt;
          font-weight: bold;
          color: #1A365D;
          border-bottom: 2px solid #2B6CB0;
          padding-bottom: 0.2cm;
          margin-top: 1.5cm;
          margin-bottom: 0.5cm;
          page-break-after: avoid;
        }
        .subsection-title {
          font-size: 14pt;
          font-weight: bold;
          color: #2D3748;
          margin-top: 0.8cm;
          margin-bottom: 0.4cm;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 0.8cm;
        }
        th, td {
          border: 1px solid #CBD5E0;
          padding: 8pt;
          text-align: left;
          font-size: 10.5pt;
        }
        th {
          background-color: #EDF2F7;
          color: #2D3748;
          font-weight: bold;
        }
        .badge {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
          color: #FFFFFF;
          font-size: 9pt;
        }
        .footer-note {
          margin-top: 3cm;
          border-top: 1px solid #E2E8F0;
          padding-top: 0.5cm;
          font-size: 9pt;
          color: #A0AEC0;
          text-align: center;
        }
        .text-box {
          background-color: #F7FAFC;
          border-left: 4px solid #4299E1;
          padding: 12pt;
          font-style: italic;
          margin-bottom: 0.8cm;
        }
      </style>
    </head>
    <body>
      <!-- PORTADA -->
      <div class="cover-page">
        <div class="cover-title">PlanIA CV</div>
        <div class="cover-subtitle">Propuesta de Programación y Temporalización Anual</div>
        <div style="font-size: 14pt; margin-bottom: 1cm;"><strong>Área / Materia:</strong> ${setup.subject}</div>
        <div style="font-size: 12pt; margin-bottom: 0.3cm;"><strong>Etapa:</strong> ${setup.stage} | <strong>Curso:</strong> ${setup.course}</div>
        <div style="font-size: 12pt; margin-bottom: 0.3cm;"><strong>Curso Escolar:</strong> ${setup.schoolYear}</div>
        <div style="font-size: 12pt; margin-bottom: 0.3cm;"><strong>Localidad:</strong> ${setup.locality}</div>
        <div style="font-size: 12pt;"><strong>Idioma de Salida:</strong> ${langTitle}</div>

        <div class="cover-details">
          Fecha de generación: ${dateStr}<br>
          Generado con el soporte pedagógico de PlanIA CV
        </div>
      </div>

      <!-- RESUMEN DE SESIONES -->
      <div class="section-title">1. Resumen Ejecutivo de Sesiones</div>
      <table>
        <thead>
          <tr>
            <th>Concepto de Cálculo</th>
            <th>Número de Sesiones</th>
            <th>Descripción</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Sesiones Teóricas</strong></td>
            <td>${calc.theoreticalSessions}</td>
            <td>Días lectivos teóricos del calendario de la Comunitat Valenciana multiplicados por el horario semanal.</td>
          </tr>
          <tr>
            <td><strong>Sesiones Descontadas/Perdidas</strong></td>
            <td>${calc.lostSessions}</td>
            <td>Incidencias del calendario: festivos autónomos/nacionales, festivos locales, puentes, excursiones y eventos especiales.</td>
          </tr>
          <tr style="background-color: #EBF8FF;">
            <td><strong>Sesiones Disponibles Reales</strong></td>
            <td><strong>${calc.availableSessions}</strong></td>
            <td><strong>Sesiones lectivas reales utilizables para la planificación del curso.</strong></td>
          </tr>
        </tbody>
      </table>

      <!-- DISTRIBUCIÓN TRIMESTRAL -->
      <div class="section-title">2. Distribución Trimestral de Sesiones Reales</div>
      <table>
        <thead>
          <tr>
            <th>Trimestre</th>
            <th>Sesiones Disponibles</th>
            <th>% del Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><span class="badge" style="background-color: ${trimesterColors[1]};">Primer Trimestre</span></td>
            <td>${calc.trimesterSessions.t1}</td>
            <td>${Math.round((calc.trimesterSessions.t1 / (calc.availableSessions || 1)) * 100)}%</td>
          </tr>
          <tr>
            <td><span class="badge" style="background-color: ${trimesterColors[2]};">Segundo Trimestre</span></td>
            <td>${calc.trimesterSessions.t2}</td>
            <td>${Math.round((calc.trimesterSessions.t2 / (calc.availableSessions || 1)) * 100)}%</td>
          </tr>
          <tr>
            <td><span class="badge" style="background-color: ${trimesterColors[3]};">Tercer Trimestre</span></td>
            <td>${calc.trimesterSessions.t3}</td>
            <td>${Math.round((calc.trimesterSessions.t3 / (calc.availableSessions || 1)) * 100)}%</td>
          </tr>
        </tbody>
      </table>

      <!-- TEMPORALIZACIÓN DE SITUACIONES DE APRENDIZAJE -->
      <div class="section-title">3. Temporalización de Situaciones de Aprendizaje (SdA)</div>
      <p>A continuación se detallan las Situaciones de Aprendizaje introducidas y distribuidas por el docente para el curso:</p>
      <table>
        <thead>
          <tr>
            <th>Orden</th>
            <th>Título de la Situación de Aprendizaje (SdA)</th>
            <th>Sesiones Asignadas</th>
            <th>Trimestre de Aplicación</th>
            <th>% Horario del Curso</th>
          </tr>
        </thead>
        <tbody>
          ${
            sdas.length === 0
              ? `<tr><td colspan="5" style="text-align: center; color: #718096;">No se han registrado Situaciones de Aprendizaje.</td></tr>`
              : sdas
                  .map(
                    (sda, index) => `
              <tr>
                <td>${index + 1}</td>
                <td><strong>${sda.name}</strong></td>
                <td>${sda.sessions} sesiones</td>
                <td><span class="badge" style="background-color: ${trimesterColors[sda.trimester]};">${
                      sda.trimester === 1 ? "1er Trimestre" : sda.trimester === 2 ? "2do Trimestre" : "3er Trimestre"
                    }</span></td>
                <td>${Math.round((sda.sessions / (calc.availableSessions || 1)) * 100)}%</td>
              </tr>
            `
                  )
                  .join("")
          }
        </tbody>
      </table>

      <!-- JUSTIFICACIÓN PEDAGÓGICA GENERADA CON IA -->
      ${
        justificationText
          ? `
        <div class="section-title">4. Justificación Pedagógica para la Programación Anual</div>
        <div style="font-size: 11pt; text-align: justify; white-space: pre-wrap;">
          ${justificationText}
        </div>
      `
          : ""
      }

      <!-- OBSERVACIONES -->
      <div class="section-title">5. Observaciones Organizativas Adicionales</div>
      <div class="text-box">
        ${observations ? observations.replace(/\n/g, "<br>") : "Sin observaciones adicionales registradas."}
      </div>

      <!-- TRAZABILIDAD NORMATIVA -->
      <div class="section-title">6. Trazabilidad Normativa Oficial</div>
      <p>Esta planificación y temporalización ha sido elaborada de estricta conformidad con la normativa reguladora de la Comunitat Valenciana vigente:</p>
      <ul>
        ${
          setup.stage === "Infantil"
            ? "<li><strong>Decreto 100/2022, de 29 de julio</strong>, del Consell, por el que se establece la ordenación y el currículo de Educación Infantil de la Comunitat Valenciana.</li>"
            : "<li><strong>Decreto 106/2022, de 5 de agosto</strong>, del Consell, por el que se establece la ordenación y el currículo de Educación Primaria en la Comunitat Valenciana.</li>"
        }
        ${
          setup.stage === "Primaria"
            ? "<li><strong>Decreto 96/2026</strong>, por el que se actualiza el currículo de Educación Primaria en la Comunitat Valenciana.</li>"
            : ""
        }
        <li><strong>Calendario Escolar Oficial 2026-2027</strong> de la Conselleria de Educación, Universidades y Empleo de la Generalitat Valenciana.</li>
        <li>Instrucciones de Organización y Funcionamiento (IOF) del curso escolar aplicable (en ausencia de la publicación oficial de las IOF específicas, se declaran vigentes los marcos generales normativos precedentes).</li>
      </ul>

      <!-- AUTORÍA Y MARCA DE AGUA -->
      <div class="footer-note">
        <p><strong>PlanIA CV</strong> - Asistente Pedagógico Inteligente</p>
        <p>Creado por David Martínez López</p>
        <p>Maestro de Educación Primaria. Especialista en Inteligencia Artificial aplicada a la Educación.</p>
        <p><em>Proyecto Sentia: Sentir, enseñar, transformar.</em></p>
      </div>
    </body>
    </html>
  `;

  downloadFile(htmlContent, "application/msword;charset=utf-8", `Programacion_${setup.subject.replace(/\s+/g, "_")}.doc`);
}

// XLSX (XML Spreadsheet 2003 format) Multi-sheet Generator
export function exportToExcel(
  setup: SchoolSetup,
  calc: SessionCalculation,
  sdas: SdA[],
  observations: string
) {
  const trimesterNames = {
    1: "Primer Trimestre",
    2: "Segundo Trimestre",
    3: "Tercer Trimestre",
  };

  const cleanXml = (val: string) =>
    val
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&apos;");

  // Build XML spreadsheet string
  let xml = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>PlanIA CV - David Martínez López</Author>
  <Title>Planificación Docente Comunitat Valenciana</Title>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="HeaderStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="12" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#1F4E78" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="TitleStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="16" ss:Bold="1" ss:Color="#1F4E78"/>
   <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="LabelStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#333333"/>
   <Interior ss:Color="#F2F2F2" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="ValueStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="T1Style">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#7A3B00" ss:Bold="1"/>
   <Interior ss:Color="#FDF2E9" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="T2Style">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#005B66" ss:Bold="1"/>
   <Interior ss:Color="#E0F7FA" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="T3Style">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#065F46" ss:Bold="1"/>
   <Interior ss:Color="#D1FAE5" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
  <Style ss:ID="HighlightStyle">
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Bold="1" ss:Color="#1e3a8a"/>
   <Interior ss:Color="#EFF6FF" ss:Pattern="Solid"/>
   <Borders>
    <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1"/>
    <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1"/>
   </Borders>
  </Style>
 </Styles>
`;

  // SHEET 1: Resumen
  xml += `
 <Worksheet ss:Name="Resumen">
  <Table ss:ExpandedColumnCount="3" ss:ExpandedRowCount="12" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="180"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="250"/>
   <Row ss:Height="30">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">PLANIA CV - RESUMEN EJECUTIVO</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Dato Curricular</Data></Cell>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Valor Seleccionado</Data></Cell>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Marco Normativo Aplicado</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Etapa Educativa</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${setup.stage}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${
      setup.stage === "Infantil" ? "Decreto 100/2022" : "Decreto 106/2022 y Decreto 96/2026"
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Curso / Nivel</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${cleanXml(setup.course)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Ordenación de Etapa</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Área / Materia</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${cleanXml(setup.subject)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Distribución Horaria</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Curso Escolar</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${cleanXml(setup.schoolYear)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Calendario Escolar Oficial Comunitat Valenciana</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Localidad</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${cleanXml(setup.locality)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Festivos Locales y Especificidades de Centro</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Concepto Temporal</Data></Cell>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Sesiones</Data></Cell>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Observación Organizativa</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Sesiones Teóricas</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${calc.theoreticalSessions}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Calculadas según calendario completo de curso.</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Sesiones Descontadas (Pérdidas)</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${calc.lostSessions}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Descontado por incidencias locales y actividades escolares.</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="HighlightStyle"><Data ss:Type="String">Sesiones Disponibles Reales</Data></Cell>
    <Cell ss:StyleID="HighlightStyle"><Data ss:Type="Number">${calc.availableSessions}</Data></Cell>
    <Cell ss:StyleID="HighlightStyle"><Data ss:Type="String">Sesiones reales disponibles para impartir contenido.</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

  // SHEET 2: Calendario (Incidents & Lost sessions list)
  xml += `
 <Worksheet ss:Name="Calendario">
  <Table ss:ExpandedColumnCount="5" ss:ExpandedRowCount="${calc.lostSessionsList.length + 4}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="100"/>
   <Column ss:AutoFitWidth="0" ss:Width="250"/>
   <Column ss:AutoFitWidth="0" ss:Width="130"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="100"/>
   <Row ss:Height="30">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">CALENDARIO DE INCIDENCIAS Y SESIONES DESCONTADAS</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Fecha</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Incidencia / Descripción</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Tipo de Evento</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Trimestre</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Sesiones Perdidas</Data></Cell>
   </Row>
   ${
     calc.lostSessionsList.length === 0
       ? `
   <Row>
    <Cell ss:MergeAcross="4" ss:StyleID="ValueStyle" class="text-center"><Data ss:Type="String">No hay incidencias que afecten al horario lectivo en los días seleccionados.</Data></Cell>
   </Row>
   `
       : calc.lostSessionsList
           .map((l) => {
             const styleId = l.trimester === 1 ? "T1Style" : l.trimester === 2 ? "T2Style" : "T3Style";
             return `
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${l.date}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${cleanXml(l.name)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${cleanXml(l.type.toUpperCase())}</Data></Cell>
    <Cell ss:StyleID="${styleId}"><Data ss:Type="String">${trimesterNames[l.trimester]}</Data></Cell>
    <Cell ss:StyleID="ValueStyle" ss:Formula="=1"><Data ss:Type="Number">1</Data></Cell>
   </Row>`;
           })
           .join("")
   }
  </Table>
 </Worksheet>
`;

  // SHEET 3: Temporalización (SdAs list)
  xml += `
 <Worksheet ss:Name="Temporalización">
  <Table ss:ExpandedColumnCount="5" ss:ExpandedRowCount="${sdas.length + 4}" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="50"/>
   <Column ss:AutoFitWidth="0" ss:Width="250"/>
   <Column ss:AutoFitWidth="0" ss:Width="110"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="120"/>
   <Row ss:Height="30">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">TEMPORALIZACIÓN DE SITUACIONES DE APRENDIZAJE (SdA)</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Orden</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Título de la SdA (Introducido por docente)</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Sesiones Asignadas</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Trimestre Asignado</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">% Horario del Curso</Data></Cell>
   </Row>
   ${
     sdas.length === 0
       ? `
   <Row>
    <Cell ss:MergeAcross="4" ss:StyleID="ValueStyle"><Data ss:Type="String">No se han registrado Situaciones de Aprendizaje.</Data></Cell>
   </Row>
   `
       : sdas
           .map((sda, idx) => {
             const styleId = sda.trimester === 1 ? "T1Style" : sda.trimester === 2 ? "T2Style" : "T3Style";
             return `
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${idx + 1}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${cleanXml(sda.name)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${sda.sessions}</Data></Cell>
    <Cell ss:StyleID="${styleId}"><Data ss:Type="String">${trimesterNames[sda.trimester]}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${Math.round(
      (sda.sessions / (calc.availableSessions || 1)) * 100
    )}%</Data></Cell>
   </Row>`;
           })
           .join("")
   }
  </Table>
 </Worksheet>
`;

  // SHEET 4: Distribución trimestral
  xml += `
 <Worksheet ss:Name="Distribución trimestral">
  <Table ss:ExpandedColumnCount="4" ss:ExpandedRowCount="7" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="150"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="140"/>
   <Column ss:AutoFitWidth="0" ss:Width="120"/>
   <Row ss:Height="30">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">DISTRIBUCIÓN DE SESIONES POR TRIMESTRES</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Trimestre</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Sesiones Disponibles</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Sesiones Planificadas SdA</Data></Cell>
    <Cell ss:StyleID="HeaderStyle"><Data ss:Type="String">Desviación / Saldo</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="T1Style"><Data ss:Type="String">Primer Trimestre</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${calc.trimesterSessions.t1}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${sdas
      .filter((s) => s.trimester === 1)
      .reduce((sum, s) => sum + s.sessions, 0)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${
      calc.trimesterSessions.t1 - sdas.filter((s) => s.trimester === 1).reduce((sum, s) => sum + s.sessions, 0)
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="T2Style"><Data ss:Type="String">Segundo Trimestre</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${calc.trimesterSessions.t2}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${sdas
      .filter((s) => s.trimester === 2)
      .reduce((sum, s) => sum + s.sessions, 0)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${
      calc.trimesterSessions.t2 - sdas.filter((s) => s.trimester === 2).reduce((sum, s) => sum + s.sessions, 0)
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="T3Style"><Data ss:Type="String">Tercer Trimestre</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${calc.trimesterSessions.t3}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${sdas
      .filter((s) => s.trimester === 3)
      .reduce((sum, s) => sum + s.sessions, 0)}</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="Number">${
      calc.trimesterSessions.t3 - sdas.filter((s) => s.trimester === 3).reduce((sum, s) => sum + s.sessions, 0)
    }</Data></Cell>
   </Row>
   <Row ss:Height="22">
    <Cell ss:StyleID="HighlightStyle"><Data ss:Type="String">TOTAL CURSO</Data></Cell>
    <Cell ss:StyleID="HighlightStyle"><Data ss:Type="Number">${calc.availableSessions}</Data></Cell>
    <Cell ss:StyleID="HighlightStyle"><Data ss:Type="Number">${sdas.reduce((sum, s) => sum + s.sessions, 0)}</Data></Cell>
    <Cell ss:StyleID="HighlightStyle"><Data ss:Type="Number">${
      calc.availableSessions - sdas.reduce((sum, s) => sum + s.sessions, 0)
    }</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

  // SHEET 5: Observaciones
  xml += `
 <Worksheet ss:Name="Observaciones">
  <Table ss:ExpandedColumnCount="2" ss:ExpandedRowCount="10" x:FullColumns="1" x:FullRows="1" ss:DefaultRowHeight="20">
   <Column ss:AutoFitWidth="0" ss:Width="160"/>
   <Column ss:AutoFitWidth="0" ss:Width="450"/>
   <Row ss:Height="30">
    <Cell ss:StyleID="TitleStyle"><Data ss:Type="String">OBSERVACIONES Y CRITERIOS ADICIONALES</Data></Cell>
   </Row>
   <Row/>
   <Row ss:Height="22">
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Sección / Tipo</Data></Cell>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Detalle de Observación / Trazabilidad</Data></Cell>
   </Row>
   <Row ss:Height="40">
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Observaciones del Docente</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${
      observations ? cleanXml(observations) : "Sin observaciones específicas."
    }</Data></Cell>
   </Row>
   <Row ss:Height="40">
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Trazabilidad Normativa</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">${
      setup.stage === "Infantil"
        ? "Regulado por el Decreto 100/2022 (Infantil de la Comunitat Valenciana)."
        : "Regulado por el Decreto 106/2022 y Decreto 96/2026 (Primaria de la Comunitat Valenciana)."
    }</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Curso de Referencia</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Curso escolar ${setup.schoolYear}. Calendario Oficial CV.</Data></Cell>
   </Row>
   <Row/>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Autoría del Sistema</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Generado con PlanIA CV</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Creador</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">David Martínez López — Maestro de Educación Primaria y Especialista en IA aplicada a la Educación.</Data></Cell>
   </Row>
   <Row>
    <Cell ss:StyleID="LabelStyle"><Data ss:Type="String">Proyecto</Data></Cell>
    <Cell ss:StyleID="ValueStyle"><Data ss:Type="String">Sentia: Sentir, enseñar, transformar</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
</Workbook>
`;

  downloadFile(
    xml,
    "application/vnd.ms-excel;charset=utf-8",
    `Planificacion_${setup.subject.replace(/\s+/g, "_")}.xls`
  );
}
