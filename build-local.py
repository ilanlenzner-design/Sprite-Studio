#!/usr/bin/env python3
# Script to create a unified local development HTML file

with open('index.html', 'r') as f:
    html = f.read()

with open('Styles.html', 'r') as f:
    styles = f.read()
    # Remove <style> tags, keep only the CSS content
    styles = styles.replace('<style>', '').replace('</style>', '').strip()

with open('Studio.html', 'r') as f:
    studio = f.read()
    # Remove <script> tags, keep only the JavaScript content
    studio = studio.replace('<script>', '').replace('</script>', '').strip()

# Replace the Apps Script include directives
html = html.replace("<?!= include('Styles'); ?>", f"<style>\n{styles}\n</style>")
html = html.replace("<?!= include('Studio'); ?>", f"<script>\n{studio}\n</script>")

# Write the combined file
with open('local-dev.html', 'w') as f:
    f.write(html)

print("✅ Created local-dev.html successfully!")
