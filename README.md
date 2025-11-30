# Flowy

<div align="center">
  <h3>Modern Music Streaming, Redefined.</h3>
  <p>A high-performance, ad-free music streaming experience powered by YouTube, built with the latest web technologies.</p>

  <p>
    <a href="#features">Features</a> •
    <a href="#tech-stack">Tech Stack</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#project-structure">Structure</a> •
    <a href="#contributing">Contributing</a>
  </p>

  ![Next.js](https://img.shields.io/badge/Next.js-black?style=for-the-badge&logo=next.js&logoColor=white)
  ![Electron](https://img.shields.io/badge/Electron-47848F?style=for-the-badge&logo=electron&logoColor=white)
  ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
  ![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)
</div>

---

## 🚀 Overview

**Flowy** is a sophisticated music streaming application that bridges the gap between web and desktop experiences. Inspired by industry leaders like Spotify, it offers a premium, dark-themed interface while leveraging the vast library of YouTube to ensure you can find and play any song you desire.

Whether you prefer a browser-based player or a native desktop application with system integration, Flowy delivers a seamless, responsive, and high-quality audio experience.

## ✨ Features

-   **🎵 Infinite Library**: Powered by YouTube, access millions of songs, remixes, and covers instantly.
-   **🧠 Smart Shuffle**: An intelligent shuffling algorithm that keeps your playlist fresh without repetition.
-   **🎨 Premium UI/UX**: A sleek, modern interface designed with `Tailwind CSS` and `Framer Motion` for fluid animations and a native app feel.
-   **🖥️ Cross-Platform**:
    -   **Web**: Accessible from any modern browser.
    -   **Desktop**: Native Windows application via Electron with taskbar integration and media keys support.
-   **⚡ High Performance**: Built on Next.js for optimal rendering and fast transitions.
-   **🎹 Advanced Player**: Full control over playback with seeking, volume control, loop modes, and queue management.

## 🛠️ Tech Stack

Flowy is built with a cutting-edge stack designed for scalability and performance:

-   **Core Framework**: [Next.js 14](https://nextjs.org/) (React) - Server-side rendering and static generation.
-   **Desktop Runtime**: [Electron](https://www.electronjs.org/) - Cross-platform desktop application wrapper.
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework for rapid UI development.
-   **Animations**: [Framer Motion](https://www.framer.com/motion/) - Production-ready animation library for React.
-   **Icons**: [Lucide React](https://lucide.dev/) - Beautiful & consistent icons.
-   **State Management**: React Context API & Hooks.
-   **Data Fetching**: Custom YouTube scraper integration.

## 📂 Project Structure

Designed for maintainability and scalability:

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # Reusable UI components
│   ├── views/        # Complex page-like views (Search, Home, etc.)
│   └── ...           # Atoms and molecules (Player, Card, etc.)
├── context/          # React Context providers (PlayerContext, etc.)
├── hooks/            # Custom React hooks
├── lib/              # Utility libraries and API wrappers
├── services/         # Business logic services (SmartShuffle, etc.)
└── utils/            # Helper functions
```

## 🏗️ Architecture

Flowy operates in two distinct modes, sharing the same UI codebase but utilizing different data fetching strategies:

### 1. Web Mode
-   **Environment**: Standard web browser.
-   **Data Fetching**: Uses Next.js API Routes (`/api/*`) to act as a proxy, avoiding CORS issues when communicating with external services like Deezer or YouTube.
-   **Limitations**: Some APIs might be restricted due to browser policies or IP-based rate limiting on the server side.

### 2. Electron Mode (Desktop)
-   **Environment**: Chromium-based desktop container.
-   **Data Fetching**: Uses **IPC (Inter-Process Communication)** to offload network requests to the main process.
-   **Advantages**: Bypasses CORS completely, allows for native system integrations (Global Media Keys, Taskbar controls), and offers better performance for heavy operations.

---

## 🔌 API Documentation

Flowy exposes several internal API endpoints used by the frontend (primarily in Web Mode).

### `GET /api/youtube`
Searches for a song on YouTube to find the best audio match.

**Parameters:**
-   `artist` (string): Name of the artist.
-   `title` (string): Title of the song.
-   `duration` (number, optional): Target duration in seconds for better matching accuracy.

**Response:**
```json
{
  "videoId": "dQw4w9WgXcQ",
  "title": "Rick Astley - Never Gonna Give You Up",
  "duration": 212,
  "thumbnail": "https://i.ytimg.com/..."
}
```

### `GET /api/album`
Fetches detailed album information from Deezer.

**Parameters:**
-   `id` (string): The Deezer album ID.

**Response:**
```json
{
  "id": 12345,
  "title": "Album Title",
  "cover": "url_to_image",
  "artist": { "name": "Artist Name" },
  "tracks": [ ... ]
}
```

### `GET /api/proxy`
*Note: Currently a stub.*
Intended to proxy requests to external music APIs (like Deezer) for the web version to avoid CORS. In the current development state, the web version often relies on mock data if this endpoint returns empty results.

---

## ⚙️ Configuration

Flowy is designed to work out-of-the-box with minimal configuration.

-   **Environment Variables**: Currently, no `.env` file is strictly required for local development as the app defaults to public APIs or mock data.
-   **Port**: Defaults to `3000` for web and `3001` for the Electron serving port.

---

## 🚀 Getting Started

Follow these steps to set up Flowy locally.

### Prerequisites

-   **Node.js** (v18 or higher recommended)
-   **npm** or **yarn**

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/alperensu/flowy.git
    cd flowy
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

### Development

Flowy can be run in two modes:

#### 🌐 Web Mode
Run the application in your browser (localhost:3000).
```bash
npm run dev
```

#### 🖥️ Desktop Mode (Electron)
Run the application as a native desktop window with hot-reloading.
```bash
npm run electron:dev
```

### Building for Production

To create a distributable desktop application (e.g., `.exe` for Windows):

```bash
npm run electron:build
```
The output will be in the `dist/` directory.

## 🤝 Contributing

We welcome contributions!
1.  Fork the project.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
