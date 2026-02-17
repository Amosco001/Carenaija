import cron from "node-cron";
import { execFile } from "child_process";
import path from "path";
import { log } from "./index";

let isScraperRunning = false;

export function isScraperBusy(): boolean {
  return isScraperRunning;
}

export function runScraper(
  command: string, 
  args: string[] = [],
  onComplete?: (error: Error | null, stdout: string) => void
): void {
  if (isScraperRunning) {
    const err = new Error("A scraper job is already running");
    if (onComplete) onComplete(err, "");
    else log("Scraper already running, skipping", "scheduler");
    return;
  }

  isScraperRunning = true;
  const scraperDir = path.join(process.cwd(), "scraper");
  const fullArgs = ["runner.py", command, ...args];

  log(`Starting scraper: ${command} ${args.join(" ")}`, "scheduler");

  execFile(
    "python3",
    fullArgs,
    { cwd: scraperDir, env: { ...process.env }, timeout: 600000 },
    (error, stdout, stderr) => {
      isScraperRunning = false;
      if (error) {
        log(`Scraper error: ${error.message}`, "scheduler");
        if (stderr) log(`stderr: ${stderr}`, "scheduler");
        if (onComplete) onComplete(error, stderr || "");
      } else {
        log(`Scraper completed: ${stdout.slice(0, 500)}`, "scheduler");
        if (onComplete) onComplete(null, stdout);
      }
    }
  );
}

export function startScheduler() {
  cron.schedule("0 3 * * *", () => {
    log("Running daily hospital discovery", "scheduler");
    runScraper("daily");
  });

  cron.schedule("0 2 * * 0", () => {
    log("Running weekly full scan", "scheduler");
    runScraper("weekly");
  });

  log("Hospital discovery scheduler started (daily at 3 AM, weekly full scan Sundays at 2 AM)", "scheduler");
}
