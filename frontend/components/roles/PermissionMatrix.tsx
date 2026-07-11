'use client';

import React from 'react';

export type PermissionCatalogue = Record<string, { key: string; description: string }[]>;

interface Props {
  catalogue: PermissionCatalogue;
  selectedKeys: string[];
  onChange: (keys: string[]) => void;
  disabled?: boolean;
}

export const PermissionMatrix = ({ catalogue, selectedKeys, onChange, disabled = false }: Props) => {
  
  const handleToggle = (key: string) => {
    if (disabled) return;
    if (selectedKeys.includes(key)) {
      onChange(selectedKeys.filter(k => k !== key));
    } else {
      onChange([...selectedKeys, key]);
    }
  };

  const handleToggleModule = (moduleName: string, keysInModule: string[]) => {
    if (disabled) return;
    const allSelected = keysInModule.every(k => selectedKeys.includes(k));
    if (allSelected) {
      onChange(selectedKeys.filter(k => !keysInModule.includes(k)));
    } else {
      const newKeys = [...selectedKeys];
      keysInModule.forEach(k => {
        if (!newKeys.includes(k)) newKeys.push(k);
      });
      onChange(newKeys);
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(catalogue).map(([moduleName, perms]) => {
        const keysInModule = perms.map(p => p.key);
        const allSelected = keysInModule.every(k => selectedKeys.includes(k));
        
        return (
          <div key={moduleName} className="border border-slate-200 dark:border-white/[0.06] rounded-xl p-4 bg-white dark:bg-[#131620]">
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-white/[0.06] pb-2">
              <h3 className="text-lg font-medium capitalize text-slate-800 dark:text-white">{moduleName}</h3>
              <button
                type="button"
                onClick={() => handleToggleModule(moduleName, keysInModule)}
                disabled={disabled}
                className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 disabled:opacity-50 outline-none"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {perms.map(p => (
                <label key={p.key} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-300 dark:border-white/[0.08] text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 bg-white dark:bg-[#0f1117]"
                    checked={selectedKeys.includes(p.key)}
                    onChange={() => handleToggle(p.key)}
                    disabled={disabled}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{p.key}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{p.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
