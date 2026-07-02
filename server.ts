import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client on the server side
// The GEMINI_API_KEY is retrieved securely from environment variables
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Server-side API endpoint for PlanIA CV programming text generation
app.post("/api/gemini/generate", async (req, res) => {
  try {
    const {
      language,
      stage,
      course,
      subject,
      schoolYear,
      locality,
      summary,
      sdas,
    } = req.body;

    if (!language || !stage || !course || !subject) {
      res.status(400).json({ error: "Faltan parámetros obligatorios" });
      return;
    }

    // Map language for the prompt instruction
    const langMap: Record<string, string> = {
      es: "Castellano",
      ca: "Valencià (normativa AVL)",
      en: "English",
    };

    const targetLanguage = langMap[language] || "Castellano";

    // System instruction detailing constraints, official decrees, and guidelines
    const systemInstruction = `Eres un asesor pedagógico experto en la Comunitat Valenciana para las etapas de Educación Infantil y Educación Primaria.
Tu tarea es redactar un texto formal, profesional y justificado técnicamente para la Programación Anual de un docente, basado ÚNICAMENTE en la información proporcionada y la normativa oficial de la Comunitat Valenciana.

IDIOMA DEL TEXTO DE SALIDA: Debes escribir TODO el texto en el idioma solicitado: ${targetLanguage}.

NORMATIVA OFICIAL DE REFERENCIA (Comunitat Valenciana):
- Para Educación Infantil: Decreto 100/2022, de 29 de julio, del Consell, por el que se establece la ordenación y el currículo de Educación Infantil.
- Para Educación Primaria: Decreto 106/2022, de 5 de agosto, del Consell, por el que se establece la ordenación y el currículo de Educación Primaria, junto con su actualización establecida en el Decreto 96/2026.
- Calendario Escolar oficial de la Comunitat Valenciana para el curso ${schoolYear}.

REGLAS DE ORO SOBRE LA NORMATIVA (¡CRÍTICO!):
1. NUNCA inventes artículos de decretos, normativas o instrucciones si no estás seguro de ellos.
2. Si un dato normativo específico no se incluye en la solicitud o no figura en los decretos anteriores (por ejemplo, las Instrucciones de Organización y Funcionamiento del presente curso si aún no han sido publicadas), indícalo expresamente en el texto con una nota formal (ej. "A la espera de la publicación oficial de las Instrucciones de Organización y Funcionamiento del curso, se toma como referencia...").
3. No generes contenido normativo ficticio ni inventes números de decretos.
4. Explica con claridad y rigor la fundamentación pedagógica de la distribución.

ESTRUCTURA DEL TEXTO REQUERIDO:
El texto debe estar estructurado en secciones formales (utiliza títulos claros en Markdown):
1. Justificación Pedagógica y Curricular (relacionando el Decreto applicable: ${stage === "Infantil" ? "Decreto 100/2022" : "Decreto 106/2022 y Decreto 96/2026"} con la materia/área "${subject}" para el curso "${course}").
2. Adaptación al Calendario Escolar y Realidad Organizativa (explicando cómo influyen la localidad "${locality}", los días festivos locales, excursiones y eventos en el cálculo de sesiones reales disponibles: ${summary.availableSessions} sesiones reales de un total teórico de ${summary.theoreticalSessions} sesiones).
3. Distribución y Temporalización de las Situaciones de Aprendizaje (analizando el equilibrio trimestral y justificando la distribución temporal de las ${sdas.length} Situaciones de Aprendizaje propuestas por el docente).
4. Conclusión sobre la Flexibilidad del Instrumento de Planificación.

Tono: Altamente formal, administrativo, técnico, pedagógico e impecable.`;

    const prompt = `Por favor, redacta el texto formal de la Programación Anual en base a los siguientes datos reales proporcionados por el docente:

DATOS CURRICULARES:
- Etapa: ${stage}
- Curso: ${course}
- Área/Materia: ${subject}
- Curso Escolar: ${schoolYear}
- Localidad: ${locality || "No especificada"}

CALCULO DE SESIONES:
- Sesiones Teóricas: ${summary.theoreticalSessions}
- Sesiones Perdidas/Descontadas: ${summary.lostSessions}
- Sesiones Lectivas Reales Disponibles: ${summary.availableSessions}
- Distribución Trimestral de Sesiones Disponibles:
  * Primer Trimestre: ${summary.trimesterSessions.t1} sesiones disponibles
  * Segundo Trimestre: ${summary.trimesterSessions.t2} sesiones disponibles
  * Tercer Trimestre: ${summary.trimesterSessions.t3} sesiones disponibles

SITUACIONES DE APRENDIZAJE INTRODUCIDAS POR EL DOCENTE (con sus sesiones asignadas y distribución trimestral):
${sdas
  .map(
    (sda: any, idx: number) =>
      `- SdA ${idx + 1}: "${sda.name}" - ${sda.sessions} sesiones (Asignada en: ${
        sda.trimester === 1
          ? "Primer Trimestre"
          : sda.trimester === 2
            ? "Segundo Trimestre"
            : "Tercer Trimestre"
      })`
  )
  .join("\n")}

Por favor, analiza la coherencia, justifica la organización de estas SdAs y genera el documento formal de programación anual.`;

    const references = req.body.references || [];
    const contents: any[] = [];

    // Add references to contents if they exist
    if (references.length > 0) {
      contents.push({
        role: "user",
        parts: [
          { text: "A continuación se adjuntan los documentos oficiales de normativa o planificación de referencia que debes considerar obligatoriamente. Analízalos con detalle:" }
        ]
      });

      for (const ref of references) {
        if (ref.mimeType === "application/pdf") {
          contents.push({
            role: "user",
            parts: [
              { text: `Documento oficial de referencia (PDF): "${ref.name}"` },
              {
                inlineData: {
                  data: ref.content, // Base64 encoded PDF
                  mimeType: "application/pdf"
                }
              }
            ]
          });
        } else {
          contents.push({
            role: "user",
            parts: [
              { text: `Documento oficial de referencia: "${ref.name}"\n\nContenido de referencia:\n${ref.content}` }
            ]
          });
        }
      }

      contents.push({
        role: "user",
        parts: [
          { text: "Usa la información de las normativas de referencia anteriores para fundamentar y enriquecer la programación anual. A continuación tienes los datos curriculares introducidos por el docente para redactar el documento final." }
        ]
      });
    }

    // Main prompt part
    contents.push({
      role: "user",
      parts: [
        { text: prompt }
      ]
    });

    // Calling Gemini 3.5 Flash for the text generation task
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const resultText = response.text || "No se pudo generar el texto de la programación anual.";
    res.json({ text: resultText });
  } catch (error: any) {
    console.error("Error calling Gemini API:", error);
    res.status(500).json({
      error: "Ocurrió un error al procesar la solicitud con Inteligencia Artificial.",
      details: error.message,
    });
  }
});

// Configure Vite or serve built files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[PlanIA CV Backend] Server running on http://localhost:${PORT}`);
  });
}

startServer();
