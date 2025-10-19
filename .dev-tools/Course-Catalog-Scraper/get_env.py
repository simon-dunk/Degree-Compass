import os

def get_env_value(key_name):
    """
    Retrieves a value from a .env file in the same directory.

    Args:
        key_name (str): The name of the key to retrieve.

    Returns:
        str: The value of the key if found, otherwise None.
    """
    # Get the directory of the current script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Construct the path to the .env file
    env_path = os.path.join(script_dir, '.env')

    try:
        with open(env_path, 'r') as file:
            for line in file:
                # Ignore comments and empty lines
                if line.strip() and not line.strip().startswith('#'):
                    # Split line into key and value
                    key, value = line.strip().split('=', 1)
                    if key.strip() == key_name:
                        # Return the value, stripping any quotes
                        return value.strip().strip("'\"")
    except FileNotFoundError:
        print(f"Error: .env file not found at {env_path}")
        return None
    
    return None