### Hello!
Quality of life changes to the work system that my work colleagues and myself wanted to make the work day go by that much faster.

#### How it works:
This is a layer of javascript that is loaded on top of the system page load. It introduces various extra functions and pages, css style sheets and fixes bugs that were "denied because it's not worth fixing". It uses a free vercel host that mirrors this repository so it can be directly added into a browser extension to load external js.

#### Key features of note:
Revamped reports; including various reporting presets and a visual display of report data before download.
Actual user and team producivity pages with statistics directly pulled from reports.
Modifications to the stylesheet to make the site look and run better.
There are other smaller modifications made, look below at the patches list to see all the specific changes.

#### How to use (Chromium):
- Get [User JavaScript and CSS extension.](https://chromewebstore.google.com/detail/user-javascript-and-css/nbhcbdghjpllgmfilhnhkllmkecfmpld?hl=en)
- The extension requires exension developer mode; go to [manage extensions](chrome://extensions) and click the switch to enable developer mode.
- Go to system homepage (dashboard).
- Click on the extention and add a new rule.
- Add a '/*' to the end of the url to ensure it works on all pages.
- Paste code from [inject.js](https://simple-patches.vercel.app/inject.js) into js side.

#### How to use (Firefox):
- I don't have a good recommendation for an extension, just find something that allows JS injects.
- Paste the code from [inject.js](https://simple-patches.vercel.app/inject.js) into the code editor.

#### Patches:
- On all pages; CSS fix to correct spacing issues in header.
- On all pages; CSS fix to get rid of light mode logo.
- On all pages; CSS fix (that I shouldn't have to do) to fix page height issues not filling the full background.
- On all pages; CSS fixes to alter some colors for better dark mode enhancement.
- On all pages; Added new button to quickly clock out and record time at the same time.
  - The activity name mirrors the clock task.
  - Field to input notes.
  - Hijacks existing modal layout for data entry (with animations).
- On all pages; CSS additions to header and clock buttons to handle the additional buttons.
- On all pages; Added details and CSS modifications to product modal:
  - Added a label for the product to print the created date.
  - Added a label for the product to print the status, color-coded.
  - Added a label for the product displaying the number of pictures on the product.
  - If the product has images, added a label for the product displaying the filename of the first picture of the product.
  - Added a column to the items table for when that item was created.
  - Added a column to the items table for the number of images specifically on the item.
  - Adjusted the width of various columns to make it fit better; shrunk location width, expanded width of created, sku and condition name.
  - Adjusted some of the heading labels to make them shorter, better for width (In Stock and Stock Available).
- On all pages; Added a refresh check to clock in tasks, every minute it checks and applies the clock-in task if it has changed.
- On product and item pages; CSS fix for layout of cards.
- On product and item pages; CSS fix for image box being too small.
- On product and item pages; CSS fix for images inside upload box not wrapping properly.
- On product and item pages; CSS fix for activity log where the color of the name is dark even when the page is in dark mode.
- On product and item pages; Fix to show metadata update name in activity log using live data.
- On product and item pages; Added a button to jump to a special search in the pending inventory queue.
- On product and item pages; Fix to the media tab by removing the existing, bad gallery viewer. Opens image in a new tab (as god intended).
- On product and item pages; Fix to prevent newly uploaded images when clicked to default a-tag behavior. It also opens in a new tab.
- On product and item pages; Fix to prevent navigation away while images are still uploading.
- On product and item pages; Added extra upload options:
  - Upload pictures from a SKU or SID. Select type and paste in the thing to steal from, preview appears with the pictures in order for fast transfer.
  - Upload pictures from a URL. This only works for the allowed system CDN links.
- On product and item pages; Added button to open all images in new tabs (enable popups in browser for it to work).
- On product and item pages; Added a popups check message on above button hover.
- On product and item pages; Added a 'copy to clipboard' button to copy unique identifier code for photo filenames.
- On product and item pages; Added a delete all images button.
- On product and item pages; Modified the image list to be an actual list instead of a grid.
- On product pages; On all ASIN inputs, a link is generated under the input field to go to the ASIN on Amazon.
- On product pages; Added approved drop down options to existing color attribute field.
- On item pages; CSS change to increase the maximum height of the inventory table.
- On listing page; A warning for when the GTIN is invalid and needs to be regenerated before going to the last step. (12 chars error)
- On listing page; A warning for when the GTIN is changed to remind the user to replace the old label with a new one.
- On listing page; when a GTIN is generated/replaced from the original, an option appears to replace the product's GTIN back to the originally listed GTIN and the generated GTIN as the secondary.
- On New Inventory Page; When a result appears that's In Catalog, the text is replaced with a link to open the SID modal.
- On New Inventory Page; Disabled entry of new inventory sent to listing without a GTIN.
- On New Inventory Page; Disabled entry of new inventory sent to listing with a GTIN longer than 12 characters.
- On New Inventory Page; Automatic response for invalid GTIN in input box.
- On New Inventory Page; Checkbox toggle to auto select searched text after making search for hands-free scanning.
- On New Inventory Page (and others but mainly for here); Change to UI-block loading wheel so it appears at the top of the div instead of the middle, and made it larger, so you can see that it is actually loading and not just sitting there.
- On pending inventory queue page; Added a button to load icons of product images into the table.
  - There is no way to get a reduced sized image from the image cdn.
  - The process is resource heavy so it has to be a button so it can be used when it is needed.
- On pending inventory queue page; Patch added to allow GET parameters to auto-do a search.
  - Now links to search in pending inventory can be used throughout the patch.
- On reports page, after submitting to generate a new report, the report displays under the original card.
  - If the file is larger than 1MB, the printing is disabled to save performance.
  - Links for products and items are automatically added into the report preview for convenience.
- On reports page, added a card to generate a preset report.
  - Added Listing department productivity reporting preset.
  - Added Marketing department productivity reporting preset.
  - Added a report for all created items (filtered) from a specified date.
  - Added Missing Picture report for Defective, Incomplete and Imaging Issues (Created last 30 days).
  - Added a Complete Missing Picture report for all items and products in the system.
  - Added a Product Items list of products over QTY 50 with ASIN column.
  - Added a tool to look up the history of a sid's skus.
  - Added a tool to look up the history of a sku.
  - Added a tool to look up the history of an event id.
  - Added a list of products that have incorrect color attributes.
- On reports page, added a css fix to correct the resize on narrow screens happening too late.
- On reports page, added css rule to flip the order of recents and main reporting tool because recents aren't THAT important.
- On Dashboard; Added quick link buttons to commonly used functions in the system (that are usually hidden behind a cascade menu).
- On Dashboard; Replaced the Engage Widget with a button to the project vercel home page; along with a rotating image for a splash of fun, I guess...
- On Calendar; CSS fix to add a background color to the list of day's events.
- On Integrations Error Page, replaced SKU references with links to the actual SKUs.
- On Tools Page, restructured the tool cards so it makes more sense in css.
- On Tools Page, added tool link to email-import so it can be used as a tool.
- On Tools Page, added tool link to simple patches cdn uploader.
- Replaced unfinished producivity pages.
  - Created Team productivity (just our department) and User productivity (hijacks a loose JS variable from the user profile page).
  - Removes duplicate entries from appearing in reports (its not really duplicates but it doesn't count)
  - Breaks down by Clock-In task and event code. Displays the added units and takes the sum of all time spent in minutes for each entry.
  - Displays it in a nice flex-grid thing.
  - Prints the full, original report generated when getting producivity under the counts and breakdowns.
  - Added a date selector to look at any producivity report within the last year.
- In Conditions Queues; Export Table button to save each visible line item into a csv. (In-system solution made, keeping it because its cool)
- In Conditions Queues; Get Total button to ge the total quantity of all visible line items.

#### Future:
- Better modal animations.
- Create a proper set of CSS rules for dark mode.
- Overhaul of CSS sizing, everything is so large that the page requires it to be zoomed out in order to be used.