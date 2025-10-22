# File: server/scripts/upload_degree_reqs_v2.py

import boto3
import json
import os
import sys
import argparse
from decimal import Decimal # Import Decimal for handling float types in DynamoDB

# --- Helper Functions (from template) ---

def load_config(config_path_relative):
    """Loads the configuration file."""
    try:
        # Construct path relative to the script's directory if it's relative
        if not os.path.isabs(config_path_relative):
             script_dir = os.path.dirname(__file__)
             config_path_absolute = os.path.abspath(os.path.join(script_dir, config_path_relative))
        else:
             config_path_absolute = config_path_relative

        print(f"Loading config from: {config_path_absolute}")
        with open(config_path_absolute, 'r', encoding='utf-8') as f:
            config = json.load(f)
        return config
    except FileNotFoundError:
        print(f"Error: Configuration file not found at {config_path_absolute}")
        sys.exit(1)
    except json.JSONDecodeError:
        print(f"Error: Could not parse configuration file at {config_path_absolute}")
        sys.exit(1)
    except Exception as e:
        print(f"An unexpected error occurred loading config: {e}")
        sys.exit(1)

def load_requirements_from_json(filepath):
    """Loads degree requirements data from a JSON file."""
    absolute_filepath = os.path.abspath(filepath)
    if not os.path.exists(absolute_filepath):
        print(f"Error: Input JSON file not found at '{absolute_filepath}'")
        return None
    try:
        with open(absolute_filepath, mode='r', encoding='utf-8') as infile:
            # Load JSON, converting floats to Decimals
            requirements = json.load(infile, parse_float=Decimal)
            if not isinstance(requirements, list):
                print(f"Error: The JSON file '{absolute_filepath}' must contain an array.")
                return None
            print(f"Successfully loaded {len(requirements)} requirements from '{absolute_filepath}'.")
            return requirements
    except json.JSONDecodeError as e:
        print(f"Error: Could not decode JSON from '{absolute_filepath}'. Please check the file format. Details: {e}")
        return None
    except Exception as e:
        print(f"An unexpected error occurred reading '{absolute_filepath}': {e}")
        return None

def replace_floats_with_decimal(item):
    """
    Recursively replaces float values in a dictionary or list with Decimal objects.
    DynamoDB requires Decimal for non-integer numbers.
    """
    if isinstance(item, list):
        return [replace_floats_with_decimal(i) for i in item]
    elif isinstance(item, dict):
        return {k: replace_floats_with_decimal(v) for k, v in item.items()}
    elif isinstance(item, float):
        # Convert float to string first to avoid precision issues
        return Decimal(str(item))
    return item # Keep int, str, bool, None, etc. as-is

def clean_empty_values(item, primary_keys):
    """
    Recursively prepares item for DynamoDB:
    1. Converts empty strings "" to None (NULL) for non-key attributes.
    2. Keeps None values (to be stored as NULL).
    3. Keeps empty lists [] and empty maps {}.
    4. Raises error if any primary key is empty or None.
    """
    if isinstance(item, dict):
        cleaned_dict = {}
        for k, v in item.items():
            # 1. Check Primary Keys
            if k in primary_keys and (v is None or v == ""):
                 raise ValueError(f"Primary key attribute '{k}' cannot be empty or None. Item: {item}")

            # 2. Recurse
            cleaned_value = clean_empty_values(v, primary_keys) # Pass primary_keys down

            # 3. Apply DynamoDB rules (no empty strings for non-keys)
            if isinstance(cleaned_value, str) and cleaned_value == "" and k not in primary_keys:
                cleaned_dict[k] = None # Convert empty string to NULL
            elif cleaned_value is not None or k in primary_keys: # Keep None only if not an empty string originally
                # 4. Keep all other valid values
                # (including None resulting from empty strings, [], {}, numbers, bools, non-empty strings)
                 cleaned_dict[k] = cleaned_value
            # If cleaned_value is None and it wasn't an empty string, it's skipped unless it's a primary key (error already raised)
        return cleaned_dict
    elif isinstance(item, list):
        # Recurse for all items in the list, cleaning each one
        return [clean_empty_values(i, primary_keys) for i in item]
    else:
        # Return primitives (int, str, Decimal, bool, None) as-is, unless it's an empty string handled above
        return item

# --- Main Upload Logic ---

