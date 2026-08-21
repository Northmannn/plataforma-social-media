import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useContentFolders } from "@/hooks/useContentFolders";

interface CreateFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parentId?: string | null;
}

const colorOptions = [
  { value: 'blue', label: 'Azul' },
  { value: 'purple', label: 'Roxo' },
  { value: 'red', label: 'Vermelho' },
  { value: 'indigo', label: 'Índigo' },
  { value: 'orange', label: 'Laranja' },
  { value: 'green', label: 'Verde' }
];

export const CreateFolderDialog = ({ open, onOpenChange, parentId = null }: CreateFolderDialogProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState("blue");
  const [description, setDescription] = useState("");
  const { createFolder } = useContentFolders(parentId);

  const handleSubmit = async () => {
    if (!name.trim()) return;

    await createFolder.mutateAsync({
      name: name.trim(),
      color,
      icon: 'Folder',
      parent_id: parentId,
      folder_type: 'custom',
      platform_name: null,
      description: description.trim() || null,
      order_index: 0
    });

    setName("");
    setColor("blue");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nova Pasta</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Pasta</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Marketing Digital"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Cor</Label>
            <Select value={color} onValueChange={setColor}>
              <SelectTrigger id="color">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {colorOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ 
                          background: option.value === 'blue' ? 'hsl(223, 90%, 50%)' :
                                    option.value === 'purple' ? 'hsl(283, 90%, 50%)' :
                                    option.value === 'red' ? 'hsl(3, 90%, 50%)' :
                                    option.value === 'indigo' ? 'hsl(253, 90%, 50%)' :
                                    option.value === 'orange' ? 'hsl(43, 90%, 50%)' :
                                    'hsl(123, 90%, 40%)'
                        }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o conteúdo desta pasta..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || createFolder.isPending}>
            {createFolder.isPending ? "Criando..." : "Criar Pasta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
