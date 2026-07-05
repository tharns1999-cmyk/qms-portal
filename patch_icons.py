import os
import re

tailwinds = {'3': 12, '4': 16, '5': 20, '6': 24, '7': 28, '8': 32, '10': 40, '12': 48, '16': 64}

def clean_class(m_class):
    classes = m_class.group(1).split()
    # Remove w- and h- classes completely
    classes = [c for c in classes if not re.match(r'^[wh]-\d+$', c)]
    if not classes: return ''
    return 'className="' + ' '.join(classes) + '"'

def patch_icons():
    for root, dirs, files in os.walk('src'):
        for file in files:
            if not file.endswith(('.jsx', '.js')): continue
            filepath = os.path.join(root, file)
            with open(filepath, 'r') as f:
                content = f.read()
            
            # Find imported lucide icons
            lucide_match = re.search(r"import\s+\{([^}]+)\}\s+from\s+['\"]lucide-react['\"]", content)
            if not lucide_match: continue
            
            icons = [i.strip() for i in lucide_match.group(1).split(',')]
            
            new_content = content
            for icon in icons:
                if not icon: continue
                # We need to find <IconName ... /> and <Icon ... /> if icon is aliased
                # Regex to match <IconName ...> or <IconName />
                
                # Careful not to match <IconNameSomethingElse>
                pattern = r'<\b' + re.escape(icon) + r'\b([^>]*?)>'
                
                def replacer(m):
                    tag_body = m.group(1)
                    
                    # Remove existing size
                    tag_body = re.sub(r'\s*size=\{[^}]*\}', '', tag_body)
                    tag_body = re.sub(r'\s*size="[^"]*"', '', tag_body)
                    
                    # Remove existing strokeWidth
                    tag_body = re.sub(r'\s*strokeWidth=\{[^}]*\}', '', tag_body)
                    tag_body = re.sub(r'\s*strokeWidth="[^"]*"', '', tag_body)
                    
                    # Determine size based on w- match
                    size = 24
                    w_match = re.search(r'\bw-(\d+)\b', tag_body)
                    if w_match and w_match.group(1) in tailwinds:
                        original_px = tailwinds[w_match.group(1)]
                        if original_px >= 32:
                            size = original_px
                        elif original_px > 20:
                            size = 28
                            
                    # Clean className
                    tag_body = re.sub(r'className="([^"]*)"', clean_class, tag_body)
                    
                    # Reconstruct tag
                    # If it was self-closing, m.group(1) will end with '/'
                    is_self_closing = tag_body.strip().endswith('/')
                    if is_self_closing:
                        tag_body = tag_body.rsplit('/', 1)[0]
                    
                    new_tag = f'<{icon} {tag_body.strip()} size={{{size}}} strokeWidth={{1.25}} ' + ('/>' if is_self_closing else '>')
                    # Cleanup extra spaces
                    new_tag = re.sub(r'\s+', ' ', new_tag).replace(' />', '/>').replace(' >', '>')
                    return new_tag

                new_content = re.sub(pattern, replacer, new_content)
                
            if new_content != content:
                with open(filepath, 'w') as f:
                    f.write(new_content)
                print(f"Updated {filepath}")

patch_icons()
