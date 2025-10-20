import csv
import re
import json
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import time
from get_env import get_env_value
from urllib.parse import urljoin
from collections import deque # Added for efficient tracking
import argparse # NEW: For handling command-line arguments
import sys # NEW: For exiting on bad arguments

# --- Configuration ---
# To get a key, visit https://makersuite.google.com/app/apikey
API_KEY = api_key = get_env_value("API_KEY") # IMPORTANT: REPLACE WITH YOUR ACTUAL API KEY

# --- NEW: Rate Limiting Configuration ---
# Set your API limits here. They can be pulled from .env or defaulted.
# Peak requests per minute (RPM)
RPM_LIMIT = int(get_env_value("RPM_LIMIT") or 60)
# Peak input tokens per minute (TPM)
TPM_LIMIT = int(get_env_value("TPM_LIMIT") or 1000000)
# Peak requests per day (RPD)
RPD_LIMIT = int(get_env_value("RPD_LIMIT") or 1500) # Free tier is often 1500 RPD

# Renamed: This is for being polite to the website server, not for AI throttling
WEBSITE_SCRAPE_DELAY = float(get_env_value("API_LIMITOR") or 1.0)  # Seconds to wait between website page fetches

CATALOG_URL = get_env_value("CATALOG_URL")

# TODO: Customize the CSV filename if you wish.
OUTPUT_CSV_FILE = "course_catalog.csv"

# --- NEW: Throttler Class ---
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
            # Get requests in the last minute (already pruned, but check window)
            requests_in_last_minute = [t for t in self.request_timestamps if current_time - t <= self.minute_window]
            if len(requests_in_last_minute) >= self.rpm_limit:
                oldest_request_in_window = requests_in_last_minute[0]
                # Wait until the oldest request is > 60s old
                rpm_wait = (self.minute_window - (current_time - oldest_request_in_window)) + 0.1 # 0.1s buffer
                
            # --- 3. Calculate TPM Wait ---
            tpm_wait = 0
            current_tokens_in_window = sum(count for _, count in self.token_log)
            
            if (current_tokens_in_window + tokens_for_this_request) > self.tpm_limit:
                if self.token_log:
                    # Wait for the oldest token entry to expire
                    oldest_token_entry_ts = self.token_log[0][0]
                    tpm_wait = (self.minute_window - (current_time - oldest_token_entry_ts)) + 0.1 # 0.1s buffer
                elif tokens_for_this_request > self.tpm_limit:
                    # This single request is too large for the TPM limit
                    print(f"      -> Warning: Single request token count ({tokens_for_this_request}) "
                          f"exceeds total TPM limit ({self.tpm_limit}). "
                          "This may cause an error. Proceeding...")
                    # We can't wait, so we proceed and hope the API handles it
            
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
        

# --- AI Model Setup ---
try:
    if not API_KEY:
        print("API_KEY is missing. Please configure it in the script.")
    else:
        genai.configure(api_key=API_KEY)
except Exception as e:
    print(f"Error configuring Generative AI: {e}")

# This prompt is refined to handle a single course's text block.
SYSTEM_PROMPT = """
You are an expert data extraction assistant. Your task is to analyze the provided text from a university course and extract the following information: course number, course title, credits, a detailed course description, and any prerequisites.

Format your output as a single, clean JSON object with the following keys: "course_number", "title", "credits", "description", and "prerequisites".

- The "description" should be the main paragraph of text and should NOT include the prerequisites list.
- The "prerequisites" should be a simple string listing the requirements (e.g., "ACCT 1001 or Instructor permission.").

If a piece of information is not available in the text, use "N/A" as the value. Do not add any extra explanations or text outside of the single JSON object.
"""

def get_ai_model():
    """Initializes and returns the Gemini AI model."""
    try:
        return genai.GenerativeModel(
            model_name=get_env_value("SCRAPER_MODEL") or "gemini-2.5-flash-preview-05-20",
            system_instruction=SYSTEM_PROMPT
        )
    except Exception as e:
        print(f"Could not initialize AI model: {e}")
        return None

def fetch_page_content(url):
    """Fetches the HTML content of a given URL."""
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=15)
        response.raise_for_status()
        return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error fetching URL {url}: {e}")
        return None

def parse_course_listing_page(html_content, base_url):
    """
    Parses a course listing page to find all individual course detail links.
    This version is specifically built for the table-based layout.
    """
    if not html_content:
        return []
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # The links are in <a> tags with a specific onclick attribute.
    link_tags = soup.find_all('a', onclick=re.compile(r"showCourse\("))
    
    detail_urls = []
    for link in link_tags:
        onclick_attr = link.get('onclick')
        match = re.search(r"showCourse\('(\d+)', '(\d+)'", onclick_attr)
        if match:
            catoid, coid = match.groups()
            relative_url = f"preview_course.php?catoid={catoid}&coid={coid}"
            full_url = urljoin(base_url, relative_url)
            if full_url not in detail_urls:
                 detail_urls.append(full_url)
                
    return detail_urls

