var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// test_render.js
var import_server = require("react-dom/server");
var import_react6 = __toESM(require("react"), 1);

// src/pages/Library/LibraryDetail.jsx
var import_react5 = __toESM(require("react"), 1);
var import_react_router_dom = require("react-router-dom");

// node_modules/zustand/esm/vanilla.mjs
var createStoreImpl = (createState) => {
  let state;
  const listeners = /* @__PURE__ */ new Set();
  const setState = (partial, replace) => {
    const nextState = typeof partial === "function" ? partial(state) : partial;
    if (!Object.is(nextState, state)) {
      const previousState = state;
      state = (replace != null ? replace : typeof nextState !== "object" || nextState === null) ? nextState : Object.assign({}, state, nextState);
      listeners.forEach((listener) => listener(state, previousState));
    }
  };
  const getState = () => state;
  const getInitialState = () => initialState;
  const subscribe = (listener) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };
  const api = { setState, getState, getInitialState, subscribe };
  const initialState = state = createState(setState, getState, api);
  return api;
};
var createStore = ((createState) => createState ? createStoreImpl(createState) : createStoreImpl);

// node_modules/zustand/esm/react.mjs
var import_react = __toESM(require("react"), 1);
var identity = (arg) => arg;
function useStore(api, selector = identity) {
  const slice = import_react.default.useSyncExternalStore(
    api.subscribe,
    import_react.default.useCallback(() => selector(api.getState()), [api, selector]),
    import_react.default.useCallback(() => selector(api.getInitialState()), [api, selector])
  );
  import_react.default.useDebugValue(slice);
  return slice;
}
var createImpl = (createState) => {
  const api = createStore(createState);
  const useBoundStore = (selector) => useStore(api, selector);
  Object.assign(useBoundStore, api);
  return useBoundStore;
};
var create = ((createState) => createState ? createImpl(createState) : createImpl);

// node_modules/zustand/esm/middleware.mjs
function createJSONStorage(getStorage, options) {
  let storage;
  try {
    storage = getStorage();
  } catch (e2) {
    return;
  }
  const persistStorage = {
    getItem: (name) => {
      var _a;
      const parse = (str2) => {
        if (str2 === null) {
          return null;
        }
        return JSON.parse(str2, options == null ? void 0 : options.reviver);
      };
      const str = (_a = storage.getItem(name)) != null ? _a : null;
      if (str instanceof Promise) {
        return str.then(parse);
      }
      return parse(str);
    },
    setItem: (name, newValue) => storage.setItem(name, JSON.stringify(newValue, options == null ? void 0 : options.replacer)),
    removeItem: (name) => storage.removeItem(name)
  };
  return persistStorage;
}
var toThenable = (fn) => (input) => {
  try {
    const result = fn(input);
    if (result instanceof Promise) {
      return result;
    }
    return {
      then(onFulfilled) {
        return toThenable(onFulfilled)(result);
      },
      catch(_onRejected) {
        return this;
      }
    };
  } catch (e2) {
    return {
      then(_onFulfilled) {
        return this;
      },
      catch(onRejected) {
        return toThenable(onRejected)(e2);
      }
    };
  }
};
var persistImpl = (config, baseOptions) => (set, get, api) => {
  let options = {
    storage: createJSONStorage(() => window.localStorage),
    partialize: (state) => state,
    version: 0,
    merge: (persistedState, currentState) => ({
      ...currentState,
      ...persistedState
    }),
    ...baseOptions
  };
  let hasHydrated = false;
  let hydrationVersion = 0;
  const hydrationListeners = /* @__PURE__ */ new Set();
  const finishHydrationListeners = /* @__PURE__ */ new Set();
  let storage = options.storage;
  if (!storage) {
    return config(
      (...args) => {
        console.warn(
          `[zustand persist middleware] Unable to update item '${options.name}', the given storage is currently unavailable.`
        );
        set(...args);
      },
      get,
      api
    );
  }
  const setItem = () => {
    const state = options.partialize({ ...get() });
    return storage.setItem(options.name, {
      state,
      version: options.version
    });
  };
  const savedSetState = api.setState;
  api.setState = (state, replace) => {
    savedSetState(state, replace);
    return setItem();
  };
  const configResult = config(
    (...args) => {
      set(...args);
      return setItem();
    },
    get,
    api
  );
  api.getInitialState = () => configResult;
  let stateFromStorage;
  const hydrate = () => {
    var _a, _b;
    if (!storage) return;
    const currentVersion = ++hydrationVersion;
    hasHydrated = false;
    hydrationListeners.forEach((cb) => {
      var _a2;
      return cb((_a2 = get()) != null ? _a2 : configResult);
    });
    const postRehydrationCallback = ((_b = options.onRehydrateStorage) == null ? void 0 : _b.call(options, (_a = get()) != null ? _a : configResult)) || void 0;
    return toThenable(storage.getItem.bind(storage))(options.name).then((deserializedStorageValue) => {
      if (deserializedStorageValue) {
        if (typeof deserializedStorageValue.version === "number" && deserializedStorageValue.version !== options.version) {
          if (options.migrate) {
            const migration = options.migrate(
              deserializedStorageValue.state,
              deserializedStorageValue.version
            );
            if (migration instanceof Promise) {
              return migration.then((result) => [true, result]);
            }
            return [true, migration];
          }
          console.error(
            `State loaded from storage couldn't be migrated since no migrate function was provided`
          );
        } else {
          return [false, deserializedStorageValue.state];
        }
      }
      return [false, void 0];
    }).then((migrationResult) => {
      var _a2;
      if (currentVersion !== hydrationVersion) {
        return;
      }
      const [migrated, migratedState] = migrationResult;
      stateFromStorage = options.merge(
        migratedState,
        (_a2 = get()) != null ? _a2 : configResult
      );
      set(stateFromStorage, true);
      if (migrated) {
        return setItem();
      }
    }).then(() => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(get(), void 0);
      stateFromStorage = get();
      hasHydrated = true;
      finishHydrationListeners.forEach((cb) => cb(stateFromStorage));
    }).catch((e2) => {
      if (currentVersion !== hydrationVersion) {
        return;
      }
      postRehydrationCallback == null ? void 0 : postRehydrationCallback(void 0, e2);
    });
  };
  api.persist = {
    setOptions: (newOptions) => {
      options = {
        ...options,
        ...newOptions
      };
      if (newOptions.storage) {
        storage = newOptions.storage;
      }
    },
    clearStorage: () => {
      storage == null ? void 0 : storage.removeItem(options.name);
    },
    getOptions: () => options,
    rehydrate: () => hydrate(),
    hasHydrated: () => hasHydrated,
    onHydrate: (cb) => {
      hydrationListeners.add(cb);
      return () => {
        hydrationListeners.delete(cb);
      };
    },
    onFinishHydration: (cb) => {
      finishHydrationListeners.add(cb);
      return () => {
        finishHydrationListeners.delete(cb);
      };
    }
  };
  if (!options.skipHydration) {
    hydrate();
  }
  return stateFromStorage || configResult;
};
var persist = persistImpl;

