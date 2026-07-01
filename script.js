const shell = document.querySelector(".c-shell");
const drawer = document.querySelector(".c-drawer");
const drawerMask = document.querySelector(".c-drawer-mask");
const modal = document.querySelector(".c-modal");
const modalMask = document.querySelector(".c-modal-mask");
const modalBody = document.querySelector("#modal-body");
const modalTitle = document.querySelector("#modal-title");
const confirmButton = document.querySelector("[data-action='confirm-modal']");
const toast = document.querySelector(".toast");
const drawerOriginalBody = drawer.querySelector(".c-drawer__body").innerHTML;
const drawerOriginalMeta = drawer.querySelector(".c-drawer__meta").innerHTML;

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

function openPendingDetailDrawer() {
  document.querySelector("#drawer-title").textContent = "次品待处理详情";
  drawer.querySelector(".c-drawer__meta").innerHTML = drawerOriginalMeta;
  drawer.querySelector(".c-drawer__tabs").hidden = false;
  drawer.querySelector(".c-drawer__body").innerHTML = drawerOriginalBody;
  openDrawer();
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
  const source = getSelectValue("source");
  const sku = document.querySelector("[data-field='sku-filter']").value.trim().toUpperCase();
  const keyword = document.querySelector("[data-field='global-search']").value.trim().toUpperCase();
  const rows = [...document.querySelectorAll("[data-row='pending']")];
  let visibleCount = 0;
  let visibleCost = 0;
  let pendingQty = 0;

  rows.forEach((row) => {
    const rowText = `${row.dataset.supplier} ${row.dataset.sku} ${row.dataset.warehouse}`.toUpperCase();
    const matched = (!supplier || row.dataset.supplier === supplier)
      && (!warehouse || row.dataset.warehouse === warehouse)
      && (!source || row.dataset.source === source)
      && (!sku || row.dataset.sku.toUpperCase().includes(sku))
      && (!keyword || rowText.includes(keyword));
    row.hidden = !matched;
    if (matched) {
      visibleCount += 1;
      visibleCost += Number(row.dataset.totalCost);
      pendingQty += Number(row.dataset.defectiveQty);
    }
  });

  document.querySelector("[data-role='empty-row']").hidden = visibleCount > 0;
  document.querySelector("[data-role='table-summary']").innerHTML = `待处理聚合 <strong>${visibleCount}</strong> 组，待处理数量 <strong>${pendingQty}</strong> 件，采购成本合计 <strong>${money(visibleCost)}</strong>`;
}