def find_pagination_links(html_content, base_url):
    """Finds all unique pagination links on the first course listing page."""
    if not html_content:
        return []
    soup = BeautifulSoup(html_content, 'html.parser')
    
    pagination_urls = []
    # Find the container for the page numbers
    pagination_container = soup.find('td', class_='acalog-course-filter-pager')
    if not pagination_container:
         # Fallback for the HTML structure provided
         tables = soup.find_all('table', class_='table_default')
         for table in tables:
              if "Page:" in table.get_text():
                   pagination_container = table
                   break

    if pagination_container:
        links = pagination_container.find_all('a', href=re.compile(r'cpage=\d+'))
        for link in links:
            relative_url = link.get('href')
            full_url = urljoin(base_url, relative_url)
            if full_url not in pagination_urls:
                pagination_urls.append(full_url)
                
    return pagination_urls

def parse_course_detail_page(html_content):
    """Parses the pop-up course detail page to extract the main text block."""
    if not html_content:
        return None
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # On the detail page, the main content is within a div with this specific ID.
    content_area = soup.find('div', id='acalog-course-preview')
    if content_area:
        return content_area.get_text(separator=' ', strip=True)
    
    print("      -> Warning: Could not find specific content div, falling back to all text.")
    return soup.get_text(separator=' ', strip=True)

def extract_info_with_ai(model, course_text, max_retries=3):
    """Uses the Gemini AI to extract structured data from a course's text."""
    if not model or not course_text:
        return None
    for attempt in range(max_retries):
        try:
            response = model.generate_content(course_text)
            cleaned_json = re.sub(r'```json\s*|\s*```', '', response.text.strip())
            return json.loads(cleaned_json)
        except json.JSONDecodeError:
            print(f"      -> AI response was not valid JSON. Retrying... (Attempt {attempt + 1})")
            time.sleep(2 ** attempt)
        except Exception as e:
            # This will catch API errors like 429 (Too Many Requests) if the throttler isn't perfect
            print(f"      -> An unexpected AI error occurred: {e}. Retrying... (Attempt {attempt + 1})")
            time.sleep(2 ** attempt)
    print(f"      -> Failed to extract info with AI after {max_retries} retries.")
    return None

