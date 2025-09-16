import app from './app.js';
import 'dotenv/config'; // Ensures .env variables are loaded

// Define the port, defaulting to 5050 if not specified in .env
const PORT = process.env.PORT || 5050;

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});