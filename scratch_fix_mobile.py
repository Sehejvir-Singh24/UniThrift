import os
import glob
import re

# Find all HTML files
html_files = glob.glob('**/*.html', recursive=True)

bad_style_re = re.compile(r'<style>\s*body\s*\{\s*min-height:\s*max\(884px,\s*100dvh\);\s*\}\s*</style>', re.MULTILINE)

for filepath in html_files:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Remove the bad min-height style
    content = bad_style_re.sub('', content)
    
    # 2. Fix the padding bottom of <main>
    # <main class="... pb-24 ..."> to pb-[120px]
    content = re.sub(r'(<main[^>]*class="[^"]*)\bpb-24\b', r'\1pb-[120px]', content)
    
    # 3. Fix the bottom position of the FAB
    # <button ... class="... bottom-24 ..."> to bottom-[120px]
    content = re.sub(r'(<button[^>]*class="[^"]*)\bbottom-24\b', r'\1bottom-[120px]', content)

    # In auth/profile_setup.html I set pb-[140px] earlier, so that's fine.

    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

print("Done fixing UI layout issues.")
