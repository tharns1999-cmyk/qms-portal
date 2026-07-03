const fs = require('fs');
const file = 'src/pages/ControlledCopy/ControlledCopyRegister.jsx';
let content = fs.readFileSync(file, 'utf8');

// The block to extract is from {activeTab === 'AUDIT_TRAIL' ? ( down to ) : activeTab === 'MASTER_DOCS' ? ( ... ) : ( 
// Since it's complex, let's just use string replacement carefully.

// Find the start of the ternary
const auditTrailStart = content.indexOf("{activeTab === 'AUDIT_TRAIL' ? (");
const masterDocsStart = content.indexOf(") : activeTab === 'MASTER_DOCS' ? (");
const instancesStart = content.indexOf(") : (\n          <>\n            {/* Filter Bar */}");

if (auditTrailStart > 0 && masterDocsStart > 0 && instancesStart > 0) {
  // Extract Audit Trail HTML
  let auditTrailHtml = content.substring(auditTrailStart + "{activeTab === 'AUDIT_TRAIL' ? (\n          <>".length, masterDocsStart);
  
  // Find the end of the instances table
  const instancesEnd = content.indexOf("          </table>\n        </div>\n        </>\n        )}");
  
  if (instancesEnd > 0) {
    let beforeTernary = content.substring(0, auditTrailStart);
    let instancesHtml = content.substring(instancesStart + ") : (\n          <>\n".length, instancesEnd + "          </table>\n        </div>\n".length);
    let afterInstances = content.substring(instancesEnd + "          </table>\n        </div>\n        </>\n        )}".length);
    
    let newContent = beforeTernary + instancesHtml + "\n        {activeTab === 'HISTORY' && (\n          <div className=\"mt-8 border-t border-gray-100 dark:border-[#334155] pt-8\">\n            <h3 className=\"text-lg font-bold px-6 mb-4 text-gray-800 dark:text-white\">Audit Trail (ประวัติการดำเนินการ)</h3>\n" + auditTrailHtml + "\n        )}\n      </div>\n" + afterInstances;
    
    fs.writeFileSync(file, newContent, 'utf8');
    console.log("Refactoring successful!");
  } else {
    console.log("Could not find instances end.");
  }
} else {
  console.log("Could not find ternary branches.");
}
