const shell = document.querySelector(".c-shell");
const drawer = document.querySelector(".c-drawer");
const drawerMask = document.querySelector(".c-drawer-mask");
const modal = document.querySelector(".c-modal");
const modalMask = document.querySelector(".c-modal-mask");
const modalBody = document.querySelector("#modal-body");
const modalTitle = document.querySelector("#modal-title");
const confirmButton = document.querySelector("[data-action='confirm-modal']");
const toast = document.querySelector(".toast");

let modalMode = "default";
let currentPlan = null;

function money(value) {
  return `¥${Number(value).toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.dataset.visible = "true";
  window.setTimeout(() => {
    toast.dataset.visible = "false";
  }, 1800);
}

function openModal(title, bodyHtml, confirmText, mode = "default") {
  modal.classList.remove("c-modal--warning");
  modalTitle.textContent = title;
  modalBody.innerHTML = bodyHtml;
  confirmButton.textContent = confirmText;
  confirmButton.hidden = false;
  modalMode = mode;
  modal.dataset.open = "true";
  modalMask.dataset.open = "true";
}

function closeModal() {
  modal.dataset.open = "false";
  modalMask.dataset.open = "false";
}

function openDrawer() {
  drawer.dataset.open = "true";
  drawerMask.dataset.open = "true";
}

function closeDrawer() {
  drawer.dataset.open = "false";
  drawerMask.dataset.open = "false";
}

function getSelectValue(name) {
  return document.querySelector(`[data-select='${name}']`)?.dataset.value || "";
}

function setSelectValue(select, value, label) {
  select.dataset.value = value;
  select.querySelector(".c-select__trigger").textContent = label;
  select.querySelectorAll(".c-select__option").forEach((option) => {
    option.classList.toggle("c-select__option--active", option.dataset.value === value);
  });
}

function applyFilters() {
  const supplier = getSelectValue("supplier");
  const warehouse = getSelectValue("warehouse");
  const sku = document.querySelector("[data-field='sku-filter']").value.trim().toUpperCase();
  const keyword = document.querySelector("[data-field='global-search']").value.trim().toUpperCase();
  const rows = [...document.querySelectorAll("[data-row='pending']")];
  let visibleCount = 0;
  let visibleCost = 0;

  rows.forEach((row) => {
    const rowText = `${row.dataset.supplier} ${row.dataset.sku} ${row.dataset.warehouse}`.toUpperCase();
    const matched = (!supplier || row.dataset.supplier === supplier)
      && (!warehouse || row.dataset.warehouse === warehouse)
      && (!sku || row.dataset.sku.toUpperCase().includes(sku))
      && (!keyword || rowText.includes(keyword));
    row.hidden = !matched;
    if (matched) {
      visibleCount += 1;
      visibleCost += Number(row.dataset.totalCost);
    }
  });

  document.querySelector("[data-role='empty-row']").hidden = visibleCount > 0;
  document.querySelector("[data-role='table-summary']").innerHTML = `待处理聚合 <strong>${visibleCount}</strong> 组，采购成本合计 <strong>${money(visibleCost)}</strong>`;
}

function resetFilters() {
  document.querySelector("[data-field='sku-filter']").value = "";
  document.querySelector("[data-field='global-search']").value = "";
  document.querySelectorAll(".c-select[data-select='supplier'], .c-select[data-select='warehouse']").forEach((select) => {
    const option = select.querySelector(".c-select__option[data-value='']");
    setSelectValue(select, "", option.textContent);
  });
  applyFilters();
}

function configListTemplate() {
  return `
    <div class="modal-toolbar">
      <div>
        <strong>次品处理配置</strong>
        <div class="text-secondary">列表展示配置条件摘要，编辑时维护具体条件组和处理方案。</div>
      </div>
      <button class="btn btn--primary" data-action="config-create" type="button">新增配置</button>
    </div>
    <table class="c-table">
      <thead>
        <tr>
          <th>配置名称</th>
          <th>配置条件</th>
          <th>处理方案</th>
          <th>状态</th>
          <th class="c-table__cell--actions">操作</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>高货值次品处理</td>
          <td><div class="condition-summary"><span class="tag tag--processing">条件组 1</span><span>SKU 固定清单，且单价和货值满足区间</span></div></td>
          <td><span class="tag tag--processing">上架次品区</span></td>
          <td><span class="tag tag--success">启用</span></td>
          <td class="c-table__cell--actions"><a class="link" data-action="config-edit">编辑</a><a class="link" data-action="config-disable">禁用</a><a class="link" data-action="config-log">日志</a></td>
        </tr>
        <tr>
          <td>低货值次品丢弃</td>
          <td><div class="condition-summary"><span class="tag tag--processing">条件组 1</span><span>货值满足低货值配置条件</span></div></td>
          <td><span class="tag tag--error">当场丢弃</span></td>
          <td><span class="tag tag--success">启用</span></td>
          <td class="c-table__cell--actions"><a class="link" data-action="config-edit">编辑</a><a class="link" data-action="config-disable">禁用</a><a class="link" data-action="config-log">日志</a></td>
        </tr>
        <tr>
          <td>工具类次品上架</td>
          <td><div class="condition-summary"><span class="tag tag--default">条件组 1</span><span>SKU 导入清单，且采购金额满足配置条件</span></div></td>
          <td><span class="tag tag--processing">上架次品区</span></td>
          <td><span class="tag tag--default">禁用</span></td>
          <td class="c-table__cell--actions"><a class="link" data-action="config-edit">编辑</a><span class="text-disabled">禁用</span><a class="link" data-action="config-log">日志</a></td>
        </tr>
      </tbody>
    </table>
  `;
}

function conditionTypeSelect(activeValue) {
  const options = ["SKU", "单价区间", "货值区间"];
  return `
    <div class="c-select" data-select="condition-type" data-value="${activeValue}">
      <button class="c-select__trigger" type="button" data-action="toggle-select">${activeValue}</button>
      <div class="c-select__menu">
        ${options.map((option) => `<button class="c-select__option${option === activeValue ? " c-select__option--active" : ""}" type="button" data-value="${option}">${option}</button>`).join("")}
      </div>
    </div>
  `;
}

function conditionValueTemplate(type) {
  if (type === "SKU") {
    return `
      <div class="sku-editor" data-condition-value>
        <div class="segmented" data-role="sku-mode">
          <button class="c-segmented__item c-segmented__item--active" data-action="sku-manual" type="button">手动输入</button>
          <button class="c-segmented__item" data-action="sku-import" type="button">导入固定 SKU</button>
        </div>
        <input class="input" data-field="sku-list" value="SKU-BAT-8842, SKU-PAD-7710" placeholder="多个 SKU 用逗号或换行分隔" />
        <div class="import-panel" hidden>
          <button class="btn" data-action="choose-file" type="button">选择文件</button>
          <span class="text-secondary" data-role="file-name">支持导入固定 SKU 清单</span>
        </div>
      </div>
    `;
  }
  return `
    <div class="range-inputs" data-condition-value>
      <input class="input" placeholder="下限" />
      <span>至</span>
      <input class="input" placeholder="上限" />
    </div>
  `;
}

function conditionRowTemplate(type = "SKU") {
  return `
    <div class="condition-row">
      ${conditionTypeSelect(type)}
      ${conditionValueTemplate(type)}
      <button class="btn btn--text" data-action="delete-condition" type="button">删除</button>
    </div>
  `;
}

function conditionGroupTemplate(index) {
  return `
    <div class="condition-group">
      <div class="condition-group__head">
        <span class="tag tag--processing">条件组 ${index}</span>
        <span class="text-secondary">组内条件需全部满足 (AND)</span>
        <button class="btn btn--text" data-action="delete-condition-group" type="button">删除组</button>
      </div>
      ${conditionRowTemplate("SKU")}
      <button class="btn" data-action="add-condition" type="button">+ 添加条件 (AND)</button>
    </div>
  `;
}

function configFormTemplate(titleText) {
  return `
    <div class="config-form-layout">
      <div>
        <div class="config-base-form">
          <label class="form-field">
            <span>配置名称</span>
            <input class="input" data-field="config-name" value="${titleText === "编辑配置" ? "高货值次品处理" : ""}" placeholder="请输入配置名称" />
          </label>
          <label class="form-field">
            <span>处理方案</span>
            <div class="segmented" data-role="config-action">
              <button class="c-segmented__item c-segmented__item--active" data-action-value="上架次品区" type="button">上架次品区</button>
              <button class="c-segmented__item" data-action-value="当场丢弃" type="button">当场丢弃</button>
            </div>
          </label>
        </div>
        <section class="rule-builder">
          <div class="rule-builder__head">
            <h3>触发规则</h3>
            <button class="btn btn--text" data-action="add-condition-group" type="button">+ 添加条件组 (OR)</button>
          </div>
          <div data-role="condition-groups">
            <div class="condition-group">
              <div class="condition-group__head">
                <span class="tag tag--processing">条件组 1</span>
                <span class="text-secondary">组内条件需全部满足 (AND)</span>
                <button class="btn btn--text" data-action="delete-condition-group" type="button">删除组</button>
              </div>
              ${conditionRowTemplate("SKU")}
              ${conditionRowTemplate("单价区间")}
              ${conditionRowTemplate("货值区间")}
              <button class="btn" data-action="add-condition" type="button">+ 添加条件 (AND)</button>
            </div>
          </div>
        </section>
      </div>
      <aside class="config-preview">
        <h3>命中说明</h3>
        <div class="preview-lines" data-role="config-preview"></div>
      </aside>
    </div>
  `;
}

function configLogTemplate() {
  return `
    <ul class="c-timeline">
      <li class="c-timeline__item"><div class="c-timeline__time">2026-05-22 14:11:08</div><div class="c-timeline__title">编辑配置</div><div class="c-timeline__detail">采购用户调整配置条件摘要和处理方案。</div></li>
      <li class="c-timeline__item"><div class="c-timeline__time">2026-05-21 18:03:42</div><div class="c-timeline__title">新增配置</div><div class="c-timeline__detail">新增高货值次品上架配置。</div></li>
      <li class="c-timeline__item"><div class="c-timeline__time">2026-05-20 09:27:16</div><div class="c-timeline__title">禁用配置</div><div class="c-timeline__detail">工具类次品上架配置被禁用。</div></li>
    </ul>
  `;
}

function updateConditionGroupLabels() {
  modalBody.querySelectorAll(".condition-group").forEach((group, index) => {
    group.querySelector(".tag").textContent = `条件组 ${index + 1}`;
  });
}

function describeConditionRow(row) {
  const type = row.querySelector("[data-select='condition-type']").dataset.value;
  if (type === "SKU") {
    const skuInput = row.querySelector("[data-field='sku-list']");
    const fileName = row.querySelector("[data-role='file-name']")?.textContent || "";
    return skuInput && !skuInput.hidden ? `SKU 属于 ${skuInput.value || "未填写"}` : fileName;
  }
  const inputs = row.querySelectorAll(".range-inputs input");
  return `${type} ${inputs[0]?.value || "不限"} 至 ${inputs[1]?.value || "不限"}`;
}

function updateConfigPreview() {
  const preview = modalBody.querySelector("[data-role='config-preview']");
  if (!preview) return;
  const groups = [...modalBody.querySelectorAll(".condition-group")];
  const action = modalBody.querySelector("[data-role='config-action'] .c-segmented__item--active")?.dataset.actionValue || "上架次品区";
  preview.innerHTML = groups.map((group, index) => {
    const conditions = [...group.querySelectorAll(".condition-row")].map(describeConditionRow).join("，且 ");
    return `<div><strong>条件组 ${index + 1}</strong>：${conditions || "暂无条件"}。命中后 ${action}。</div>`;
  }).join("");
}

function bindModalInteractions() {
  bindSelects(modalBody);
  bindSegmented(modalBody);
  updateConfigPreview();
}

function planTemplate(plan) {
  return `
    <dl class="info-grid">
      <dt>供应商</dt><dd>${plan.supplier}</dd>
      <dt>SKU</dt><dd>${plan.sku}</dd>
      <dt>次品数量</dt><dd>${plan.qty}</dd>
      <dt>总成本</dt><dd>${money(plan.totalCost)}</dd>
    </dl>
    <div class="plan-form">
      <div class="form-field">
        <span>是否返修</span>
        <div class="segmented" data-role="repair-choice">
          <button class="c-segmented__item c-segmented__item--active" data-plan-choice="repair" type="button">是，返修</button>
          <button class="c-segmented__item" data-plan-choice="scrap" type="button">否，报损</button>
        </div>
      </div>
      <div class="repair-fields" data-repair-fields>
        <label class="form-field">
          <span>返修数量</span>
          <input class="input" data-field="repair-qty" type="number" min="1" max="${plan.qty}" value="${plan.qty}" />
        </label>
        <label class="form-field">
          <span>返修成本</span>
          <input class="input" data-field="repair-cost" type="number" min="0" value="0" />
        </label>
        <div class="threshold-note">若成本大于 1000，返修成本占总成本 80% 以上，不建议返修；若成本小于 1000，返修成本占总成本 60% 以上，不建议返修。</div>
      </div>
      <div class="scrap-note" data-scrap-note hidden>将让仓库对次品全部报损丢弃。</div>
      <section class="plan-preview" data-role="plan-preview"></section>
    </div>
  `;
}

function updatePlanPreview() {
  const preview = modalBody.querySelector("[data-role='plan-preview']");
  if (!preview || !currentPlan) return;
  const selected = modalBody.querySelector("[data-plan-choice].c-segmented__item--active")?.dataset.planChoice;
  if (selected === "scrap") {
    preview.innerHTML = `<h3>方案预览</h3><div class="preview-lines"><div>确认后，将让仓库对当前 ${currentPlan.qty} 件次品全部报损丢弃。</div></div>`;
    return;
  }
  const repairCost = Number(modalBody.querySelector("[data-field='repair-cost']")?.value || 0);
  const ratio = currentPlan.totalCost > 0 ? (repairCost / currentPlan.totalCost) * 100 : 0;
  const threshold = currentPlan.totalCost > 1000 ? 80 : 60;
  const riskClass = ratio >= threshold ? "metric--danger" : ratio >= threshold * 0.75 ? "metric--warning" : "";
  const advice = ratio >= threshold ? "不建议返修，确认时需二次确认" : "可提交返修申请";
  preview.innerHTML = `
    <h3>成本测算</h3>
    <div class="plan-preview__grid">
      <div class="metric"><span>总成本</span><strong>${money(currentPlan.totalCost)}</strong></div>
      <div class="metric"><span>返修成本</span><strong>${money(repairCost)}</strong></div>
      <div class="metric ${riskClass}"><span>成本占比</span><strong>${ratio.toFixed(2)}%</strong></div>
    </div>
    <div class="preview-lines" style="margin-top: var(--space-3);"><div>${advice}</div></div>
  `;
}

function warningTemplate(percent, threshold) {
  return `
    <div class="warning-content">
      <div class="warning-content__title">返修成本占总成本 ${percent}%，大于 ${threshold}%，不建议返修，请确认最终处理方案。</div>
      <div class="warning-content__actions">
        <button class="btn" data-action="warning-cancel" type="button">取消</button>
        <button class="btn btn--primary" data-action="warning-repair" type="button">确认返修</button>
        <button class="btn btn--danger" data-action="warning-scrap" type="button">报损</button>
      </div>
    </div>
  `;
}

function openPlanModal(row) {
  currentPlan = {
    qty: Number(row.dataset.defectiveQty),
    totalCost: Number(row.dataset.totalCost),
    supplier: row.dataset.supplier,
    sku: row.dataset.sku,
  };
  openModal("设置处理方案", planTemplate(currentPlan), "确认方案", "plan");
  bindSegmented(modalBody);
  updatePlanPreview();
}

function submitPlan() {
  const selected = modalBody.querySelector("[data-plan-choice].c-segmented__item--active")?.dataset.planChoice;
  if (selected === "scrap") {
    closeModal();
    showToast("已选择报损方案，将让仓库对次品全部报损丢弃");
    return;
  }

  const qtyInput = modalBody.querySelector("[data-field='repair-qty']");
  const costInput = modalBody.querySelector("[data-field='repair-cost']");
  const qty = Number(qtyInput.value);
  const repairCost = Number(costInput.value);
  qtyInput.setAttribute("aria-invalid", String(Number.isNaN(qty) || qty <= 0 || qty > currentPlan.qty));
  costInput.setAttribute("aria-invalid", String(Number.isNaN(repairCost) || repairCost < 0));
  if (Number.isNaN(qty) || qty <= 0 || qty > currentPlan.qty) {
    showToast("返修数量需大于 0，且不能超过当前次品数量");
    return;
  }
  if (Number.isNaN(repairCost) || repairCost < 0) {
    showToast("返修成本必须大于等于 0");
    return;
  }

  const percent = Number(((repairCost / currentPlan.totalCost) * 100).toFixed(2));
  const threshold = currentPlan.totalCost > 1000 ? 80 : 60;
  if (percent >= threshold) {
    modal.classList.add("c-modal--warning");
    modalTitle.textContent = "返修成本预警";
    modalBody.innerHTML = warningTemplate(percent, threshold);
    confirmButton.hidden = true;
    modalMode = "warning";
    return;
  }

  closeModal();
  showToast("处理方案已确认：返修申请已生成");
}

function bindSelects(scope = document) {
  scope.querySelectorAll(".c-select").forEach((select) => {
    if (select.dataset.bound === "true") return;
    select.dataset.bound = "true";
    select.querySelector(".c-select__trigger").addEventListener("click", (event) => {
      event.stopPropagation();
      document.querySelectorAll(".c-select[data-open='true']").forEach((openSelect) => {
        if (openSelect !== select) openSelect.dataset.open = "false";
      });
      select.dataset.open = select.dataset.open === "true" ? "false" : "true";
    });
  });
}

function bindSegmented(scope = document) {
  scope.querySelectorAll(".c-segmented__item").forEach((item) => {
    if (item.dataset.bound === "true") return;
    item.dataset.bound = "true";
    item.addEventListener("click", () => {
      const segmented = item.closest(".segmented");
      segmented.querySelectorAll(".c-segmented__item").forEach((other) => other.classList.remove("c-segmented__item--active"));
      item.classList.add("c-segmented__item--active");
      const row = item.closest(".condition-row");
      if (row && item.dataset.action === "sku-import") {
        row.querySelector(".import-panel").hidden = false;
        row.querySelector("[data-field='sku-list']").hidden = true;
      }
      if (row && item.dataset.action === "sku-manual") {
        row.querySelector(".import-panel").hidden = true;
        row.querySelector("[data-field='sku-list']").hidden = false;
      }
      if (item.dataset.planChoice === "repair") {
        modalBody.querySelector("[data-repair-fields]").hidden = false;
        modalBody.querySelector("[data-scrap-note]").hidden = true;
        updatePlanPreview();
      }
      if (item.dataset.planChoice === "scrap") {
        modalBody.querySelector("[data-repair-fields]").hidden = true;
        modalBody.querySelector("[data-scrap-note]").hidden = false;
        updatePlanPreview();
      }
      updateConfigPreview();
    });
  });
}

document.addEventListener("click", (event) => {
  const option = event.target.closest(".c-select__option");
  if (option) {
    event.stopPropagation();
    const select = option.closest(".c-select");
    setSelectValue(select, option.dataset.value, option.textContent);
    select.dataset.open = "false";
    const row = select.closest(".condition-row");
    if (row && select.dataset.select === "condition-type") {
      row.querySelector("[data-condition-value]").outerHTML = conditionValueTemplate(option.dataset.value);
      bindSegmented(row);
      updateConfigPreview();
    }
    return;
  }

  document.querySelectorAll(".c-select[data-open='true']").forEach((select) => {
    select.dataset.open = "false";
  });
});

modalBody.addEventListener("click", (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;

  if (action === "config-create" || action === "config-edit") {
    openModal(action === "config-create" ? "新增次品处理配置" : "编辑次品处理配置", configFormTemplate(action === "config-create" ? "新增配置" : "编辑配置"), "保存配置", "config-save");
    bindModalInteractions();
  }
  if (action === "config-disable") {
    openModal("禁用次品处理配置", `<div class="warning-content__title">禁用后，该配置不再参与次品处理方案命中。</div>`, "确认禁用", "config-disable");
  }
  if (action === "config-log") {
    openModal("配置操作日志", configLogTemplate(), "关闭", "log");
  }
  if (action === "add-condition") {
    const button = event.target.closest("[data-action='add-condition']");
    button.insertAdjacentHTML("beforebegin", conditionRowTemplate("SKU"));
    bindModalInteractions();
  }
  if (action === "add-condition-group") {
    const groups = modalBody.querySelector("[data-role='condition-groups']");
    groups.insertAdjacentHTML("beforeend", conditionGroupTemplate(groups.querySelectorAll(".condition-group").length + 1));
    bindModalInteractions();
  }
  if (action === "delete-condition") {
    const group = event.target.closest(".condition-group");
    if (group.querySelectorAll(".condition-row").length === 1) {
      showToast("每个条件组至少保留一个条件");
      return;
    }
    event.target.closest(".condition-row").remove();
    updateConfigPreview();
  }
  if (action === "delete-condition-group") {
    const groups = modalBody.querySelectorAll(".condition-group");
    if (groups.length === 1) {
      showToast("至少保留一个条件组");
      return;
    }
    event.target.closest(".condition-group").remove();
    updateConditionGroupLabels();
    updateConfigPreview();
  }
  if (action === "choose-file") {
    event.target.closest(".import-panel").querySelector("[data-role='file-name']").textContent = "已选择：defective-sku-list.xlsx";
    updateConfigPreview();
  }
  if (action === "warning-cancel") closeModal();
  if (action === "warning-repair") {
    closeModal();
    showToast("已确认返修，返修申请已生成");
  }
  if (action === "warning-scrap") {
    closeModal();
    showToast("已改为报损方案，将让仓库对次品全部报损丢弃");
  }
});

modalBody.addEventListener("input", (event) => {
  if (event.target.matches("[data-field='repair-cost'], [data-field='repair-qty']")) updatePlanPreview();
  if (event.target.closest(".condition-row") || event.target.matches("[data-field='config-name']")) updateConfigPreview();
});

document.querySelector("[data-action='collapse']").addEventListener("click", () => {
  shell.dataset.collapsed = shell.dataset.collapsed === "true" ? "false" : "true";
});

document.querySelector("[data-action='open-config']").addEventListener("click", () => {
  openModal("次品处理配置", configListTemplate(), "关闭", "log");
});

document.querySelector("[data-action='query-filter']").addEventListener("click", applyFilters);
document.querySelector("[data-action='reset-filter']").addEventListener("click", resetFilters);
document.querySelector("[data-field='global-search']").addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyFilters();
});
document.querySelector("[data-field='sku-filter']").addEventListener("keydown", (event) => {
  if (event.key === "Enter") applyFilters();
});

document.querySelectorAll("[data-action='open-pending-detail']").forEach((item) => {
  item.addEventListener("click", openDrawer);
});

document.querySelectorAll("[data-action='open-plan']").forEach((item) => {
  item.addEventListener("click", () => openPlanModal(item.closest("tr")));
});

document.querySelectorAll("[data-action='close-drawer']").forEach((item) => {
  item.addEventListener("click", closeDrawer);
});

document.querySelectorAll("[data-action='close-modal']").forEach((item) => {
  item.addEventListener("click", closeModal);
});

confirmButton.addEventListener("click", () => {
  if (modalMode === "log") {
    closeModal();
    return;
  }
  if (modalMode === "plan") {
    submitPlan();
    return;
  }
  if (modalMode === "config-save") {
    const nameInput = modalBody.querySelector("[data-field='config-name']");
    if (nameInput && !nameInput.value.trim()) {
      nameInput.setAttribute("aria-invalid", "true");
      showToast("请输入配置名称");
      return;
    }
  }
  const messages = {
    "config-save": "配置已保存",
    "config-disable": "配置已禁用",
    default: "操作已提交",
  };
  closeModal();
  showToast(messages[modalMode] || messages.default);
});

document.querySelectorAll("[data-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-tab]").forEach((item) => item.setAttribute("aria-selected", "false"));
    tab.setAttribute("aria-selected", "true");
    document.querySelectorAll("[data-tab-pane]").forEach((pane) => {
      pane.hidden = pane.dataset.tabPane !== tab.dataset.tab;
    });
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer();
    closeModal();
  }
});

bindSelects(document);
