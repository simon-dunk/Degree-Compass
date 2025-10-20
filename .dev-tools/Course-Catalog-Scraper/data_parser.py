import csv
import re
import json
import google.generativeai as genai
import time
import pandas as pd
from get_env import get_env_value

# --- Configuration ---
# TODO: Paste your Gemini API Key here if it's not already set as an environment variable.
# To get a key, visit https://makersuite.google.com/app/apikey
API_KEY = api_key = get_env_value("API_KEY") # IMPORTANT: REPLACE WITH YOUR ACTUAL API KEY

API_LIMITOR = float(get_env_value("API_LIMITOR"))  # Seconds to wait between API calls

# TODO: Make sure these filenames match your project.
INPUT_CSV_FILE = "course_catalog.csv"
OUTPUT_CSV_FILE = "parsed_prerequisites.csv"

# --- AI Model Setup ---
try:
    if not API_KEY:
        print("API_KEY is missing. Please configure it in the script.")
    else:
        genai.configure(api_key=API_KEY)
except Exception as e:
    print(f"Error configuring Generative AI: {e}")

# This is a highly specific prompt designed to parse prerequisite text into a structured JSON object.
SYSTEM_PROMPT = """
You are an expert university registrar's assistant specializing in data normalization. Your task is to analyze a course prerequisite string and convert it into a structured JSON format.

The JSON object must have the following keys:
- "required_courses": An array of objects. Each object represents a specific course requirement and must have "course_code" and "minimum_grade" keys. If no grade is specified, use "N/A".
- "required_choices": An array of objects for when a student must choose one from a list. Each object in this array should represent a group of choices and have a "choose_n" (integer) key and a "from_courses" (array of course objects, same format as above) key.
- "other_conditions": A simple string to capture any non-course requirements, such as "Instructor permission.", "Junior standing.", etc.

Analyze the text and populate this structure.

Example 1:
Input: "ACCT 2013 with a grade of 'C' or better"
Output:
{
  "required_courses": [{"course_code": "ACCT 2013", "minimum_grade": "C"}],
  "required_choices": [],
  "other_conditions": "N/A"
}

Example 2:
Input: "ACCT 1001 or Instructor permission."
Output:
{
  "required_courses": [],
  "required_choices": [{"choose_n": 1, "from_courses": [{"course_code": "ACCT 1001", "minimum_grade": "N/A"}]}],
  "other_conditions": "Instructor permission."
}

Example 3:
Input: "BIOL 1014 and CHEM 1114"
Output:
{
    "required_courses": [
        {"course_code": "BIOL 1014", "minimum_grade": "N/A"},
        {"course_code": "CHEM 1114", "minimum_grade": "N/A"}
    ],
    "required_choices": [],
    "other_conditions": "N/A"
}

If the input is "N/A" or empty, return an object with empty arrays and "N/A" for other_conditions.
Do not add any explanations or text outside of the single JSON object.
"""

def get_ai_model():
    """Initializes and returns the Gemini AI model."""
    try:
        return genai.GenerativeModel(
            model_name=get_env_value("DATA_PARSER_MODEL") or "gemini-2.5-flash-preview-05-20",
            system_instruction=SYSTEM_PROMPT
        )
    except Exception as e:
        print(f"Could not initialize AI model: {e}")
        return None

def parse_prerequisites_with_ai(model, prereq_text, max_retries=3):
    """
    Uses the Gemini AI to parse a single prerequisite string into a structured dictionary.
    """
    if not model or not prereq_text or prereq_text.strip().lower() == 'n/a':
        return None

    for attempt in range(max_retries):
        try:
            response = model.generate_content(prereq_text)
            cleaned_json = re.sub(r'```json\s*|\s*```', '', response.text.strip())
            return json.loads(cleaned_json)
        except json.JSONDecodeError as e:
            print(f"      -> AI response was not valid JSON for '{prereq_text}'. Error: {e}. Retrying... (Attempt {attempt + 1})")
            time.sleep(2 ** attempt)
        except Exception as e:
            print(f"      -> An unexpected AI error occurred for '{prereq_text}': {e}. Retrying... (Attempt {attempt + 1})")
            time.sleep(2 ** attempt)

    print(f"      -> Failed to parse prerequisite with AI after {max_retries} retries: '{prereq_text}'")
    return None

def main():
    """
    Main function to read the scraped CSV, parse prerequisites, and save to a new CSV.
    """
    print("Starting the prerequisite parsing process...")

    if not API_KEY or API_KEY == "YOUR_API_KEY_HERE":
        print("Fatal Error: Gemini API Key is not configured. Please edit the script and add your key.")
        return

    ai_model = get_ai_model()
    if not ai_model:
        print("Fatal Error: Could not create AI model. Exiting.")
        return

    try:
        df = pd.read_csv(INPUT_CSV_FILE)
        print(f"Successfully loaded {len(df)} courses from '{INPUT_CSV_FILE}'.")
    except FileNotFoundError:
        print(f"Fatal Error: Input file '{INPUT_CSV_FILE}' not found. Please run the scraper first.")
        return
    except Exception as e:
        print(f"Fatal Error: Could not read the input CSV file. Error: {e}")
        return
        
    # Lists to hold the new, parsed data
    parsed_data_list = []

    print("\n--- Processing prerequisites for each course ---")
    # Iterate over each row in the DataFrame
    for index, row in df.iterrows():
        prereq_text = row.get('prerequisites', 'N/A')
        
        # Ensure prereq_text is a string before processing
        if not isinstance(prereq_text, str) or prereq_text.strip().lower() in ['n/a', '']:
            parsed_structure = None
        else:
            print(f"  - Parsing for '{row.get('course_number', 'Unknown')}': \"{prereq_text}\"")
            parsed_structure = parse_prerequisites_with_ai(ai_model, prereq_text)
            time.sleep(API_LIMITOR) # Rate limit the API calls

        # --- Flatten the JSON structure for CSV columns ---
        flat_record = row.to_dict() # Start with the original data
        
        if parsed_structure:
            # Flatten 'required_courses'
            for i, req in enumerate(parsed_structure.get('required_courses', [])):
                flat_record[f'req_course_{i+1}_code'] = req.get('course_code')
                flat_record[f'req_course_{i+1}_grade'] = req.get('minimum_grade')
            
            # Flatten 'required_choices'
            for i, choice in enumerate(parsed_structure.get('required_choices', [])):
                flat_record[f'choice_{i+1}_choose_n'] = choice.get('choose_n')
                from_courses_str = ", ".join([c.get('course_code', '') for c in choice.get('from_courses', [])])
                flat_record[f'choice_{i+1}_from'] = from_courses_str

            # Add other conditions
            flat_record['other_conditions'] = parsed_structure.get('other_conditions', 'N/A')
        
        parsed_data_list.append(flat_record)

    # Convert the list of dictionaries to a new DataFrame
    # This handles mismatched columns by filling with NaN
    output_df = pd.DataFrame(parsed_data_list)
    
    # Reorder columns to be more logical: original columns first, then new parsed ones
    original_cols = [col for col in df.columns if col in output_df.columns]
    new_cols = [col for col in output_df.columns if col not in original_cols]
    output_df = output_df[original_cols + sorted(new_cols)]

    try:
        output_df.to_csv(OUTPUT_CSV_FILE, index=False)
        print(f"\nSuccessfully parsed prerequisites and saved results to '{OUTPUT_CSV_FILE}'.")
    except IOError as e:
        print(f"\nError: Could not write to the output file '{OUTPUT_CSV_FILE}'. Error: {e}")

if __name__ == "__main__":
    main()