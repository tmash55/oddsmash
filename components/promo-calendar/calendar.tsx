"use client";

import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  CalendarIcon,
  List,
  Grid,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  type Promotion,
  getPromotionsForMonth,
  sportsbooks,
} from "@/data/promotions";

import { PromotionDetail } from "./promotion-detail";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMediaQuery } from "@/hooks/use-media-query";
import { PromotionCard } from "./promotion-card";

type CalendarView = "month" | "week" | "day";

export function PromoCalendar() {
  const isMobile = useMediaQuery("(max-width: 640px)");
  const [view, setView] = useState<CalendarView>(isMobile ? "week" : "month");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedSportsbooks, setSelectedSportsbooks] = useState<string[]>([]);

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const currentDay = currentDate.getDate();

  // Get the start and end dates for the current week
  const getWeekDates = () => {
    const day = currentDate.getDay(); // 0 for Sunday, 1 for Monday, etc.
    const diff = currentDate.getDate() - day;
    const startDate = new Date(currentDate);
    startDate.setDate(diff);

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const monthPromotions = getPromotionsForMonth(currentYear, currentMonth);

  const filteredPromotions =
    selectedSportsbooks.length > 0
      ? monthPromotions.filter((promo) =>
          selectedSportsbooks.includes(promo.sportsbook)
        )
      : monthPromotions;

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayNamesShort = ["S", "M", "T", "W", "T", "F", "S"];

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getPromotionsForDay = (
    day: number,
    month = currentMonth,
    year = currentYear
  ) => {
    const date = new Date(year, month, day);
    return filteredPromotions.filter(
      (promo) =>
        promo.date.getDate() === day &&
        promo.date.getMonth() === month &&
        promo.date.getFullYear() === year
    );
  };

  const getPromotionsForDate = (date: Date) => {
    return filteredPromotions.filter(
      (promo) =>
        promo.date.getDate() === date.getDate() &&
        promo.date.getMonth() === date.getMonth() &&
        promo.date.getFullYear() === date.getFullYear()
    );
  };

  const handlePromotionClick = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setIsDetailOpen(true);
  };

  const handleSportsbookToggle = (sportsbookId: string) => {
    setSelectedSportsbooks((prev) => {
      if (prev.includes(sportsbookId)) {
        return prev.filter((id) => id !== sportsbookId);
      } else {
        return [...prev, sportsbookId];
      }
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  };

  const formatDayDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Handle view change and adjust for mobile
  const handleViewChange = (newView: CalendarView) => {
    setView(newView);
  };

  // Effect to change view based on screen size
  useState(() => {
    if (isMobile && view === "month") {
      setView("week");
    }
  });

  return (
    <div className="bg-card rounded-lg border shadow-sm">
      <div className="p-4 border-b">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">Promo Calendar</h2>
            <Badge variant="outline" className="ml-2">
              {filteredPromotions.length} Promotions
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-1">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                  {selectedSportsbooks.length > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1 text-xs"
                    >
                      {selectedSportsbooks.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-3" align="end">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Sportsbooks</h4>
                  <div className="space-y-2">
                    {sportsbooks.map((sportsbook) => (
                      <div
                        key={sportsbook.id}
                        className="flex items-center space-x-2"
                      >
                        <Checkbox
                          id={`filter-${sportsbook.id}`}
                          checked={selectedSportsbooks.includes(sportsbook.id)}
                          onCheckedChange={() =>
                            handleSportsbookToggle(sportsbook.id)
                          }
                        />
                        <Label
                          htmlFor={`filter-${sportsbook.id}`}
                          className="text-sm flex items-center gap-2"
                        >
                          <div className="w-4 h-4">
                            <img
                              src={sportsbook.logo || "/placeholder.svg"}
                              alt={sportsbook.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          {sportsbook.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                  {selectedSportsbooks.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs h-7 mt-2"
                      onClick={() => setSelectedSportsbooks([])}
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={
                view === "month"
                  ? goToPreviousMonth
                  : view === "week"
                  ? goToPreviousWeek
                  : goToPreviousDay
              }
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous {view}</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={
                view === "month"
                  ? goToNextMonth
                  : view === "week"
                  ? goToNextWeek
                  : goToNextDay
              }
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next {view}</span>
            </Button>
            <h3 className="text-lg font-semibold ml-2">
              {view === "month"
                ? `${monthNames[currentMonth]} ${currentYear}`
                : view === "week"
                ? `${formatDate(weekDates[0])} - ${formatDate(weekDates[6])}`
                : formatDayDate(currentDate)}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <ToggleGroup
              type="single"
              value={view}
              onValueChange={(value) =>
                value && handleViewChange(value as CalendarView)
              }
            >
              <ToggleGroupItem
                value="month"
                aria-label="Month view"
                disabled={isMobile}
              >
                <Grid className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="week" aria-label="Week view">
                <CalendarIcon className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="day" aria-label="Day view">
                <List className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            {view === "month" && (
              <Select
                value={currentMonth.toString()}
                onValueChange={(value) => {
                  setCurrentDate(
                    new Date(currentYear, Number.parseInt(value), 1)
                  );
                }}
              >
                <SelectTrigger className="w-[180px] h-8">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {monthNames.map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Monthly View */}
      {view === "month" && (
        <div className="grid grid-cols-7 gap-px bg-muted">
          {(isMobile ? dayNamesShort : dayNames).map((day, index) => (
            <div
              key={day + index}
              className="bg-card p-2 text-center text-xs font-medium text-muted-foreground"
            >
              {day}
            </div>
          ))}

          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div
              key={`empty-${index}`}
              className="bg-card min-h-[80px] sm:min-h-[120px]"
            />
          ))}

          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayPromotions = getPromotionsForDay(day);
            const hasPromotions = dayPromotions.length > 0;
            const date = new Date(currentYear, currentMonth, day);

            return (
              <div
                key={`day-${day}`}
                className={`bg-card min-h-[80px] sm:min-h-[120px] p-1 ${
                  isToday(date) ? "ring-2 ring-primary ring-inset" : ""
                }`}
              >
                <div className="h-full flex flex-col">
                  <div
                    className={`text-xs font-medium p-1 text-center rounded-full w-6 h-6 ${
                      isToday(date) ? "bg-primary text-primary-foreground" : ""
                    }`}
                  >
                    {day}
                  </div>

                  {hasPromotions ? (
                    <ScrollArea className="flex-1 mt-1 max-h-[60px] sm:max-h-none">
                      <div className="space-y-1 pr-3">
                        {dayPromotions.map((promotion) => (
                          <PromotionCard
                            key={promotion.id}
                            promotion={promotion}
                            onClick={() => handlePromotionClick(promotion)}
                          />
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="flex-1 flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        No promos
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Weekly View */}
      {view === "week" && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-px bg-muted">
          {/* Day headers for desktop */}
          <div className="hidden sm:grid sm:grid-cols-7 col-span-full">
            {dayNames.map((day, index) => (
              <div
                key={day + index}
                className="bg-card p-2 text-center text-xs font-medium text-muted-foreground"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Week days for desktop */}
          <div className="hidden sm:grid sm:grid-cols-7 col-span-full gap-px">
            {weekDates.map((date, index) => {
              const dayPromotions = getPromotionsForDate(date);
              const hasPromotions = dayPromotions.length > 0;

              return (
                <div
                  key={`week-day-${index}`}
                  className={`bg-card min-h-[150px] p-2 ${
                    isToday(date) ? "ring-2 ring-primary ring-inset" : ""
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">
                        {date.getDate()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {monthNames[date.getMonth()].substring(0, 3)}
                      </span>
                    </div>

                    {hasPromotions ? (
                      <ScrollArea className="flex-1">
                        <div className="space-y-1 pr-3">
                          {dayPromotions.map((promotion) => (
                            <PromotionCard
                              key={promotion.id}
                              promotion={promotion}
                              onClick={() => handlePromotionClick(promotion)}
                            />
                          ))}
                        </div>
                      </ScrollArea>
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          No promos
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Mobile week view - vertical list of days */}
          <div className="sm:hidden space-y-4 p-4">
            {weekDates.map((date, index) => {
              const dayPromotions = getPromotionsForDate(date);
              const hasPromotions = dayPromotions.length > 0;

              return (
                <div
                  key={`mobile-week-day-${index}`}
                  className={`bg-card rounded-md border ${
                    isToday(date) ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div
                    className={`p-3 border-b ${
                      isToday(date) ? "bg-primary/10" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {dayNames[date.getDay()]}, {date.getDate()}{" "}
                        {monthNames[date.getMonth()].substring(0, 3)}
                      </span>
                      {isToday(date) && (
                        <Badge
                          variant="outline"
                          className="bg-primary text-primary-foreground"
                        >
                          Today
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="p-3">
                    {hasPromotions ? (
                      <div className="space-y-2">
                        {dayPromotions.map((promotion) => (
                          <PromotionCard
                            key={promotion.id}
                            promotion={promotion}
                            onClick={() => handlePromotionClick(promotion)}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center">
                        <span className="text-sm text-muted-foreground">
                          No promotions available
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily View */}
      {view === "day" && (
        <div className="p-4 space-y-4">
          <div
            className={`bg-card rounded-md border ${
              isToday(currentDate) ? "ring-2 ring-primary" : ""
            }`}
          >
            <div
              className={`p-4 border-b ${
                isToday(currentDate) ? "bg-primary/10" : ""
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">
                  {formatDayDate(currentDate)}
                </h3>
                {isToday(currentDate) && (
                  <Badge
                    variant="outline"
                    className="bg-primary text-primary-foreground"
                  >
                    Today
                  </Badge>
                )}
              </div>
            </div>

            <div className="p-4">
              {(() => {
                const dayPromotions = getPromotionsForDate(currentDate);
                const hasPromotions = dayPromotions.length > 0;

                return hasPromotions ? (
                  <div className="space-y-3">
                    {dayPromotions.map((promotion) => (
                      <div
                        key={promotion.id}
                        className="p-3 border rounded-md hover:bg-accent/50 cursor-pointer transition-colors"
                        onClick={() => handlePromotionClick(promotion)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-md overflow-hidden">
                            <img
                              src={
                                getSportsbook(promotion.sportsbook)?.logo ||
                                "/placeholder.svg"
                              }
                              alt={getSportsbook(promotion.sportsbook)?.name}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-medium">{promotion.title}</h4>
                            <p className="text-sm text-muted-foreground">
                              {promotion.description}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {promotion.category
                                  .split("-")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1)
                                  )
                                  .join(" ")}
                              </Badge>
                              <span className="text-sm font-medium text-primary">
                                {promotion.value}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
                    <h3 className="mt-4 text-lg font-medium">
                      No Promotions Today
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground">
                      There are no promotions available for this date.
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={goToToday}
                    >
                      Go to Today
                    </Button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      <PromotionDetail
        promotion={selectedPromotion}
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
      />
    </div>
  );
}

// Helper function to get sportsbook info
function getSportsbook(sportsbookId: string) {
  return sportsbooks.find((sportsbook) => sportsbook.id === sportsbookId);
}
