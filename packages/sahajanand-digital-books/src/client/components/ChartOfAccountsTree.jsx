import { useState, useMemo } from 'react';
import { toSafeArray } from '../utils/safeArray';

// Color badges for Root Types
const ROOT_TYPE_COLORS = {
  Asset: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Liability: 'bg-rose-50 text-rose-700 border-rose-200',
  Equity: 'bg-purple-50 text-purple-700 border-purple-200',
  Income: 'bg-blue-50 text-blue-700 border-blue-200',
  Expense: 'bg-amber-50 text-amber-700 border-amber-200',
};

const TreeNode = ({ node, level = 0, expandedState, toggleNode, onSelectAccount }) => {
  const isGroup = node.isGroup || (node.children && node.children.length > 0);
  const isExpanded = expandedState[node.name] !== false; // Default expanded unless collapsed

  return (
    <div className="select-none">
      <div
        className={`flex items-center justify-between py-2 px-3 rounded-xl transition-colors hover:bg-slate-100/80 cursor-pointer ${
          level === 0 ? 'bg-slate-50/80 font-bold border border-slate-200 my-1' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
        onClick={() => (isGroup ? toggleNode(node.name) : onSelectAccount && onSelectAccount(node.name))}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Chevron Toggle */}
          {isGroup ? (
            <button
              type="button"
              className="p-1 rounded-md hover:bg-slate-200 text-slate-500 transition-transform"
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.name);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-3.5 w-3.5 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <span className="w-5 text-center text-slate-300 text-xs">•</span>
          )}

          {/* Icon */}
          <span className="text-xs">
            {isGroup ? (isExpanded ? '📂' : '📁') : '📄'}
          </span>

          {/* Account Title */}
          <span
            className={`text-xs truncate ${
              level === 0
                ? 'font-extrabold text-slate-900 text-sm'
                : isGroup
                ? 'font-bold text-slate-800'
                : 'font-medium text-slate-700'
            }`}
          >
            {node.name}
          </span>

          {/* Child Count Badge for Groups */}
          {isGroup && node.children.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 bg-slate-200/70 text-slate-600 rounded-full font-mono font-medium">
              {node.children.length}
            </span>
          )}
        </div>

        {/* Right Details: Account Type & Category */}
        <div className="flex items-center gap-2 shrink-0">
          {node.accountType && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-600">
              {node.accountType}
            </span>
          )}

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
              ROOT_TYPE_COLORS[node.rootType] || 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {node.rootType}
          </span>
        </div>
      </div>

      {/* Children Nodes */}
      {isGroup && isExpanded && Array.isArray(node.children) && node.children.length > 0 && (
        <div className="border-l border-slate-200 ml-4">
          {node.children.map((child) => child ? (
            <TreeNode
              key={child.name || Math.random()}
              node={child}
              level={level + 1}
              expandedState={expandedState}
              toggleNode={toggleNode}
              onSelectAccount={onSelectAccount}
            />
          ) : null)}
        </div>
      )}
    </div>
  );
};

const ChartOfAccountsTree = ({ accounts = [], onSelectAccount }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedState, setExpandedState] = useState({});
  const safeAccounts = toSafeArray(accounts);

  // Build tree from flat account list
  const treeRoots = useMemo(() => {
    const map = {};
    const roots = [];

    // Initialize node map
    safeAccounts.forEach((acc) => {
      if (!acc) return;
      const name = acc.name || acc.AccountName;
      if (!name) return;
      map[name] = {
        ...acc,
        name,
        children: [],
        isGroup: acc.isGroup || acc.IsGroup || false,
        rootType: acc.rootType || acc.RootType || 'Asset',
        accountType: acc.accountType || acc.AccountType || '',
        parentAccount: acc.parentAccount || acc.ParentAccount || '',
      };
    });

    // Link children to parents
    safeAccounts.forEach((acc) => {
      if (!acc) return;
      const name = acc.name || acc.AccountName;
      if (!name || !map[name]) return;
      const parent = acc.parentAccount || acc.ParentAccount;
      if (parent && map[parent]) {
        map[parent].children.push(map[name]);
      } else {
        roots.push(map[name]);
      }
    });

    // Sort roots into standard accounting order: Asset, Liability, Equity, Income, Expense
    const cleanRoots = roots.filter(Boolean);
    const order = ['Asset', 'Liability', 'Equity', 'Income', 'Expense'];
    cleanRoots.sort((a, b) => order.indexOf(a.rootType) - order.indexOf(b.rootType));

    return cleanRoots;
  }, [safeAccounts]);

  // Filter tree when searching
  const filteredTree = useMemo(() => {
    if (!String(searchTerm || '').trim()) return treeRoots;

    const term = String(searchTerm || '').toLowerCase();

    function filterNode(node) {
      if (!node) return null;
      const nameMatch = String(node.name || '').toLowerCase().includes(term);
      const typeMatch = String(node.accountType || '').toLowerCase().includes(term);
      const rootMatch = String(node.rootType || '').toLowerCase().includes(term);

      const matchingChildren = [];
      if (node.children) {
        node.children.forEach((c) => {
          const res = filterNode(c);
          if (res) matchingChildren.push(res);
        });
      }

      if (nameMatch || typeMatch || rootMatch || matchingChildren.length > 0) {
        return {
          ...node,
          children: matchingChildren,
        };
      }
      return null;
    }

    return treeRoots.map(filterNode).filter(Boolean);
  }, [treeRoots, searchTerm]);

  const toggleNode = (name) => {
    setExpandedState((prev) => ({
      ...prev,
      [name]: prev[name] === false ? true : false,
    }));
  };

  const handleExpandAll = () => {
    const all = {};
    accounts.forEach((a) => {
      all[a.name || a.AccountName] = true;
    });
    setExpandedState(all);
  };

  const handleCollapseAll = () => {
    const all = {};
    accounts.forEach((a) => {
      all[a.name || a.AccountName] = false;
    });
    setExpandedState(all);
  };

  return (
    <div className="space-y-4">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
        <div className="relative w-full sm:w-80">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search account tree..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs bg-white focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExpandAll}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-2xs"
          >
            Expand All
          </button>
          <button
            onClick={handleCollapseAll}
            className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all shadow-2xs"
          >
            Collapse All
          </button>
          <span className="text-xs text-slate-400 pl-2">
            {accounts.length} accounts
          </span>
        </div>
      </div>

      {/* Tree Container */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs">
        {filteredTree.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No accounts found matching "{searchTerm}"
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTree.map((rootNode) => (
              <TreeNode
                key={rootNode.name}
                node={rootNode}
                level={0}
                expandedState={expandedState}
                toggleNode={toggleNode}
                onSelectAccount={onSelectAccount}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChartOfAccountsTree;
