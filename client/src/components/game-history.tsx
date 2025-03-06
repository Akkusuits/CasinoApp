import { useQuery } from "@tanstack/react-query";
import { type NumericGameHistory } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

export function GameHistoryList() {
  const { data: history } = useQuery<NumericGameHistory[]>({
    queryKey: ["/api/game/history"],
  });

  if (!history?.length) return null;

  return (
    <Card className="bg-black/50 border-primary/20">
      <CardHeader>
        <CardTitle className="text-lg">Recent Games</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[200px]">
          {history.map((game) => (
            <div
              key={game.id}
              className="flex justify-between items-center py-2 border-b border-primary/10"
            >
              <div className="flex items-center gap-2">
                <span className="capitalize">{game.gameType}</span>
                <span className="text-sm text-muted-foreground">
                  {new Date(game.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span>${game.betAmount.toFixed(2)}</span>
                <span className={game.payout > game.betAmount ? "text-green-500" : "text-red-500"}>
                  {game.payout > game.betAmount ? "+" : "-"}${Math.abs(game.payout - game.betAmount).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}