Hello,

This is code I wrote to add features and fix issues with the work system.

How to use:
- Get [User JavaScript and CSS extension.](https://chromewebstore.google.com/detail/user-javascript-and-css/nbhcbdghjpllgmfilhnhkllmkecfmpld?hl=en)
- Go to system homepage (dashboard).
- Click on the extention and add a new rule.
- Add a '/*' to the end of the url to ensure it works on all pages.
- Paste code from inject.js into js side.

Enhancements:
- In conditions Queues; Export Table button to save each visible line item into a csv.
- In Conditions Queues; Get Total button to ge the total quantity of all visible line items.
- On product and item pages; CSS fix for layout of cards.
- On product and item pages; CSS fix for image box being too small.
- On product and item pages; CSS fix for images inside upload box not wrapping properly.
- On product and item pages; CSS fix for activity log where the color of the name is dark even when the page is in dark mode.
- On item pages; CSS fix to have the inventory tab larger so you can see more.
- On listing page; A warning for when the GTIN is invalid and needs to be regenerated before going to the last step.
- On listing page; A warning for when the GTIN is changed to remind the user to replace the old label with a new one.
- On New Inventory Page; Disabled entry of new inventory sent to listing without a GTIN.
- On New Inventory Page; Disabled entry of new inventory sent to listing with a GTIN longer than 12 characters.
- On New Inventory Page; Automatic response for invalid GTIN in input box.
- On reports page, after submitting to generate a new report, the report displays under the original card.
  - If the file is larger than 1MB, the printing is disabled to save performance.
  - Links for products and items are automatically added into the report preview for convenience.
- On reports page, added a card to generate a preset report.
  - Added Listing department productivity reporting preset.
  - Added Marketing department productivity reporting preset.
  - Missing Picture report for Defective, Incomplete and Imaging Issues (Created last 30 days).
  - Product Items list of products over QTY 50 with ASIN column.
- On Calendar; CSS fix to add a background color to the list of day's events.
- On all pages; CSS fix to correct spacing issues in header.
- On all pages; CSS fix to get rid of light mode logo.
- On all pages; CSS fix (that I shouldn't have to do) to fix page height issues not filling the full background.
- On all pages; CSS fixes to alter some colors for better dark mode enhancement.

Future Requests or Patches:
- A button on images tab to remove all existing images.
- A button on images tab to download all existing images into a zip.
