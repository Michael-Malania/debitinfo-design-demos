# 🚀 Deployment Guide: Debitinfo Design Demos & Comment Platform

This platform allows clients and team members to review all 9 static HTML design demos, switch between pages from a sleek sidebar, and drop Figma-style pinpoint comments directly on any element.

---

## 💻 Local Development

Run the development server locally:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## ☁️ Deploying to Vercel (Step-by-Step)

### Option 1: Via GitHub (Recommended)
1. Push this project folder to your GitHub repository:
   ```bash
   git init
   git add .
   git commit -m "Debitinfo design review and comment platform"
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git branch -M main
   git push -u origin main
   ```
2. Go to **[vercel.com/new](https://vercel.com/new)**.
3. Select your repository and click **Deploy**.
4. Vercel automatically detects Next.js, compiles the build, and serves the static demos and serverless API route.

### Option 2: Via Vercel CLI
Run in your terminal:
```bash
npx vercel
```
Follow the quick prompts to deploy directly.

---

## 💬 How Commenting Works

- **Who are you?** On first visit, the sidebar prompts for the reviewer's name (e.g. `ნიკა`, `გიორგი`, `Reviewer`). Once entered, it's remembered automatically.
- **Select Mode (V)**: Normal browsing mode. Reviewers can click around, scroll, test links, and interact with the demo.
- **Comment Mode (C)**: Click **Comment (C)** in the floating toolbar (or press `C` on your keyboard).
  - The cursor turns into a Figma comment bubble icon.
  - Click anywhere on the preview to drop a pin.
  - Type your feedback in the popover and click **Post** (or `Ctrl + Enter`).
- **Reviewing Feedback**: Select any page from the sidebar to view all pins left by clients and reviewers.
- **Resolve / Delete**: Click any comment in the sidebar or on the pin to mark it as resolved or delete it.
