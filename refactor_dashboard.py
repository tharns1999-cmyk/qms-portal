import re

with open('/Users/macpro/Documents/Tharn/qms-portal/src/pages/Dashboard/Dashboard.jsx', 'r') as f:
    content = f.read()

# Replace p-6 and p-8 in cards with p-4
content = re.sub(r'className="p-6\s+', 'className="p-4 ', content)
content = re.sub(r'className="premium-card p-8\s+', 'className="premium-card p-4 ', content)
content = re.sub(r'className="p-4 border', 'className="p-4 border', content) # Already p-4

# We need to replace the tabs and card rendering logic.
# Find the start of Section 2:
start_marker = "{/* Section 2: System Overview (Tabs & Compact Grid) */}"
end_marker = "{/* Section 5: Recent DARs Table */}"

section_pattern = re.compile(re.escape(start_marker) + r".*?" + re.escape(end_marker), re.DOTALL)

match = section_pattern.search(content)
if not match:
    print("Could not find sections!")
    exit(1)

old_section = match.group(0)

# We will just write the new JSX for this entire section.
new_section = """{/* Section 2: System Overview (Unified for Admin, Tabs for Users) */}
      <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/50 pb-2">
          <div className="flex space-x-4">
            {isAdmin ? (
              <div className="pb-2 px-1 text-sm font-bold text-blue-600 transition-all relative flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> ภาพรวมระบบ (System Overview)
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-md" />
              </div>
            ) : (
              <>
                <button
                  onClick={() => { setActiveOverviewTab('ALL_REQUESTS'); setActiveCardFilter(''); }}
                  className={`pb-2 px-1 text-sm font-bold transition-all relative ${activeOverviewTab === 'ALL_REQUESTS' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  <span className="flex items-center gap-2"><Briefcase className="w-4 h-4" /> คำขอของฉัน (My Requests)</span>
                  {activeOverviewTab === 'ALL_REQUESTS' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-md" />}
                </button>
                <button
                  onClick={() => { setActiveOverviewTab('ACTION_REQUIRED'); setActiveCardFilter(''); }}
                  className={`pb-2 px-1 text-sm font-bold transition-all relative ${currentUser.level <= 3 ? 'opacity-50 cursor-not-allowed' : ''} ${activeOverviewTab === 'ACTION_REQUIRED' ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
                  disabled={currentUser.level <= 3}
                >
                  <span className="flex items-center gap-2">
                    <Activity className="w-4 h-4" /> งานที่ต้องจัดการ (Action Required)
                    {myTasks.length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm ml-1 animate-pulse">
                        {myTasks.length}
                      </span>
                    )}
                  </span>
                  {activeOverviewTab === 'ACTION_REQUIRED' && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 rounded-t-md" />}
                </button>
              </>
            )}
          </div>
        </div>

        {(isAdmin || activeOverviewTab === 'ALL_REQUESTS') && (
          <div className="mb-2">
            {isAdmin && <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">สถานะคำขอเอกสาร (Document Requests)</h4>}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Draft */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_DRAFT' ? '' : 'MY_DRAFT')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_DRAFT' ? 'premium-card ring-2 ring-gray-300 bg-gray-50' : 'premium-card bg-white'}`}>
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-gray-500">Draft (ร่าง)</h3>
                </div>
                <span className="text-3xl font-bold text-gray-800">{myDraftCount}</span>
              </motion.div>
              
              {/* In Progress */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_IN_PROGRESS' ? '' : 'MY_IN_PROGRESS')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_IN_PROGRESS' ? 'premium-card ring-2 ring-blue-300 bg-blue-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-blue-600 font-semibold">{isAdmin ? 'In Progress (รวม)' : 'In Progress (กำลังดำเนินการ)'}</p>
                  <Clock className="w-5 h-5 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-700">{myInProgressCount}</p>
              </motion.div>
              
              {/* Returned */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_RETURNED' ? '' : 'MY_RETURNED')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_RETURNED' ? 'premium-card ring-2 ring-red-300 bg-red-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-red-600 font-semibold">{isAdmin ? 'Returned (รวม)' : 'Returned (ให้แก้ไข)'}</p>
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-red-700">{myReturnedCount}</p>
              </motion.div>

              {/* Waiting Effective */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_WAITING' ? '' : 'MY_WAITING')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_WAITING' ? 'premium-card ring-2 ring-green-300 bg-green-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-green-600 font-semibold">{isAdmin ? 'Waiting (รวม)' : 'Waiting (รอประกาศ)'}</p>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-700">{myWaitingCount}</p>
              </motion.div>

              {/* Cancelled (Overdue) */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'MY_CANCELLED' ? '' : 'MY_CANCELLED')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'MY_CANCELLED' ? 'premium-card ring-2 ring-red-300 bg-red-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-red-600 font-semibold">{isAdmin ? 'Cancelled (รวม)' : 'Cancelled (ถูกยกเลิก)'}</p>
                  <Trash2 className="w-5 h-5 text-red-400" />
                </div>
                <p className="text-3xl font-bold text-red-700">{myCancelledCount}</p>
              </motion.div>
            </motion.div>
          </div>
        )}

        {(isAdmin || activeOverviewTab === 'ACTION_REQUIRED') && (
          <div className="mb-2 mt-4">
            {isAdmin && <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">งานที่ต้องตรวจสอบ (Action Required)</h4>}
            <motion.div variants={containerVariants} initial="hidden" animate="show" className={`grid grid-cols-2 md:grid-cols-4 gap-3`}>
              
              {/* Pending Review */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_REVIEW' ? '' : 'ACTION_REVIEW')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_REVIEW' ? 'premium-card ring-2 ring-indigo-300 bg-indigo-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-indigo-600 font-semibold">Pending Review</p>
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{actionReviewCount}</p>
              </motion.div>
              
              {/* Pending Approval */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_APPROVE' ? '' : 'ACTION_APPROVE')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_APPROVE' ? 'premium-card ring-2 ring-yellow-400 bg-yellow-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-yellow-600 font-semibold">Pending Approval</p>
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                </div>
                <p className="text-3xl font-bold text-gray-800">{actionApproveCount}</p>
              </motion.div>
              
              {/* Due Soon */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_DUE_SOON' ? '' : 'ACTION_DUE_SOON')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_DUE_SOON' ? 'premium-card ring-2 ring-orange-300 bg-orange-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-orange-600 font-semibold">Due Soon</p>
                  {activeCardFilter === 'ACTION_DUE_SOON' ? <span className="flex h-2 w-2 rounded-full bg-orange-500"></span> : <Clock className="w-5 h-5 text-orange-500" />}
                </div>
                <p className="text-3xl font-bold text-gray-800">{actionDueSoonCount}</p>
              </motion.div>
  
              {/* Overdue */}
              <motion.div variants={itemVariants} onClick={() => setActiveCardFilter(activeCardFilter === 'ACTION_OVERDUE' ? '' : 'ACTION_OVERDUE')} className={`p-4 flex flex-col justify-between h-full border-none jelly-interactive ${activeCardFilter === 'ACTION_OVERDUE' ? 'premium-card ring-2 ring-red-300 bg-red-50' : 'premium-card bg-white'}`}>
                <div className="flex justify-between items-start mb-1">
                  <p className="text-sm text-red-600 font-semibold">Overdue</p>
                  {activeCardFilter === 'ACTION_OVERDUE' ? <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping"></span> : <AlertTriangle className="w-5 h-5 text-red-500" />}
                </div>
                <p className="text-3xl font-bold text-gray-800">{actionOverdueCount}</p>
              </motion.div>
            </motion.div>
          </div>
        )}

        {isAdmin && (
          <div className="mb-2 mt-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">งานควบคุมสำเนาแจกจ่าย (Controlled Copy Tasks)</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Pending Print & Issue */}
              <motion.div variants={itemVariants}
                onClick={() => navigate('/controlled-copy?tab=ACTION_REQUIRED')}
                className="premium-card p-4 flex flex-col justify-between group bg-teal-50 border border-teal-100 jelly-interactive"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-teal-800 font-semibold text-sm">รอพิมพ์แจกจ่าย (Pending Print)</p>
                  <div className="p-1 bg-teal-500/20 rounded-xl">
                    <FileText className="w-4 h-4 text-teal-700" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1 text-teal-900">{pendingPrintCount}</p>
              </motion.div>

              {/* Pending Recall */}
              <motion.div variants={itemVariants}
                onClick={() => navigate('/controlled-copy?tab=ACTION_REQUIRED')}
                className="p-4 border border-rose-100 bg-rose-50 rounded-2xl jelly-interactive flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-rose-800 font-semibold text-sm">รอเรียกคืน (Pending Recall)</p>
                  <div className="p-1 bg-rose-500/20 rounded-xl">
                    <Clock className="w-4 h-4 text-rose-700" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1 text-rose-900">{pendingRecallCount}</p>
              </motion.div>

              {/* Replacement Requests */}
              <motion.div variants={itemVariants}
                onClick={() => navigate('/controlled-copy?tab=ACTION_REQUIRED')}
                className="p-4 border border-amber-100 bg-amber-50 rounded-2xl jelly-interactive flex flex-col justify-between"
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-amber-800 font-semibold text-sm">คำขอทดแทน (Replacement)</p>
                  <div className="p-1 bg-amber-500/20 rounded-xl">
                    <AlertTriangle className="w-4 h-4 text-amber-700" />
                  </div>
                </div>
                <p className="text-3xl font-bold mb-1 text-amber-900">{replacementRequestCount}</p>
              </motion.div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Section 5: Recent DARs Table */}
"""
content = content[:match.start()] + new_section + content[match.end():]

with open('/Users/macpro/Documents/Tharn/qms-portal/src/pages/Dashboard/Dashboard.jsx', 'w') as f:
    f.write(content)

print("Dashboard patched successfully")
