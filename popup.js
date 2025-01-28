document.addEventListener("DOMContentLoaded", () => {
  const bookmarksContainer = document.getElementById("bookmarks-container");
  
  // Store the bookmarks in a global variable
  let allBookmarks = [];
  
  // Function to create bookmark elements
  function createBookmarkElements(data) {
    bookmarksContainer.innerHTML = ''; // Clear existing content
  
    if (Object.keys(data).length === 0) {
      bookmarksContainer.innerHTML = '<p>No bookmarks found.</p>';
      return;
    }
  
    for (const [site, bookmarks] of Object.entries(data)) {
      // Create site container
      const siteContainer = document.createElement('div');
      siteContainer.classList.add('site-container');
  
      // Create collapsible title
      const siteTitle = document.createElement('div');
      siteTitle.classList.add('site-title');
      siteTitle.innerHTML = `
        <span>${site}</span>
        <span class="toggle-icon">▼</span>
      `;
      siteContainer.appendChild(siteTitle);
  
      // Create collapsible bookmark list
      const bookmarkList = document.createElement('ul');
      bookmarkList.classList.add('collapsible');
  
      // Add bookmarks
      bookmarks.forEach(({ url, title, date }) => {
        const listItem = document.createElement('li');
        listItem.classList.add('bookmark-item');
        listItem.innerHTML = `
          <div class="bookmark-header">
            <img src="https://www.google.com/s2/favicons?domain=${url}" class="favicon" alt="favicon">
            <a href="${url}" target="_blank">${title}</a>
            <span class="date">${date}</span>
          </div>
          <div class="bookmark-actions">
            <button class="edit-btn" data-url="${url}">Edit</button>
            <button class="remove-btn" data-url="${url}">Remove</button>
          </div>
        `;
        bookmarkList.appendChild(listItem);

        // Add event listeners for edit and remove buttons
        listItem.querySelector('.edit-btn').addEventListener('click', () => editBookmark(url));
        listItem.querySelector('.remove-btn').addEventListener('click', () => removeBookmark(url));
      });
  
      siteContainer.appendChild(bookmarkList);
      bookmarksContainer.appendChild(siteContainer);
  
      // Add toggle functionality
      siteTitle.addEventListener('click', () => {
        bookmarkList.classList.toggle('collapsible');
        siteTitle.classList.toggle('collapsed');
      });
    }
  }
  
  // Function to categorize bookmarks
  function categorizeBookmarks(bookmarks) {
    const categorized = {};
  
    bookmarks.forEach(bookmark => {
      const url = new URL(bookmark.url);
      const domain = url.hostname.replace('www.', '');
  
      if (!categorized[domain]) {
        categorized[domain] = [];
      }
  
      categorized[domain].push({
        url: bookmark.url,
        title: bookmark.title || domain,
        date: new Date().toISOString().split('T')[0], // Add date for display
      });
    });
  
    return categorized;
  }
  
  // Edit bookmark function
  function editBookmark(url) {
    const newTitle = prompt('Enter a new title for this bookmark:');
    if (newTitle) {
      chrome.bookmarks.search({ url: url }, (results) => {
        const bookmark = results[0];
        chrome.bookmarks.update(bookmark.id, { title: newTitle });
      });
    }
  }

  // Remove bookmark function
  function removeBookmark(url) {
    chrome.bookmarks.search({ url: url }, (results) => {
      const bookmark = results[0];
      chrome.bookmarks.remove(bookmark.id);
      location.reload(); // Refresh the bookmarks
    });
  }

  // Fetch bookmarks using Chrome Bookmarks API
  chrome.bookmarks.getTree((bookmarkTreeNodes) => {
    function extractBookmarks(nodes) {
      let allBookmarks = [];
  
      nodes.forEach(node => {
        if (node.url) {
          allBookmarks.push({
            url: node.url,
            title: node.title,
          });
        }
  
        if (node.children) {
          allBookmarks = allBookmarks.concat(extractBookmarks(node.children));
        }
      });
  
      return allBookmarks;
    }
  
    allBookmarks = extractBookmarks(bookmarkTreeNodes);
    const categorizedBookmarks = categorizeBookmarks(allBookmarks);
    createBookmarkElements(categorizedBookmarks);
  });
});
