if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Hello from Shopify App!');
        // Create a new anchor element
        var a = document.createElement('a');
        // Set the hyperlink reference
        a.href = "https://wa.me/15550717955";
        // Set the text
        a.textContent = "Go to whatsapp chat";
        // Append the anchor element to the body
        document.body.appendChild(a);
    });
} else {
    // DOMContentLoaded has already fired
    console.log('Hello from Shopify App, its Ahmed!');
    // Create a new anchor element
    var a = document.createElement('a');
    // Set the hyperlink reference
    a.href = "https://wa.me/15550717955";
    // Set the text
    a.textContent = "Go to whatsapp chat";
    // Append the anchor element to the body
    document.body.appendChild(a);
}