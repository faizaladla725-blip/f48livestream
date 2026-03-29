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
  return (
    <Tabs value={activeServer} onValueChange={onServerChange}>
      <TabsList className="bg-muted w-full">
        {servers.map((server) => (
          <TabsTrigger
            key={server.id}
            value={server.id}
            className="flex-1 font-heading text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-1.5"
          >
            {server.is_live && <span className="w-1.5 h-1.5 rounded-full bg-live live-pulse" />}
            {server.server_name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
