document.getElementById("btnProblema").addEventListener("click", () => {
    const box = document.getElementById("infoBox");

    box.classList.remove("hidden");

    // Allow the browser to register the display change before fading in
    setTimeout(() => {
        box.classList.add("show");
    }, 20);
});


const CLOUD_RUN_SERVICE_URL = 'https://todo-derecho-vecino-693380294336.us-south1.run.app';

// Get references to HTML elements
const userInput = document.getElementById('userInput');
const submitButton = document.getElementById('submitButton');
const outputDisplay = document.getElementById('outputDisplay');
const statusMessage = document.getElementById('statusMessage');
const errorMessage = document.getElementById('errorMessage');

// Function to update the output display area
function updateOutputDisplay(data) {
    // Clear previous error messages
    errorMessage.textContent = ''; 
    statusMessage.textContent = '';

    if (data && data.processed_output) {
        // Assuming Cloud Run returns an object with a 'processed_output' field
        outputDisplay.textContent = JSON.stringify(data.processed_output, null, 2); // Prettify JSON output
        // If your output is simple text, just use: outputDisplay.textContent = data.processed_output;
    } else {
        outputDisplay.textContent = 'No processed output received.';
    }
}

// Function to show a temporary status message (e.g., loading)
function showStatus(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `message ${type}`; // Add styling class
}

// Function to show an error message
function showErrorMessage(message) {
    errorMessage.textContent = `Error: ${message}`;
    statusMessage.textContent = ''; // Clear other status messages
}

// Function to send text to Cloud Run
async function sendTextToCloudRun(inputText) {
    showStatus('Processing your text...', 'info');
    outputDisplay.textContent = ''; // Clear previous output

    try {
        const response = await fetch(CLOUD_RUN_SERVICE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: inputText }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
            throw new Error(`HTTP status ${response.status}: ${errorData.message || 'Server error'}`);
        }

        const result = await response.json(); // Parse the JSON response from Cloud Run
        updateOutputDisplay(result); // Update the HTML with the result
        showStatus('Processing complete!', 'success');
        return result;

    } catch (error) {
        console.error('Error sending text to Cloud Run:', error);
        showErrorMessage(error.message); // Display error on the page
    }
}

// Event Listener for the submit button
submitButton.addEventListener('click', async () => {
    const textToSend = userInput.value.trim(); // .trim() removes leading/trailing whitespace

    if (textToSend) {
        await sendTextToCloudRun(textToSend);
    } else {
        showErrorMessage('Please enter some text before processing.');
    }
});
