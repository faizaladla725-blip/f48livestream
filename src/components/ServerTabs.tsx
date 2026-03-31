import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  if (servers.length <= 1) return null;

  return (
    <Tabs value={activeServer} onValueChange={onServerChange}>
      <TabsList className="bg-card/50 border border-border/30 w-full h-8 rounded-xl p-0.5">
        {servers.map((server) => (
          <TabsTrigger
            key={server.id}
            value={server.id}
            className="flex-1 font-heading text-[10px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1 h-7 transition-all"
          >
            {server.is_live && <span className="w-1 h-1 rounded-full bg-current live-pulse" />}
            {server.server_name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
