import asyncio
from playwright.async_api import async_playwright
import os

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        # Navigate to the local server
        await page.goto('http://localhost:8000')

        # Wait for a key element to be visible to ensure the page has loaded
        await page.wait_for_selector('#header-container h1')

        # Give the page a moment to render everything, especially the chart
        await page.wait_for_timeout(2000)

        # Take a screenshot of the entire page
        await page.screenshot(path='jules-scratch/verification/verification.png', full_page=True)

        await browser.close()

if __name__ == '__main__':
    asyncio.run(main())