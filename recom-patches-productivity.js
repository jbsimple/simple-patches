fetch('/user/me')
    .then(response => response.text())
    .then(html => {
        // Extract script contents
        const scriptMatch = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
        if (scriptMatch) {
            for (const script of scriptMatch) {
                // Look for userID assignment
                const userIdMatch = script.match(/userID\s*=\s*(\d+);/);
                if (userIdMatch) {
                    console.log('PATCHES - Extracted userID:', userIdMatch[1]);
                    return userIdMatch[1]; // Return the extracted userID
                }
            }
        }
        console.log('userID not found');
    })
    .catch(error => console.error('Error fetching the page:', error));
