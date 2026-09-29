const { loadState, updateState } = require('../storage/local');

const MAX_TUANTUAN_AFFINITY = 100;

function clampAffinity(value) {
  return Math.max(0, Math.min(MAX_TUANTUAN_AFFINITY, Math.round(value)));
}

// 供互动与学习里程碑共用的纯状态变更接口。
function applyTuantuanAffinityChange(petState, amount, reason, timestamp) {
  if (!petState || !Number.isFinite(amount) || !Number.isInteger(amount) || typeof reason !== 'string' || !reason) {
    throw new Error('团团好感变化参数无效');
  }
  const before = clampAffinity(Number.isFinite(petState.affinity) ? petState.affinity : 0);
  const after = clampAffinity(before + amount);
  const actualChange = after - before;
  petState.affinity = after;
  petState.lastAffinityChange = {
    amount: actualChange,
    reason,
    updatedAt: timestamp || new Date().toISOString()
  };
  return { before, after, amount: actualChange, reason };
}

// 业务模块通过此接口调节好感，不直接改写角色档案。
function adjustTuantuanAffinity(amount, reason) {
  let change;
  const state = updateState((draft) => {
    change = applyTuantuanAffinityChange(draft.petState, amount, reason);
  });
  return Object.assign({}, change, { affinity: state.petState.affinity });
}

function getTuantuanAffinity() {
  const value = loadState().petState.affinity;
  return clampAffinity(Number.isFinite(value) ? value : 0);
}

// 儿童界面使用关系阶段，不显示分数。
function getTuantuanBondLabel(value) {
  const affinity = clampAffinity(Number.isFinite(value) ? value : getTuantuanAffinity());
  if (affinity >= 60) {
    return '默契伙伴';
  }
  if (affinity >= 25) {
    return '好伙伴';
  }
  if (affinity >= 8) {
    return '熟悉中';
  }
  return '刚认识';
}

module.exports = {
  MAX_TUANTUAN_AFFINITY,
  applyTuantuanAffinityChange,
  adjustTuantuanAffinity,
  getTuantuanAffinity,
  getTuantuanBondLabel
};
