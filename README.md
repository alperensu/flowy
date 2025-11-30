# Flowy

Flowy is a modern, high-performance music streaming application inspired by Spotify. It leverages the power of YouTube's vast library to provide an extensive collection of music, wrapped in a sleek, responsive user interface. Built with Next.js and Electron, Flowy offers both a web-based experience and a native desktop application.

## Features

-   **YouTube Integration**: Search and play any song available on YouTube.
-   **Sleek UI**: A premium, dark-themed interface inspired by modern streaming services.
-   **Responsive Design**: Optimized for various screen sizes, ensuring a consistent experience.
-   **Desktop Experience**: Native capabilities via Electron, including system integration.
-   **Custom Player**: Full-featured music player with playback controls, seeking, and volume management.

## Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (React)
-   **Desktop Runtime**: [Electron](https://www.electronjs.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Media Playback**: [React Player](https://github.com/cookpete/react-player)
-   **Data Fetching**: [yt-search](https://github.com/talmuth/yt-search)

## Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/alperensu/flowy.git
    cd flowy
    ```

2.  Install dependencies:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

### Running the App

#### Web Development
To run the application in the browser:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

#### Electron Development
To run the application as a desktop app (with hot reloading):

```bash
npm run electron:dev
```

This command concurrently runs the Next.js dev server and the Electron main process.

## Building for Production

To create a production build of the desktop application:

```bash
npm run electron:build
```

The output binaries will be generated in the `dist` directory.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [MIT License](LICENSE).
