# ClearPath Cold — Delivery Tracking POC

## What this is
Live delivery tracking POC. Driver streams GPS from phone browser. Customer gets a link and watches a dot move on a map in real time. Uber-style.

## What's already built
- `server/index.js` — Node.js WebSocket server. Creates sessions, receives GPS from driver, broadcasts to watchers.
- `driver/driver.html` — Driver PWA. Runs in mobile browser, streams GPS every ~4 seconds via WebSocket.

## What you need to build

### 1. `track/track.html` — Customer tracking page
This is the money shot. Uber-style live map.

Requirements:
- Google Maps JS API with a moving driver marker (van icon or arrow that rotates with heading)
- Smooth marker interpolation between GPS updates (don't jump — animate)
- Connects via WebSocket as `role=watcher`
- Session ID from URL param: `track.html?id=ABC123`
- Status banner: `Preparing → On the way → Arriving soon → Delivered`
- When driver sends `delivered` event: map freezes, show confirmation state
- Handle reconnection gracefully (buffer, replay on reconnect)
- Mobile-first, looks premium

Design direction: dark map (Google Maps dark style), minimal UI chrome, the map IS the experience. ClearPath Cold brand — dark navy `#0D1B2A`, ice blue `#1B6CA8`, frost `#A8D5EA`. Think Uber Eats dark mode but colder.

### 2. Deploy the server
Deploy `server/` to Render (free tier, Web Service, Node). 
- Update the `WS_URL` in `driver.html` and `track.html` with the live Render URL.

### 3. Deploy frontend to Vercel
Both `driver.html` and `track.html` as static files.
- New Vercel project: `clearpath-cold`
- Driver URL: `clearpath-cold.vercel.app/driver`
- Track URL: `clearpath-cold.vercel.app/track?id=XXX`

## Google Maps
- **API Key:** `AIzaSyC1MaPUOfYKWagYghJ0ye0HcpwkJusn-RU`
- **Restrictions:** Maps JavaScript API + Places API
- **Google Cloud login:** rdpeacock67@gmail.com

## Test flow
1. Russ opens `/driver` on his phone → taps Start → gets tracking link
2. Sends link to someone
3. They open it → see Russ's dot moving on the map in real time

That's the whole POC.
