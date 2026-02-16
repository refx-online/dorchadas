import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Navigate to homepage
        print("Navigating to http://localhost:5173/ ...")
        await page.goto("http://localhost:5173/")

        # Wait for hydration
        # await page.wait_for_load_state("networkidle")

        # 1. Verify Language Menu
        print("Checking Language Menu...")
        # Desktop language button
        lang_btn = page.locator('button[aria-label="Select Language"]')

        if await lang_btn.count() > 0:
            first_lang_btn = lang_btn.first
            if await first_lang_btn.is_visible():
                await first_lang_btn.click()
                await page.wait_for_timeout(1000) # wait for popup animation
                await page.screenshot(path="verification_lang.png")
                print("Language menu verified.")
            else:
                 print("Language button exists but not visible (maybe mobile view?)")
        else:
            print("Language button not found!")

        # Close popup by clicking outside
        await page.mouse.click(0, 0)
        await page.wait_for_timeout(500)

        # 2. Verify User Menu (should show Sign In/Up since not logged in)
        print("Checking User Menu...")
        user_btn = page.locator('button[aria-label="User menu"]')

        if await user_btn.count() > 0:
            first_user_btn = user_btn.first
            if await first_user_btn.is_visible():
                await first_user_btn.click()
                await page.wait_for_timeout(1000) # wait for popup animation
                await page.screenshot(path="verification_user.png")
                print("User menu verified.")
            else:
                 print("User button exists but not visible (maybe mobile view?)")
        else:
            print("User button not found!")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
