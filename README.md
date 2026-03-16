<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/c92bf064-9a13-4cfa-b032-05961f4806db

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (or configure your NVIDIA API key).
3. Run the app:
   `npm run dev`

## Deploying to Cloudflare Pages

This project is configured to be deployed to **Cloudflare Pages**, utilizing Cloudflare Workers (Edge functions) for the AI recommendation features.

### Option 1: Automatic Deployment (Recommended)
You can deploy your Next.js application automatically from a GitHub repository:

1. Push this project code to a GitHub repository.
2. Log into the [Cloudflare Dashboard](https://dash.cloudflare.com/), and navigate to **Workers & Pages**.
3. Click **Create application** -> **Pages** -> **Connect to Git** and authorize your GitHub account.
4. Select your newly created repository and configure the build settings:
   - Framework preset: **Next.js**
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
5. Ensure to add any environment variables (e.g., `NVIDIA_API_KEY`) under the **Environment variables** section.
6. Click **Save and Deploy**. Cloudflare will automatically build and deploy your app globally.

### Option 2: Local Deployment (via WSL or Mac/Linux)
*Note: The `@cloudflare/next-on-pages` CLI tool has known compatibility bugs when running natively in the Windows Command Prompt/PowerShell. Please run these commands from Windows Subsystem for Linux (WSL), macOS, or Linux.*

1. Run the specialized Cloudflare build command to bundle the Edge functions and output static assets:
   ```bash
   npm run pages:build
   ```
2. Deploy the bundled output dir using Wrangler:
   ```bash
   npx wrangler pages deploy .vercel/output/static
   ```
3. The CLI will prompt you to log into your Cloudflare account and will output your live Edge URL once complete!