// src/utils/workflowResolver.js
var resolveReviewer = (requesterId, department, masterUsers, reviewUsers) => {
  console.log(`[Routing] Resolving Reviewer for Requester: ${requesterId} in Dept: ${department}`);
  const requester = masterUsers.find((u2) => u2.id === requesterId);
  if (!requester) {
    console.error(`[Routing] Requester ${requesterId} not found in master data.`);
    return null;
  }
  const reqLevel = requester.level || 0;
  let candidates = reviewUsers.filter((u2) => {
    if (u2.dept !== department) return false;
    if (u2.id === requesterId) return false;
    const m2 = masterUsers.find((mu) => mu.id === u2.id);
    if (!m2) return false;
    if (m2.isDcc || m2.role === "DCC_ADMIN") return false;
    return (m2.level || 0) > reqLevel;
  });
  if (candidates.length > 0) {
    candidates.sort((a2, b3) => {
      const lA = masterUsers.find((mu) => mu.id === a2.id)?.level || 0;
      const lB = masterUsers.find((mu) => mu.id === b3.id)?.level || 0;
      return lA - lB;
    });
    const selected = candidates[0];
    const sLevel = masterUsers.find((mu) => mu.id === selected.id)?.level || 0;
    console.log(`[Routing] Found Nearest Higher Reviewer: ${selected.id} (${selected.name}) - Level ${sLevel} (Requester Level was ${reqLevel})`);
    return { id: selected.id, level: sLevel, dept: department };
  }
  console.log(`[Routing] No direct higher level found for Requester Level ${reqLevel}. Skipping Review step...`);
  return null;
};
var resolveApprover = (requesterId, reviewerId, department, masterUsers, approveUsers) => {
  console.log(`[Routing] Resolving Approver for Reviewer: ${reviewerId} (Requester: ${requesterId}) in Dept: ${department}`);
  const reviewer = masterUsers.find((u2) => u2.id === reviewerId);
  const revLevel = reviewer ? reviewer.level || 0 : 0;
  let candidates = approveUsers.filter((u2) => {
    if (u2.dept !== department) return false;
    if (u2.id === requesterId) return false;
    if (u2.id === reviewerId) return false;
    const m2 = masterUsers.find((mu) => mu.id === u2.id);
    if (!m2) return false;
    if (m2.isDcc || m2.role === "DCC_ADMIN") return false;
    return (m2.level || 0) > revLevel;
  });
  if (candidates.length > 0) {
    candidates.sort((a2, b3) => {
      const lA = masterUsers.find((mu) => mu.id === a2.id)?.level || 0;
      const lB = masterUsers.find((mu) => mu.id === b3.id)?.level || 0;
      return lA - lB;
    });
    const selected = candidates[0];
    const sLevel = masterUsers.find((mu) => mu.id === selected.id)?.level || 0;
    console.log(`[Routing] Found Nearest Higher Approver: ${selected.id} (${selected.name}) - Level ${sLevel} (Reviewer Level was ${revLevel})`);
    return { id: selected.id, level: sLevel, dept: department };
  }
  console.log(`[Routing] No direct higher level found for Reviewer Level ${revLevel}. Skipping Approve step...`);
  return null;
};

