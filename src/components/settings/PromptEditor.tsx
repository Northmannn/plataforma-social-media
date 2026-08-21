import { useState } from "react";
import { PromptDefinition } from "@/hooks/usePromptTemplates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, RotateCcw, Save, X, Edit3, ChevronDown, ChevronUp, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface PromptEditorProps {
  definition: PromptDefinition;
  currentValue: string;
  isCustomized: boolean;
  isSaving: boolean;
  onSave: (key: string, value: string) => void;
  onRestore: (key: string) => void;
}

export const PromptEditor = ({
  definition,
  currentValue,
  isCustomized,
  isSaving,
  onSave,
  onRestore,
}: PromptEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(currentValue);
  const [showVariables, setShowVariables] = useState(false);

  const handleSave = () => {
    onSave(definition.key, editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(currentValue);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditValue(currentValue);
    setIsEditing(true);
  };

  return (
    <div className="rounded-xl border border-border/50 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-foreground">{definition.name}</h3>
            <Badge
              variant={isCustomized ? "default" : "secondary"}
              className="text-[10px] px-1.5 py-0"
            >
              {isCustomized ? "Customizado" : "Default"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{definition.description}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {isCustomized && !isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRestore(definition.key)}
              className="text-xs h-7 px-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw size={12} className="mr-1" />
              Restaurar
            </Button>
          )}
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={handleEdit} className="text-xs h-7 px-2">
              <Edit3 size={12} className="mr-1" />
              Editar
            </Button>
          )}
        </div>
      </div>

      {isEditing && (
        <div className="mt-3 space-y-3">
          {definition.variables.length > 0 && (
            <div>
              <button
                onClick={() => setShowVariables(!showVariables)}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Code size={12} />
                Variáveis disponíveis
                {showVariables ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
              {showVariables && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {definition.variables.map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        const textarea = document.getElementById(`prompt-${definition.key}`) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const newValue = editValue.slice(0, start) + v + editValue.slice(end);
                          setEditValue(newValue);
                        }
                      }}
                      className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[11px] font-mono hover:bg-primary/20 transition-colors"
                    >
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <Textarea
            id={`prompt-${definition.key}`}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="min-h-[200px] bg-white/[0.05] border-border/30 font-mono text-xs leading-relaxed"
          />
          <div className="flex items-center gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={handleCancel} className="text-xs h-7">
              <X size={12} className="mr-1" />
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="text-xs h-7">
              <Save size={12} className="mr-1" />
              Salvar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
