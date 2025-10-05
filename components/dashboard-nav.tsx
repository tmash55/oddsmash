import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

const sports = [
  { id: "mlb", name: "MLB" },
  { id: "nba", name: "NBA" },
  { id: "nfl", name: "NFL" },
  { id: "nhl", name: "NHL" },
]

const features = [
  { id: "hit-rates", name: "Hit Rates" },
  { id: "hit-sheets", name: "Hit Sheets" },
  { id: "box-scores", name: "Box Scores" },
  { id: "parlay", name: "Parlay Builder" },
]

export function DashboardNav() {
  const pathname = usePathname()
  const currentSport = pathname.split("/")[2] || "mlb"

  return (
    <div className="flex items-center space-x-6">
      <Select defaultValue={currentSport}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Sport" />
        </SelectTrigger>
        <SelectContent>
          {sports.map((sport) => (
            <SelectItem key={sport.id} value={sport.id}>
              {sport.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <nav className="flex items-center space-x-4">
        {features.map((feature) => (
          <Link
            key={feature.id}
            href={`/dashboard/${currentSport}/${feature.id}`}
            className={cn(
              "text-sm font-medium transition-colors hover:text-primary",
              pathname === `/dashboard/${currentSport}/${feature.id}`
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            {feature.name}
          </Link>
        ))}
      </nav>
    </div>
  )
} 