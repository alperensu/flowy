import { spawn } from 'child_process';
import path from 'path';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const videoId = searchParams.get('videoId');

        if (!videoId) {
            return new Response('Missing videoId', { status: 400 });
        }

        console.log(`[Stream API] Using yt-dlp for ${videoId}`);

        const ytDlpPath = path.join(process.cwd(), 'yt-dlp.exe');
        const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

        // Spawn yt-dlp process
        // -o - : Output to stdout
        // -f bestaudio : Best audio quality
        const ytDlpProcess = spawn(ytDlpPath, [
            '-o', '-',
            '-f', 'bestaudio',
            '--no-playlist',
            '--no-warnings',
            videoUrl
        ]);

        // Create a ReadableStream from stdout
        const readable = new ReadableStream({
            start(controller) {
                ytDlpProcess.stdout.on('data', (chunk) => {
                    controller.enqueue(chunk);
                });

                ytDlpProcess.stdout.on('end', () => {
                    controller.close();
                });

                ytDlpProcess.stdout.on('error', (err) => {
                    console.error('[Stream API] stdout error:', err);
                    controller.error(err);
                });

                ytDlpProcess.stderr.on('data', (data) => {
                    console.warn(`[yt-dlp stderr]: ${data}`);
                });

                ytDlpProcess.on('close', (code) => {
                    if (code !== 0) {
                        console.error(`[Stream API] yt-dlp exited with code ${code}`);
                    }
                });

                // Safety timeout: Kill process after 1 hour (max track length usually)
                const timeout = setTimeout(() => {
                    console.warn(`[Stream API] Killing yt-dlp process for ${videoId} after timeout`);
                    ytDlpProcess.kill();
                }, 3600000);

                // Clear timeout on close
                ytDlpProcess.on('close', () => clearTimeout(timeout));
            },
            cancel() {
                ytDlpProcess.kill();
            }
        });

        return new Response(readable, {
            headers: {
                'Content-Type': 'audio/mpeg',
                'Cache-Control': 'public, max-age=3600',
                'Content-Disposition': `inline; filename="${videoId}.mp3"`,
            },
        });

    } catch (error) {
        console.error('Stream Proxy Error:', error);
        return new Response(`Internal Server Error: ${error.message}`, { status: 500 });
    }
}
