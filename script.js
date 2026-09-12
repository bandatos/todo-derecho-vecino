function toggleInfoBox(button) {
    const infoBox = document.getElementById(button.dataset.infoBox);
    const isOpen = button.getAttribute("aria-expanded") === "true";

    if (!isOpen) {
        infoBox.classList.remove("hidden");
        button.setAttribute("aria-expanded", "true");

        // Allow the browser to register the display change before fading in
        requestAnimationFrame(() => {
            if (button.getAttribute("aria-expanded") === "true") {
                infoBox.classList.add("show");
            }
        });
    } else {
        button.setAttribute("aria-expanded", "false");

        if (!infoBox.classList.contains("show")) {
            infoBox.classList.add("hidden");
            return;
        }

        infoBox.classList.remove("show");

        infoBox.addEventListener("transitionend", () => {
            if (!infoBox.classList.contains("show")) {
                infoBox.classList.add("hidden");
            }
        }, { once: true });
    }
}

document.querySelectorAll(".info-toggle").forEach((button) => {
    button.addEventListener("click", () => toggleInfoBox(button));
});

const CLOUD_RUN_SERVICE_URL = 'https://tdv-rag-app-693380294336.us-central1.run.app/';
// const CLOUD_RUN_SERVICE_URL = 'http://localhost:8080'; // For local testing

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

    if (!data || !data.processed_output) {
        outputDisplay.textContent = 'No processed output received.';
        return;
    }

    const escapeHtml = (text) => text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');

    const formatInlineText = (text) => {
        // Support escaped Markdown markers: \*\*text\*\*
        const normalizedText = text.replace(/\\([*_])/g, '$1');

        return escapeHtml(normalizedText)
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    };

    // Convert literal "\n" sequences into real line breaks
    const normalizedOutput = data.processed_output
        .replace(/\r\n?/g, '\n')
        .replace(/\\n/g, '\n');

    const lines = normalizedOutput.split('\n');
    const html = [];
    const paragraphLines = [];
    const listLevels = [];

    const closeLists = () => {
        while (listLevels.length) {
            html.push('</li></ul>');
            listLevels.pop();
        }
    };

    const flushParagraph = () => {
        if (paragraphLines.length) {
            html.push(
                `<p>${paragraphLines
                    .map(formatInlineText)
                    .join('<br>')}</p>`
            );

            paragraphLines.length = 0;
        }
    };

    lines.forEach((line) => {
        const bullet = line.match(/^(\s*)\*+\s+(.*)$/);

        if (bullet) {
            flushParagraph();

            const indentation = bullet[1].length;

            while (
                listLevels.length &&
                indentation < listLevels[listLevels.length - 1]
            ) {
                html.push('</li></ul>');
                listLevels.pop();
            }

            if (
                !listLevels.length ||
                indentation > listLevels[listLevels.length - 1]
            ) {
                html.push('<ul>');
                listLevels.push(indentation);
            } else {
                html.push('</li>');
            }

            html.push(`<li>${formatInlineText(bullet[2])}`);
            return;
        }

        if (!line.trim()) {
            flushParagraph();
            closeLists();
            return;
        }

        if (listLevels.length) {
            html.push(`<br>${formatInlineText(line.trim())}`);
        } else {
            paragraphLines.push(line);
        }
    });

    flushParagraph();
    closeLists();

    // Convert any remaining newline characters into HTML line breaks
    const formattedHtml = html.join('').replace(/\n/g, '<br>');

    outputDisplay.innerHTML = `
        <div style="
            white-space: normal;
            line-height: 1.6;
            font-family: Arial, sans-serif;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
        ">
            ${formattedHtml}
        </div>
    `;
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
        showStatus('Consulta completada con éxito', 'success');
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
