# pt2

pt2 is a browser extension which allows you to keep track of content changes on web pages.

The extension will add `action` button to the browser toolbar. When the button is clicked,
the extension opens via popup window. The popup window will show the list of all
tracked pages.

You can add new pages to the list by clicking on the `Add` button. The extension
will inject `inject.js` content script into the current tab. The content script
will highlight elements under the mouse cursor. You can select the element by clicking
on it. Content script will send the unique selector of the selected element along with
the page URL and the page title to the extension's background script. The background
script will save the data to the `browser.storage.sync` storage and notify the user
that the page was added to the list by adding the badge to the extension's icon.

When user clicks on the extension's icon, the extension requests the list of all
tracked pages from the `browser.storage.sync` storage and displays it in the popup.
It will also send the message to the background script to load the content
of the page and extract the text from the element which matches the selector.

## Development
### System requirements
 - Fedora 39 or similar
 - Node.js 20
 - Firefox 121 or similar

### How to test
```bash
# Install all dependencies
npm ci

# Start vite in watch mode. The extension will be available in `dist/` folder
npm run dev

# In the separate terminal, start browser and test extension
npm run open
```

> Note: after running `npm run open` you will need to manually allow the extension
to access all websites. This is required for the extension to work properly. To do so,
right click on the extension icon in the browser toolbar and select `Manage Extension`.
Then, in the opened page, click on the `Permissions` tab and enable `Access your data for all websites`.
