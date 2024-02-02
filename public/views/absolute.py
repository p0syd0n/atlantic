import re
import os

# Open the file and read its contents
with open('soundboard.ejs', 'r') as f:
    contents = f.read()

# Define the base URL
base_url = 'http:\/\/myinstants.com'

# Find all instances of local resource links
links = re.findall(r"'(.*?)'", contents)

# Loop through each link
for link in links:
    # If the link is a local resource link, CSS/JS file, or image file
    if '/media/' in link or link.endswith('.css') or link.endswith('.js') or link.endswith('.jpg') or link.endswith('.png') or link.endswith('.gif'):
        # Convert to absolute URL
        abs_link = base_url + link
        # Replace the original link with the absolute URL
        contents = contents.replace(f"'{link}'", f"'{abs_link}'")

# Write the modified contents back to the file
with open('soundboard.ejs', 'w') as f:
    f.write(contents)
