import express from 'express';
import path from 'path';

const app = express();
const port = 8080;

// Get the project root directory from the current working directory where the script is run
const projectRoot = process.cwd();

// Define the root for the test UI and the location of the core package's distribution files
const testUiRoot = path.join(projectRoot, 'dev-tools', 'time-design-test');
const coreDist = path.join(projectRoot, 'packages', 'core', 'dist');

// Serve static files from the test UI directory (e.g., /js, /css, /index.html)
app.use(express.static(testUiRoot));

// Serve the core browser build from its dist folder, mounting it at the /dist URL path
app.use('/dist', express.static(coreDist));

// Default catch-all to serve index.html for any other request.
// This is useful for single-page applications.
app.get('*', (req, res) => {
    res.sendFile(path.join(testUiRoot, 'index.html'));
});

app.listen(port, () => {
    console.log(`Development server running at http://localhost:${port}`);
    console.log(`Serving UI from: ${testUiRoot}`);
    console.log(`Serving core library from: ${coreDist}`);
}); 