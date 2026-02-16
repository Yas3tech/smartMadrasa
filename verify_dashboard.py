from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()

        def handle_console(msg):
            print(f"Console: {msg.text}")

        page.on("console", handle_console)

        try:
            print("Navigating to http://localhost:5173")
            page.goto("http://localhost:5173", timeout=60000)

            # Wait for dashboard to load
            page.wait_for_timeout(5000)

            # Take screenshot
            page.screenshot(path="/home/jules/verification/dashboard.png", full_page=True)
            print("Screenshot saved to /home/jules/verification/dashboard.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="/home/jules/verification/error.png")
            print("Error screenshot saved to /home/jules/verification/error.png")

if __name__ == "__main__":
    run()
