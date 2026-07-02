export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  size?: string;
}

export interface SelectedReference {
  id: string;
  name: string;
  mimeType: string;
  // Content can be plain text or a base64 string for PDF
  content: string;
  status: "loading" | "loaded" | "error";
  error?: string;
}

/**
 * Lists files from Google Drive matching query parameters.
 */
export async function listDriveFiles(accessToken: string, queryText = ""): Promise<DriveFile[]> {
  // Query to filter for text, pdf, docx, or google docs
  let q = "(mimeType = 'application/vnd.google-apps.document' or " +
          "mimeType = 'text/plain' or " +
          "mimeType = 'application/pdf' or " +
          "mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')";
  
  if (queryText.trim()) {
    // Escaping single quotes
    const escapedText = queryText.replace(/'/g, "\\'");
    q += ` and name contains '${escapedText}'`;
  }

  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,modifiedTime,size)&pageSize=35`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "Error al listar archivos de Google Drive");
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Downloads a file from Google Drive and returns its content.
 * For Google Docs, exports to plain text.
 * For PDF, downloads as blob and returns a base64 string.
 * For Text, downloads and returns the plain text.
 */
export async function fetchDriveFileContent(
  accessToken: string,
  fileId: string,
  mimeType: string
): Promise<{ content: string; mimeType: string }> {
  let url = "";
  let isGoogleDoc = false;
  let isPdf = mimeType === "application/pdf";

  if (mimeType === "application/vnd.google-apps.document") {
    // Google Docs must be exported
    url = `https://www.googleapis.com/drive/v3/files/${fileId}/export?mimeType=text/plain`;
    isGoogleDoc = true;
  } else {
    // Other files are downloaded with alt=media
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  }

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData?.error?.message || "Error al descargar el archivo de Google Drive");
  }

  if (isPdf) {
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return {
      content: base64,
      mimeType: "application/pdf",
    };
  } else if (isGoogleDoc) {
    const text = await response.text();
    return {
      content: text,
      mimeType: "text/plain",
    };
  } else {
    // Plain text or docx (if plain text can fetch as text, docx is tricky so we treat as plain text or fallback)
    if (mimeType.startsWith("text/")) {
      const text = await response.text();
      return {
        content: text,
        mimeType: "text/plain",
      };
    } else {
      // Fallback: try to read as text
      const text = await response.text();
      return {
        content: text,
        mimeType: "text/plain",
      };
    }
  }
}

/**
 * Helper to convert a blob to base64 string
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Extract base64 part from Data URL (e.g., "data:application/pdf;base64,JVBERi...")
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
