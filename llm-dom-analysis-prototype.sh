#!/bin/bash

# Function to capture DOM
capture_dom() {
    local url=$1
    curl -s "$url" > dom.html
    echo "DOM captured and saved to dom.html"
}

# Function to analyze DOM with Anthropic API using Python's built-in libraries
analyze_dom_with_llm() {
    python3 - <<END
import json
import http.client
import os
import ssl

# Read .env file and set environment variables
with open('.env', 'r') as env_file:
    for line in env_file:
        if line.strip() and not line.startswith('#'):
            key, value = line.strip().split('=', 1)
            os.environ[key] = value

# Read the DOM content
with open('dom.html', 'r') as file:
    dom_content = file.read()

# Get environment variables with default values
api_key = os.getenv('LLM_API_KEY')
if not api_key:
    raise ValueError("LLM_API_KEY is not set in the .env file")

max_tokens = int(os.getenv('MAX_TOKENS', '1000'))
temperature = float(os.getenv('TEMPERATURE', '0.7'))

# Construct the payload
payload = {
    "prompt": f"Human: Analyze this HTML DOM and identify any plugins, frameworks, or third-party scripts. Here's the DOM content: {json.dumps(dom_content)}\n\nAssistant: Certainly! I'll analyze the HTML DOM you provided and identify any plugins, frameworks, or third-party scripts. Here's what I found:\n\nHuman: Great, please proceed with the analysis.\n\nAssistant:",
    "model": "claude-2",
    "max_tokens_to_sample": max_tokens,
    "temperature": temperature
}

# Create a secure SSL context
context = ssl.create_default_context()

# Make the API request
conn = http.client.HTTPSConnection("api.anthropic.com", context=context)
headers = {
    "Content-Type": "application/json",
    "X-API-Key": api_key,
    "anthropic-version": "2023-06-01"  # Add this line
}

conn.request("POST", "/v1/complete", body=json.dumps(payload), headers=headers)
response = conn.getresponse()

print("Raw API Response:")
raw_response = response.read().decode()
print(raw_response)

print("\nParsed Response:")
if response.status == 200:
    parsed_response = json.loads(raw_response)
    print(parsed_response.get('completion', ''))
else:
    print(f"Error: {response.status}")
    print(raw_response)

conn.close()
END
}

# Main execution
url="https://planetpure.com"
capture_dom "$url"
echo "Analysis Result:"
analysis_result=$(analyze_dom_with_llm)
echo "$analysis_result"