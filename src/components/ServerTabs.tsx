import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Radio } from 'lucide-react';

interface Server {
  id: string;
  server_name: string;
  is_live: boolean;
}

interface ServerTabsProps {
  servers: Server[];
  activeServer: string;
  onServerChange: (serverId: string) => void;
}

export function ServerTabs({ servers, activeServer, onServerChange }: ServerTabsProps) {
  return (
    <Tabs value={activeServer} onValueChange={onServerChange}>
      <TabsList className="bg-card border border-border w-full h-10 rounded-xl p-1">
        {servers.map((server) => (
          <TabsTrigger
            key={server.id}
            value={server.id}
            className="flex-1 font-heading text-xs rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5 h-8 transition-all"
          >
            {server.is_live && <span className="w-1.5 h-1.5 rounded-full bg-current live-pulse" />}
            {server.server_name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
