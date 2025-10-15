## Hello!
This is just various javascript-based quality of life patches to our work system so we can better interface with it, complete time-consuming tasks faster and make the day go by slightly faster.

#### How it works:
With the inject js code, it will load various extra scripts and css files depending on what page of the system your on.
Each page as its own set of "patches" so that way not everything has to be downloaded and loaded on each page navigation.
These can be small things like fixing annoying or broken css to introducing extra, necessary features for various day-to-day tasks.
The reason why this github exists is so I can deploy it using vercel for free. Version control is also nice.

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
- Optional: Add contents of injex.css to fix loading issues caused by adding the patch.

#### How to use (Firefox):
- I don't have a good recommendation for an extension, just find something that allows JS injects.
- Paste the code from [inject.js](https://simple-patches.vercel.app/inject.js) into the code editor.

## Patch List
Below is a detailed list of all the pages made to the site. Everything that is modified is outlined below. The code is also open source (obviously) so feel free to see specifically what it is doing.

#### Temporary Patches:
No temporary patches at the moment.

#### Settings Patches:
These are patches added to a special settings box the user can edit.
- Patch to add a list of custom activity codes to be added as prefill options when recording clock out.
- Patch to replace the user's icon with a custom image from a url.
- Patch to add a background image globally.
  - Option to set the object position, anchoring the image.
  - Option to set the object fit, changing how it fills and covers the background.
  - Option to set the image opacity, so it better blends in the background/keep text readable.
  - Also adjusts card background to be slightly transparent to blend better.
- Option to set extra global css rules.

#### Global Patches:
- When the user is clocked into the Pictures task, an extra button and window is added for bulk location updates.
  - Textarea to drop a list of SKUs or SIDs to be updated; comma, space or new line separated is accepted.
  - Progress bar to see how much is done.
  - Printout for success and failiures.
- CSS fix to correct spacing issues in header.
- CSS fix to get rid of light mode logo.
- CSS fix (that I shouldn't have to do) to fix page height issues not filling the full background.
- CSS fixes to alter some colors for better dark mode enhancement.
- Added new button to quickly clock out and record time at the same time.
  - The activity name mirrors the clock task.
  - Field to input notes.
  - Hijacks existing modal layout for data entry (with animations).
- CSS additions to header and clock buttons to handle the additional buttons.
- Added details and CSS modifications to product modal:
  - Added a label for the product to print the created date.
  - Added a label for the product to print the status, color-coded.
  - Added a label for the product displaying the number of pictures on the product.
  - If the product has images, added a label for the product displaying the filename of the first picture of the product.
  - Added a column to the items table for when that item was created.
  - Added a column to the items table for the number of images specifically on the item.
  - Adjusted the width of various columns to make it fit better; shrunk location width, expanded width of created, sku and condition name.
  - Adjusted some of the heading labels to make them shorter, better for width (In Stock and Stock Available).
- Added a refresh check to clock in tasks, every minute it checks and applies the clock-in task if it has changed.
- Change to UI-block loading wheel so it appears at the top of the div instead of the middle, and made it larger, so you can see that it is actually loading and not just sitting there.
- When clocked into the pictures task, there is an activity buster to prevent the logout. This also means when clocked into pictures you're sendign user activity that you're active the whole time, so remember to clock out!

#### Product and Item Page Patches:
- CSS fix for layout of cards.
- CSS fix for image box being too small.
- CSS fix for images inside upload box not wrapping properly.
- CSS fix for activity log where the color of the name is dark even when the page is in dark mode.
- Fix to show metadata update name in activity log using live data.
- Added a button to jump to a special search in the pending inventory queue.
- Fix to the media tab by removing the existing, bad gallery viewer. Opens image in a new tab (as god intended).
- Fix to prevent newly uploaded images when clicked to default a-tag behavior. It also opens in a new tab.
- Fix to prevent navigation away while images are still uploading.
- Added extra upload options:
  - Upload pictures from a SKU or SID. Select type and paste in the thing to steal from, preview appears with the pictures in order for fast transfer.
  - Upload pictures from a URL. This only works for the allowed system CDN links.
- Added button to open all images in new tabs (enable popups in browser for it to work).
- Added a popups check message on above button hover.
- Added a 'copy to clipboard' button to copy unique identifier code for photo filenames.
- Added a delete all images button.
- Modified the image list to be an actual list instead of a grid.
- On all ASIN inputs, a link is generated under the input field to go to the ASIN on Amazon.
- Added approved drop down options to existing color attribute field.
- CSS change to increase the maximum height of the inventory table.
- Added a button in the tools to open the product/item in FBA check or Pending Inventory, using GET parameters patch.
- Added a new button above the attributes form to bulk resubmit all channels for in stock skus under the sid.

#### Listing Patches:
- Custom feature to prepend "PICTURES" to all newly-created SKUs Locations.
- A warning for when the GTIN is invalid and needs to be regenerated before going to the last step. (12 chars error)
- A warning for when the GTIN is changed to remind the user to replace the old label with a new one.
- when a GTIN is generated/replaced from the original, an option appears to replace the product's GTIN back to the originally listed GTIN and the generated GTIN as the secondary.
- A warning appears when the user is not clocked into the Listing taks.
- When prefill creating, if there is no picture, the picture is stock or has invalid dimensions, a warning appears.

#### New Inventory Page Patches:
-  When a result appears that's In Catalog, the text is replaced with a link to open the SID modal.
-  Disabled entry of new inventory sent to listing without a GTIN.
-  Disabled entry of new inventory sent to listing with a GTIN longer than 12 characters.
-  Automatic response for invalid GTIN in input box.
-  Checkbox toggle to auto select searched text after making search for hands-free scanning.

#### Pending Inventory Page Patches:
- Added a button to load icons of product images into the table.
  - There is no way to get a reduced sized image from the image cdn.
  - The process is resource heavy so it has to be a button so it can be used when it is needed.
- Added GET parameters to auto-do a search.
  - Now links to search in pending inventory can be used throughout the patch.
- Added a keywords search button to search by listing keywords/PO.

#### Reports Page Patches:
- After submitting to generate a new report, the report displays under the original card.
  - If the file is larger than 1MB, the printing is disabled to save performance.
  - Links for products and items are automatically added into the report preview for convenience.
- Aadded a card to generate a preset report.
  - Added Listing department productivity reporting preset.
  - Added Marketing department productivity reporting preset.
  - Added a report for all created items (filtered) from a specified date.
  - Added Missing Picture report for Defective, Incomplete and Imaging Issues (Created last 30 days).
  - Added a Complete Missing Picture report for all items and products in the system.
  - Added a Product Items list of products over QTY 50 with ASIN column.
  - Added a report that gets total inventory stock by SID.
  - Added a tool to look up the history of a sid's skus.
  - Added a tool to look up the history of a sku.
  - Added a tool to look up the history of an event id.
  - Added a list of products that have incorrect color attributes.
- Added a css fix to correct the resize on narrow screens happening too late.
- Added css rule to flip the order of recents and main reporting tool because recents aren't THAT important.

#### Intergations Errors Page:
- Added a button to download the table into a csv.
- Added a new column for In Stock SKUs
  - Will load the SKU page to get the in stock for that SKU and adds a new column with that number.

#### Other Page Patches:
- On Dashboard; Added quick link buttons to commonly used functions in the system (that are usually hidden behind a cascade menu).
- On Dashboard; Replaced the Engage Widget with a button to the project vercel home page; along with a rotating image for a splash of fun, I guess...
- On Calendar; CSS fix to add a background color to the list of day's events.
- On Integrations Error Page, replaced SKU references with links to the actual SKUs.
- On Tools Page, restructured the tool cards so it makes more sense in css.
- On Tools Page, added tool link to email-import so it can be used as a tool.
- On Tools Page, added tool link to simple patches cdn uploader.
- In Conditions Queues; Export Table button to save each visible line item into a csv. (In-system solution made, keeping it because its cool)
- In Conditions Queues; Get Total button to ge the total quantity of all visible line items.

#### Additional Patches:
- Replaced unfinished producivity pages.
  - Created Team productivity (just our department) and User productivity (hijacks a loose JS variable from the user profile page).
  - Removes duplicate entries from appearing in reports (its not really duplicates but it doesn't count)
  - Breaks down by Clock-In task and event code. Displays the added units and takes the sum of all time spent in minutes for each entry.
  - Displays it in a nice flex-grid thing.
  - Prints the full, original report generated when getting producivity under the counts and breakdowns.
  - Added a date selector to look at any producivity report within the last year.

#### Future Patches:
- Proper handling of users in different departments, Listing department is hard-coded for productivity page.
- Create a proper set of CSS rules for dark mode.
- Overhaul of CSS sizing, everything is so large that the page requires it to be zoomed out in order to be used.