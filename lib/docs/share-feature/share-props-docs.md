# 📤 Share Props Feature — Overview & Implementation Plan

This document outlines the architecture and logic behind the **Prop Share Page** feature in the Oddsmash app. Use this to guide AI agents like Cursor or for documentation.

---

## 📌 Feature Summary
The share props feature allows users to click a button and generate a shareable page that displays a prop bet (player, line, odds) across sportsbooks. The data is cached in Redis and refreshed if stale. The shared page includes options for users to easily send via text, email, or post to social media.

---

## 🧱 Architecture

### 1. `/app/share/[id]/page.tsx`
- This is the route that handles rendering a shared prop URL like `/share/abc123`
- It does the following:
  - Loads cached prop data from Redis: `share:<id>`
  - If cache is stale (e.g., 20+ minutes old), re-fetch odds using the cached event ID and statType
  - Renders the share UI with formatted odds

### 2. `lib/share-utils.ts`
- Utility file with:
  - `generateShareId(data: ShareablePropPayload): string`
  - `storeSharedProp(id: string, payload: ShareablePropPayload): Promise<void>`
  - Optionally include `getSharedProp(id)`
- Uses Redis TTL of 1 hour (`3600s`) by default

```ts
const redisKey = `share:${id}`;
await redis.set(redisKey, payload, { ex: 3600 });
```

---

## ⚙️ How to Use in Code

### 1. Share Button
Place a `<ShareButton />` inside each prop row, like this:

```tsx
<ShareButton
  player={prop.player}
  line={prop.line}
  statType={statType}
  eventId={eventId}
  marketKey={marketKey}
  selectedBooks={selectedSportsbooks}
  odds={bookmakers}
/>
```

### 2. On Click
- It triggers a function to:
  - Generate a unique hash (e.g., using player + line + statType + eventId)
  - Store the prop data in Redis
  - Redirect to `/share/<id>`

### 3. On Load `/share/[id]`
- Loads the data from Redis
- If expired, fetch latest odds for the same `eventId` + `statType`
- Render UI component `SharePageContent`

---

## 🧠 Future Upgrades
- [ ] Add Open Graph image previews
- [ ] Support multiple legs for parlay shares
- [ ] Add preview modal with share buttons (Email, Text, X, etc)
- [ ] Track click analytics with Supabase later

---

## 🗂️ Where to Place Files
- `lib/share-utils.ts` — logic for caching and retrieval
- `app/share/[id]/page.tsx` — page component for shared prop
- `components/prop-table/share-button.tsx` — UI trigger inside table

---

## 🧪 Testing Tips
- ✅ Open devtools → clear Redis key manually → test cache expiry
- ✅ Share link with expired odds → confirm refresh
- ✅ Test on mobile and desktop

---

Let Cursor or other AI assistants reference this document for help building or updating share functionality.