def upload_requirements_to_dynamodb(requirements, table_name, region_name, access_key_id=None, secret_access_key=None):
    """Uploads a list of requirement objects to the specified DynamoDB table."""
    try:
        session_args = {}
        if region_name:
            session_args['region_name'] = region_name
        if access_key_id and secret_access_key:
            session_args['aws_access_key_id'] = access_key_id
            session_args['aws_secret_access_key'] = secret_access_key

        session = boto3.Session(**session_args)
        dynamodb = session.resource('dynamodb')
        table = dynamodb.Table(table_name)
        print(f"Targeting table: '{table_name}' in region '{session.region_name}'")

    except Exception as e:
        print(f"Error connecting to DynamoDB: {e}")
        print("Ensure your AWS credentials and region are configured correctly.")
        return

    total_reqs = len(requirements)
    uploaded_count = 0
    failed_count = 0
    primary_keys = ['MajorCode', 'RequirementType'] # Define primary keys for validation

    print(f"Starting upload of {total_reqs} requirements to table '{table_name}'...")

    # Use batch_writer for efficiency and automatic retry handling
    try:
        with table.batch_writer() as batch:
            for i, req in enumerate(requirements):
                try:
                    # Prepare item: Convert floats, clean empty values based on primary keys
                    item_to_upload = clean_empty_values(replace_floats_with_decimal(req), primary_keys)

                    # Ensure essential keys are present after cleaning (redundant check, handled by clean_empty_values)
                    # if 'MajorCode' not in item_to_upload or 'RequirementType' not in item_to_upload:
                    #     print(f"Warning: Skipping requirement at index {i} due to missing primary key after cleaning: {req}")
                    #     failed_count += 1
                    #     continue

                    batch.put_item(Item=item_to_upload)
                    uploaded_count += 1

                    if (uploaded_count + failed_count) % 100 == 0 or (i + 1) == total_reqs:
                        print(f"  Processed {i + 1}/{total_reqs} requirements ({uploaded_count} staged for upload, {failed_count} skipped)...")

                except ValueError as ve:
                    # Raised by clean_empty_values if a primary key is invalid
                    print(f"Error preparing item at index {i}: {ve}. Skipping item.")
                    failed_count += 1
                except Exception as item_error:
                    print(f"Error preparing/adding item at index {i} to batch: {item_error}. Item: {req}. Skipping item.")
                    failed_count += 1

        print(f"\nBatch writing complete.")
        print(f"Successfully uploaded: {uploaded_count}")
        print(f"Failed/Skipped:      {failed_count}")
        print(f"Total:               {total_reqs}")

    except Exception as e:
        # Catch errors during the batch writing process (e.g., throttling, access issues)
        print(f"\nAn error occurred during the batch upload process: {e}")
        print(f"Attempted to upload {uploaded_count} requirements before the error.")

# --- Script Execution ---

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Upload degree requirements from a JSON file to DynamoDB.')
    parser.add_argument('file_path', help='Path to the JSON file containing the requirements array.')
    parser.add_argument('--config', default='../server/src/config/config.json', help='Relative path to the config.json file (default: ../server/src/config/config.json)')
    parser.add_argument('--region', default=os.environ.get('AWS_REGION'), help='AWS Region (overrides environment variable, uses boto3 default if not set)')
    parser.add_argument('--access-key', default=os.environ.get('AWS_ACCESS_KEY_ID'), help='AWS Access Key ID (overrides environment variable)')
    parser.add_argument('--secret-key', default=os.environ.get('AWS_SECRET_ACCESS_KEY'), help='AWS Secret Access Key (overrides environment variable)')

    args = parser.parse_args()

    # --- Load Configuration ---
    config = load_config(args.config)
    try:
        DYNAMODB_TABLE_NAME = config['db_tables']['degree_reqs']
    except KeyError:
        print(f"Error: Could not find 'db_tables.degree_reqs' in config file '{args.config}'")
        sys.exit(1)

    # --- Load Data ---
    requirements_list = load_requirements_from_json(args.file_path)

    # --- Upload Data ---
    if requirements_list:
        upload_requirements_to_dynamodb(
            requirements_list,
            DYNAMODB_TABLE_NAME,
            args.region, # Pass region from args or env
            args.access_key, # Pass credentials from args or env
            args.secret_key
        )
    else:
        print("Upload aborted due to errors loading JSON data.")