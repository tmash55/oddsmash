import { ImageResponse } from "next/og";

// Route segment config
export const runtime = "edge";

// Helper to format American odds for display
function formatOdds(price: number): string {
  if (!price || price === 0) return "N/A";

  if (price >= 2) {
    // Positive odds
    return "+" + Math.round((price - 1) * 100);
  } else {
    // Negative odds
    return Math.round(-100 / (price - 1)).toString();
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Fetch the shared prop data directly from your API or database
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_API_URL || "https://api.oddsmash.io"
      }/api/share/${id}`,
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch shared prop data");
    }

    const sharedProp = await response.json();

    if (!sharedProp || !sharedProp.player) {
      return new ImageResponse(
        (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              height: "100%",
              backgroundColor: "#f9fafb",
              color: "#1f2937",
              fontFamily: "sans-serif",
              padding: "40px",
            }}
          >
            <div style={{ fontSize: 60, fontWeight: "bold", marginBottom: 20 }}>
              Prop Not Found
            </div>
            <div style={{ fontSize: 30, color: "#6b7280" }}>
              This share link is invalid or has expired.
            </div>
            <div style={{ marginTop: 40, fontSize: 24, color: "#6b7280" }}>
              Powered by Oddsmash
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Format stat type
    const formattedStatType = sharedProp.statType
      ? sharedProp.statType
          .split("_")
          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ")
      : "Stats";

    // Default to "both" if no bet type is specified (backward compatibility)
    const betType = sharedProp.betType || "both";
    const betTypeText =
      betType === "over" ? "Over" : betType === "under" ? "Under" : "";

    // Format game data
    const homeTeam =
      sharedProp.homeTeam || sharedProp.event?.homeTeam?.name || "";
    const awayTeam =
      sharedProp.awayTeam || sharedProp.event?.awayTeam?.name || "";
    const gameInfo = homeTeam && awayTeam ? `${homeTeam} vs ${awayTeam}` : "";

    // Get best odds for Over
    let bestOverPrice = 0;
    let bestOverBookmaker = "N/A";

    if (Array.isArray(sharedProp.bookmakers)) {
      for (const bookmaker of sharedProp.bookmakers) {
        if (!bookmaker || !bookmaker.key) continue;

        let price = null;

        // Check for markets format
        if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
          const market = bookmaker.markets.find(
            (m: any) => m.key === sharedProp.marketKey
          );
          if (market && Array.isArray(market.outcomes)) {
            const outcome = market.outcomes.find(
              (o: any) => o.name === "Over" && o.point === sharedProp.line
            );
            if (outcome) price = outcome.price;
          }
        }

        // Check for legacy format
        if (price === null && bookmaker.outcomes && bookmaker.outcomes.over) {
          price = bookmaker.outcomes.over.price;
        }

        if (price !== null && price > bestOverPrice) {
          bestOverPrice = price;
          bestOverBookmaker = bookmaker.title || bookmaker.key;
        }
      }
    }

    // Get best odds for Under
    let bestUnderPrice = 0;
    let bestUnderBookmaker = "N/A";

    if (Array.isArray(sharedProp.bookmakers)) {
      for (const bookmaker of sharedProp.bookmakers) {
        if (!bookmaker || !bookmaker.key) continue;

        let price = null;

        // Check for markets format
        if (bookmaker.markets && Array.isArray(bookmaker.markets)) {
          const market = bookmaker.markets.find(
            (m: any) => m.key === sharedProp.marketKey
          );
          if (market && Array.isArray(market.outcomes)) {
            const outcome = market.outcomes.find(
              (o: any) => o.name === "Under" && o.point === sharedProp.line
            );
            if (outcome) price = outcome.price;
          }
        }

        // Check for legacy format
        if (price === null && bookmaker.outcomes && bookmaker.outcomes.under) {
          price = bookmaker.outcomes.under.price;
        }

        if (price !== null && price > bestUnderPrice) {
          bestUnderPrice = price;
          bestUnderBookmaker = bookmaker.title || bookmaker.key;
        }
      }
    }

    // Determine which odds to show based on bet type
    const showOver = betType === "over" || betType === "both";
    const showUnder = betType === "under" || betType === "both";

    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            backgroundColor: "white",
            padding: "50px",
            fontFamily: "sans-serif",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "30px",
            }}
          >
            <div
              style={{
                fontSize: "28px",
                fontWeight: "bold",
                color: "#4f46e5",
              }}
            >
              ODDSMASH
            </div>
            <div
              style={{
                fontSize: "18px",
                color: "#6b7280",
              }}
            >
              Odds Comparison
            </div>
          </div>

          {/* Main content */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              justifyContent: "center",
            }}
          >
            {/* Player name */}
            <div
              style={{
                fontSize: "64px",
                fontWeight: "bold",
                color: "#111827",
                marginBottom: "20px",
                lineHeight: "1.1",
              }}
            >
              {sharedProp.player}
            </div>

            {/* Stat type and line */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginBottom: "30px",
              }}
            >
              <div
                style={{
                  backgroundColor: "#f3f4f6",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "24px",
                  fontWeight: "500",
                  color: "#4b5563",
                }}
              >
                {formattedStatType}
              </div>

              <div
                style={{
                  backgroundColor: "white",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  fontSize: "24px",
                  fontWeight: "500",
                  color: "#4b5563",
                  border: "1px solid #e5e7eb",
                }}
              >
                Line: {sharedProp.line || 0}
              </div>

              {betTypeText && (
                <div
                  style={{
                    backgroundColor:
                      betTypeText === "Over"
                        ? "rgba(79, 70, 229, 0.1)"
                        : "rgba(239, 68, 68, 0.1)",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "24px",
                    fontWeight: "500",
                    color: betTypeText === "Over" ? "#4f46e5" : "#ef4444",
                    border: `1px solid ${
                      betTypeText === "Over"
                        ? "rgba(79, 70, 229, 0.3)"
                        : "rgba(239, 68, 68, 0.3)"
                    }`,
                  }}
                >
                  {betTypeText}
                </div>
              )}
            </div>

            {/* Game info if available */}
            {gameInfo && (
              <div
                style={{
                  fontSize: "24px",
                  color: "#6b7280",
                  marginBottom: "30px",
                }}
              >
                {gameInfo}
              </div>
            )}

            {/* Odds display */}
            <div
              style={{
                display: "flex",
                gap: "30px",
                marginBottom: "20px",
              }}
            >
              {/* Over odds */}
              {showOver && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    border: "1px solid rgba(79, 70, 229, 0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "16px",
                        backgroundColor: "rgba(79, 70, 229, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                      }}
                    >
                      ▲
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "#111827",
                      }}
                    >
                      Over {sharedProp.line || 0}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: "bold",
                      color: "#4f46e5",
                      marginBottom: "8px",
                    }}
                  >
                    {formatOdds(bestOverPrice)}
                  </div>

                  <div
                    style={{
                      fontSize: "18px",
                      color: "#6b7280",
                    }}
                  >
                    Best at: {bestOverBookmaker}
                  </div>
                </div>
              )}

              {/* Under odds */}
              {showUnder && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    backgroundColor: "white",
                    padding: "24px",
                    borderRadius: "12px",
                    boxShadow:
                      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "16px",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                      }}
                    >
                      ▼
                    </div>
                    <div
                      style={{
                        fontSize: "24px",
                        fontWeight: "bold",
                        color: "#111827",
                      }}
                    >
                      Under {sharedProp.line || 0}
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: "bold",
                      color: "#ef4444",
                      marginBottom: "8px",
                    }}
                  >
                    {formatOdds(bestUnderPrice)}
                  </div>

                  <div
                    style={{
                      fontSize: "18px",
                      color: "#6b7280",
                    }}
                  >
                    Best at: {bestUnderBookmaker}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderTop: "1px solid #e5e7eb",
              paddingTop: "20px",
              color: "#6b7280",
              fontSize: "18px",
            }}
          >
            <div>oddsmash.io</div>
            <div>Compare odds across sportsbooks</div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error("Error generating OG image:", error);

    // Return a fallback image
    return new ImageResponse(
      (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%",
            backgroundColor: "#f9fafb",
            color: "#1f2937",
            fontFamily: "sans-serif",
            padding: "40px",
          }}
        >
          <div style={{ fontSize: 60, fontWeight: "bold", marginBottom: 20 }}>
            Oddsmash
          </div>
          <div style={{ fontSize: 30, color: "#6b7280" }}>
            Compare odds across sportsbooks
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
