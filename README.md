# Smart-City-Led.com

Interactive 3D scroll-driven showcase of a solar-powered smart city, solar EV charging station, and evening residential solar storage ecosystem — built with native ES Modules and Three.js for zero-build GitHub Pages deployment.

## Languages Supported
- **English** (`EN`)
- **Français** (`FR`)
- **Български** (`BG`)
- **Română** (`RO`)

## Key Features
- **Stage 1 — Solar Mini-City (Daylight)**: Photovoltaic solar farms and rooftop arrays feed the central smart grid hub and urban towers with animated 3D energy conduits.
- **Stage 2 — Solar EV Charging Station**: As you scroll down, an electric vehicle drives down the smart boulevard, docks at the solar-canopy fast-charging bay, and charges from 22% to 100% via animated solar energy streams.
- **Stage 3 — Evening Drive & Solar Smart Home**: As dusk falls into night, streetlamps, city windows, and EV headlights automatically ignite. The EV drives home and parks in the residential driveway while the rooftop battery storage and V2H solar system power the home through the night.
- **Stage 4 — Night Ecosystem & Interactive Solar/LED ROI Calculator**: Explore the full illuminated city in Free 3D Orbit mode and calculate estimated solar and smart LED savings.

## GitHub Pages Deployment
This repository is configured as a static site with zero build dependencies:
1. Push the repository to GitHub.
2. In **Settings → Pages**, set Source to **Deploy from a branch** (`main` / root).
3. `.nojekyll` and `CNAME` (`smart-city-led.com`) are already included in the root directory.

## Local Preview
Serve the root folder over any static HTTP server (required for ES modules), for example:
- VS Code Live Server, or
- PowerShell `.NET` static listener, `npx serve .`, or `python -m http.server 8080`.
