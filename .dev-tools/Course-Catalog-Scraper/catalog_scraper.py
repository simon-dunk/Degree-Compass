import csv
import re
import json
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai
import time
from get_env import get_env_value
from urllib.parse import urljoin

# --- Configuration ---
# TODO: Paste your Gemini API Key here.
# To get a key, visit https://makersuite.google.com/app/apikey
API_KEY = api_key = get_env_value("API_KEY") # IMPORTANT: REPLACE WITH YOUR ACTUAL API KEY

# This is the correct starting URL for the full course list.
CATALOG_URL = get_env_value("CATALOG_URL")

# TODO: Customize the CSV filename if you wish.
OUTPUT_CSV_FILE = "course_catalog.csv"

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
            model_name="gemini-2.5-flash-preview-05-20",
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
            print(f"      -> An unexpected AI error occurred: {e}. Retrying... (Attempt {attempt + 1})")
            time.sleep(2 ** attempt)
    print(f"      -> Failed to extract info with AI after {max_retries} retries.")
    return None

def save_to_csv(data, filename):
    """Saves a list of course dictionaries to a CSV file."""
    if not data:
        print("No data to save.")
        return
    headers = ["course_number", "title", "credits", "description", "prerequisites"]
    try:
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            writer.writerows(data)
        print(f"\nSuccessfully saved {len(data)} courses to {filename}")
    except IOError as e:
        print(f"Error writing to CSV file {filename}: {e}")

def main():
    """Main function to run the course catalog scraper."""
    print("Starting the course catalog scraper...")
    
    if not API_KEY or API_KEY == "YOUR_API_KEY_HERE":
        print("Fatal Error: Gemini API Key is not configured.")
        return

    ai_model = get_ai_model()
    if not ai_model:
        print("Fatal Error: Could not create AI model. Exiting.")
        return

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
        time.sleep(1) # Be polite to the server

    if not all_course_detail_urls:
        print("Fatal Error: Could not find any course links on any page.")
        return
    
    # Remove duplicates
    unique_course_urls = sorted(list(set(all_course_detail_urls)))
    print(f"Found a total of {len(unique_course_urls)} unique course links.")
    
    # --- Stage 2: Process each unique course link ---
    all_courses_data = []
    for i, detail_url in enumerate(unique_course_urls):
        # --- MANUAL LIMITER FOR TESTING ---
        if i >= 1: # Limit to 10 courses for a quick test run
            print(f"\n--- Reached manual limit of {i} courses for testing. Stopping. ---")
            break
            
        print(f"\n--- Scraping Course {i+1}/{len(unique_course_urls)} ---")
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
        ai_result = extract_info_with_ai(ai_model, course_text_block)
        
        if ai_result:
            all_courses_data.append(ai_result)
            print(f"    -> Successfully processed: {ai_result.get('course_number', 'N/A')}")
        else:
            print(f"    -> AI could not process text. Debug info:")
            print(f"    --- TEXT SENT TO AI ---\n{course_text_block}\n    --- END TEXT ---")
            
        time.sleep(1) 
            
    if all_courses_data:
        save_to_csv(all_courses_data, OUTPUT_CSV_FILE)
    else:
        print("\nCould not extract any structured course data.")

if __name__ == "__main__":
    main()

