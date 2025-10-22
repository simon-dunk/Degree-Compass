import csv
import re
import json
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import time
# Assuming get_env.py exists to read .env files
# If not, replace get_env_value with os.getenv and ensure dotenv is installed and loaded
# e.g., import os; from dotenv import load_dotenv; load_dotenv()
try:
    from get_env import get_env_value
except ImportError:
    import os
    from dotenv import load_dotenv
    load_dotenv()
    def get_env_value(key_name):
        return os.getenv(key_name)

from urllib.parse import urljoin
from collections import deque
import argparse
import sys
import os # Added for file operations

# --- Configuration ---
# Set the target URL, output file, and major code directly here
TARGET_URL = get_env_value("DEGREE_REQS_URL")
OUTPUT_JSON_FILE = "data/degree_requirements.json" # <<< SET YOUR OUTPUT FILE PATH HERE
MAJOR_CODE = "Computer_Science_BS" # <<< SET THE MAJOR CODE HERE


# --- API Key Configuration ---
# To get a key, visit https://makersuite.google.com/app/apikey
API_KEY = get_env_value("API_KEY") # IMPORTANT: REPLACE WITH YOUR ACTUAL API KEY or load from .env
if not API_KEY:
    print("Error: API_KEY not found in environment variables or .env file.")
    sys.exit(1)

# --- Rate Limiting Configuration ---
# Set your API limits here. They can be pulled from .env or defaulted.
RPM_LIMIT = int(get_env_value("RPM_LIMIT") or 60) # Peak requests per minute (RPM)
TPM_LIMIT = int(get_env_value("TPM_LIMIT") or 1000000) # Peak input tokens per minute (TPM)
RPD_LIMIT = int(get_env_value("RPD_LIMIT") or 1500) # Peak requests per day (RPD)

# Delay between fetching pages from the target website
WEBSITE_SCRAPE_DELAY = float(get_env_value("WEBSITE_SCRAPE_DELAY") or 1.0)  # Seconds to wait between website page fetches

