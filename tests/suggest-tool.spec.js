// @ts-check
import { test, expect } from "@playwright/test";

test.describe("Suggest a Tool functionality", () => {
  test("should open and close the suggest tool dialog", async ({ page }) => {
    // Navigate to the home page
    await page.goto("http://localhost:5173/");

    // Find and click the suggest tool button
    const suggestButton = page.getByRole("button", { name: "Suggest a Tool" });
    await expect(suggestButton).toBeVisible();
    await suggestButton.click();

    // Verify the dialog is open
    const dialog = page.locator("dialog.suggest-tool-dialog");
    await expect(dialog).toBeVisible();
    
    // Check for form elements
    await expect(page.getByRole("heading", { name: "Suggest a Tool" })).toBeVisible();
    await expect(page.getByLabel("Title")).toBeVisible();
    await expect(page.getByLabel("URL")).toBeVisible();
    await expect(page.getByLabel("Description")).toBeVisible();
    await expect(page.getByLabel("Tags")).toBeVisible();
    
    // Close the dialog
    const closeButton = dialog.getByRole("button", { name: "Close dialog" });
    await closeButton.click();
    
    // Verify dialog is closed
    await expect(dialog).not.toBeVisible();
  });

  test("form validation works correctly", async ({ page }) => {
    // Navigate to the home page
    await page.goto("http://localhost:5173/");

    // Open the dialog
    const suggestButton = page.getByRole("button", { name: "Suggest a Tool" });
    await suggestButton.click();

    // Try to submit the empty form
    const submitButton = page.getByRole("button", { name: "Submit Tool" });
    await submitButton.click();

    // Check for validation errors
    await expect(page.getByText("Title is required")).toBeVisible();
    await expect(page.getByText("URL is required")).toBeVisible();
    await expect(page.getByText("Description is required")).toBeVisible();
    await expect(page.getByText("At least one tag is required")).toBeVisible();

    // Fill in the title field only
    await page.getByLabel("Title").fill("Test Tool");
    await submitButton.click();
    
    // Verify that the other validation errors are still present
    await expect(page.getByText("Title is required")).not.toBeVisible();
    await expect(page.getByText("URL is required")).toBeVisible();
    
    // Test invalid URL format
    await page.getByLabel("URL").fill("not-a-url");
    await submitButton.click();
    await expect(page.getByText("Please enter a valid URL")).toBeVisible();
    
    // Enter a valid URL
    await page.getByLabel("URL").fill("https://example.com");
    await submitButton.click();
    await expect(page.getByText("Please enter a valid URL")).not.toBeVisible();
  });
});