document.getElementById("btnProblema").addEventListener("click", () => {
    const box = document.getElementById("infoBox");

    box.classList.remove("hidden");

    // Allow the browser to register the display change before fading in
    setTimeout(() => {
        box.classList.add("show");
    }, 20);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////

// Example usage:
// Imagine you have an HTML input field with id="userInput" and a button with id="submitButton"
const submitButton = document.getElementById('submitButton');

submitButton.addEventListener('click', async () => {
  const userInput = document.getElementById('userInput').value;
  if (userInput) {
    const processedData = await sendTextToCloudRun(userInput);
    // Update your HTML to display processedData
  } else {
    alert('Please enter some text.');
  }
});

// Function to send text to Cloud Runrun.app
async function sendTextToCloudRun(inputText) {
  // Replace with your actual Cloud Run service URL
  const cloudRunServiceUrl = 'https://todo-derecho-vecino-693380294336.us-south1.run.app';

  try {
    const response = await fetch(cloudRunServiceUrl, {
      method: 'POST', // Specify the HTTP method
      headers: {
        'Content-Type': 'application/json', // Indicate that you're sending JSON
      },
      // Convert your text input into a JSON string
      // The Cloud Run service will expect a 'text' key in the JSON object
      body: JSON.stringify({ text: inputText }),
    });

    if (!response.ok) {
      // Handle HTTP errors (e.g., 404, 500)
      const errorData = await response.json();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorData.message}`);
    }

    const result = await response.json(); // Parse the JSON response from Cloud Run
    console.log('Cloud Run response:', result);
    // You can now display 'result' on your GitHub Pages site
    return result;

  } catch (error) {
    console.error('Error sending text to Cloud Run:', error);
    // Handle network errors or other exceptions
  }
}