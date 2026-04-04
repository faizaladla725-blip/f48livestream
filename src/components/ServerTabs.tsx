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
      <TabsList className="bg-card/40 backdrop-blur-sm border border-border/20 w-full h-9 rounded-xl p-0.5">
        {servers.map((server) => (
          <TabsTrigger
            key={server.id}
            value={server.id}
            className="flex-1 font-heading text-[10px] rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/20 gap-1.5 h-8 transition-all"
          >
            {server.is_live && <span className="w-1.5 h-1.5 rounded-full bg-current live-pulse" />}
            {server.server_name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
