from bs4 import BeautifulSoup
from urllib.parse import urlparse, urljoin

def convert_local_links_to_absolute(html_file_path, base_url):
    with open(html_file_path, 'r', encoding='utf-8') as file:
        html_content = file.read()

    soup = BeautifulSoup(html_content, 'html.parser')

    # Find all media elements with src or href attributes
    media_elements = soup.find_all(['img', 'audio', 'video', 'source', 'link', 'script'])

    for element in media_elements:
        if element.has_attr('src') or element.has_attr('href'):
            if element.has_attr('src'):
                media_url = element['src']
            else:
                media_url = element['href']

            # Check if the media URL is relative
            if not urlparse(media_url).netloc:
                absolute_url = urljoin(base_url, media_url)
                if element.has_attr('src'):
                    element['src'] = absolute_url
                else:
                    element['href'] = absolute_url

    # Write the modified HTML content to a new file
    with open('absolute_links.html', 'w', encoding='utf-8') as file:
        file.write(str(soup))

# Example usage:
html_file_path = 'soundboard.ejs'  # Path to your HTML file
base_url = 'https://www.myinstants.com'  # Base URL of your website
convert_local_links_to_absolute(html_file_path, base_url)
