import os
import sys

def require_env(key: str) -> str:
    value = os.getenv(key)
    if not value:
        print(f"Error: environment variable {key} is required.", file=sys.stderr)
        sys.exit(1)
    return value
