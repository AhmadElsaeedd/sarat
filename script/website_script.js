if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('Hello from Shopify App!');
        // Create a new div element as a container
        var div = document.createElement('div');
div.style.position = "fixed";
div.style.bottom = "20px";
div.style.right = "20px";
div.style.backgroundColor = "white";
div.style.padding = "20px";
div.style.borderRadius = "10px";
div.style.width = "300px";
div.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";
div.style.zIndex = "1000"; // Add this line

        // Add animation
        div.style.animation = "updown 2s infinite";

        // Create a close button
        var closeButton = document.createElement('button');
closeButton.textContent = "X";
closeButton.style.position = "absolute";
closeButton.style.top = "10px";
closeButton.style.right = "10px";
closeButton.style.border = "none";
closeButton.style.background = "none";
closeButton.style.color = "black"; // Black text
closeButton.style.fontSize = "20px";
closeButton.style.cursor = "pointer";
closeButton.onmouseover = function() {
    closeButton.style.color = "#999"; // Dark gray when mouse over
};
closeButton.onmouseout = function() {
    closeButton.style.color = "black"; // Black when mouse out
};
closeButton.onclick = function() {
    // Remove the popup from the document when the close button is clicked
    document.body.removeChild(div);
};
div.appendChild(closeButton);

        // Create a new paragraph element for the title
        var p1 = document.createElement('p');
        p1.textContent = "Want 10% off your order?";
        p1.style.fontWeight = "bold";
        p1.style.textAlign = "center";
        p1.style.marginBottom = "10px";

        // Create a new paragraph element for the subtitle
        var p2 = document.createElement('p');
        p2.textContent = "Sign up for texts to unlock your discount";
        p2.style.textAlign = "center";
        p2.style.marginBottom = "20px";

        // Create a new input element for phone numbers
        var input = document.createElement('input');
        input.type = "text";
        input.placeholder = "Enter your phone number";
        input.style.width = "100%";
        input.style.marginBottom = "10px";

        // Create a new button element for submission
        var button = document.createElement('button');

        button.style.paddingTop = "0px";
        button.style.paddingBottom = "0px";
        button.textContent = "Submit";
        button.style.width = "100%";
        button.style.padding = "10px";
        button.style.marginBottom = "10px";
        button.style.border = "none";
        button.style.backgroundColor = "#008CBA"; // Blue color
        button.style.color = "white"; // White text
        button.style.cursor = "pointer";
        button.onclick = function() {
            // Connect to Firebase and do something with the input value
            console.log("Submitted with value: " + input.value);
        
            fetch('/cart.js').then(async res => {
                let cart = await res.json();
                cart.phone_number = input.value;

                // Make a POST request to your server
                const response = await fetch('https://us-central1-textlet-test.cloudfunctions.net/webhook/firebase/SetNewCart', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        cart: cart,
                        shop: Shopify.shop
                    })
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log(data);
            })
        };

        // Create a new paragraph element for the 'or' text
        var p3 = document.createElement('p');
        p3.textContent = "or";
        p3.style.textAlign = "center";
        p3.style.marginBottom = "10px";

        // Create a new anchor element
        var a = document.createElement('a');
        // Set the hyperlink reference
        a.href = "https://wa.me/15550717955";
        // Set the text
        a.innerHTML = "<u>Go to Whatsapp</u> and text us to automatically unlock your discount";
        a.style.textAlign = "center";
        a.style.display = "block";

        // Append the elements to the div
        div.appendChild(p1);
        div.appendChild(p2);
        div.appendChild(input);
        div.appendChild(button);
        div.appendChild(p3);
        div.appendChild(a);

        // Append the div to the body
        document.body.appendChild(div);

        // Add CSS for animation
        var style = document.createElement('style');
        style.innerHTML = `
        @keyframes updown {
            0% { bottom: 20px; }
            50% { bottom: 30px; }
            100% { bottom: 20px; }
        }`;
        document.head.appendChild(style);
    });
} else {
    // DOMContentLoaded has already fired
    console.log('Hello from Shopify App, its Ahmed!');
    // Similar to the above, create and append elements here
            // Create a new div element as a container
            var div = document.createElement('div');
div.style.position = "fixed";
div.style.bottom = "20px";
div.style.right = "20px";
div.style.backgroundColor = "white";
div.style.padding = "20px";
div.style.borderRadius = "10px";
div.style.width = "300px";
div.style.boxShadow = "0px 0px 10px rgba(0,0,0,0.5)";
div.style.zIndex = "1000"; // Add this line
    
            // Add animation
            div.style.animation = "updown 2s infinite";
    
            // Create a close button
            var closeButton = document.createElement('button');
closeButton.textContent = "X";
closeButton.style.position = "absolute";
closeButton.style.top = "10px";
closeButton.style.right = "10px";
closeButton.style.border = "none";
closeButton.style.background = "none";
closeButton.style.color = "black"; // Black text
closeButton.style.fontSize = "20px";
closeButton.style.cursor = "pointer";
closeButton.onmouseover = function() {
    closeButton.style.color = "#999"; // Dark gray when mouse over
};
closeButton.onmouseout = function() {
    closeButton.style.color = "black"; // Black when mouse out
};
closeButton.onclick = function() {
    // Remove the popup from the document when the close button is clicked
    document.body.removeChild(div);
};
div.appendChild(closeButton);
    
            // Create a new paragraph element for the title
            var p1 = document.createElement('p');
            p1.textContent = "Want 10% off your order?";
            p1.style.fontWeight = "bold";
            p1.style.textAlign = "center";
            p1.style.marginBottom = "10px";
    
            // Create a new paragraph element for the subtitle
            var p2 = document.createElement('p');
            p2.textContent = "Sign up for texts to unlock your discount";
            p2.style.textAlign = "center";
            p2.style.marginBottom = "20px";
    
            // Create a new input element for phone numbers
            var input = document.createElement('input');
            input.type = "text";
            input.placeholder = "Enter your phone number";
            input.style.width = "100%";
            input.style.marginBottom = "10px";
    
            // Create a new button element for submission
            var button = document.createElement('button');
            button.style.paddingTop = "0px";
            button.style.paddingBottom = "0px";
            button.textContent = "Submit";
            button.style.width = "100%";
            button.style.padding = "10px";
            button.style.marginBottom = "10px";
            button.style.border = "none";
            button.style.backgroundColor = "#008CBA"; // Blue color
            button.style.color = "white"; // White text
            button.style.cursor = "pointer";
            button.onclick = function() {
                // Connect to Firebase and do something with the input value
                console.log("Submitted with value: " + input.value);
            
                fetch('/cart.js').then(async res => {
                    let cart = await res.json();
                    cart.phone_number = input.value;

                    // Make a POST request to your server
                    const response = await fetch('https://us-central1-textlet-test.cloudfunctions.net/webhook/firebase/SetNewCart', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            cart: cart,
                            shop: Shopify.shop
                        })
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log(data);
                })
            };
    
            // Create a new paragraph element for the 'or' text
            var p3 = document.createElement('p');
            p3.textContent = "or";
            p3.style.textAlign = "center";
            p3.style.marginBottom = "10px";
    
            // Create a new anchor element
            var a = document.createElement('a');
            // Set the hyperlink reference
            a.href = "https://wa.me/15550717955";
            // Set the text
            a.innerHTML = "<u>Go to Whatsapp</u> and text us to automatically unlock your discount";
            a.style.textAlign = "center";
            a.style.display = "block";
    
            // Append the elements to the div
            div.appendChild(p1);
            div.appendChild(p2);
            div.appendChild(input);
            div.appendChild(button);
            div.appendChild(p3);
            div.appendChild(a);
    
            // Append the div to the body
            document.body.appendChild(div);
    
            // Add CSS for animation
            var style = document.createElement('style');
            style.innerHTML = `
            @keyframes updown {
                0% { bottom: 20px; }
                50% { bottom: 30px; }
                100% { bottom: 20px; }
            }`;
            document.head.appendChild(style);
}