# --- MODIFIED: save_to_csv now accepts an 'append' flag ---
def save_to_csv(data, filename, append=False):
    """Saves a list of course dictionaries to a CSV file."""
    if not data:
        print("No data to save.")
        return
    headers = ["course_number", "title", "credits", "description", "prerequisites"]
    
    # NEW: Determine file mode and operation based on 'append' flag
    file_mode = 'a' if append else 'w'
    
    try:
        with open(filename, file_mode, newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            
            # NEW: Only write header if NOT appending
            if not append:
                writer.writeheader()
                
            writer.writerows(data)
        
        operation = "appended" if append else "saved"
        print(f"\nSuccessfully {operation} {len(data)} courses to {filename}")
        
    except IOError as e:
        print(f"Error writing to CSV file {filename}: {e}")

def main():
    """Main function to run the course catalog scraper."""
    
    # --- NEW: Argument Parsing ---
    parser = argparse.ArgumentParser(description="Scrape a university course catalog.")
    parser.add_argument(
        '--limit', 
        type=int, 
        default=None, 
        help='Manually stop after scraping this many courses (for testing).'
    )
    parser.add_argument(
        '--start-at', 
        type=int, 
        default=None, 
        help='Start scraping at this specific course number (1-based). e.g., --start-at 500'
    )
    # --- NEW: Added --append argument ---
    parser.add_argument(
        '--append',
        action='store_true', # This stores 'True' if --append is present, 'False' otherwise
        help='Append data to the existing CSV file instead of overwriting. Headers will be skipped.'
    )
    args = parser.parse_args()

    # --- NEW: Set up limit variables based on args ---
    DO_LIMIT = False
    MANNUAL_LIMIT = 0
    if args.limit is not None:
        DO_LIMIT = True
        MANNUAL_LIMIT = args.limit
        print(f"--- Manual stop enabled. Will stop after {MANNUAL_LIMIT} courses. ---")
    else:
        print("--- No manual limit set. Will scrape all courses. ---")
    
    # --- NEW: Acknowledge append mode ---
    if args.append:
        print(f"--- Append mode enabled. Will add to {OUTPUT_CSV_FILE} and skip headers. ---")


    print("Starting the course catalog scraper...")
    
    if not API_KEY or API_KEY == "YOUR_API_KEY_HERE":
        print("Fatal Error: Gemini API Key is not configured.")
        return

    ai_model = get_ai_model()
    if not ai_model:
        print("Fatal Error: Could not create AI model. Exiting.")
        return
        
    # --- NEW: Initialize the Throttler ---
    throttler = Throttler(RPM_LIMIT, TPM_LIMIT, RPD_LIMIT)
    print(f"Throttler initialized: RPM={RPM_LIMIT}, TPM={TPM_LIMIT}, RPD={RPD_LIMIT}")

    # --- Stage 1: Gather all course links from all pages ---
    print(f"Fetching main catalog page: {CATALOG_URL}")
    first_page_html = fetch_page_content(CATALOG_URL)
    if not first_page_html:
        print("Fatal Error: Could not fetch main catalog page. Exiting.")
        return

    all_course_detail_urls = []
    
    # Get course URLs from the first page
    all_course_detail_urls.extend(parse_course_listing_page(first_page_html, CATALOG_URL))
    
    # Find pagination links and scrape the rest of the pages
    pages_to_scrape = find_pagination_links(first_page_html, CATALOG_URL)
    print(f"Found {len(pages_to_scrape) + 1} pages of courses to scrape.")

    for i, page_url in enumerate(pages_to_scrape):
        print(f"Fetching page {i + 2}/{len(pages_to_scrape) + 1}...")
        page_html = fetch_page_content(page_url)
        if page_html:
            all_course_detail_urls.extend(parse_course_listing_page(page_html, CATALOG_URL))
        # Be polite to the website server
        time.sleep(WEBSITE_SCRAPE_DELAY) 

    if not all_course_detail_urls:
        print("Fatal Error: Could not find any course links on any page.")
        return
    
    # Remove duplicates
    unique_course_urls = sorted(list(set(all_course_detail_urls)))
    total_courses_found = len(unique_course_urls)
    print(f"Found a total of {total_courses_found} unique course links.")
    
    # --- MODIFIED: Handle --start-at logic for a single number ---
    start_index = 0
    urls_to_process = unique_course_urls

    if args.start_at is not None:
        start_at_number = args.start_at
        
        if start_at_number < 1:
            print(f"Error: --start-at must be a number 1 or greater. Received: {start_at_number}")
            sys.exit(1)
            
        start_index = start_at_number - 1 # Convert 1-based to 0-based index
            
        if start_index >= total_courses_found:
            print(f"Error: --start-at number ({start_at_number}) is larger than the "
                  f"total courses found ({total_courses_found}).")
            print("Will not process any courses. Exiting.")
            return

        urls_to_process = unique_course_urls[start_index:]
        print(f"--- --start-at {start_at_number} applied. "
              f"Starting at course {start_at_number} of {total_courses_found} (index {start_index}). ---")

    
    # --- Stage 2: Process each unique course link ---
    all_courses_data = []
    
    # MODIFIED: Iterate over the potentially sliced list
    for i, detail_url in enumerate(urls_to_process):
        
        # --- MANUAL LIMITER FOR TESTING ---
        # This check is now relative to the start position
        # e.g., if --limit 10, it will process 10 courses from the start_index
        if DO_LIMIT == True:
            if i >= MANNUAL_LIMIT:
                print(f"\n--- Reached manual limit of {MANNUAL_LIMIT} courses. Stopping. ---")
                break
        
        # MODIFIED: Print statement shows absolute progress
        current_course_number = i + start_index + 1
        print(f"\n--- Scraping Course {current_course_number}/{total_courses_found} ---")
        print(f"  -> URL: {detail_url}")
        
        detail_html = fetch_page_content(detail_url)
        if not detail_html:
            print(f"  -> Could not fetch content for this course. Skipping.")
            continue
            
        course_text_block = parse_course_detail_page(detail_html)
        if not course_text_block:
            print("  -> No course text found on this page. Skipping.")
            continue
            
        print(f"  -> Found course text. Processing with AI...")
        ai_result = None
        
        try:
            # --- MODIFIED: Throttling Logic ---
            
            # 1. Count tokens (this is a fast API call)
            token_count = ai_model.count_tokens(course_text_block).total_tokens
            
            # 2. Wait if needed (this function blocks until safe)
            throttler.wait_if_needed(token_count)
            
            # 3. Log the request and make the call
            throttler.log_request(token_count)
            ai_result = extract_info_with_ai(ai_model, course_text_block)
            
        except Exception as e:
            print(f"    -> An error occurred during throttling or AI call: {e}")
            if "RPD" in str(e):
                print("    -> Daily quota reached. Stopping script.")
                break # Exit the for loop
            # Otherwise, just continue to the next course
            continue
        
        # --- End of Modified Logic ---
        
        if ai_result:
            all_courses_data.append(ai_result)
            print(f"    -> Successfully processed: {ai_result.get('course_number', 'N/A')}")
        else:
            print(f"    -> AI could not process text. Debug info:")
            print(f"    --- TEXT SENT TO AI ---\n{course_text_block}\n    --- END TEXT ---")
            
        # The old time.sleep(API_LIMITOR) is no longer needed here, 
        # as the Throttler class handles all AI call delays.
            
    if all_courses_data:
        # --- MODIFIED: Pass the args.append flag to the save function ---
        save_to_csv(all_courses_data, OUTPUT_CSV_FILE, append=args.append)
    else:
        print("\nCould not extract any structured course data.")

if __name__ == "__main__":
    main()