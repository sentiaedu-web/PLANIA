import React, { useState, useEffect, useRef } from "react";
import { 
  googleSignIn, 
  logout, 
  initAuth 
} from "../utils/firebase";
import { 
  listDriveFiles, 
  fetchDriveFileContent, 
  DriveFile, 
  SelectedReference 
} from "../utils/drive";
import { 
  Search, 
  LogOut, 
  RefreshCw, 
  FileText, 
  Check, 
  Trash2, 
  FolderOpen, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  BookOpen,
  UploadCloud,
  FileUp,
  Laptop,
  CheckCircle
} from "lucide-react";

interface DriveIntegrationProps {
  selectedReferences: SelectedReference[];
  setSelectedReferences: React.Dispatch<React.SetStateAction<SelectedReference[]>>;
}

export function DriveIntegration({ 
  selectedReferences, 
  setSelectedReferences 
}: DriveIntegrationProps) {
  const [activeTab, setActiveTab] = useState<"local" | "drive">("local");
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState("");
  const [localError, setLocalError] = useState("");

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setNeedsAuth(false);
        fetchFiles(accessToken, searchQuery);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Fetch files from Google Drive
  const fetchFiles = async (accessToken: string, query = "") => {
    setLoadingFiles(true);
    setError("");
    try {
      const files = await listDriveFiles(accessToken, query);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setError("Error al cargar los archivos de Google Drive. Por favor, asegúrate de haber concedido los permisos.");
    } finally {
      setLoadingFiles(false);
    }
  };

  const handleLogin = async () => {
    setIsLoggingIn(true);
    setError("");
    try {
      const result = await googleSignIn();
      if (result) {
        setToken(result.accessToken);
        setUser(result.user);
        setNeedsAuth(false);
        fetchFiles(result.accessToken, searchQuery);
      }
    } catch (err: any) {
      console.error(err);
      setError("Fallo al iniciar sesión con Google. Inténtalo de nuevo.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setToken(null);
      setNeedsAuth(true);
      setDriveFiles([]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token) {
      fetchFiles(token, searchQuery);
    }
  };

  const handleRefresh = () => {
    if (token) {
      fetchFiles(token, searchQuery);
    }
  };

  // Add a file from Google Drive to the selected references list
  const handleSelectFile = async (file: DriveFile) => {
    if (!token) return;

    // Check if already selected
    if (selectedReferences.some((ref) => ref.id === file.id)) {
      return;
    }

    const newRef: SelectedReference = {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      content: "",
      status: "loading",
    };

    setSelectedReferences((prev) => [...prev, newRef]);

    try {
      const fetched = await fetchDriveFileContent(token, file.id, file.mimeType);
      
      setSelectedReferences((prev) =>
        prev.map((r) =>
          r.id === file.id
            ? { ...r, content: fetched.content, status: "loaded" }
            : r
        )
      );
    } catch (err: any) {
      console.error(err);
      setSelectedReferences((prev) =>
        prev.map((r) =>
          r.id === file.id
            ? { ...r, status: "error", error: err.message || "Error al descargar" }
            : r
        )
      );
    }
  };

  const handleRemoveReference = (id: string) => {
    setSelectedReferences((prev) => prev.filter((ref) => ref.id !== id));
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setLocalError("");
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processLocalFiles(e.dataTransfer.files);
    }
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalError("");
    if (e.target.files && e.target.files.length > 0) {
      processLocalFiles(e.target.files);
    }
  };

  // Process selected or dropped local files
  const processLocalFiles = (files: FileList) => {
    Array.from(files).forEach((file) => {
      // Validate types
      const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
      const isTxt = file.type === "text/plain" || file.name.toLowerCase().endsWith(".txt") || file.name.toLowerCase().endsWith(".md");

      if (!isPdf && !isTxt) {
        setLocalError("Solo se admiten documentos en formato PDF (.pdf) o archivos de texto (.txt).");
        return;
      }

      // Check size (max 12 MB)
      if (file.size > 12 * 1024 * 1024) {
        setLocalError(`El archivo "${file.name}" supera el límite de 12 MB.`);
        return;
      }

      const fileId = `local-${Date.now()}-${file.name}`;
      
      // Check if already exists in reference list
      if (selectedReferences.some((r) => r.name === file.name)) {
        return;
      }

      const newRef: SelectedReference = {
        id: fileId,
        name: file.name,
        mimeType: isPdf ? "application/pdf" : "text/plain",
        content: "",
        status: "loading"
      };

      setSelectedReferences((prev) => [...prev, newRef]);

      const reader = new FileReader();

      if (isPdf) {
        reader.onload = () => {
          const result = reader.result as string;
          // Extract the base64 payload from data URL
          const base64 = result.split(",")[1];
          setSelectedReferences((prev) =>
            prev.map((r) =>
              r.id === fileId
                ? { ...r, content: base64, status: "loaded" }
                : r
            )
          );
        };
        reader.onerror = () => {
          setSelectedReferences((prev) =>
            prev.map((r) =>
              r.id === fileId
                ? { ...r, status: "error", error: "No se pudo leer el archivo local" }
                : r
            )
          );
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const text = reader.result as string;
          setSelectedReferences((prev) =>
            prev.map((r) =>
              r.id === fileId
                ? { ...r, content: text, status: "loaded" }
                : r
            )
          );
        };
        reader.onerror = () => {
          setSelectedReferences((prev) =>
            prev.map((r) =>
              r.id === fileId
                ? { ...r, status: "error", error: "No se pudo leer el archivo local" }
                : r
            )
          );
        };
        reader.readAsText(file);
      }
    });
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm w-full space-y-6" id="drive-integration-panel">
      {/* Title Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="bg-amber-500 text-slate-950 p-2 rounded-xl flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Fuentes y Normativa de Referencia (Opcional)
            </h3>
            <p className="text-[11px] text-slate-500">
              Adjunta decretos oficiales o decretos específicos como contexto para la redacción de la IA.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-slate-100">
        <button
          onClick={() => setActiveTab("local")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "local"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <FileUp className="w-4 h-4" />
          <span>Subir desde mi PC</span>
        </button>
        <button
          onClick={() => setActiveTab("drive")}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
            activeTab === "drive"
              ? "border-amber-500 text-slate-900"
              : "border-transparent text-slate-400 hover:text-slate-600"
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span>Google Drive</span>
        </button>
      </div>

      {/* Common Active Reference List (always visible on top to see what is imported) */}
      {selectedReferences.length > 0 && (
        <div className="space-y-2 bg-slate-50 rounded-xl p-4 border border-slate-150">
          <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Documentos cargados como contexto para la IA ({selectedReferences.length})</span>
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {selectedReferences.map((ref) => (
              <div
                key={ref.id}
                className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 truncate" title={ref.name}>
                      {ref.name}
                    </p>
                    <p className="text-[9px] text-slate-400 uppercase font-bold">
                      {ref.status === "loading" && (
                        <span className="text-blue-500 flex items-center gap-1">
                          <Loader2 className="w-2.5 h-2.5 animate-spin inline" />
                          Procesando...
                        </span>
                      )}
                      {ref.status === "loaded" && (
                        <span className="text-emerald-600">✓ Listo para redacción IA</span>
                      )}
                      {ref.status === "error" && (
                        <span className="text-red-500">⚠ Error de lectura</span>
                      )}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveReference(ref.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Quitar de referencias"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Local File Upload Tab Content */}
      {activeTab === "local" && (
        <div className="space-y-4">
          {localError && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{localError}</p>
            </div>
          )}

          {/* Drag & Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center space-y-3 ${
              isDragging
                ? "border-amber-500 bg-amber-500/10 text-amber-600 scale-[0.99]"
                : "border-slate-200 hover:border-amber-400 hover:bg-slate-50/50 text-slate-500"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelectChange}
              multiple
              accept=".pdf,.txt"
              className="hidden"
            />
            
            <div className={`p-4 rounded-2xl ${isDragging ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-400"} transition-all shadow-sm`}>
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-800">
                Arrastra tus documentos oficiales aquí o haz clic para buscarlos
              </p>
              <p className="text-[11px] text-slate-400 leading-normal max-w-md mx-auto">
                Formatos recomendados: <strong>PDF oficiales</strong> (ej. Decretos curriculares DOGV, Resoluciones de inicio de curso) o <strong>documentos de texto (.txt)</strong>. Máximo 12 MB por archivo.
              </p>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs font-bold text-amber-950">
                ¿Cómo funciona el contexto adjunto?
              </p>
              <p className="text-[10.5px] text-slate-700 leading-relaxed text-justify">
                Al adjuntar normativas locales (por ejemplo, el <strong>Decreto 106/2022 de Educación Primaria</strong> o el <strong>Decreto 100/2022 de Infantil</strong>), la IA de PlanIA CV (Gemini) las analizará con prioridad absoluta para justificar y estructurar tu programación anual, garantizando una trazabilidad legal perfecta con la normativa de la Generalitat Valenciana.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Google Drive Tab Content */}
      {activeTab === "drive" && (
        <div className="space-y-4">
          {error && (
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {needsAuth ? (
            <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
              <div className="max-w-md space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed text-justify">
                  Puedes conectar tu cuenta de <strong>Google Drive</strong> para buscar e importar directamente archivos de normativa o decretos en formato <strong>PDF o Texto plano (.txt)</strong>.
                </p>
                <p className="text-[11px] text-slate-400 leading-relaxed text-justify">
                  PlanIA CV procesará estas normativas de forma que tu programación anual esté totalmente coordinada.
                </p>
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoggingIn}
                className="gsi-material-button flex items-center justify-center border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 rounded-xl py-2.5 px-5 shadow-sm transition-all cursor-pointer bg-white disabled:opacity-50"
                style={{ width: "auto" }}
              >
                <div className="gsi-material-button-content-wrapper flex items-center gap-3">
                  {isLoggingIn ? (
                    <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                  ) : (
                    <div className="gsi-material-button-icon w-5 h-5">
                      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: "block" }}>
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      </svg>
                    </div>
                  )}
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    {isLoggingIn ? "Conectando..." : "Conectar Google Drive"}
                  </span>
                </div>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* User Profile Info */}
              <div className="flex items-center justify-between bg-slate-50 rounded-xl p-3 border border-slate-100">
                <div className="flex items-center gap-2.5">
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "Usuario"}
                      className="w-8 h-8 rounded-full border border-slate-200"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm uppercase">
                      {user.displayName?.charAt(0) || "U"}
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      {user.displayName || "Usuario Conectado"}
                    </p>
                    <p className="text-[10px] text-slate-500">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold border border-emerald-100 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Drive Conectado
                </div>
              </div>

              {/* Search & File Browser Area */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700">Buscar en mi Google Drive</h4>
                  <button
                    onClick={handleRefresh}
                    className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                    title="Actualizar lista"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingFiles ? "animate-spin" : ""}`} />
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar normativas, decretos, resoluciones..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-xl pl-9 pr-4 py-2 bg-slate-50 focus:bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-slate-800 font-medium"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Buscar
                  </button>
                </form>

                {loadingFiles ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center space-y-2">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">Buscando archivos en tu Drive...</span>
                  </div>
                ) : driveFiles.length === 0 ? (
                  <p className="text-xs text-slate-400 bg-slate-50 rounded-xl p-4 border border-dashed border-slate-200 text-center">
                    {searchQuery ? "No se encontraron archivos con ese término." : "Inicia una búsqueda o actualiza para ver tus documentos."}
                  </p>
                ) : (
                  <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto bg-slate-50/50">
                    {driveFiles.map((file) => {
                      const isSelected = selectedReferences.some((r) => r.id === file.id);
                      return (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2.5 hover:bg-white transition-colors text-xs"
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-3">
                            <FileText className={`w-4 h-4 shrink-0 ${file.mimeType === "application/pdf" ? "text-red-500" : "text-blue-500"}`} />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-800 truncate" title={file.name}>
                                {file.name}
                              </p>
                              <p className="text-[9px] text-slate-400 uppercase font-bold">
                                {file.mimeType.replace("application/vnd.google-apps.", "Google ").replace("application/", "").replace("vnd.openxmlformats-officedocument.wordprocessingml.document", "docx")}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleSelectFile(file)}
                            disabled={isSelected}
                            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-transparent"
                                : "bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200"
                            }`}
                          >
                            {isSelected ? (
                              <span className="flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                Seleccionado
                              </span>
                            ) : (
                              "Seleccionar"
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