// src/store/useStore.js
var MASTER_DATA_USER = [
  { id: "U001", name: "Admin QA (DCC)", position: "Officer", level: 1, isDcc: true, dept: "QA" },
  { id: "U002", name: "QA Sup", position: "Supervisor", level: 4, dept: "QA" },
  { id: "U003", name: "QA Asst Mgr", position: "Asst. Manager", level: 5, dept: "QA" },
  { id: "U004", name: "QA GM", position: "General Manager", level: 6, dept: "QA" },
  { id: "U005", name: "PD Officer", position: "Officer", level: 1, dept: "PD" },
  { id: "U006", name: "PD Sup", position: "Supervisor", level: 4, dept: "PD" },
  { id: "U007", name: "PD Asst Mgr", position: "Asst. Manager", level: 5, dept: "PD" },
  { id: "U008", name: "PD GM", position: "General Manager", level: 6, dept: "PD" },
  { id: "U009", name: "PC Officer", position: "Officer", level: 1, dept: "PC" },
  { id: "U010", name: "PC Asst Mgr", position: "Asst. Manager", level: 5, dept: "PC" },
  { id: "U011", name: "PC Director", position: "Director", level: 7, dept: "PC" },
  { id: "U012", name: "ST Asst Mgr", position: "Asst. Manager", level: 5, dept: "ST" },
  { id: "U013", name: "HSE Asst Mgr", position: "Asst. Manager", level: 5, dept: "HSE" },
  { id: "U014", name: "WH Asst Mgr", position: "Asst. Manager", level: 5, dept: "WH" },
  { id: "U015", name: "MKT Asst Mgr", position: "Asst. Manager", level: 5, dept: "MKT" },
  { id: "U016", name: "EN Asst Mgr", position: "Asst. Manager", level: 5, dept: "EN" },
  { id: "U017", name: "HR Asst Mgr", position: "Asst. Manager", level: 5, dept: "HR" },
  // Mock A, B, C for SoD Testing
  { id: "M001", name: "\u0E19\u0E32\u0E22 A", position: "Officer", level: 1, dept: "PD" },
  { id: "M002", name: "\u0E19\u0E32\u0E22 B", position: "Supervisor", level: 4, dept: "PD" },
  { id: "M003", name: "\u0E19\u0E32\u0E22 C", position: "Asst. Manager", level: 5, dept: "PD" }
];
var REQUEST_MASTER_DATA_USER = MASTER_DATA_USER.map((u2) => ({ id: u2.id, name: u2.name, dept: u2.dept }));
var REVIEW_MASTER_DATA_USER = MASTER_DATA_USER.map((u2) => ({ id: u2.id, name: u2.name, dept: u2.dept }));
var APPROVE_MASTER_DATA_USER = MASTER_DATA_USER.map((u2) => ({ id: u2.id, name: u2.name, dept: u2.dept }));
var MOCK_DOC_FORMATS = [
  { id: 1, format: "WI-[YY]-[RUN_NO]" },
  { id: 2, format: "MN-[YY]-[RUN_NO]" }
];
var MOCK_DARS = [];
var MOCK_TASKS = [];
var MOCK_TIMELINE = [];
var MOCK_DOCUMENTS = [];
var MOCK_CONTROLLED_COPY_INSTANCES = [];
var calculateSLAStatus = (effectiveDate, currentDate) => {
  if (!effectiveDate) return "NORMAL";
  const eff = new Date(effectiveDate);
  eff.setHours(0, 0, 0, 0);
  const cur = new Date(currentDate);
  cur.setHours(0, 0, 0, 0);
  const diffTime = eff.getTime() - cur.getTime();
  const diffDays = Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 3) return "DUE_SOON";
  return "NORMAL";
};
var useStore2 = create(persist((set, get) => ({
  masterUsers: MASTER_DATA_USER,
  requestUsers: REQUEST_MASTER_DATA_USER,
  reviewUsers: REVIEW_MASTER_DATA_USER,
  approveUsers: APPROVE_MASTER_DATA_USER,
  docFormats: MOCK_DOC_FORMATS,
  dars: MOCK_DARS,
  tasks: MOCK_TASKS,
  timeline: MOCK_TIMELINE,
  documents: MOCK_DOCUMENTS,
  externalDocuments: [],
  externalAuditTrail: [],
  notifications: [],
  controlledCopyInstances: MOCK_CONTROLLED_COPY_INSTANCES,
  controlledCopyAuditTrail: [],
  mockDateOffset: 0,
  // Used to simulate passing days for SLA testing
  isDarkMode: false,
  toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setMockDateOffset: (days) => set({ mockDateOffset: days }),
  // Default user is PD Officer (U005)
  currentUser: { ...MASTER_DATA_USER[4], department: "PD" },
  setCurrentUser: (userId) => set((state) => {
    const baseUser = state.masterUsers.find((u2) => u2.id === userId);
    if (!baseUser) return state;
    const req = state.requestUsers.find((u2) => u2.id === userId);
    const rev = state.reviewUsers.find((u2) => u2.id === userId);
    const app = state.approveUsers.find((u2) => u2.id === userId);
    const dept = req?.dept || rev?.dept || app?.dept || baseUser.dept || "QA";
    return { currentUser: { ...baseUser, department: dept } };
  }),
  addNotification: (userId, title, message, link) => set((state) => ({
    notifications: [{ id: Date.now() + Math.random(), userId, title, message, isRead: false, link, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, ...state.notifications]
  })),
  markNotificationAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n3) => n3.id === id ? { ...n3, isRead: true } : n3)
  })),
  markAllNotificationsAsRead: (userId) => set((state) => ({
    notifications: state.notifications.map((n3) => n3.userId === userId ? { ...n3, isRead: true } : n3)
  })),
  registerExternalDoc: (doc) => set((state) => {
    const newId = `EXT-${Date.now()}`;
    let initialStatus = "ACTIVE";
    let newTasks = [...state.tasks];
    let newNotifications = [...state.notifications];
    if (doc.reviewerId) {
      initialStatus = "PENDING_EXT_REVIEW";
      newTasks.push({
        id: `extt-${Date.now()}-rev`,
        referenceType: "EXTERNAL_DOC",
        referenceId: newId,
        title: doc.title,
        type: "EXT_REVIEW",
        assigneeId: doc.reviewerId,
        status: "PENDING"
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: doc.reviewerId, title: "\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A", message: `\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01 "${doc.title}" \u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    } else if (doc.approverId) {
      initialStatus = "PENDING_EXT_APPROVAL";
      newTasks.push({
        id: `extt-${Date.now()}-app`,
        referenceType: "EXTERNAL_DOC",
        referenceId: newId,
        title: doc.title,
        type: "EXT_APPROVAL",
        assigneeId: doc.approverId,
        status: "PENDING"
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: doc.approverId, title: "\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34", message: `\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01 "${doc.title}" \u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
    if (initialStatus === "ACTIVE" && doc.acknowledgees && doc.acknowledgees.length > 0) {
      doc.acknowledgees.forEach((uid) => {
        newTasks.push({
          id: `extt-${Date.now()}-ack-${uid}`,
          referenceType: "EXTERNAL_DOC",
          referenceId: newId,
          title: doc.title,
          type: "Ack",
          assigneeId: uid,
          status: "PENDING"
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: "\u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", message: `\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01 "${doc.title}" \u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      });
    }
    return {
      externalDocuments: [{ ...doc, id: newId, status: initialStatus, ownerId: state.currentUser.id }, ...state.externalDocuments],
      tasks: newTasks,
      notifications: newNotifications,
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: newId,
        action: "REGISTER",
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: (/* @__PURE__ */ new Date()).toISOString(),
        details: `Registered external document (Status: ${initialStatus})`
      }, ...state.externalAuditTrail]
    };
  }),
  updateExternalDoc: (id, updates) => set((state) => ({
    externalDocuments: state.externalDocuments.map((d2) => d2.id === id ? { ...d2, ...updates } : d2),
    externalAuditTrail: [{
      id: `EXTA-${Date.now()}`,
      docId: id,
      action: "UPDATE",
      actor: state.currentUser.name,
      actorId: state.currentUser.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      details: "Updated external document"
    }, ...state.externalAuditTrail]
  })),
  withdrawExternalDoc: (id, reason) => set((state) => {
    const remainingTasks = state.tasks.filter((t2) => t2.referenceId !== id);
    return {
      externalDocuments: state.externalDocuments.map((d2) => d2.id === id ? { ...d2, status: "WITHDRAWN" } : d2),
      tasks: remainingTasks,
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: id,
        action: "WITHDRAW",
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: (/* @__PURE__ */ new Date()).toISOString(),
        details: reason || "Withdrawn"
      }, ...state.externalAuditTrail]
    };
  }),
  logExternalDownload: (id) => set((state) => ({
    externalAuditTrail: [{
      id: `EXTA-${Date.now()}`,
      docId: id,
      action: "DOWNLOAD",
      actor: state.currentUser.name,
      actorId: state.currentUser.id,
      date: (/* @__PURE__ */ new Date()).toISOString(),
      details: "Downloaded confidential document"
    }, ...state.externalAuditTrail]
  })),
  processExternalTask: (taskId, action, comment) => set((state) => {
    const taskIndex = state.tasks.findIndex((t2) => t2.id === taskId);
    if (taskIndex === -1) return state;
    const task = state.tasks[taskIndex];
    const docIndex = state.externalDocuments.findIndex((d2) => d2.id === task.referenceId);
    if (docIndex === -1) return state;
    const doc = state.externalDocuments[docIndex];
    let newDocStatus = doc.status;
    let newTasks = state.tasks.filter((t2) => t2.id !== taskId);
    let newNotifications = [...state.notifications];
    if (action === "APPROVE") {
      if (task.type === "EXT_REVIEW" || task.type === "Review") {
        if (doc.approverId) {
          newDocStatus = "PENDING_EXT_APPROVAL";
          newTasks.push({
            id: `extt-${Date.now()}-app`,
            referenceType: "EXTERNAL_DOC",
            referenceId: doc.id,
            title: doc.title,
            type: "EXT_APPROVAL",
            assigneeId: doc.approverId,
            status: "PENDING"
          });
          newNotifications.push({ id: Date.now() + Math.random(), userId: doc.approverId, title: "\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34", message: `\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01 "${doc.title}" \u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        } else {
          newDocStatus = "ACTIVE";
        }
      } else if (task.type === "EXT_APPROVAL" || task.type === "Approve") {
        newDocStatus = "ACTIVE";
      } else if (task.type === "Ack") {
      }
    } else if (action === "REJECT") {
      newDocStatus = "DRAFT";
      newTasks = newTasks.filter((t2) => t2.referenceId !== doc.id);
    }
    if (newDocStatus === "ACTIVE" && doc.status !== "ACTIVE" && doc.acknowledgees && doc.acknowledgees.length > 0) {
      doc.acknowledgees.forEach((uid) => {
        newTasks.push({
          id: `extt-${Date.now()}-ack-${uid}`,
          referenceType: "EXTERNAL_DOC",
          referenceId: doc.id,
          title: doc.title,
          type: "Ack",
          assigneeId: uid,
          status: "PENDING"
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: "\u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", message: `\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E20\u0E32\u0E22\u0E19\u0E2D\u0E01 "${doc.title}" \u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      });
    }
    const updatedDocs = [...state.externalDocuments];
    updatedDocs[docIndex] = { ...doc, status: newDocStatus };
    return {
      tasks: newTasks,
      notifications: newNotifications,
      externalDocuments: updatedDocs,
      externalAuditTrail: [{
        id: `EXTA-${Date.now()}`,
        docId: doc.id,
        action: `TASK_${action}_${task.type.toUpperCase()}`,
        actor: state.currentUser.name,
        actorId: state.currentUser.id,
        date: (/* @__PURE__ */ new Date()).toISOString(),
        details: comment || `Processed external task (${task.type})`
      }, ...state.externalAuditTrail]
    };
  }),
  addDar: (dar) => set((state) => {
    const date = /* @__PURE__ */ new Date();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    const prefix = `DAR`;
    const suffix = `-${mm}-${yy}`;
    const existingDarsThisMonth = state.dars.filter((d2) => d2.id.endsWith(suffix));
    let nextRun = 1;
    if (existingDarsThisMonth.length > 0) {
      const runNums = existingDarsThisMonth.map((d2) => parseInt(d2.id.replace(prefix, "").split("-")[0]));
      nextRun = Math.max(...runNums) + 1;
    }
    const newDarId = `${prefix}${String(nextRun).padStart(2, "0")}${suffix}`;
    const distributions = dar.distributions || [];
    const newDar = { ...dar, id: newDarId, distributions };
    if (newDar.type === "NEW" || newDar.type === "NEW_DOCUMENT") {
      const docPrefix = `${newDar.docType}-${newDar.department}-`;
      const existingDocs = state.documents.filter((d2) => d2.title.startsWith(docPrefix));
      const existingDars = state.dars.filter((d2) => (d2.type === "NEW" || d2.type === "NEW_DOCUMENT") && d2.docIdInput && d2.docIdInput.startsWith(docPrefix));
      let maxSeq = 0;
      existingDocs.forEach((d2) => {
        const seqStr = d2.title.replace(docPrefix, "");
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      });
      existingDars.forEach((d2) => {
        const seqStr = d2.docIdInput.replace(docPrefix, "");
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      });
      newDar.docIdInput = `${docPrefix}${String(maxSeq + 1).padStart(3, "0")}`;
    }
    let reviewerObj = null;
    if (!newDar.manualReviewerId) {
      reviewerObj = resolveReviewer(newDar.requesterId, newDar.department, state.masterUsers, state.reviewUsers);
    } else {
      const u2 = state.masterUsers.find((m2) => m2.id === newDar.manualReviewerId);
      if (u2) reviewerObj = { id: u2.id, level: u2.level, dept: u2.dept };
    }
    const today = /* @__PURE__ */ new Date();
    today.setDate(today.getDate() + state.mockDateOffset);
    const dueDateStr = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const cancelDateStr = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    let newTasks = [...state.tasks];
    let newNotifications = [...state.notifications];
    let realStatus = dar.isDraft ? "DRAFT" : "UNDER_REVIEW";
    if (!dar.isDraft) {
      if (reviewerObj) {
        newTasks.push({
          id: `t-${Date.now()}`,
          referenceType: "INTERNAL_DAR",
          referenceId: newDar.id,
          darId: newDar.id,
          title: newDar.title,
          type: "Review",
          assigneeId: reviewerObj.id,
          currentHandlerDepartment: reviewerObj.dept,
          currentHandlerLevel: reviewerObj.level,
          dueDate: dueDateStr,
          cancelDate: cancelDateStr,
          status: "NORMAL"
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: reviewerObj.id, title: "\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A", message: `DAR "${newDar.title}" \u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      } else {
        realStatus = "PENDING_APPROVAL";
        let approverObj = null;
        if (!newDar.manualApproverId) {
          approverObj = resolveApprover(newDar.requesterId, newDar.requesterId, newDar.department, state.masterUsers, state.approveUsers);
        } else {
          const u2 = state.masterUsers.find((m2) => m2.id === newDar.manualApproverId);
          if (u2) approverObj = { id: u2.id, level: u2.level, dept: u2.dept };
        }
        if (approverObj) {
          newTasks.push({
            id: `t-${Date.now()}`,
            referenceType: "INTERNAL_DAR",
            referenceId: newDar.id,
            darId: newDar.id,
            title: newDar.title,
            type: "Approve",
            assigneeId: approverObj.id,
            currentHandlerDepartment: approverObj.dept,
            currentHandlerLevel: approverObj.level,
            dueDate: dueDateStr,
            cancelDate: cancelDateStr,
            status: "NORMAL"
          });
          newNotifications.push({ id: Date.now() + Math.random(), userId: approverObj.id, title: "\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34", message: `DAR "${newDar.title}" \u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        } else {
          realStatus = dar.ackRequirement === "REQUIRED" ? "WAITING_ACKNOWLEDGEMENT" : "APPROVED_WAITING_EFFECTIVE";
          if (realStatus === "WAITING_ACKNOWLEDGEMENT" && dar.ackUserIds?.length > 0) {
            dar.ackUserIds.forEach((uid) => {
              newTasks.push({
                id: `t-${Date.now()}-${uid}`,
                referenceType: "INTERNAL_DAR",
                referenceId: newDar.id,
                darId: newDar.id,
                title: newDar.title,
                type: "Ack",
                assigneeId: uid,
                dueDate: dueDateStr,
                cancelDate: cancelDateStr,
                status: "NORMAL"
              });
              newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: "\u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", message: `DAR "${newDar.title}" \u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
            });
          }
        }
      }
    }
    return {
      dars: [...state.dars, { ...newDar, status: realStatus }],
      tasks: newTasks,
      notifications: newNotifications,
      timeline: [...state.timeline, {
        id: Date.now(),
        darId: newDar.id,
        action: "Created",
        user: state.currentUser.name,
        date: (/* @__PURE__ */ new Date()).toLocaleString(),
        comment: "Submitted request"
      }]
    };
  }),
  processWorkflow: (taskId, action, comment) => set((state) => {
    const task = state.tasks.find((t2) => t2.id === taskId);
    if (!task) return state;
    const dar = state.dars.find((d2) => d2.id === task.darId);
    if (!dar) return state;
    const newTasks = state.tasks.filter((t2) => t2.id !== taskId);
    let newStatus = dar.status;
    const today = /* @__PURE__ */ new Date();
    today.setDate(today.getDate() + state.mockDateOffset);
    const dueDateStr = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    const cancelDateStr = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
    let newNotifications = [...state.notifications];
    if (task.type === "Review") {
      if (action === "APPROVE") {
        newStatus = "PENDING_APPROVAL";
        let approverObj = null;
        if (!dar.manualApproverId) {
          approverObj = resolveApprover(dar.requesterId, task.assigneeId, dar.department, state.masterUsers, state.approveUsers);
        } else {
          const u2 = state.masterUsers.find((m2) => m2.id === dar.manualApproverId);
          if (u2) approverObj = { id: u2.id, level: u2.level, dept: u2.dept };
        }
        if (approverObj) {
          newTasks.push({
            id: `t-${Date.now()}`,
            referenceType: "INTERNAL_DAR",
            referenceId: dar.id,
            darId: dar.id,
            title: dar.title,
            type: "Approve",
            assigneeId: approverObj.id,
            currentHandlerDepartment: approverObj.dept,
            currentHandlerLevel: approverObj.level,
            dueDate: dueDateStr,
            cancelDate: cancelDateStr,
            status: "NORMAL"
          });
          newNotifications.push({ id: Date.now() + Math.random(), userId: approverObj.id, title: "\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34", message: `DAR "${dar.title}" \u0E23\u0E2D\u0E01\u0E32\u0E23\u0E2D\u0E19\u0E38\u0E21\u0E31\u0E15\u0E34\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
        } else {
          newStatus = dar.ackRequirement === "REQUIRED" ? "WAITING_ACKNOWLEDGEMENT" : "APPROVED_WAITING_EFFECTIVE";
          if (newStatus === "WAITING_ACKNOWLEDGEMENT" && dar.ackUserIds?.length > 0) {
            dar.ackUserIds.forEach((uid) => {
              newTasks.push({
                id: `t-${Date.now()}-${uid}`,
                referenceType: "INTERNAL_DAR",
                referenceId: dar.id,
                darId: dar.id,
                title: dar.title,
                type: "Ack",
                assigneeId: uid,
                dueDate: dueDateStr,
                cancelDate: cancelDateStr,
                status: "NORMAL"
              });
              newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: "\u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", message: `DAR "${dar.title}" \u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
            });
          }
        }
      } else if (action === "RETURN") {
        newStatus = "RETURNED_FOR_REVISION";
        newTasks.push({
          id: `t-${Date.now()}`,
          referenceType: "INTERNAL_DAR",
          referenceId: dar.id,
          darId: dar.id,
          title: dar.title,
          type: "Revise",
          assigneeId: dar.requesterId,
          dueDate: dueDateStr,
          cancelDate: cancelDateStr,
          status: "NORMAL"
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: dar.requesterId, title: "DAR \u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02", message: `DAR "${dar.title}" \u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13\u0E41\u0E01\u0E49\u0E44\u0E02`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      }
    } else if (task.type === "Approve") {
      if (action === "APPROVE") {
        newStatus = dar.ackRequirement === "REQUIRED" ? "WAITING_ACKNOWLEDGEMENT" : "APPROVED_WAITING_EFFECTIVE";
        if (newStatus === "WAITING_ACKNOWLEDGEMENT" && dar.ackUserIds?.length > 0) {
          dar.ackUserIds.forEach((uid) => {
            newTasks.push({
              id: `t-${Date.now()}-${uid}`,
              referenceType: "INTERNAL_DAR",
              referenceId: dar.id,
              darId: dar.id,
              title: dar.title,
              type: "Ack",
              assigneeId: uid,
              dueDate: dueDateStr,
              cancelDate: cancelDateStr,
              status: "NORMAL"
            });
            newNotifications.push({ id: Date.now() + Math.random(), userId: uid, title: "\u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23", message: `DAR "${dar.title}" \u0E1A\u0E31\u0E07\u0E04\u0E31\u0E1A\u0E43\u0E0A\u0E49\u0E41\u0E25\u0E49\u0E27 \u0E42\u0E1B\u0E23\u0E14\u0E23\u0E31\u0E1A\u0E17\u0E23\u0E32\u0E1A`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
          });
        }
      } else if (action === "RETURN") {
        newStatus = "RETURNED_FOR_REVISION";
        newTasks.push({
          id: `t-${Date.now()}`,
          referenceType: "INTERNAL_DAR",
          referenceId: dar.id,
          darId: dar.id,
          title: dar.title,
          type: "Revise",
          assigneeId: dar.requesterId,
          dueDate: dueDateStr,
          cancelDate: cancelDateStr,
          status: "NORMAL"
        });
        newNotifications.push({ id: Date.now() + Math.random(), userId: dar.requesterId, title: "DAR \u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E41\u0E01\u0E49\u0E44\u0E02", message: `DAR "${dar.title}" \u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E01\u0E25\u0E31\u0E1A\u0E43\u0E2B\u0E49\u0E04\u0E38\u0E13\u0E41\u0E01\u0E49\u0E44\u0E02`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
      } else if (action === "REJECT") {
        newStatus = "REJECTED";
      }
    } else if (task.type === "Ack") {
      if (action === "ACKNOWLEDGE") {
        const remainingAcks = newTasks.filter((t2) => t2.darId === dar.id && t2.type === "Ack");
        if (remainingAcks.length === 0) {
          newStatus = "APPROVED_WAITING_EFFECTIVE";
        }
      }
    }
    const updatedDars = state.dars.map((d2) => d2.id === dar.id ? { ...d2, status: newStatus } : d2);
    let timelineActionLabel = action;
    if (action === "APPROVE") {
      timelineActionLabel = task.type === "Review" ? "Reviewed" : "Approved";
    } else if (action === "RETURN") {
      timelineActionLabel = "Returned for Revision";
    } else if (action === "REJECT") {
      timelineActionLabel = "Rejected";
    } else if (action === "ACKNOWLEDGE") {
      timelineActionLabel = "Acknowledged";
    }
    const newTimeline = [...state.timeline, {
      id: Date.now(),
      darId: dar.id,
      action: timelineActionLabel,
      user: state.currentUser.name,
      date: (/* @__PURE__ */ new Date()).toLocaleString(),
      comment: comment || "-",
      isChat: false,
      userId: state.currentUser.id
    }];
    return {
      tasks: newTasks,
      notifications: newNotifications,
      dars: updatedDars,
      timeline: newTimeline
    };
  }),
  resubmitDar: (darId, updatedData, taskId) => set((state) => {
    const dar = state.dars.find((d2) => d2.id === darId);
    if (!dar) return state;
    const newTasks = state.tasks.filter((t2) => t2.id !== taskId);
    const updatedDars = state.dars.map((d2) => d2.id === darId ? { ...d2, ...updatedData, status: "UNDER_REVIEW" } : d2);
    let newNotifications = [...state.notifications];
    const assignedReviewerId = resolveReviewer(dar.requesterId, dar.department, state.masterUsers, state.reviewUsers);
    if (assignedReviewerId) {
      const today = /* @__PURE__ */ new Date();
      today.setDate(today.getDate() + state.mockDateOffset);
      newTasks.push({
        id: `t-${Date.now()}`,
        referenceType: "INTERNAL_DAR",
        referenceId: dar.id,
        darId: dar.id,
        title: updatedData.title || dar.title,
        type: "Review",
        assigneeId: assignedReviewerId,
        dueDate: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        cancelDate: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        status: "NORMAL"
      });
      newNotifications.push({ id: Date.now() + Math.random(), userId: assignedReviewerId, title: "\u0E07\u0E32\u0E19\u0E43\u0E2B\u0E21\u0E48\u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A", message: `DAR "${updatedData.title || dar.title}" \u0E16\u0E39\u0E01\u0E2A\u0E48\u0E07\u0E21\u0E32\u0E43\u0E2B\u0E21\u0E48 \u0E23\u0E2D\u0E01\u0E32\u0E23\u0E15\u0E23\u0E27\u0E08\u0E2A\u0E2D\u0E1A\u0E08\u0E32\u0E01\u0E04\u0E38\u0E13`, isRead: false, link: "/tasks", timestamp: (/* @__PURE__ */ new Date()).toISOString() });
    }
    return {
      dars: updatedDars,
      tasks: newTasks,
      notifications: newNotifications,
      timeline: [...state.timeline, {
        id: Date.now(),
        darId: dar.id,
        action: "Resubmitted",
        user: state.currentUser.name,
        date: (/* @__PURE__ */ new Date()).toLocaleString(),
        comment: "Resubmitted after revision"
      }]
    };
  }),
  simulatedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
  simulateNextDay: () => {
    set((state) => {
      const current = new Date(state.simulatedDate);
      current.setDate(current.getDate() + 1);
      return { simulatedDate: current.toISOString().split("T")[0] };
    });
    useStore2.getState().checkSLA();
  },
  // Auto-evaluation engine (runs on every tick/app load)
  checkSLA: () => set((state) => {
    const todayStr = state.simulatedDate;
    const today = new Date(todayStr);
    const activeStatuses = ["DRAFT", "UNDER_REVIEW", "PENDING_APPROVAL", "RETURNED_FOR_REVISION", "WAITING_ACKNOWLEDGEMENT"];
    const tasksToCheck = state.tasks.filter((t2) => t2.referenceType !== "EXTERNAL_DOC");
    const darIdsToCancel = state.dars.filter((d2) => activeStatuses.includes(d2.status)).filter((d2) => calculateSLAStatus(d2.effectiveDate, todayStr) === "OVERDUE").map((d2) => d2.id);
    const newTasks = state.tasks.filter((t2) => !darIdsToCancel.includes(t2.darId)).map((t2) => {
      const dar = state.dars.find((d2) => d2.id === t2.darId);
      const sla = dar && activeStatuses.includes(dar.status) ? calculateSLAStatus(dar.effectiveDate, todayStr) : "NORMAL";
      return { ...t2, status: sla };
    });
    let newDars = state.dars.map((d2) => darIdsToCancel.includes(d2.id) ? { ...d2, status: "CANCELLED_OVERDUE" } : d2);
    let newDocuments = [...state.documents];
    const newTimeline = [...state.timeline];
    darIdsToCancel.forEach((darId) => {
      newTimeline.push({
        id: Date.now() + Math.random(),
        darId,
        action: "System Cancel",
        user: "System (SLA Engine)",
        date: (/* @__PURE__ */ new Date()).toLocaleString(),
        comment: "Auto-cancelled due to Overdue Effective Date"
      });
    });
    const waitingEffectiveDars = newDars.filter((d2) => d2.status === "APPROVED_WAITING_EFFECTIVE" && d2.effectiveDate <= todayStr);
    let newControlledCopyInstances = [...state.controlledCopyInstances];
    let newAuditTrail = [...state.controlledCopyAuditTrail];
    if (waitingEffectiveDars.length > 0) {
      waitingEffectiveDars.forEach((dar) => {
        newDars = newDars.map((d2) => d2.id === dar.id ? { ...d2, status: "COMPLETED" } : d2);
        if (dar.type === "NEW" || dar.type === "NEW_DOCUMENT") {
          const newDoc = {
            id: `doc-${Date.now()}-${Math.random()}`,
            darId: dar.id,
            title: dar.docIdInput || "TBD",
            name: dar.title,
            status: "EFFECTIVE",
            rev: "00",
            department: dar.department,
            controlledCopy: 0,
            effectiveDate: dar.effectiveDate || todayStr,
            distributions: dar.distributions || []
          };
          newDocuments.push(newDoc);
          if (newDoc.distributions && newDoc.distributions.length > 0) {
            newTasks.push({
              id: `task-dist-${Date.now()}-${Math.random()}`,
              title: `\u0E41\u0E08\u0E01\u0E08\u0E48\u0E32\u0E22\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Controlled Copy (NEW)`,
              description: `\u0E01\u0E23\u0E38\u0E13\u0E32\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E41\u0E25\u0E30\u0E41\u0E08\u0E01\u0E08\u0E48\u0E32\u0E22\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 ${newDoc.title} \u0E08\u0E33\u0E19\u0E27\u0E19 ${newDoc.distributions.length} \u0E41\u0E1C\u0E19\u0E01`,
              type: "DCC_DISTRIBUTE",
              status: "PENDING",
              assigneeId: "U001",
              dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
              priority: "HIGH",
              darId: dar.id
            });
            newDoc.distributions.forEach((dist, idx) => {
              const deptName = dist.departmentId || dist.dept;
              const nextCcNum = `CC-${String(idx + 1).padStart(3, "0")}`;
              const newInst = {
                id: `inst-${Date.now()}-${idx}`,
                docId: newDoc.id,
                docTitle: newDoc.title,
                docName: newDoc.name,
                rev: newDoc.rev,
                ccNumber: nextCcNum,
                department: deptName,
                issueNumber: "I01",
                status: "PENDING_RECEIPT",
                dateIssued: todayStr
              };
              newControlledCopyInstances.push(newInst);
              newAuditTrail.push({
                id: `audit-${Date.now()}-${idx}`,
                timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                user: "System (SLA Engine)",
                action: "AUTO_GENERATE",
                docTitle: newInst.docTitle,
                docRev: newInst.rev,
                ccNumber: newInst.ccNumber,
                oldStatus: "-",
                newStatus: newInst.status,
                remarks: `Auto-generated CC for ${dist.dept} department upon document effective`
              });
            });
          }
        } else if (dar.type === "REVISION") {
          const oldDoc = newDocuments.find((doc) => doc.id === dar.docIdRef && doc.status === "EFFECTIVE");
          if (oldDoc) {
            newDocuments = newDocuments.map((doc) => doc.id === oldDoc.id ? { ...doc, status: "SUPERSEDED_ARCHIVED" } : doc);
            const currentRevNum = parseInt(oldDoc.rev, 10) || 0;
            const newRevNum = currentRevNum + 1;
            const newRevStr = newRevNum < 10 ? `0${newRevNum}` : `${newRevNum}`;
            const newDoc = {
              id: `doc-${Date.now()}-${Math.random()}`,
              darId: dar.id,
              title: oldDoc.title,
              name: dar.title || oldDoc.name,
              status: "EFFECTIVE",
              rev: newRevStr,
              department: dar.department,
              controlledCopy: oldDoc.controlledCopy || 0,
              effectiveDate: dar.effectiveDate || todayStr,
              distributions: dar.distributions && dar.distributions.length > 0 ? dar.distributions : oldDoc.distributions || []
            };
            newDocuments.push(newDoc);
            if (newDoc.distributions && newDoc.distributions.length > 0) {
              newTasks.push({
                id: `task-dist-${Date.now()}-${Math.random()}`,
                title: `\u0E41\u0E08\u0E01\u0E08\u0E48\u0E32\u0E22\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Controlled Copy (Rev.${newDoc.rev})`,
                description: `\u0E01\u0E23\u0E38\u0E13\u0E32\u0E1E\u0E34\u0E21\u0E1E\u0E4C\u0E41\u0E25\u0E30\u0E41\u0E08\u0E01\u0E08\u0E48\u0E32\u0E22\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E04\u0E27\u0E1A\u0E04\u0E38\u0E21\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 ${newDoc.title} \u0E08\u0E33\u0E19\u0E27\u0E19 ${newDoc.distributions.length} \u0E41\u0E1C\u0E19\u0E01`,
                type: "DCC_DISTRIBUTE",
                status: "PENDING",
                assigneeId: "U001",
                dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
                priority: "HIGH",
                darId: dar.id
              });
              newTasks.push({
                id: `task-recall-${Date.now()}-${Math.random()}`,
                title: `\u0E40\u0E23\u0E35\u0E22\u0E01\u0E04\u0E37\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 Controlled Copy (Rev.${oldDoc.rev})`,
                description: `\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 ${oldDoc.title} \u0E21\u0E35\u0E01\u0E32\u0E23\u0E2D\u0E31\u0E1B\u0E40\u0E14\u0E15\u0E40\u0E1B\u0E47\u0E19 Rev.${newDoc.rev} \u0E41\u0E25\u0E49\u0E27 \u0E01\u0E23\u0E38\u0E13\u0E32\u0E40\u0E23\u0E35\u0E22\u0E01\u0E04\u0E37\u0E19\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23\u0E09\u0E1A\u0E31\u0E1A\u0E40\u0E01\u0E48\u0E32 (Rev.${oldDoc.rev}) \u0E08\u0E32\u0E01\u0E41\u0E1C\u0E19\u0E01\u0E17\u0E35\u0E48\u0E40\u0E01\u0E35\u0E48\u0E22\u0E27\u0E02\u0E49\u0E2D\u0E07`,
                type: "DCC_RECALL",
                status: "PENDING",
                assigneeId: "U001",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
                priority: "HIGH",
                darId: dar.id
              });
              let maxCcNum = 0;
              newDoc.distributions.forEach((dist, idx) => {
                const deptName = dist.departmentId || dist.dept;
                maxCcNum += 1;
                const nextCcNum = `CC-${String(maxCcNum).padStart(3, "0")}`;
                const newInst = {
                  id: `inst-${Date.now()}-${idx}`,
                  docId: newDoc.id,
                  docTitle: newDoc.title,
                  docName: newDoc.name,
                  rev: newDoc.rev,
                  ccNumber: nextCcNum,
                  department: deptName,
                  issueNumber: "I01",
                  status: "PENDING_RECEIPT",
                  dateIssued: todayStr
                };
                newControlledCopyInstances.push(newInst);
                newAuditTrail.push({
                  id: `audit-${Date.now()}-${idx}`,
                  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
                  user: "System (SLA Engine)",
                  action: "AUTO_GENERATE",
                  docTitle: newInst.docTitle,
                  docRev: newInst.rev,
                  ccNumber: newInst.ccNumber,
                  oldStatus: "-",
                  newStatus: newInst.status,
                  remarks: `Auto-generated CC for ${dist.dept} department upon new revision effective`
                });
              });
            }
          }
        } else if (dar.type === "OBSOLETE") {
          newDocuments = newDocuments.map((doc) => doc.id === dar.docIdRef && doc.status === "EFFECTIVE" ? { ...doc, status: "OBSOLETE_ARCHIVED" } : doc);
        }
        newTimeline.push({
          id: Date.now() + Math.random(),
          darId: dar.id,
          action: "Auto Publish",
          user: "System (Lifecycle Engine)",
          date: (/* @__PURE__ */ new Date()).toLocaleString(),
          comment: "Document changed to EFFECTIVE status automatically"
        });
      });
    }
    if (darIdsToCancel.length === 0 && waitingEffectiveDars.length === 0 && JSON.stringify(newTasks) === JSON.stringify(state.tasks)) {
      return state;
    }
    return {
      tasks: newTasks,
      dars: newDars,
      documents: newDocuments,
      timeline: newTimeline,
      controlledCopyInstances: newControlledCopyInstances,
      controlledCopyAuditTrail: newAuditTrail
    };
  }),
  addComment: (darId, commentStr, user) => set((state) => {
    const newTimeline = [...state.timeline, {
      id: Date.now(),
      darId,
      action: "Comment",
      user: user.name,
      date: (/* @__PURE__ */ new Date()).toLocaleString(),
      comment: commentStr,
      isChat: true,
      userId: user.id
    }];
    return { timeline: newTimeline };
  }),
  deleteDar: (darId) => set((state) => {
    return {
      dars: state.dars.filter((d2) => d2.id !== darId),
      tasks: state.tasks.filter((t2) => t2.darId !== darId),
      timeline: state.timeline.filter((t2) => t2.darId !== darId)
    };
  }),
  // Phase 1.5 Departmental Access Control
  canAccessDocument: (userId, documentDept, distributions = []) => {
    const user = MASTER_DATA_USER.find((u2) => u2.id === userId);
    if (!user) return false;
    if (documentDept === user.dept) return true;
    if (distributions && distributions.some((d2) => d2.dept === user.dept || d2.departmentId === user.dept)) return true;
    if (user.level >= 5) return true;
    if (user.isDcc) return true;
    return false;
  },
  canDownloadDocument: (doc, user) => {
    return !!user.isDcc;
  },
  // --- CONTROLLED COPY METHODS ---
  issueControlledCopy: (docTitle, dept) => set((state) => {
    const doc = state.documents.find((d2) => d2.title === docTitle && d2.status === "EFFECTIVE");
    if (!doc) return state;
    const existingCopies = state.controlledCopyInstances.filter((c2) => c2.docTitle === docTitle);
    const nextCcNum = `CC-${String(existingCopies.length + 1).padStart(3, "0")}`;
    const newInst = {
      id: `inst-${Date.now()}`,
      docId: doc.id,
      docTitle: doc.title,
      docName: doc.name,
      rev: doc.rev,
      ccNumber: nextCcNum,
      department: dept,
      issueNumber: "I01",
      status: "PENDING_RECEIPT",
      dateIssued: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
    };
    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user: state.currentUser.name,
      action: "ISSUE_COPY",
      docTitle: newInst.docTitle,
      docRev: newInst.rev,
      ccNumber: newInst.ccNumber,
      oldStatus: "-",
      newStatus: newInst.status,
      remarks: `Issued new controlled copy to ${dept}`
    };
    return {
      controlledCopyInstances: [...state.controlledCopyInstances, newInst],
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail]
    };
  }),
  confirmCcReceipt: (instId) => set((state) => {
    const inst = state.controlledCopyInstances.find((i2) => i2.id === instId);
    if (!inst) return state;
    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user: state.currentUser.name,
      action: "CONFIRM_RECEIPT",
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: "ACTIVE",
      remarks: `Confirmed delivery to ${inst.department}`
    };
    return {
      controlledCopyInstances: state.controlledCopyInstances.map(
        (i2) => i2.id === instId ? { ...i2, status: "ACTIVE" } : i2
      ),
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail]
    };
  }),
  reportCcDamagedLost: (instId, type, reason) => set((state) => {
    const inst = state.controlledCopyInstances.find((i2) => i2.id === instId);
    if (!inst) return state;
    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user: state.currentUser.name,
      action: type === "LOST" ? "REPORT_LOST" : "REPORT_DAMAGED",
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: "REPLACEMENT_REQUESTED",
      remarks: `User reported: ${reason}`
    };
    const newTask = {
      id: `task-rep-${Date.now()}-${Math.random()}`,
      title: `\u0E04\u0E33\u0E02\u0E2D\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E43\u0E2B\u0E21\u0E48 (Replacement)`,
      description: `\u0E41\u0E1C\u0E19\u0E01 ${inst.department} \u0E02\u0E2D\u0E2A\u0E33\u0E40\u0E19\u0E32\u0E43\u0E2B\u0E21\u0E48\u0E2A\u0E33\u0E2B\u0E23\u0E31\u0E1A\u0E40\u0E2D\u0E01\u0E2A\u0E32\u0E23 ${inst.docTitle} \u0E40\u0E19\u0E37\u0E48\u0E2D\u0E07\u0E08\u0E32\u0E01 ${type} (${reason})`,
      type: "DCC_REPLACEMENT",
      status: "PENDING",
      assigneeId: "U001",
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
      priority: "HIGH",
      darId: inst.docId
    };
    return {
      controlledCopyInstances: state.controlledCopyInstances.map(
        (i2) => i2.id === instId ? { ...i2, status: "REPLACEMENT_REQUESTED", reportType: type, reportReason: reason } : i2
      ),
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail],
      tasks: [newTask, ...state.tasks]
    };
  }),
  approveCcReplacement: (instId) => set((state) => {
    const oldInst = state.controlledCopyInstances.find((i2) => i2.id === instId);
    if (!oldInst) return state;
    const updatedInstances = state.controlledCopyInstances.map(
      (inst) => inst.id === instId ? { ...inst, status: oldInst.reportType } : inst
    );
    const currentIssue = parseInt(oldInst.issueNumber.replace("I", "")) || 1;
    const nextIssue = `I${String(currentIssue + 1).padStart(2, "0")}`;
    const newInst = {
      ...oldInst,
      id: `inst-${Date.now()}`,
      ccNumber: oldInst.ccNumber,
      // Keep the same CC Number
      issueNumber: nextIssue,
      // Increment Issue Number
      status: "PENDING_RECEIPT",
      dateIssued: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      reportType: void 0,
      reportReason: void 0
    };
    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user: state.currentUser.name,
      action: "APPROVE_REPLACEMENT",
      docTitle: oldInst.docTitle,
      docRev: oldInst.rev,
      ccNumber: oldInst.ccNumber,
      oldStatus: oldInst.status,
      newStatus: oldInst.reportType,
      remarks: `Approved replacement for ${oldInst.reportType}. Issue number updated to: ${nextIssue}`
    };
    return {
      controlledCopyInstances: [...updatedInstances, newInst],
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail]
    };
  }),
  rejectCcReplacement: (instId) => set((state) => {
    const inst = state.controlledCopyInstances.find((i2) => i2.id === instId);
    if (!inst) return state;
    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user: state.currentUser.name,
      action: "REJECT_REPLACEMENT",
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: "ACTIVE",
      remarks: `Rejected replacement request`
    };
    return {
      controlledCopyInstances: state.controlledCopyInstances.map(
        (i2) => i2.id === instId ? { ...i2, status: "ACTIVE", reportType: void 0, reportReason: void 0 } : i2
      ),
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail]
    };
  }),
  recallControlledCopy: (instId) => set((state) => {
    const inst = state.controlledCopyInstances.find((i2) => i2.id === instId);
    if (!inst) return state;
    const auditLog = {
      id: `audit-${Date.now()}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      user: state.currentUser.name,
      action: "RECALL_COPY",
      docTitle: inst.docTitle,
      docRev: inst.rev,
      ccNumber: inst.ccNumber,
      oldStatus: inst.status,
      newStatus: "RECALLED",
      remarks: `Recalled copy due to obsolescence or new revision`
    };
    return {
      controlledCopyInstances: state.controlledCopyInstances.map(
        (i2) => i2.id === instId ? { ...i2, status: "RECALLED", dateRecalled: (/* @__PURE__ */ new Date()).toISOString().split("T")[0] } : i2
      ),
      controlledCopyAuditTrail: [auditLog, ...state.controlledCopyAuditTrail]
    };
  }),
  distributeDocument: (docId, deptId) => set((state) => {
    let updatedDocs = [...state.documents];
    const docIndex = updatedDocs.findIndex((d2) => d2.id === docId);
    if (docIndex > -1) {
      const doc = updatedDocs[docIndex];
      const updatedDistributions = (doc.distributions || []).map((dist) => {
        const dId = dist.departmentId || dist.dept;
        if (dId === deptId) {
          return { ...dist, isDistributed: true, distributedAt: (/* @__PURE__ */ new Date()).toISOString() };
        }
        return dist;
      });
      updatedDocs[docIndex] = { ...doc, distributions: updatedDistributions };
    }
    return { documents: updatedDocs };
  }),
  distributeAllDocument: (docId) => set((state) => {
    let updatedDocs = [...state.documents];
    const docIndex = updatedDocs.findIndex((d2) => d2.id === docId);
    if (docIndex > -1) {
      const doc = updatedDocs[docIndex];
      const updatedDistributions = (doc.distributions || []).map((dist) => {
        return { ...dist, isDistributed: true, distributedAt: (/* @__PURE__ */ new Date()).toISOString() };
      });
      updatedDocs[docIndex] = { ...doc, distributions: updatedDistributions };
    }
    return { documents: updatedDocs };
  })
}), {
  name: "qms-storage-uat-v2",
  partialize: (state) => ({
    currentUser: state.currentUser,
    tasks: state.tasks,
    notifications: state.notifications,
    dars: state.dars,
    timeline: state.timeline,
    documents: state.documents,
    externalDocuments: state.externalDocuments,
    controlledCopyInstances: state.controlledCopyInstances,
    controlledCopyAuditTrail: state.controlledCopyAuditTrail
  })
}));

// node_modules/react-hot-toast/dist/index.mjs
var import_react2 = require("react");
var import_react3 = require("react");
var y = __toESM(require("react"), 1);

// node_modules/goober/dist/goober.modern.js
var e = { data: "" };
var t = (t2) => {
  if ("object" == typeof window) {
    let e2 = (t2 ? t2.querySelector("#_goober") : window._goober) || Object.assign(document.createElement("style"), { innerHTML: " ", id: "_goober" });
    return e2.nonce = window.__nonce__, e2.parentNode || (t2 || document.head).appendChild(e2), e2.firstChild;
  }
  return t2 || e;
};
var a = /(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g;
var l = /\/\*[^]*?\*\/|  +/g;
var n = /\n+/g;
var o = (e2, t2) => {
  let r = "", a2 = "", l2 = "";
  for (let n3 in e2) {
    let c2 = e2[n3];
    "@" == n3[0] ? "i" == n3[1] ? r = n3 + " " + c2 + ";" : a2 += "f" == n3[1] ? o(c2, n3) : n3 + "{" + o(c2, "k" == n3[1] ? "" : t2) + "}" : "object" == typeof c2 ? a2 += o(c2, t2 ? t2.replace(/([^,])+/g, (e3) => n3.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g, (t3) => /&/.test(t3) ? t3.replace(/&/g, e3) : e3 ? e3 + " " + t3 : t3)) : n3) : null != c2 && (n3 = "-" == n3[1] ? n3 : n3.replace(/[A-Z]/g, "-$&").toLowerCase(), l2 += o.p ? o.p(n3, c2) : n3 + ":" + c2 + ";");
  }
  return r + (t2 && l2 ? t2 + "{" + l2 + "}" : l2) + a2;
};
var c = {};
var i = (e2) => {
  if ("object" == typeof e2) {
    let t2 = "";
    for (let r in e2) t2 += r + i(e2[r]);
    return t2;
  }
  return e2;
};
var s = (e2, t2, r, s2, p2) => {
  let u2 = i(e2), d2 = c[u2] || (c[u2] = ((e3) => {
    let t3 = 0, r2 = 11;
    for (; t3 < e3.length; ) r2 = 101 * r2 + e3.charCodeAt(t3++) >>> 0;
    return "go" + r2;
  })(u2));
  if (!c[d2]) {
    let t3 = u2 !== e2 ? e2 : ((e3) => {
      let t4, r2, o2 = [{}];
      for (; t4 = a.exec(e3.replace(l, "")); ) t4[4] ? o2.shift() : t4[3] ? (r2 = t4[3].replace(n, " ").trim(), o2.unshift(o2[0][r2] = o2[0][r2] || {})) : o2[0][t4[1]] = t4[2].replace(n, " ").trim();
      return o2[0];
    })(e2);
    c[d2] = o(p2 ? { ["@keyframes " + d2]: t3 } : t3, r ? "" : "." + d2);
  }
  let f3 = r && c.g;
  return r && (c.g = c[d2]), ((e3, t3, r2, a2) => {
    a2 ? t3.data = t3.data.replace(a2, e3) : -1 === t3.data.indexOf(e3) && (t3.data = r2 ? e3 + t3.data : t3.data + e3);
  })(c[d2], t2, s2, f3), d2;
};
var p = (e2, t2, r) => e2.reduce((e3, a2, l2) => {
  let n3 = t2[l2];
  if (n3 && n3.call) {
    let e4 = n3(r), t3 = e4 && e4.props && e4.props.className || /^go/.test(e4) && e4;
    n3 = t3 ? "." + t3 : e4 && "object" == typeof e4 ? e4.props ? "" : o(e4, "") : false === e4 ? "" : e4;
  }
  return e3 + a2 + (null == n3 ? "" : n3);
}, "");
function u(e2) {
  let r = this || {}, a2 = e2.call ? e2(r.p) : e2;
  return s(a2.unshift ? a2.raw ? p(a2, [].slice.call(arguments, 1), r.p) : a2.reduce((e3, t2) => Object.assign(e3, t2 && t2.call ? t2(r.p) : t2), {}) : a2, t(r.target), r.g, r.o, r.k);
}
var d;
var f;
var g;
var b = u.bind({ g: 1 });
var h = u.bind({ k: 1 });
function m(e2, t2, r, a2) {
  o.p = t2, d = e2, f = r, g = a2;
}
function w(e2, t2) {
  let r = this || {};
  return function() {
    let a2 = arguments;
    function l2(n3, o2) {
      let c2 = Object.assign({}, n3), i2 = c2.className || l2.className;
      r.p = Object.assign({ theme: f && f() }, c2), r.o = /go\d/.test(i2), c2.className = u.apply(r, a2) + (i2 ? " " + i2 : ""), t2 && (c2.ref = o2);
      let s2 = e2;
      return e2[0] && (s2 = c2.as || e2, delete c2.as), g && s2[0] && g(c2), d(s2, c2);
    }
    return t2 ? t2(l2) : l2;
  };
}

// node_modules/react-hot-toast/dist/index.mjs
var b2 = __toESM(require("react"), 1);
var x = __toESM(require("react"), 1);
var Z = (e2) => typeof e2 == "function";
var h2 = (e2, t2) => Z(e2) ? e2(t2) : e2;
var W = /* @__PURE__ */ (() => {
  let e2 = 0;
  return () => (++e2).toString();
})();
var E = /* @__PURE__ */ (() => {
  let e2;
  return () => {
    if (e2 === void 0 && typeof window < "u") {
      let t2 = matchMedia("(prefers-reduced-motion: reduce)");
      e2 = !t2 || t2.matches;
    }
    return e2;
  };
})();
var re = 20;
var k = "default";
var H = (e2, t2) => {
  let { toastLimit: o2 } = e2.settings;
  switch (t2.type) {
    case 0:
      return { ...e2, toasts: [t2.toast, ...e2.toasts].slice(0, o2) };
    case 1:
      return { ...e2, toasts: e2.toasts.map((r) => r.id === t2.toast.id ? { ...r, ...t2.toast } : r) };
    case 2:
      let { toast: s2 } = t2;
      return H(e2, { type: e2.toasts.find((r) => r.id === s2.id) ? 1 : 0, toast: s2 });
    case 3:
      let { toastId: a2 } = t2;
      return { ...e2, toasts: e2.toasts.map((r) => r.id === a2 || a2 === void 0 ? { ...r, dismissed: true, visible: false } : r) };
    case 4:
      return t2.toastId === void 0 ? { ...e2, toasts: [] } : { ...e2, toasts: e2.toasts.filter((r) => r.id !== t2.toastId) };
    case 5:
      return { ...e2, pausedAt: t2.time };
    case 6:
      let i2 = t2.time - (e2.pausedAt || 0);
      return { ...e2, pausedAt: void 0, toasts: e2.toasts.map((r) => ({ ...r, pauseDuration: r.pauseDuration + i2 })) };
  }
};
var v = [];
var j = { toasts: [], pausedAt: void 0, settings: { toastLimit: re } };
var f2 = {};
var Y = (e2, t2 = k) => {
  f2[t2] = H(f2[t2] || j, e2), v.forEach(([o2, s2]) => {
    o2 === t2 && s2(f2[t2]);
  });
};
var _ = (e2) => Object.keys(f2).forEach((t2) => Y(e2, t2));
var Q = (e2) => Object.keys(f2).find((t2) => f2[t2].toasts.some((o2) => o2.id === e2));
var S = (e2 = k) => (t2) => {
  Y(t2, e2);
};
var se = { blank: 4e3, error: 4e3, success: 2e3, loading: 1 / 0, custom: 4e3 };
var ie = (e2, t2 = "blank", o2) => ({ createdAt: Date.now(), visible: true, dismissed: false, type: t2, ariaProps: { role: "status", "aria-live": "polite" }, message: e2, pauseDuration: 0, ...o2, id: (o2 == null ? void 0 : o2.id) || W() });
var P = (e2) => (t2, o2) => {
  let s2 = ie(t2, e2, o2);
  return S(s2.toasterId || Q(s2.id))({ type: 2, toast: s2 }), s2.id;
};
var n2 = (e2, t2) => P("blank")(e2, t2);
n2.error = P("error");
n2.success = P("success");
n2.loading = P("loading");
n2.custom = P("custom");
n2.dismiss = (e2, t2) => {
  let o2 = { type: 3, toastId: e2 };
  t2 ? S(t2)(o2) : _(o2);
};
n2.dismissAll = (e2) => n2.dismiss(void 0, e2);
n2.remove = (e2, t2) => {
  let o2 = { type: 4, toastId: e2 };
  t2 ? S(t2)(o2) : _(o2);
};
n2.removeAll = (e2) => n2.remove(void 0, e2);
n2.promise = (e2, t2, o2) => {
  let s2 = n2.loading(t2.loading, { ...o2, ...o2 == null ? void 0 : o2.loading });
  return typeof e2 == "function" && (e2 = e2()), e2.then((a2) => {
    let i2 = t2.success ? h2(t2.success, a2) : void 0;
    return i2 ? n2.success(i2, { id: s2, ...o2, ...o2 == null ? void 0 : o2.success }) : n2.dismiss(s2), a2;
  }).catch((a2) => {
    let i2 = t2.error ? h2(t2.error, a2) : void 0;
    i2 ? n2.error(i2, { id: s2, ...o2, ...o2 == null ? void 0 : o2.error }) : n2.dismiss(s2);
  }), e2;
};
var de = h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`;
var me = h`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`;
var le = h`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`;
var C = w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e2) => e2.primary || "#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${de} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${me} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${(e2) => e2.secondary || "#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${le} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`;
var Te = h`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;
var F = w("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${(e2) => e2.secondary || "#e0e0e0"};
  border-right-color: ${(e2) => e2.primary || "#616161"};
  animation: ${Te} 1s linear infinite;
`;
var ge = h`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`;
var he = h`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`;
var L = w("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${(e2) => e2.primary || "#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${ge} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${he} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${(e2) => e2.secondary || "#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`;
var be = w("div")`
  position: absolute;
`;
var Se = w("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`;
var Ae = h`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`;
var Pe = w("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${Ae} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`;
var $ = ({ toast: e2 }) => {
  let { icon: t2, type: o2, iconTheme: s2 } = e2;
  return t2 !== void 0 ? typeof t2 == "string" ? b2.createElement(Pe, null, t2) : t2 : o2 === "blank" ? null : b2.createElement(Se, null, b2.createElement(F, { ...s2 }), o2 !== "loading" && b2.createElement(be, null, o2 === "error" ? b2.createElement(C, { ...s2 }) : b2.createElement(L, { ...s2 })));
};
var Re = (e2) => `
0% {transform: translate3d(0,${e2 * -200}%,0) scale(.6); opacity:.5;}
100% {transform: translate3d(0,0,0) scale(1); opacity:1;}
`;
var Ee = (e2) => `
0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}
100% {transform: translate3d(0,${e2 * -150}%,-1px) scale(.6); opacity:0;}
`;
var ve = "0%{opacity:0;} 100%{opacity:1;}";
var De = "0%{opacity:1;} 100%{opacity:0;}";
var Oe = w("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`;
var Ie = w("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;
var ke = (e2, t2) => {
  let s2 = e2.includes("top") ? 1 : -1, [a2, i2] = E() ? [ve, De] : [Re(s2), Ee(s2)];
  return { animation: t2 ? `${h(a2)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards` : `${h(i2)} 0.4s forwards cubic-bezier(.06,.71,.55,1)` };
};
var N = y.memo(({ toast: e2, position: t2, style: o2, children: s2 }) => {
  let a2 = e2.height ? ke(e2.position || t2 || "top-center", e2.visible) : { opacity: 0 }, i2 = y.createElement($, { toast: e2 }), r = y.createElement(Ie, { ...e2.ariaProps }, h2(e2.message, e2));
  return y.createElement(Oe, { className: e2.className, style: { ...a2, ...o2, ...e2.style } }, typeof s2 == "function" ? s2({ icon: i2, message: r }) : y.createElement(y.Fragment, null, i2, r));
});
m(x.createElement);
var Ce = u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;

// src/pages/Library/ReplacementModal.jsx
var import_react4 = __toESM(require("react"), 1);

// test_render.js
var import_react_router_dom2 = require("react-router-dom");
try {
  console.log("Compiling LibraryDetail...");
} catch (e2) {
  console.error(e2);
}
