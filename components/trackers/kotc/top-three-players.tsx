import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy } from "lucide-react";

type Player = {
  name: string;
  pra: number;
};

type TopThreePlayersProps = {
  players: Player[];
  title: string;
};

export function TopThreePlayers({ players, title }: TopThreePlayersProps) {
  const badges = [
    { color: "bg-yellow-400 text-yellow-900", text: "1st" },
    { color: "bg-gray-400 text-gray-900", text: "2nd" },
    { color: "bg-orange-400 text-orange-900", text: "3rd" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {players.map((player, index) => (
            <li key={player.name} className="flex items-center space-x-2">
              <Trophy
                className={`w-4 h-4 ${
                  index === 0
                    ? "text-yellow-500"
                    : index === 1
                    ? "text-gray-500"
                    : "text-orange-500"
                }`}
              />
              <Badge className={badges[index].color}>
                {badges[index].text}
              </Badge>
              <span>{player.name}</span>
              <span className="font-bold">{player.pra} PRA</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
