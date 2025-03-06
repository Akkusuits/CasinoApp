import { useState } from "react";
import { UserBalance } from "@/components/user-balance";
import { GameHistoryList } from "@/components/game-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { rollDice, calculateDiceWin } from "@/lib/game-logic";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Dice() {
  const [bet, setBet] = useState("10");
  const [target, setTarget] = useState(50);
  const [prediction, setPrediction] = useState<'over' | 'under'>('over');
  const [rolling, setRolling] = useState(false);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const { toast } = useToast();

  const multiplier = 98 / (prediction === 'over' ? (99 - target) : target);

  const roll = async () => {
    const betAmount = parseFloat(bet);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({ title: "Error", description: "Invalid bet amount", variant: "destructive" });
      return;
    }

    setRolling(true);
    const outcome = rollDice();
    const won = calculateDiceWin(outcome, prediction, target);
    const payout = won ? betAmount * multiplier : 0;

    try {
      await apiRequest("POST", "/api/game/result", {
        gameType: "dice",
        betAmount,
        multiplier: won ? multiplier : 0,
        payout,
        userId: 1, // Will be set by backend
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game/history"] });

      setTimeout(() => {
        setLastRoll(outcome);
        setRolling(false);
      }, 1000);
    } catch (error) {
      toast({ title: "Error", description: "Insufficient balance", variant: "destructive" });
      setRolling(false);
    }
  };

  return (
    <div className="space-y-6">
      <UserBalance />

      <Card className="bg-black/50 border-primary/20">
        <CardHeader>
          <CardTitle>Dice</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-8">
            <motion.div
              className="text-6xl font-bold text-center p-8"
              animate={{ scale: rolling ? 1.2 : 1 }}
            >
              {lastRoll ?? "?"}
            </motion.div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-2">
              <Button
                variant={prediction === 'over' ? "default" : "outline"}
                onClick={() => setPrediction('over')}
                className="flex-1"
                disabled={rolling}
              >
                Over
              </Button>
              <Button
                variant={prediction === 'under' ? "default" : "outline"}
                onClick={() => setPrediction('under')}
                className="flex-1"
                disabled={rolling}
              >
                Under
              </Button>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Target: {target}</span>
                <span>Multiplier: {multiplier.toFixed(2)}x</span>
              </div>
              <Slider
                value={[target]}
                onValueChange={([value]) => setTarget(value)}
                min={1}
                max={98}
                step={1}
                disabled={rolling}
              />
            </div>

            <div className="flex gap-2">
              <Input
                type="number"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
                min="0"
                step="0.1"
                disabled={rolling}
              />
              <Button onClick={roll} disabled={rolling}>
                {rolling ? "Rolling..." : "Roll"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <GameHistoryList />
    </div>
  );
}