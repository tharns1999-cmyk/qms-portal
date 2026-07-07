import re

with open('/Users/macpro/Documents/Tharn/qms-portal/src/store/useStore.js', 'r') as f:
    content = f.read()

def inject_log(func_name, action_type, details):
    global content
    
    # Find the function declaration
    func_pattern = re.compile(r'(\s+' + func_name + r'\s*:\s*.*?=>\s*set\s*\(\s*\(state\)\s*=>\s*\{.*?)(\n\s*return\s*\{)(.*?)(\n\s*\}\s*;?\s*\n\s*\}\)\s*,)', re.DOTALL)
    
    match = func_pattern.search(content)
    if match:
        prefix = match.group(1)
        ret_start = match.group(2)
        ret_body = match.group(3)
        ret_end = match.group(4)
        
        # Check if actionLog is already in ret_body
        if 'actionLog:' not in ret_body:
            log_str = f",\n      actionLog: [{{\n        id: `LOG-${{Date.now()}}-${{Math.random().toString(36).substr(2, 9)}}`,\n        actionType: '{action_type}',\n        actor: state.currentUser.name,\n        details: `{details}`,\n        timestamp: new Date().toISOString()\n      }}, ...(state.actionLog || [])]"
            new_ret_body = ret_body + log_str
            new_content = prefix + ret_start + new_ret_body + ret_end
            content = content[:match.start()] + new_content + content[match.end():]
            print(f"Patched {func_name}")
        else:
            print(f"Already patched {func_name}")
    else:
        print(f"Could not find {func_name}")

inject_log('setCurrentUser', 'USER_LOGIN', 'User logged in')
inject_log('addDar', 'DAR_SUBMIT', 'Submitted DAR ${newDar.id}')
inject_log('deleteDar', 'DAR_DELETE', 'Deleted DAR ${darId}')
inject_log('addComment', 'DAR_COMMENT', 'Added comment to DAR ${darId}')
inject_log('issueControlledCopy', 'CC_ISSUE', 'Issued controlled copy for ${docTitle}')
inject_log('confirmCcReceipt', 'CC_RECEIPT', 'Confirmed receipt for copy ${instId}')
inject_log('reportCcDamagedLost', 'CC_REPORT', 'Reported copy ${instId} as ${type}')
inject_log('approveCcReplacement', 'CC_REPLACE_APPROVE', 'Approved replacement for task ${taskId}')
inject_log('rejectCcReplacement', 'CC_REPLACE_REJECT', 'Rejected replacement for task ${taskId}')
inject_log('recallControlledCopy', 'CC_RECALL', 'Recalled copy ${instId}')
inject_log('distributeDocument', 'DOC_DISTRIBUTE', 'Distributed document ${docId} to department ${deptId}')
inject_log('distributeAllDocument', 'DOC_DISTRIBUTE_ALL', 'Distributed document ${docId} to all departments')

with open('/Users/macpro/Documents/Tharn/qms-portal/src/store/useStore.js', 'w') as f:
    f.write(content)

