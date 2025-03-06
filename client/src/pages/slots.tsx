import { useState } from "react";
import { UserBalance } from "@/components/user-balance";
import { GameHistoryList } from "@/components/game-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { generateSlotOutcome, calculateSlotPayout } from "@/lib/game-logic";
import { motion } from "framer-motion";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function Slots() {
  const [bet, setBet] = useState("10");
  const [grid, setGrid] = useState<string[][]>([]);
  const [spinning, setSpinning] = useState(false);
  const { toast } = useToast();

  const spin = async () => {
    const betAmount = parseFloat(bet);
    if (isNaN(betAmount) || betAmount <= 0) {
      toast({ title: "Error", description: "Invalid bet amount", variant: "destructive" });
      return;
    }

    setSpinning(true);
    const outcome = generateSlotOutcome();
    const payout = calculateSlotPayout(outcome, betAmount);

    try {
      await apiRequest("POST", "/api/game/result", {
        gameType: "slots",
        betAmount,
        multiplier: payout / betAmount,
        payout,
        userId: 1, // Will be set by backend
      });

      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game/history"] });

      setTimeout(() => {
        setGrid(outcome);
        setSpinning(false);
      }, 1000);
    } catch (error) {
      toast({ title: "Error", description: "Insufficient balance", variant: "destructive" });
      setSpinning(false);
    }
  };

  return (
    <div className="space-y-6">
      <UserBalance />

      <Card className="bg-black/50 border-primary/20">
        <CardHeader>
          <CardTitle>Slots</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {grid.length > 0 ? (
              grid.map((row, i) =>
                row.map((symbol, j) => (
                  <motion.div
                    key={`${i}-${j}`}
                    className="aspect-square flex items-center justify-center text-4xl bg-primary/10 rounded-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: (i * 3 + j) * 0.1 }}
                  >
                    {symbol}
                  </motion.div>
                ))
              )
            ) : (
              Array(9).fill(null).map((_, i) => (
                <div
                  key={i}
                  className="aspect-square flex items-center justify-center text-4xl bg-primary/10 rounded-lg"
                >
                  ?
                </div>
              ))
            )}
          </div>

          <div className="flex gap-2">
            <Input
              type="number"
              value={bet}
              onChange={(e) => setBet(e.target.value)}
              min="0"
              step="0.1"
              disabled={spinning}
            />
            <Button onClick={spin} disabled={spinning}>
              {spinning ? "Spinning..." : "Spin"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <GameHistoryList />
    </div>
  );
}