# Citeplex Demo Video

60-second animated demo video built with [Remotion](https://www.remotion.dev/).

## Setup

```bash
cd video
npm install
```

## Preview in Browser

```bash
npm start
```

Opens Remotion Studio at `http://localhost:3000`. You can preview each scene individually or the full `CiteplexDemo` composition.

## Add Screenshots

Place your dashboard screenshots in `public/screenshots/`:

- `dashboard.png` - AI Visibility dashboard overview
- `content.png` - Content Planner view
- `article.png` - Generated article detail page

Recommended size: 1200x750px or larger (will be auto-cropped).

## Render to MP4

```bash
npm run build
```

Output: `out/demo.mp4` (1920x1080, 30fps, 60 seconds)

Requires [ffmpeg](https://ffmpeg.org/) installed on your system.

## Scenes

| Scene | Duration | Description |
|-------|----------|-------------|
| Intro | 0-8s | Logo reveal + tagline + gradient line |
| Problem | 8-18s | "AI engines don't mention your brand" + AI engine grid |
| Dashboard | 18-35s | 3D browser frames cycling through screenshots |
| Features | 35-50s | Counter (45 articles) + feature cards |
| CTA | 50-60s | Pricing ($69/mo) + free trial + citeplex.io |
