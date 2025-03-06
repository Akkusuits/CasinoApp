import { UserBalance } from "@/components/user-balance";
import { GameHistoryList } from "@/components/game-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Coins, Dices, TrendingUp } from "lucide-react";

export default function Home() {
  const games = [
    { href: "/slots", icon: Coins, name: "Slots", description: "Classic 3x3 slot machine with multiple winning combinations" },
    { href: "/dice", icon: Dices, name: "Dice", description: "Predict if the roll will be over or under your target" },
    { href: "/crash", icon: TrendingUp, name: "Crash", description: "Cash out before the multiplier crashes" },
  ];

  return (
    <div className="space-y-6">
      <UserBalance />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {games.map((game) => (
          <Link key={game.href} href={game.href}>
            <Card className="bg-black/50 border-primary/20 hover:bg-primary/5 transition-colors cursor-pointer h-full">
              <CardHeader>
                <game.icon className="h-8 w-8 text-primary" />
                <CardTitle>{game.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{game.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <GameHistoryList />
    </div>
  );
}