import React, { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Upload, FileJson, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { importSystemData, validateImportJson, type ImportResult } from "@/utils/importSystem";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

const ImportJsonDialog: React.FC<Props> = ({ open, onOpenChange, onComplete }) => {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<"upload" | "preview" | "importing" | "done">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [parsedData, setParsedData] = useState<any>(null);
  const [validationError, setValidationError] = useState<string>("");
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setStep("upload");
    setFileName("");
    setParsedData(null);
    setValidationError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const validation = await validateImportJson(text);
    if (!validation.ok) {
      setValidationError(validation.error || "JSON inválido");
      setStep("preview");
      return;
    }
    setValidationError("");
    setParsedData(validation.data);
    setStep("preview");
  };

  const handleImport = async () => {
    if (!user || !parsedData) return;
    setStep("importing");
    try {
      const r = await importSystemData(parsedData, user.id);
      setResult(r);
      setStep("done");
      onComplete?.();
      toast({
        description: `Importação concluída: ${r.criadas} criadas, ${r.duplicadas} duplicadas, ${r.ignoradas} ignoradas`,
      });
    } catch (err: any) {
      toast({ description: err.message || "Erro ao importar", variant: "destructive" });
      setStep("preview");
    }
  };

  const toolsCount = Array.isArray(parsedData?.tools) ? parsedData.tools.length : 0;
  const meta = parsedData?.meta || {};

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto border-border" style={{ background: "hsl(220 20% 9%)" }}>
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            <FileJson className="h-5 w-5" /> Importar JSON
          </DialogTitle>
        </DialogHeader>

        {step === "upload" && (
          <div className="py-8 flex flex-col items-center gap-4">
            <p className="text-sm text-muted-foreground text-center">
              Selecione um arquivo .json gerado pela exportação do sistema.
              <br />
              <span className="text-xs">Todos os campos, formatação, listas e credenciais serão preservados.</span>
            </p>
            <label
              className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-medium cursor-pointer transition-all hover:bg-accent"
              style={{ background: "hsl(0 0% 100% / 0.06)", border: "1px solid hsl(0 0% 100% / 0.10)", color: "hsl(0 0% 85%)" }}
            >
              <Upload className="h-4 w-4" /> Escolher arquivo JSON
              <input ref={inputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
            </label>
          </div>
        )}

        {step === "preview" && (
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileJson className="h-4 w-4" /> {fileName}
            </div>
            {validationError ? (
              <div className="rounded-lg p-4 flex items-start gap-2" style={{ background: "hsl(0 72% 55% / 0.1)", border: "1px solid hsl(0 72% 55% / 0.3)" }}>
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-destructive">JSON inválido</p>
                  <p className="text-xs text-muted-foreground mt-1">{validationError}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-4 space-y-2" style={{ background: "hsl(0 0% 100% / 0.04)", border: "1px solid hsl(0 0% 100% / 0.08)" }}>
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <p className="text-sm font-medium">JSON validado com sucesso</p>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 pl-6">
                  <p>Ferramentas: <span className="text-foreground font-medium">{toolsCount}</span></p>
                  {meta.version && <p>Versão do formato: <span className="text-foreground">{meta.version}</span></p>}
                  {meta.exportedAt && <p>Exportado em: <span className="text-foreground">{new Date(meta.exportedAt).toLocaleString("pt-BR")}</span></p>}
                </div>
              </div>
            )}
          </div>
        )}

        {step === "importing" && (
          <div className="py-12 flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Importando {toolsCount} ferramenta(s)...</p>
          </div>
        )}

        {step === "done" && result && (
          <div className="py-4 space-y-3">
            <div className="text-center space-y-1">
              <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
              <p className="text-base font-semibold text-foreground">Importação concluída</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg p-3" style={{ background: "hsl(142 70% 50% / 0.1)" }}>
                <p className="text-2xl font-bold text-emerald-400">{result.criadas}</p>
                <p className="text-xs text-muted-foreground">criadas</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "hsl(45 90% 50% / 0.1)" }}>
                <p className="text-2xl font-bold text-amber-400">{result.duplicadas}</p>
                <p className="text-xs text-muted-foreground">duplicadas</p>
              </div>
              <div className="rounded-lg p-3" style={{ background: "hsl(0 72% 55% / 0.1)" }}>
                <p className="text-2xl font-bold text-destructive">{result.ignoradas}</p>
                <p className="text-xs text-muted-foreground">ignoradas</p>
              </div>
            </div>
            {(result.erros.length > 0 || result.avisos.length > 0) && (
              <div className="rounded-lg p-3 max-h-40 overflow-y-auto space-y-1 text-xs" style={{ background: "hsl(0 0% 100% / 0.04)" }}>
                {result.erros.map((e, i) => <p key={`e${i}`} className="text-destructive">⚠ {e}</p>)}
                {result.avisos.map((w, i) => <p key={`w${i}`} className="text-muted-foreground">ℹ {w}</p>)}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "preview" && !validationError && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={handleClose} className="flex-1">Cancelar</Button>
              <Button onClick={handleImport} className="flex-1">Confirmar importação</Button>
            </div>
          )}
          {step === "preview" && validationError && (
            <div className="flex gap-2 w-full">
              <Button variant="outline" onClick={reset} className="flex-1">Escolher outro</Button>
              <Button variant="outline" onClick={handleClose} className="flex-1">Fechar</Button>
            </div>
          )}
          {step === "done" && (
            <Button onClick={handleClose} className="w-full">Fechar</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportJsonDialog;
