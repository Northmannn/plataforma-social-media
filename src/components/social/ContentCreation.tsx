import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScriptEditor } from "./ScriptEditor";
import { ScriptList } from "./ScriptList";
import { ProfileSelector } from "./ProfileSelector";
import { Card } from "@/components/ui/card";

export const ContentCreation = () => {
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <ProfileSelector value={selectedProfileId} onChange={setSelectedProfileId} />
      </Card>

      <Tabs defaultValue="roteiros" className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="roteiros">Roteiros de Vídeo</TabsTrigger>
          <TabsTrigger value="legendas">Legendas</TabsTrigger>
          <TabsTrigger value="ideias">Ideias</TabsTrigger>
        </TabsList>

        <TabsContent value="roteiros" className="space-y-6">
          <ScriptEditor type="video" profileId={selectedProfileId} />
          <ScriptList type="video" />
        </TabsContent>

        <TabsContent value="legendas" className="space-y-6">
          <ScriptEditor type="post" profileId={selectedProfileId} />
          <ScriptList type="post" />
        </TabsContent>

        <TabsContent value="ideias" className="space-y-6">
          <ScriptEditor type="idea" profileId={selectedProfileId} />
          <ScriptList type="idea" />
        </TabsContent>
      </Tabs>
    </div>
  );
};