function resetFilters() {
  document.querySelector("[data-field='sku-filter']").value = "";
  document.querySelector("[data-field='global-search']").value = "";
  document.querySelectorAll(".c-select[data-select='supplier'], .c-select[data-select='warehouse'], .c-select[data-select='source']").forEach((select) => {
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
          <td>低货值次品框归集</td>
          <td><div class="condition-summary"><span class="tag tag--processing">条件组 1</span><span>货值满足低货值配置条件</span></div></td>
          <td><span class="tag tag--warning">次品框归集</span></td>
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
  const options = ["SKU", "平台", "单价区间", "货值区间"];
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
      <div class="sku-condition-control" data-condition-value>
        <input class="input" data-field="sku-list" value="SKU-BAT-8842, SKU-PAD-7710" placeholder="输入SKU，回车添加" />
        <button class="btn" data-action="choose-file" type="button">批量导入</button>
        <span class="text-secondary" data-role="file-name" hidden>支持导入固定 SKU 清单</span>
      </div>
    `;
  }
  if (type === "平台") {
    return `
      <div class="c-select condition-value-select" data-select="condition-platform" data-value="amazon">
        <button class="c-select__trigger" type="button" data-action="toggle-select">Amazon</button>
        <div class="c-select__menu">
          <button class="c-select__option c-select__option--active" type="button" data-value="amazon">Amazon</button>
          <button class="c-select__option" type="button" data-value="ebay">eBay</button>
          <button class="c-select__option" type="button" data-value="walmart">Walmart</button>
          <button class="c-select__option" type="button" data-value="temu">Temu</button>
          <button class="c-select__option" type="button" data-value="tiktok">TikTok Shop</button>
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
      <button class="condition-delete" data-action="delete-condition" title="删除条件" type="button">×</button>
    </div>
  `;
}

function conditionGroupTemplate(index) {
  return `
    <div class="condition-group">
      <div class="condition-group__head">
        <span class="tag tag--processing">条件组 ${index}</span>
        <span class="text-secondary">组内条件需全部满足 (AND)</span>
        <button class="btn btn--text condition-group__delete" data-action="delete-condition-group" type="button">删除组</button>
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
              <button class="c-segmented__item" data-action-value="次品框归集" type="button">次品框归集</button>
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
                <button class="btn btn--text condition-group__delete" data-action="delete-condition-group" type="button">删除组</button>
              </div>
              ${conditionRowTemplate("SKU")}
              ${conditionRowTemplate("平台")}
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
  if (type === "平台") {
    return `平台 = ${row.querySelector("[data-select='condition-platform'] .c-select__trigger")?.textContent || "未选择"}`;
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

function planChoiceButtonsTemplate(plan) {
  if (plan.source === "temporary") {
    return `
      <button class="c-segmented__item c-segmented__item--active" data-plan-choice="scrap" type="button">报损</button>
      <button class="c-segmented__item" data-plan-choice="deduct" type="button">抵扣账单</button>
      <button class="c-segmented__item" data-plan-choice="compensation" type="button">赔款</button>
    `;
  }
  return `
    <button class="c-segmented__item c-segmented__item--active" data-plan-choice="repair" type="button">返修</button>
    <button class="c-segmented__item" data-plan-choice="scrap" type="button">报损</button>
  `;
}

function planTemplate(plan) {
  const isTemporary = plan.source === "temporary";
  return `
    <dl class="info-grid">
      <dt>供应商</dt><dd>${plan.supplier}</dd>
      <dt>SKU</dt><dd>${plan.sku}</dd>
      <dt>次品数量</dt><dd>${plan.qty}</dd>
      <dt>总成本</dt><dd>${money(plan.totalCost)}</dd>
      <dt>次品存放类型</dt><dd>${plan.source === "temporary" ? '<span class="tag tag--warning">次品框归集</span>' : '<span class="tag tag--processing">已上架次品区</span>'}</dd>
      <dt>历史处理次数</dt><dd>${plan.historyCount} 次</dd>
    </dl>
    <div class="plan-form">
      <div class="form-field">
        <span>处理方式</span>
        <div class="segmented" data-role="repair-choice">
          ${planChoiceButtonsTemplate(plan)}
        </div>
      </div>
      <div class="repair-plan-panel" data-repair-plan-fields ${isTemporary ? "hidden" : ""}>
        <div class="form-field">
          <span>返修方案</span>
          <div class="segmented" data-role="repair-scheme">
            <button class="c-segmented__item c-segmented__item--active" data-repair-scheme="inbound" type="button">返修入库</button>
            <button class="c-segmented__item" data-repair-scheme="exchange" type="button">返修换货</button>
          </div>
        </div>
        <div class="exchange-sku-list" data-exchange-sku-list hidden>
          <div class="text-secondary">返修换货需维护新换货 SKU，系统展示换货 SKU 单价和金额。</div>
          <table class="c-table c-table--compact">
            <thead>
              <tr><th>换货 SKU</th><th class="c-table__cell--num">换货数量</th><th class="c-table__cell--num">换货 SKU 单价</th><th class="c-table__cell--num">换货 SKU 金额</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><input class="input" data-field="exchange-sku" value="SKU-BAT-8842-R" /></td>
                <td class="c-table__cell--num"><input class="input" data-field="exchange-qty" type="number" min="1" value="${plan.qty}" /></td>
                <td class="c-table__cell--num">¥72.00</td>
                <td class="c-table__cell--num" data-role="exchange-amount">¥${(plan.qty * 72).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="repair-fields" data-repair-fields ${isTemporary ? "hidden" : ""}>
        <label class="form-field">
          <span>返修数量</span>
          <input class="input" data-field="repair-qty" type="number" min="1" max="${plan.qty}" value="${plan.qty}" />
        </label>
        <label class="form-field">
          <span>预估运费</span>
          <input class="input" data-field="estimated-freight" type="number" min="0" value="0" />
        </label>
        <div class="form-field">
          <span>运费承担方</span>
          <div class="segmented">
            <button class="c-segmented__item c-segmented__item--active" data-freight-bearer="company" type="button">公司承担</button>
            <button class="c-segmented__item" data-freight-bearer="supplier" type="button">供应商承担</button>
          </div>
        </div>
        <label class="form-field">
          <span>返修费</span>
          <input class="input" data-field="repair-fee" type="number" min="0" value="0" />
        </label>
        <div class="threshold-note">返修成本比较 = 返修费 + 公司承担的预估运费。总成本大于 1000 时，占比达到 80% 不建议返修；总成本小于等于 1000 时，占比达到 60% 不建议返修。</div>
      </div>
      <div data-scrap-fields ${isTemporary ? "" : "hidden"}>
        <div class="scrap-note">确认后生成报损出库单并进入报损审核流，当前弹窗不再展示二级方案。</div>
      </div>
      <div class="settlement-fields" data-deduct-fields hidden>
        <label class="form-field">
          <span>抵扣金额</span>
          <input class="input" data-field="deduct-amount" type="number" min="0" value="${plan.totalCost}" />
        </label>
        <label class="form-field">
          <span>抵扣供应商</span>
          <input class="input" value="${plan.supplier}" disabled />
        </label>
        <div class="threshold-note">抵扣供应商由当前次品记录自动带出，不支持手工编辑。</div>
      </div>
      <div class="compensation-fields" data-compensation-fields hidden>
        <section class="compensation-panel">
          <h3>赔款信息</h3>
          <div class="compensation-row compensation-row--top">
            <label class="form-field">
              <span><em>*</em>赔款金额</span>
              <input class="input" data-field="compensation-amount" type="number" min="0" value="${plan.totalCost}" />
            </label>
            <label class="form-field">
              <span>流水</span>
              <input class="input" data-field="compensation-flow" placeholder="输入赔款流水号" value="ZFB202604170003" />
            </label>
            <button class="icon-delete" title="删除赔款" type="button">⌫</button>
          </div>
          <button class="link-add" type="button">⊕ 添加赔款</button>
          <div class="compensation-row compensation-row--bottom">
            <label class="form-field">
              <span><em>*</em>赔款方式</span>
              <div class="c-select" data-select="compensation-method" data-value="alipay">
                <button class="c-select__trigger" type="button" data-action="toggle-select">支付宝转账</button>
                <div class="c-select__menu">
                  <button class="c-select__option c-select__option--active" type="button" data-value="alipay">支付宝转账</button>
                  <button class="c-select__option" type="button" data-value="bank">银行卡转账</button>
                </div>
              </div>
            </label>
            <label class="form-field">
              <span><em>*</em>赔款状态</span>
              <div class="c-select" data-select="compensation-status" data-value="full">
                <button class="c-select__trigger" type="button" data-action="toggle-select">全部</button>
                <div class="c-select__menu">
                  <button class="c-select__option" type="button" data-value="partial">部分</button>
                  <button class="c-select__option c-select__option--active" type="button" data-value="full">全部</button>
                </div>
              </div>
            </label>
            <label class="form-field">
              <span>实际退款金额</span>
              <input class="input" data-field="actual-refund-amount" value="${money(plan.totalCost)}" disabled />
            </label>
          </div>
          <div class="voucher-field">
            <span>凭证</span>
            <div class="voucher-upload">
              <span class="upload-hint">jpg,jpeg,png</span>
              <button class="voucher-box" data-action="choose-voucher" type="button">
                <span>☁</span>
                <strong>点击上传图片</strong>
              </button>
              <span class="text-secondary" data-role="voucher-name">未上传</span>
            </div>
          </div>
        </section>
        </div>
      </div>
      <section class="plan-preview" data-role="plan-preview"></section>
    </div>
  `;
}

function updatePlanPreview() {
  const preview = modalBody.querySelector("[data-role='plan-preview']");
  if (!preview || !currentPlan) return;
  const selected = modalBody.querySelector("[data-plan-choice].c-segmented__item--active")?.dataset.planChoice;
  if (selected === "scrap") {
    preview.innerHTML = `<h3>方案预览</h3><div class="preview-lines"><div>确认后生成报损出库单并推送报损审核流。</div><div>报损不需要维护返修方案。</div></div>`;
    return;
  }
  if (selected === "deduct") {
    const deductAmount = Number(modalBody.querySelector("[data-field='deduct-amount']")?.value || 0);
    preview.innerHTML = `
      <h3>抵扣信息</h3>
      <div class="plan-preview__grid">
        <div class="metric"><span>抵扣金额</span><strong>${money(deductAmount)}</strong></div>
        <div class="metric"><span>抵扣供应商</span><strong>${currentPlan.supplier}</strong></div>
        <div class="metric"><span>处理结果</span><strong>生成待抵扣记录</strong></div>
      </div>
    `;
    return;
  }
  if (selected === "compensation") {
    const compensationAmount = Number(modalBody.querySelector("[data-field='compensation-amount']")?.value || 0);
    const actualRefundInput = modalBody.querySelector("[data-field='actual-refund-amount']");
    if (actualRefundInput) actualRefundInput.value = money(compensationAmount);
    const method = modalBody.querySelector("[data-select='compensation-method'] .c-select__trigger")?.textContent || "支付宝转账";
    const status = modalBody.querySelector("[data-select='compensation-status'] .c-select__trigger")?.textContent || "部分";
    preview.innerHTML = `
      <h3>赔款信息</h3>
      <div class="plan-preview__grid">
        <div class="metric"><span>赔款金额合计</span><strong>${money(compensationAmount)}</strong></div>
        <div class="metric"><span>实际退款金额</span><strong>${money(compensationAmount)}</strong></div>
        <div class="metric"><span>赔款方式</span><strong>${method}</strong></div>
        <div class="metric"><span>赔款状态</span><strong>${status}</strong></div>
      </div>
    `;
    return;
  }
  const repairScheme = modalBody.querySelector("[data-repair-scheme].c-segmented__item--active")?.dataset.repairScheme || "inbound";
  const repairFee = Number(modalBody.querySelector("[data-field='repair-fee']")?.value || 0);
  const estimatedFreight = Number(modalBody.querySelector("[data-field='estimated-freight']")?.value || 0);
  const freightBearer = modalBody.querySelector("[data-freight-bearer].c-segmented__item--active")?.dataset.freightBearer || "company";
  const companyFreight = freightBearer === "company" ? estimatedFreight : 0;
  const repairCost = repairFee + companyFreight;
  const ratio = currentPlan.totalCost > 0 ? (repairCost / currentPlan.totalCost) * 100 : 0;
  const threshold = currentPlan.totalCost > 1000 ? 80 : 60;
  const riskClass = ratio >= threshold ? "metric--danger" : ratio >= threshold * 0.75 ? "metric--warning" : "";
  const advice = ratio >= threshold ? "不建议返修，确认时需二次确认" : "可提交返修申请";
  const schemeText = {
    inbound: "返修入库",
    exchange: "返修换货",
  }[repairScheme];
  const schemeResult = repairScheme === "exchange"
    ? "将记录新换货 SKU、数量、单价和金额。"
    : "供应商回货后进入返修入库流程。";
  preview.innerHTML = `
    <h3>成本测算</h3>
    <div class="plan-preview__grid">
      <div class="metric"><span>返修方案</span><strong>${schemeText}</strong></div>
      <div class="metric"><span>总成本</span><strong>${money(currentPlan.totalCost)}</strong></div>
      <div class="metric"><span>返修费</span><strong>${money(repairFee)}</strong></div>
      <div class="metric"><span>公司承担运费</span><strong>${money(companyFreight)}</strong></div>
      <div class="metric"><span>比较成本</span><strong>${money(repairCost)}</strong></div>
      <div class="metric ${riskClass}"><span>成本占比</span><strong>${ratio.toFixed(2)}%</strong></div>
    </div>
    <div class="preview-lines" style="margin-top: var(--space-3);"><div>${schemeResult}</div><div>${advice}</div></div>
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
    source: row.dataset.source,
    historyCount: Number(row.dataset.historyCount || 0),
  };
  openModal("设置处理方案", planTemplate(currentPlan), "确认方案", "plan");
  bindSelects(modalBody);
  bindSegmented(modalBody);
  updatePlanPreview();
}

function submitPlan() {
  const selected = modalBody.querySelector("[data-plan-choice].c-segmented__item--active")?.dataset.planChoice;
  if (selected === "scrap") {
    closeModal();
    showToast("报损方案已确认，报损出库单已生成并进入审核流");
    return;
  }
  if (selected === "deduct") {
    const deductInput = modalBody.querySelector("[data-field='deduct-amount']");
    const deductAmount = Number(deductInput.value);
    deductInput.setAttribute("aria-invalid", String(Number.isNaN(deductAmount) || deductAmount <= 0));
    if (Number.isNaN(deductAmount) || deductAmount <= 0) {
      showToast("抵扣金额需大于 0");
      return;
    }
    closeModal();
    showToast("抵扣账单方案已确认，待抵扣记录已生成");
    return;
  }
  if (selected === "compensation") {
    const amountInput = modalBody.querySelector("[data-field='compensation-amount']");
    const flowInput = modalBody.querySelector("[data-field='compensation-flow']");
    const amount = Number(amountInput.value);
    const flow = flowInput.value.trim();
    amountInput.setAttribute("aria-invalid", String(Number.isNaN(amount) || amount <= 0));
    flowInput.setAttribute("aria-invalid", String(!flow));
    if (Number.isNaN(amount) || amount <= 0) {
      showToast("赔款金额需大于 0");
      return;
    }
    if (!flow) {
      showToast("请填写赔款流水");
      return;
    }
    closeModal();
    showToast("赔款方案已确认，赔款信息已记录");
    return;
  }

  const repairScheme = modalBody.querySelector("[data-repair-scheme].c-segmented__item--active")?.dataset.repairScheme || "inbound";
  if (repairScheme === "exchange") {
    const exchangeSkuInput = modalBody.querySelector("[data-field='exchange-sku']");
    const exchangeQtyInput = modalBody.querySelector("[data-field='exchange-qty']");
    const exchangeSku = exchangeSkuInput.value.trim();
    const exchangeQty = Number(exchangeQtyInput.value);
    exchangeSkuInput.setAttribute("aria-invalid", String(!exchangeSku));
    exchangeQtyInput.setAttribute("aria-invalid", String(Number.isNaN(exchangeQty) || exchangeQty <= 0));
    if (!exchangeSku || Number.isNaN(exchangeQty) || exchangeQty <= 0) {
      showToast("请填写换货 SKU 和大于 0 的换货数量");
      return;
    }
  }

  const qtyInput = modalBody.querySelector("[data-field='repair-qty']");
  const repairFeeInput = modalBody.querySelector("[data-field='repair-fee']");
  const freightInput = modalBody.querySelector("[data-field='estimated-freight']");
  const qty = Number(qtyInput.value);
  const repairFee = Number(repairFeeInput.value);
  const estimatedFreight = Number(freightInput.value);
  const freightBearer = modalBody.querySelector("[data-freight-bearer].c-segmented__item--active")?.dataset.freightBearer || "company";
  const repairCost = repairFee + (freightBearer === "company" ? estimatedFreight : 0);
  qtyInput.setAttribute("aria-invalid", String(Number.isNaN(qty) || qty <= 0 || qty > currentPlan.qty));
  repairFeeInput.setAttribute("aria-invalid", String(Number.isNaN(repairFee) || repairFee < 0));
  freightInput.setAttribute("aria-invalid", String(Number.isNaN(estimatedFreight) || estimatedFreight < 0));
  if (Number.isNaN(qty) || qty <= 0 || qty > currentPlan.qty) {
    showToast("返修数量需大于 0，且不能超过当前次品数量");
    return;
  }
  if (Number.isNaN(repairFee) || repairFee < 0 || Number.isNaN(estimatedFreight) || estimatedFreight < 0) {
    showToast("返修费和预估运费必须大于等于 0");
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

function openHistoryDrawer(row) {
  const count = Number(row.dataset.historyCount || 0);
  document.querySelector("#drawer-title").textContent = `${row.dataset.sku} 历史处理记录`;
  drawer.querySelector(".c-drawer__meta").innerHTML = `<span class="tag tag--processing">${row.dataset.supplier}</span><span>历史发起 <strong>${count}</strong> 次</span><span>当前存放类型：${row.dataset.source === "temporary" ? "次品框归集" : "已上架次品区"}</span>`;
  drawer.querySelector(".c-drawer__tabs").hidden = true;
  drawer.querySelector(".c-drawer__body").innerHTML = `
    <section class="history-summary">
      <div class="metric"><span>累计处理数量</span><strong>${count ? 72 : 0}</strong></div>
      <div class="metric"><span>返修 / 报损</span><strong>${count ? "1 / 1" : "0 / 0"}</strong></div>
      <div class="metric"><span>返修入库 / 返修换货</span><strong>${count ? "1 / 1" : "0 / 0"}</strong></div>
    </section>
    <h3 class="c-section-title">历次处理明细</h3>
    ${count ? `<table class="c-table"><thead><tr><th>发起时间</th><th>来源</th><th>数量</th><th>处理方案</th><th>金额</th><th>关联单据</th><th>结果</th></tr></thead><tbody>
      <tr><td>2026-05-28</td><td>已上架</td><td>30</td><td>返修入库</td><td>¥680.00</td><td><a class="link">RX260528001</a></td><td><span class="tag tag--success">已完成</span></td></tr>
      <tr><td>2026-05-26</td><td>次品框归集</td><td>14</td><td>返修换货</td><td>¥888.00</td><td><a class="link">RX260526009</a></td><td><span class="tag tag--processing">返修中</span></td></tr>
      <tr><td>2026-05-18</td><td>已上架</td><td>28</td><td>报损</td><td>¥1,904.00</td><td><a class="link">BS260518016</a></td><td><span class="tag tag--success">已完成</span></td></tr>
    </tbody></table>` : `<div class="empty-state">该 SKU 暂无历史处理记录</div>`}
  `;
  openDrawer();
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

function setPlanChoiceVisibility(choice) {
  const repairPlanFields = modalBody.querySelector("[data-repair-plan-fields]");
  const repairFields = modalBody.querySelector("[data-repair-fields]");
  const scrapFields = modalBody.querySelector("[data-scrap-fields]");
  const deductFields = modalBody.querySelector("[data-deduct-fields]");
  const compensationFields = modalBody.querySelector("[data-compensation-fields]");
  if (repairPlanFields) repairPlanFields.hidden = choice !== "repair";
  if (repairFields) repairFields.hidden = choice !== "repair";
  if (scrapFields) scrapFields.hidden = choice !== "scrap";
  if (deductFields) deductFields.hidden = choice !== "deduct";
  if (compensationFields) compensationFields.hidden = choice !== "compensation";
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
      if (item.dataset.planChoice) {
        setPlanChoiceVisibility(item.dataset.planChoice);
        updatePlanPreview();
      }
      if (item.dataset.repairScheme) {
        const scheme = item.dataset.repairScheme;
        modalBody.querySelector("[data-exchange-sku-list]").hidden = scheme !== "exchange";
        updatePlanPreview();
      }
      if (item.dataset.feeBearer) {
        const preview = modalBody.querySelector(".plan-preview .preview-lines");
        if (preview) preview.innerHTML = item.dataset.feeBearer === "supplier" ? "<div>返修费应付：¥500.00</div><div>运费由供应商承担，将生成 ¥100.00 供应商扣款。</div><div>确认后费用锁定。</div>" : "<div>返修费应付：¥500.00</div><div>当前运费由公司承担，不生成运费扣款。</div><div>确认后费用锁定。</div>";
      }
      if (item.dataset.freightBearer) {
        updatePlanPreview();
      }
      if (item.dataset.compensationMethod || item.dataset.compensationStatus) {
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
    if (select.dataset.select === "compensation-method" || select.dataset.select === "compensation-status") {
      updatePlanPreview();
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
    const skuControl = event.target.closest(".sku-condition-control");
    if (skuControl) {
      const fileName = skuControl.querySelector("[data-role='file-name']");
      fileName.hidden = false;
      fileName.textContent = "已选择：defective-sku-list.xlsx";
    }
    updateConfigPreview();
  }
  if (action === "choose-voucher") {
    const voucherName = event.target.closest(".upload-control")?.querySelector("[data-role='voucher-name']");
    if (voucherName) voucherName.textContent = "已上传：compensation-voucher.jpg";
  }
  if (action === "warning-cancel") closeModal();
  if (action === "warning-repair") {
    closeModal();
    showToast("已确认返修，返修申请已生成");
  }
  if (action === "warning-scrap") {
    closeModal();
    showToast("已改为报损方案，将生成报损出库处理");
  }
});

modalBody.addEventListener("input", (event) => {
  if (event.target.matches("[data-field='repair-fee'], [data-field='estimated-freight'], [data-field='repair-qty'], [data-field='deduct-amount'], [data-field='compensation-amount']")) updatePlanPreview();
  if (event.target.matches("[data-field='exchange-qty']")) {
    const qty = Number(event.target.value || 0);
    const amount = modalBody.querySelector("[data-role='exchange-amount']");
    if (amount) amount.textContent = money(qty * 72);
    updatePlanPreview();
  }
  if (event.target.closest(".condition-row") || event.target.matches("[data-field='config-name']")) updateConfigPreview();
});

document.querySelector("[data-action='collapse']").addEventListener("click", () => {
  shell.dataset.collapsed = shell.dataset.collapsed === "true" ? "false" : "true";
});

document.querySelector("[data-action='open-config']").addEventListener("click", () => {
  openModal("次品处理配置", configListTemplate(), "关闭", "log");
});

document.querySelectorAll("[data-pool-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.dataset.poolTab;
    document.querySelectorAll("[data-pool-tab]").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("c-tabs__item--active", active);
      item.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-pool-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.poolPanel !== target;
    });
    document.querySelector("[data-role='table-summary']").innerHTML = target === "records"
      ? `已处理记录 <strong>5</strong> 条，处置数量 <strong>116</strong> 件`
      : `待处理聚合 <strong>4</strong> 组，待处理数量 <strong>105</strong> 件，采购成本合计 <strong>¥13,564.00</strong>`;
  });
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
  item.addEventListener("click", openPendingDetailDrawer);
});

document.querySelectorAll("[data-action='open-plan']").forEach((item) => {
  item.addEventListener("click", () => openPlanModal(item.closest("tr")));
});

document.querySelectorAll("[data-action='open-history']").forEach((item) => {
  item.addEventListener("click", () => openHistoryDrawer(item.closest("tr")));
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
