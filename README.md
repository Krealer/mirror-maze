# Mirror Maze

Mirror Maze is a browser-based interactive story where you navigate a shifting labyrinth. Your choices influence your emotions and determine the ending you see. The game is implemented with static HTML, CSS and JavaScript.

## Local Setup

1. Clone this repository:
   ```bash
   git clone <repo-url>
   cd mirror-maze
   ```
2. Serve the files locally. You can open `index.html` directly, but running a small web server avoids cross-origin issues. A quick option using Python is:
   ```bash
   python3 -m http.server 8000
   ```
   Then visit `http://localhost:8000` in your browser.

## Build/Test

The project is entirely static and does not require a build step. There are also no automated tests.

## Deploying to GitHub Pages

1. Push your code to the `main` branch of your GitHub repository.
2. In the repository settings under **Pages**, choose `main` as the source and the root directory (`/`).
3. After saving the settings, GitHub Pages will publish the site at
   `https://<username>.github.io/<repository>/`.

Enjoy exploring the maze!

## Skills

As you progress, you may unlock special abilities:

- **Pattern Sense** – notice manipulation tactics before they unfold.
- **Emotional Anchor** – ground yourself in self-trust to resist control.
- **Truth Sense** – automatically detect false memories and distorted rooms after surviving repeated loops.

## License

This project is licensed under the [MIT License](LICENSE).
