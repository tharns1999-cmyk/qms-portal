import os
import re

for root, dirs, files in os.walk('src'):
    for file in files:
        if not file.endswith(('.jsx', '.js')): continue
        filepath = os.path.join(root, file)
        with open(filepath, 'r') as f:
            content = f.read()
            
        if re.search(r'size=\{\d+\}\s+strokeWidth=\{1\.25\}>\s*0\s*\?', content):
            print(f"Found broken > 0 in {filepath}")
            
        if 'className={`' in content and 'size={' in content:
            # We might have other broken tags
            pass