# Configure the Generative AI client
genai.configure(api_key=API_KEY)
generation_config = {
    "temperature": 0.1, # Lower temperature for more deterministic, structured output
    "top_p": 1,
    "top_k": 1,
    "max_output_tokens": 8192,
    "response_mime_type": "application/json", # Request JSON output directly
}
# Configure safety settings as needed for your use case
safety_settings = [
    {"category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
    {"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_MEDIUM_AND_ABOVE"},
]
# Select the appropriate model
model = genai.GenerativeModel(
    model_name=get_env_value("DEGREE_REQS_SCRAPER_MODEL"), # Using Flash for potentially faster/cheaper processing
    generation_config=generation_config,
    safety_settings=safety_settings
)


# --- Throttler Class ---
class Throttler:
    """Manages API rate limits for RPM, TPM, and RPD."""

    def __init__(self, rpm_limit, tpm_limit, rpd_limit):
        self.rpm_limit = rpm_limit
        self.tpm_limit = tpm_limit
        self.rpd_limit = rpd_limit

        # Use deques for efficient pop/append from both ends
        # Tracks timestamps of all requests in the last 24 hours
        self.request_timestamps = deque()
        # Tracks (timestamp, token_count) of requests in the last 60 seconds
        self.token_log = deque()

        self.day_window = 86400  # 24 hours in seconds
        self.minute_window = 60    # 60 seconds

    def _prune_logs(self, current_time):
        """Removes old entries from logs."""
        # Prune RPD log (timestamps older than 24 hours)
        while self.request_timestamps and (current_time - self.request_timestamps[0] > self.day_window):
            self.request_timestamps.popleft()

        # Prune TPM log (entries older than 60 seconds)
        while self.token_log and (current_time - self.token_log[0][0] > self.minute_window):
            self.token_log.popleft()

    def wait_if_needed(self, tokens_for_this_request):
        """Checks limits and sleeps if necessary. Loops until safe to proceed."""
        while True:
            current_time = time.time()
            self._prune_logs(current_time)

            # --- 1. Check RPD (Hard Limit) ---
            if len(self.request_timestamps) >= self.rpd_limit:
                raise Exception(f"Daily Request Limit (RPD) of {self.rpd_limit} reached. Stopping.")

            # --- 2. Calculate RPM Wait ---
            rpm_wait = 0
            # Get requests in the last minute
            requests_in_last_minute = [t for t in self.request_timestamps if current_time - t <= self.minute_window]
            if len(requests_in_last_minute) >= self.rpm_limit:
                # Find the oldest request *within* the current 60s window that needs to expire
                # Sort timestamps in ascending order to find the one determining the wait
                relevant_timestamps = sorted([t for t in self.request_timestamps if current_time - t <= self.minute_window])
                # We need to wait until the (rpm_limit)-th request from the end falls out of the window
                if len(relevant_timestamps) >= self.rpm_limit:
                    oldest_request_to_expire = relevant_timestamps[len(relevant_timestamps) - self.rpm_limit]
                    rpm_wait = max(0, (self.minute_window - (current_time - oldest_request_to_expire)) + 0.1) # 0.1s buffer, ensure non-negative

            # --- 3. Calculate TPM Wait ---
            tpm_wait = 0
            current_tokens_in_window = sum(count for _, count in self.token_log)

            if (current_tokens_in_window + tokens_for_this_request) > self.tpm_limit:
                needed_to_free = (current_tokens_in_window + tokens_for_this_request) - self.tpm_limit
                freed_tokens = 0
                wait_until_time = 0
                # Iterate through the token log from oldest to newest
                for ts, count in self.token_log:
                    freed_tokens += count
                    wait_until_time = ts + self.minute_window + 0.1 # Time when this entry expires + buffer
                    if freed_tokens >= needed_to_free:
                        break # Found enough tokens that will expire

                if wait_until_time > current_time:
                    tpm_wait = max(0, wait_until_time - current_time) # Ensure non-negative wait
                elif tokens_for_this_request > self.tpm_limit:
                    # This single request is too large for the TPM limit
                    print(f"      -> Warning: Single request token count ({tokens_for_this_request}) "
                          f"exceeds total TPM limit ({self.tpm_limit}). "
                          "Proceeding, but API may reject.")
                    # We can't wait based on past requests if the current one is too big

            # --- 4. Decide and Act ---
            wait_duration = max(rpm_wait, tpm_wait)

            if wait_duration <= 0:
                # No wait needed, break the loop and proceed
                break

            print(f"      -> Throttling: Waiting {wait_duration:.2f}s to respect RPM/TPM limits.")
            time.sleep(wait_duration)
            # Loop will repeat to re-check conditions after sleeping

    def log_request(self, token_count):
        """Logs a new request timestamp and token count."""
        current_time = time.time()
        self.request_timestamps.append(current_time)
        self.token_log.append((current_time, token_count))
# --- Instantiate Throttler ---
api_throttler = Throttler(RPM_LIMIT, TPM_LIMIT, RPD_LIMIT)

# --- Helper Functions ---

def get_page_content(url):
    """Fetches and extracts the main textual content from a URL."""
    print(f"   Fetching content from: {url}")
    try:
        headers = {'User-Agent': 'DegreePlanConverterBot/1.0 (https://your-contact-info-or-website.com)'} # Be polite & identifiable
        response = requests.get(url, headers=headers, timeout=30) # Increased timeout
        response.raise_for_status() # Raise an exception for bad status codes (4xx, 5xx)

        # Basic check for non-HTML content
        content_type = response.headers.get('content-type', '').lower()
        if 'html' not in content_type:
            print(f"   Warning: Content type is not HTML ({content_type}). Attempting to parse anyway.")

        soup = BeautifulSoup(response.content, 'html.parser')

        # Basic cleanup: remove script, style, nav, header, footer elements and elements often used for ads/sidebars
        for element in soup(["script", "style", "nav", "header", "footer", "aside", "form", "button", "iframe", "img", "svg", "link", "meta"]):
            element.decompose()

        # Try to find the main content area (common tags/IDs/classes) - Be more specific if possible for target sites
        main_content = (
            soup.find('main') or
            soup.find('article') or
            soup.find(id='content') or
            soup.find(class_='content') or
            soup.find(id='main') or
            soup.find(class_='main') or
            soup.find(role='main') or # Added role=main
            soup.body # Fallback to body
        )

        if not main_content or main_content.name == 'body':
             print("     -> Warning: Could not find specific main content area, using entire body content.")
             main_content = soup.body # Ensure it's assigned if fallbacks failed initially

        if not main_content:
             print("     -> Error: Could not find body tag.")
             return None

        # Extract text, trying to preserve some structure with paragraph breaks
        text_blocks = []
        # Find meaningful block elements
        for element in main_content.find_all(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li', 'div', 'section', 'table']):
            # Get text, replace non-breaking spaces, strip whitespace
            block_text = element.get_text(separator=' ', strip=True).replace('\xa0', ' ')
            if block_text:
                text_blocks.append(block_text)

        text_content = '\n\n'.join(text_blocks) # Join blocks with double newlines

        # Further cleanup: remove excessive whitespace within lines and multiple blank lines
        text_content = re.sub(r'[ \t]+', ' ', text_content) # Replace multiple spaces/tabs with single space
        text_content = re.sub(r'(\n\s*){3,}', '\n\n', text_content) # Replace 3+ newlines (with optional spaces) with double newline

        if not text_content.strip():
             print("     -> Warning: No significant text content found after cleanup.")
             return None

        print(f"   Content fetched and cleaned successfully ({len(text_content)} chars).")
        return text_content.strip()

    except requests.exceptions.RequestException as e:
        print(f"   Error fetching URL {url}: {e}")
        return None
    except Exception as e:
        print(f"   Error parsing content from {url}: {e}")
        return None

def count_tokens(text):
    """Estimates the token count for the given text using the GenAI API."""
    try:
        # Use the actual API count if possible
        token_count = model.count_tokens(text).total_tokens
        return token_count
    except Exception as e:
        print(f"     -> Warning: Could not get exact token count from API: {e}. Estimating.")
        # Fallback simple estimation: average ~4 chars per token.
        return len(text) // 4

def call_llm_api(text_content, major_code):
    """Sends content to the LLM API and parses the JSON response."""
    if not text_content:
        print("   No text content provided to LLM.")
        return None

    # Use the API to count tokens accurately if possible
    estimated_tokens = count_tokens(text_content)
    print(f"   Calling LLM API (estimated/counted tokens: {estimated_tokens})...")

    # --- Wait if rate limited ---
    try:
        api_throttler.wait_if_needed(estimated_tokens)
    except Exception as e:
        print(f"   Stopping due to rate limit error: {e}")
        sys.exit(1) # Exit script if RPD limit is hit

    # --- Define the Prompt (Updated based on user examples) ---
    prompt = f"""
    Analyze the following text describing university degree requirements for the major "{major_code}".
    Extract all distinct requirement sections (like 'Core Courses', 'General Education', 'Electives', 'Business Minor', etc.).
    Format the output as a JSON array, where each object represents one requirement rule according to the specified schema.

    Schema for each rule object:
    {{
      "MajorCode": "{major_code}", /* REQUIRED: Use the provided major code */
      "RequirementType": "string", /* REQUIRED: e.g., "CORE", "GENERAL_EDUCATION", "ELECTIVES", "BUSINESS_MINOR". Use descriptive UPPER_SNAKE_CASE. */
      "Courses": [ /* Optional: Include ONLY if specific courses are listed. Array of objects: {{"Subject": "string", "CourseNumber": integer}}. Parse subject codes (e.g., "CS", "MATH") and course numbers accurately. Do NOT include credits here unless specified per course in the source text. */ ],
      "MinCredits": integer, /* Optional: Include ONLY for elective-like rules specifying a minimum credit total needed FROM a group/list. */
      "AllowedSubjects": ["string"], /* Optional: Include ONLY for elective-like rules listing allowed subjects/departments. Use subject codes. */
      "Restrictions": ["string"], /* Optional: Include ONLY for elective-like rules specifying restrictions (e.g., "Must be 3000+ level", "Excludes internships"). List each restriction as a separate string. */
      "TotalCreditsRequired": integer /* Optional: Include ONLY if the rule block explicitly states a total credit number FOR THAT SPECIFIC SECTION (e.g., "General Education: 44 Credits"). Do not confuse with overall degree credits or MinCredits for electives. */
    }}

    Processing Instructions:
    1.  **Major Code:** Always set "MajorCode" to "{major_code}".
    2.  **Requirement Type:** Identify logical sections (Core, Gen Ed, Electives, Minor, Concentration, etc.) and assign a concise `UPPER_SNAKE_CASE` "RequirementType".
    3.  **Courses Array:**
        * If a section lists specific courses (e.g., "MATH 101", "ENGL 102"), populate the "Courses" array.
        * Each course object MUST contain "Subject" (string, e.g., "MATH") and "CourseNumber" (integer, e.g., 101). Convert course numbers like '1103' to the integer 1103.
        * If the text explicitly states credits *for an individual course* within that list (rare), you can add a `"Credits": integer` field to that specific course object inside the "Courses" array.
        * Do *not* include the "Courses" key if the section describes electives by rules (use MinCredits, AllowedSubjects, Restrictions instead) or only gives a total credit number.
    4.  **Elective Rules (MinCredits, AllowedSubjects, Restrictions):**
        * Use "MinCredits" when the text says "choose X credits from..." or similar. Convert credit numbers to integers.
        * Use "AllowedSubjects" when allowed departments or subject codes are listed (e.g., "from CIS, MATH, or STAT"). Extract only the subject codes.
        * Use "Restrictions" for conditions like level requirements ("3000+ level"), exclusions, course attributes, etc. List each distinct restriction as a separate string in the array.
    5.  **TotalCreditsRequired:** Use this *only* when a specific section explicitly totals its own credit requirement (e.g., "General Education: 44 Credits"). Convert the number to an integer. Do not use it for the overall degree total or for elective minimums.
    6.  **Parsing:** Extract Subject codes (usually 2-4 uppercase letters) and Course Numbers (usually 3-4 digits) accurately. Ensure CourseNumber, MinCredits, and TotalCreditsRequired are integers.
    7.  **Exclusions:** Ignore general degree information like total hours for graduation (e.g., "120 hours required"), GPA requirements, university-wide policies, introductory paragraphs, and advisor notes unless they are part of a specific requirement block being parsed.
    8.  **Output:** Ensure the final output is ONLY a valid JSON array `[...]` containing the rule objects. Do not include any other text, comments, markdown formatting (like ```json), or explanations.

    Degree Requirements Text to Analyze:
    ---
    {text_content}
    ---

    JSON Output:
    """

    try:
        # Send the prompt to the model
        response = model.generate_content(prompt)

        # Log the request AFTER it completes successfully, using actual usage data
        token_count = estimated_tokens # Default if metadata missing
        # Use getattr safely in case usage_metadata or prompt_token_count is missing
        if hasattr(response, 'usage_metadata') and response.usage_metadata:
             token_count = getattr(response.usage_metadata, 'total_token_count', estimated_tokens) # Log total tokens if available


        api_throttler.log_request(token_count)

        # Debug: Print raw response text if needed
        # print("--- LLM Raw Response ---")
        # print(response.text)
        # print("-----------------------")

        # Attempt to parse the JSON response
        # Sometimes the response might be wrapped in ```json ... ```, try to strip that
        cleaned_text = response.text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:] # Remove ```json\n
        elif cleaned_text.startswith("```"):
             cleaned_text = cleaned_text[3:] # Remove ```\n
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip() # Remove leading/trailing whitespace again

        # Handle potential API errors indicated in the text itself
        if "Request failed" in cleaned_text or "API key" in cleaned_text:
             raise Exception(f"LLM API returned an error message: {cleaned_text}")

        requirements_json = json.loads(cleaned_text)

        # Validation: Check if it's a list of dictionaries
        if not isinstance(requirements_json, list):
             print("   Error: LLM did not return a valid JSON array.")
             return None
        if not all(isinstance(item, dict) for item in requirements_json):
             print("   Error: LLM response is an array, but contains non-object items.")
             # Optionally print the problematic items for debugging
             # for i, item in enumerate(requirements_json):
             #     if not isinstance(item, dict):
             #         print(f"     Problematic item at index {i}: {item}")
             return None

        print(f"   LLM call successful, received {len(requirements_json)} requirement rule(s).")
        return requirements_json

    except json.JSONDecodeError as e:
        print(f"   Error: Failed to decode JSON response from LLM: {e}")
        print(f"   LLM Raw Text (first 500 chars): {response.text[:500]}...") # Print beginning for debugging
        return None
    except Exception as e:
        # Catch other potential API errors (e.g., safety blocks, connection issues, explicit errors in text)
        print(f"   Error calling LLM API or processing response: {e}")
        # Log a failed request attempt (0 tokens used for limit calculation to avoid penalty)
        api_throttler.log_request(0)
        # Attempt to get more specific error details if available from the response object
        if hasattr(response, 'prompt_feedback') and response.prompt_feedback:
            print(f"   LLM Prompt Feedback: {response.prompt_feedback}")
        # Check candidates if available (might contain block reasons)
        if hasattr(response, 'candidates') and response.candidates:
             for candidate in response.candidates:
                 if hasattr(candidate, 'finish_reason') and candidate.finish_reason != 'STOP':
                     print(f"   Candidate Finish Reason: {candidate.finish_reason}")
                 if hasattr(candidate, 'safety_ratings'):
                     print(f"   Candidate Safety Ratings: {candidate.safety_ratings}")

        return None

def write_results_to_json(data, filename, append=False):
    """Writes or appends the extracted requirement rules to a JSON file."""
    mode = 'a' if append else 'w'
    existing_data = []
    is_new_file = not os.path.exists(filename) or os.path.getsize(filename) == 0

    if append and not is_new_file:
        try:
            with open(filename, 'r', encoding='utf-8') as f_read:
                content = f_read.read().strip()
                if content: # Check if file is not empty
                    existing_data = json.loads(content)
                    if not isinstance(existing_data, list):
                        print(f"Warning: Existing file '{filename}' does not contain a JSON array. Overwriting.")
                        existing_data = []
                        is_new_file = True # Treat as new file for writing
                        mode = 'w'
                else:
                     print(f"Info: Existing file '{filename}' is empty. Starting new array.")
                     is_new_file = True # Treat as new file for writing

        except json.JSONDecodeError:
            print(f"Warning: Existing file '{filename}' contains invalid JSON. Overwriting.")
            existing_data = []
            is_new_file = True
            mode = 'w'
        except FileNotFoundError:
             # This case is less likely now due to os.path.exists, but good practice
             print(f"Info: Append mode specified, but file '{filename}' not found. Creating new file.")
             is_new_file = True
             mode = 'w' # Switch to write mode
        except Exception as e:
            print(f"Error reading existing file '{filename}': {e}. Overwriting.")
            existing_data = []
            is_new_file = True
            mode = 'w'
    elif append and is_new_file:
         mode = 'w' # Force write if appending to a new/empty file

    # Ensure data to be added is always a list
    if data is None: # Handle case where LLM failed
        data = []
    elif not isinstance(data, list):
        print(f"Warning: Data to write is not a list ({type(data)}). Wrapping in a list.")
        data = [data]

    # Combine existing data (if appending valid data) with new data
    combined_data = existing_data + data if append and not is_new_file else data

    # Write the combined data back to the file
    try:
        # Create directory if it doesn't exist
        output_dir = os.path.dirname(filename)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
            print(f"   Created output directory: {output_dir}")

        # Write mode needs to write the whole list, append adds based on what was read
        data_to_write = combined_data if mode == 'w' else data

        with open(filename, mode, encoding='utf-8') as f_write:
            if mode == 'w':
                 json.dump(data_to_write, f_write, indent=2, ensure_ascii=False)
            elif mode == 'a' and data_to_write: # Need to handle adding to existing JSON array carefully
                 # This simple append mode might create invalid JSON if the file isn't empty
                 # A more robust append would load, append in memory, and rewrite the whole file
                 # For now, we rewrite the whole combined list if appending
                 # Re-open in write mode to overwrite with combined data
                 with open(filename, 'w', encoding='utf-8') as f_rewrite:
                      json.dump(combined_data, f_rewrite, indent=2, ensure_ascii=False)


        action = "appended to" if append and not is_new_file else ("created/wrote to" if is_new_file else "overwrote")
        print(f"   Successfully {action} {filename}")
    except Exception as e:
        print(f"   Error writing to JSON file {filename}: {e}")


# --- Main Execution ---
def main(url, output_file, major_code, limit=None, start_at=None, append=False):
    """Main function: scrape, process with LLM, and write results."""

    print(f"Starting degree requirement extraction for Major: {major_code}")
    print(f"Target URL: {url}")
    print(f"Output File: {output_file}")
    if limit is not None: print(f"Processing Limit: {limit} rules")
    if start_at is not None: print(f"Starting At Rule Index: {start_at}") # Clarified it's rules index
    if append: print(f"Append Mode: Enabled")
    print("-" * 20)

    # --- 1. Scrape Website ---
    page_text = get_page_content(url)
    if not page_text:
        print("Stopping script: page content could not be retrieved or was empty after cleaning.")
        sys.exit(1)

    time.sleep(WEBSITE_SCRAPE_DELAY) # Be polite to the web server

    # --- 2. Process with LLM ---
    extracted_rules = call_llm_api(page_text, major_code)

    if extracted_rules is None: # Check specifically for None, as empty list [] is valid
        print("LLM processing failed or returned no data. Nothing written.")
        # Optional: Save raw text for debugging
        # error_filename = "failed_llm_input.txt"
        # try:
        #     with open(error_filename, "w", encoding='utf-8') as f_err:
        #         f_err.write(f"URL: {url}\nMajor Code: {major_code}\n\n--- Page Text ---\n{page_text}")
        #     print(f"   Raw page text saved to {error_filename}")
        # except Exception as save_e:
        #     print(f"   Could not save raw text to {error_filename}: {save_e}")
        sys.exit(1)

    # --- 3. Apply Filtering (Limit/Start At - applied *after* extraction) ---
    processed_count = 0
    final_rules_to_write = []
    rules_available = len(extracted_rules)

    print(f"   LLM returned {rules_available} rule(s). Applying filters...")

    for i, rule in enumerate(extracted_rules):
        # NOTE: The prompt refers to "courses", but the arguments are --limit and --start-at for *rules*.
        # Adjusting interpretation here to apply limits to the extracted *rules*.
        if start_at is not None and i < start_at:
            continue # Skip rules before the start_at index

        if limit is not None and processed_count >= limit:
            print(f"   Reached processing limit of {limit} rules.")
            break # Stop processing if limit is reached

        final_rules_to_write.append(rule)
        processed_count += 1

    if not final_rules_to_write:
         print("   No rules remain after applying limit/start_at filters, or LLM returned an empty list.")
         # Decide if an empty file should be created or not
         # write_results_to_json([], output_file, append=append) # Uncomment to create/overwrite with empty list
         return # Nothing to write

    print(f"   Will write {processed_count} rule(s) after filtering.")

    # --- 4. Write to JSON ---
    write_results_to_json(final_rules_to_write, output_file, append=append)

    print("-" * 20)
    print("Script finished successfully.")


if __name__ == "__main__":
    # --- Command-Line Argument Parsing ---
    parser = argparse.ArgumentParser(
        description="Scrape degree requirements from a URL and convert them to JSON using a Google Generative AI model. URL, output file, and major code are set inside the script.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter # Show defaults in help
    )
    # Removed url, output_file, major_code positional arguments

    # Kept the optional arguments as requested
    parser.add_argument("--limit", type=int, default=None,
                        help="Stop after processing N requirement rules found on the page (applied *after* LLM extraction).")
    parser.add_argument("--start-at", type=int, default=None,
                        help="Skip the first N rules found (0-based index) and start processing from there (applied *after* LLM extraction).")
    parser.add_argument("--append", action="store_true", default=False,
                        help="Append results to the output file if it exists and contains a valid JSON array, otherwise create/overwrite it.")

    # --- Optional Rate Limit Overrides ---
    parser.add_argument("--rpm", type=int, default=RPM_LIMIT,
                        help=f"Override RPM limit (requests per minute). Default: {RPM_LIMIT}")
    parser.add_argument("--tpm", type=int, default=TPM_LIMIT,
                        help=f"Override TPM limit (tokens per minute). Default: {TPM_LIMIT}")
    parser.add_argument("--rpd", type=int, default=RPD_LIMIT,
                        help=f"Override RPD limit (requests per day). Default: {RPD_LIMIT}")
    parser.add_argument("--scrape-delay", type=float, default=WEBSITE_SCRAPE_DELAY,
                        help=f"Override delay (in seconds) between website page fetches. Default: {WEBSITE_SCRAPE_DELAY}")


    args = parser.parse_args()

    # --- Update Config/Throttler if Overridden ---
    if args.rpm != RPM_LIMIT or args.tpm != TPM_LIMIT or args.rpd != RPD_LIMIT:
        print("Applying command-line rate limit overrides...")
        api_throttler = Throttler(args.rpm, args.tpm, args.rpd)
    if args.scrape_delay != WEBSITE_SCRAPE_DELAY:
         print("Applying command-line scrape delay override...")
         WEBSITE_SCRAPE_DELAY = args.scrape_delay


    # Basic validation for arguments
    if args.limit is not None and args.limit < 1:
        print("Error: --limit must be a positive integer.")
        sys.exit(1)
    if args.start_at is not None and args.start_at < 0:
         print("Error: --start-at must be a non-negative integer.")
         sys.exit(1)

    # Validate hardcoded variables
    if not TARGET_URL or not TARGET_URL.startswith(('http://', 'https://')):
        print(f"Error: TARGET_URL ('{TARGET_URL}') inside the script is invalid or missing.")
        sys.exit(1)
    if not OUTPUT_JSON_FILE:
        print("Error: OUTPUT_JSON_FILE inside the script is not set.")
        sys.exit(1)
    if not OUTPUT_JSON_FILE.lower().endswith('.json'):
        print(f"Warning: OUTPUT_JSON_FILE ('{OUTPUT_JSON_FILE}') does not end with .json.")
    if not MAJOR_CODE:
         print("Error: MAJOR_CODE inside the script is not set.")
         sys.exit(1)


    # --- Run Main Function ---
    main(
        url=TARGET_URL,
        output_file=OUTPUT_JSON_FILE,
        major_code=MAJOR_CODE.upper(), # Standardize to upper case
        limit=args.limit,
        start_at=args.start_at,
        append=args.append
    )