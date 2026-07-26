/* ============ API 封装 ============ */
const API_BASE = '';
function currentUserId() {
  try { const a = JSON.parse(localStorage.getItem('milktea_auth')); return a ? a.id : null; } catch { return null; }
}
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const uid = currentUserId();
  if (uid) headers['x-current-user'] = String(uid);
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers,
  });
  if (!res.ok) {
    let msg = '请求失败 (' + res.status + ')';
    try { const j = await res.json(); msg = j.detail || JSON.stringify(j); } catch (e) {}
    throw new Error(msg);
  }
  return res.json();
}
const apiGet = (entity, params = {}) => {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  return api('/api/' + entity + (qs ? '?' + qs : ''));
};
const apiCreate = (e, d) => api('/api/' + e, { method: 'POST', body: JSON.stringify(d) });
const apiUpdate = (e, id, d) => api('/api/' + e + '/' + id, { method: 'PUT', body: JSON.stringify(d) });
const apiDelete = (e, id) => api('/api/' + e + '/' + id, { method: 'DELETE' });

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function tagClass(v) {
  const s = String(v);
  if (/过期|紧急|不足|停用|已终止|变质/.test(s)) return 'tag-danger';
  if (/警告|关注|低库存|低于安全|待审核|装修|暂停/.test(s)) return 'tag-warning';
  if (/运输中|待发货|待执行|进行中|战略合作|核心供应商/.test(s)) return 'tag-info';
  if (/合作中|正常|已完成|已签收|营业中|启用|运营中|在职/.test(s)) return 'tag-success';
  return 'tag-default';
}
function tag(v) { return `<span class="tag ${tagClass(v)}">${escapeHtml(v)}</span>`; }
function fmtMoney(n) { return '¥' + Number(n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

/* ============ 实体配置 ============ */
const ENTITY_CONFIG = {
  suppliers: {
    title: '🏭 供应商账号',
    columns: ['code:编号', 'name:供应商名称', 'platform_name:上级平台:tag', 'type:类型:tag', 'account_status:账号状态:tag',
      'username:登录账号', 'contact:联系人', 'phone:电话', 'category:供应类别', 'level:合作等级:tag',
      'max_brands:授权品牌商配额', 'status:状态:tag'],
    form: ['code:编号', 'name:名称', 'platform_id:上级平台:fk:platforms', 'type:类型:select:贸易商,制造商,种植基地',
      'username:登录账号', 'password:密码:password', 'account_status:账号状态:select:正常,停用,待激活',
      'registered_at:注册时间', 'contact:联系人', 'phone:电话', 'category:供应类别',
      'level:合作等级:select:战略合作,核心供应商,一般供应商', 'max_brands:授权品牌商配额:number',
      'supply_cycle:供货周期', 'cooperation_start:合作起始', 'total_amount:累计供货额:number',
      'status:状态:select:合作中,暂停合作,已终止'],
    filters: ['category:供应类别:茶叶类,糖浆类,奶制品类,小料类,水果类', 'account_status:账号状态:正常,停用,待激活'],
  },
  brands: {
    title: '🏢 品牌商账号',
    columns: ['code:编号', 'name:品牌名称', 'supplier_name:上级供应商:tag', 'account_status:账号状态:tag',
      'username:登录账号', 'company:所属公司', 'manager:品牌负责人', 'phone:电话', 'store_count:旗下门店数',
      'max_stores:授权门店配额', 'franchise_mode:加盟模式:tag', 'status:状态:tag'],
    form: ['code:编号', 'name:品牌名称', 'supplier_id:上级供应商:fk:suppliers', 'username:登录账号',
      'password:密码:password', 'account_status:账号状态:select:正常,停用,待激活', 'registered_at:注册时间',
      'company:所属公司', 'manager:品牌负责人', 'phone:电话', 'store_count:旗下门店数:number',
      'max_stores:授权门店配额:number', 'franchise_mode:加盟模式:select:直营,加盟,直营+加盟',
      'created_at_date:创建时间', 'status:状态:select:运营中,筹备中,已关闭'],
    filters: ['supplier_name:上级供应商:茗源茶业有限公司,甜蜜源糖业,光明乳业股份有限公司,珍珠大王食品,鲜果汇供应链', 'account_status:账号状态:正常,停用,待激活'],
  },
  stores: {
    title: '🏪 门店账号',
    columns: ['code:门店编号', 'name:门店名称', 'brand_name:所属品牌:tag', 'account_status:账号状态:tag',
      'username:登录账号', 'type:门店类型:tag', 'manager:店长', 'phone:电话', 'area:营业面积',
      'staff_count:店员数', 'max_staff:授权店员配额', 'status:营业状态:tag'],
    form: ['code:门店编号', 'name:门店名称', 'brand_id:所属品牌:fk:brands', 'username:登录账号',
      'password:密码:password', 'account_status:账号状态:select:正常,停用,待激活', 'registered_at:注册时间',
      'type:门店类型:select:旗舰店,标准店,社区店', 'manager:店长', 'phone:电话', 'address:地址',
      'area:营业面积', 'staff_count:店员数:number', 'max_staff:授权店员配额:number',
      'status:营业状态:select:营业中,休息中,装修中,已关闭'],
    filters: ['brand_name:所属品牌:茶颜悦色,蜜雪冰城,喜茶', 'account_status:账号状态:正常,停用,待激活'],
  },
  staff: {
    title: '👤 店员账号',
    columns: ['code:工号', 'name:姓名', 'role:角色:tag', 'store_name:所属门店:tag', 'account_status:账号状态:tag',
      'username:登录账号', 'phone:电话', 'hire_date:入职日期', 'permissions:操作权限', 'qualification:资质等级', 'status:状态:tag'],
    form: ['code:工号', 'name:姓名', 'role:角色:select:店长,副店长,制茶师,收银员,仓库管理员', 'store_id:所属门店:fk:stores',
      'username:登录账号', 'password:密码:password', 'account_status:账号状态:select:正常,停用,待激活',
      'registered_at:注册时间', 'phone:电话', 'hire_date:入职日期', 'permissions:操作权限',
      'qualification:资质等级:select:高级,中级,初级', 'status:状态:select:在职,离职,休假'],
    filters: ['store_name:所属门店:朝阳旗舰店,海淀中关村店,西城金融街店', 'account_status:账号状态:正常,停用,待激活'],
  },
  ingredients: {
    title: '🧂 配料管理',
    columns: ['code:编码', 'name:名称:tag', 'category:类别', 'barcode:条码', 'spec:规格', 'unit:单位',
      'supplier_name:供应商:tag', 'cost_price:进货价:money', 'sale_price:参考售价:money',
      'safety_stock:安全库存', 'max_stock:库存上限', 'location:建议库位', 'brand:品牌',
      'shelf_life:保质期', 'pinyin:拼音码', 'status:状态:tag'],
    form: ['section:基本信息',
      'code:编码', 'name:品名', 'status:启用状态:switch:启用,停用',
      'category:类别(三级):cat3', 'barcode:条码', 'multi_code:一品多码:switch',
      'supplier_id:供货商:fk:suppliers', 'image_url:商品图片',
      'section:价格与库存',
      'cost_price:进价', 'sale_price:售价', 'gross_margin:毛利率:margin', 'use_member_discount:会员折扣:switch',
      'safety_stock:库存下限', 'max_stock:库存上限', 'not_count_stock:不计库存:switch',
      'unit:主单位', 'location:库位', 'min_sale_qty:起售量',
      'section:规格与生产',
      'spec:商品规格', 'has_other_spec:其它规格:switch',
      'flavor:商品口味', 'weight:重量(kg)',
      'prep_time:准备时间(分钟)', 'kitchen_ticket:厨房票打:switch',
      'brand:商品品牌', 'label_print:标签打印:switch',
      'pinyin:拼音码', 'production_date:生产日期', 'shelf_life:保质期',
      'refrigerated:冷藏:switch', 'unopened:未开封:switch',
      'wholesale_price:批发价', 'tags:商品标签', 'remark:商品描述'],
  },
  categories: {
    title: '🗂️ 配料类别（三级分类）',
    columns: ['code:编码', 'name:名称:tag', 'level:级别:tag', 'parent_id:上级:tag', 'sort:排序',
      'status:状态:tag', 'remark:备注'],
    form: ['code:编码', 'name:名称', 'level:级别:select:1,2,3',
      'parent_id:上级分类:catparent', 'sort:排序:number', 'status:状态:select:启用,停用', 'remark:备注'],
  },
  units: {
    title: '⚖️ 配料单位及换算',
    columns: ['code:编码', 'name:单位名称:tag', 'symbol:符号', 'group:计量类别:tag', 'base_unit:基准单位',
      'factor:换算系数', 'conversion:换算关系', 'status:状态:tag'],
    form: ['code:编码', 'name:单位名称', 'symbol:符号', 'group:计量类别:select:重量,容量,计数',
      'base_unit:基准单位', 'factor:换算系数:number', 'status:状态:select:启用,停用', 'remark:备注'],
  },
  inventory: {
    title: '📦 库存总览',
    columns: ['ingredient_id:', 'ingredient_name:物料名称:tag', 'store_name:所属门店:tag', 'current_stock:当前库存',
      'safety_stock:安全库存', 'status:库存状态:tag', 'last_in:最近入库', 'last_out:最近出库', 'location:仓库位置'],
    form: ['ingredient_id:物料:fk:ingredients', 'store_id:所属门店:fk:stores', 'current_stock:当前库存:number', 'safety_stock:安全库存:number',
      'status:库存状态:select:正常,低于安全库存,库存不足', 'last_in:最近入库', 'last_out:最近出库', 'location:仓库位置'],
  },
  wastage: {
    title: '📉 损耗记录列表',
    columns: ['code:记录编号', 'store_name:门店:tag', 'ingredient_name:物料名称:tag', 'type:损耗类型:tag',
      'quantity:数量', 'amount:金额:money', 'rate:损耗率', 'responsible:责任人', 'date:日期', 'status:状态:tag'],
    form: ['code:记录编号', 'store_id:门店:fk:stores', 'ingredient_id:物料:fk:ingredients',
      'type:损耗类型:select:过期损耗,制作损耗,变质损耗,洒漏损耗', 'quantity:数量:number', 'amount:金额:number',
      'rate:损耗率', 'responsible:责任人', 'date:日期', 'status:状态:select:待审核,已确认,已处理'],
  },
  prep: {
    title: '⚙️ 配料预制计划',
    columns: ['code:计划编号', 'name:预制品名称', 'materials:所需原料', 'quantity:预制数量', 'duration:预制耗时',
      'store_name:负责门店:tag', 'plan_time:计划时间', 'status:状态:tag'],
    form: ['section:计划信息', 'code:计划编号', 'name:预制品名称', 'quantity:预制数量',
      'duration:预制耗时', 'store_id:负责门店:fk:stores', 'plan_time:计划时间',
      'status:状态:select:待执行,进行中,已完成',
      'section:预制配料（仅可从库存管理中选取）',
      'materials:预制配料:prepmaterials'],
  },
  expiry: {
    title: '⏰ 效期监控列表',
    columns: ['batch_no:批次号', 'ingredient_name:物料名称:tag', 'production_date:生产日期', 'shelf_life:保质期',
      'expiry_date:到期日期', 'batch_qty:批次数量', 'remaining_qty:剩余数量', 'location:存放位置', 'status:状态:tag'],
    form: ['batch_no:批次号', 'ingredient_id:物料:fk:ingredients', 'production_date:生产日期', 'shelf_life:保质期',
      'expiry_date:到期日期', 'batch_qty:批次数量:number', 'remaining_qty:剩余数量:number',
      'location:存放位置', 'status:状态:select:正常,关注,警告,紧急,已过期'],
  },
  logistics: {
    title: '🚚 物流订单列表',
    columns: ['code:物流单号', 'supplier_name:供应商:tag', 'warehouse:发货仓库', 'store_name:目的门店:tag',
      'details:物料明细', 'total_weight:总重量', 'logistics_company:物流公司', 'ship_date:发货日期',
      'eta:预计到达', 'actual_arrival:实际到达', 'status:状态:tag'],
    form: ['code:物流单号', 'supplier_id:供应商:fk:suppliers', 'warehouse:发货仓库', 'store_id:目的门店:fk:stores',
      'details:物料明细', 'total_weight:总重量', 'logistics_company:物流公司', 'ship_date:发货日期',
      'eta:预计到达', 'actual_arrival:实际到达', 'status:状态:select:待发货,运输中,已签收,已退货'],
  },
  purchase_orders: {
    title: '📋 叫货管理',
    columns: ['code:叫货单号', 'store_name:叫货门店', 'supplier_name:供应商', 'items_summary:物料摘要',
      'total_amount:金额:money', 'status:状态:tag', 'approve_note:备注'],
    form: ['code:叫货单号', 'store_id:叫货门店:fk:stores', 'supplier_id:供应商:fk:suppliers',
      'items:叫货明细:poitems', 'total_amount:总金额:number', 'status:状态:select:待审核,已拒绝,已通过,已发货,已签收',
      'approve_note:审批备注'],
  },
};

// 解析列/表单字段定义串
function parseDef(def) {
  return def.split(':').map(s => s.trim());
}

/* ============ 通用 CRUD 页面 ============ */
const state = { entity: null, page: 1, search: '', filters: {} };

async function renderCrud(entity) {
  const cfg = ENTITY_CONFIG[entity];
  state.entity = entity; state.page = 1; state.search = ''; state.filters = {};

  const filterHtml = (cfg.filters || []).map(f => {
    const [key, label, opts] = parseDef(f);
    const options = opts ? opts.split(',').map(o => `<option value="${o}">${o}</option>`).join('') : '';
    return `<select id="filter-${key}" style="padding:6px 12px;border:1px solid var(--border);border-radius:6px;font-size:13px;">
      <option value="">${label}：全部</option>${options}</select>`;
  }).join(' ');

  const isIngredient = entity === 'ingredients';
  const html = `
    <div class="panel">
      <div class="panel-header">
        <h3>${cfg.title}</h3>
        <div class="btn-group">
          <div class="search-bar"><input id="searchInput" placeholder="搜索关键字..."></div>
          ${filterHtml}
          ${isIngredient ? `
          <button class="btn btn-outline btn-sm" onclick="downloadIngredientTemplate()">⬇ 导入模板</button>
          <button class="btn btn-outline btn-sm" onclick="document.getElementById('ingImportFile').click()">⬆ 导入Excel</button>
          <input type="file" id="ingImportFile" accept=".xlsx,.csv" style="display:none" onchange="importIngredients(this)">
          <button class="btn btn-outline btn-sm" onclick="exportIngredients()">⬇ 导出</button>` : ''}
          <button class="btn btn-primary btn-sm" onclick="${entity === 'purchase_orders' ? 'renderPOCreate()' : `openForm('${entity}')`}">+ 新增</button>
        </div>
      </div>
      <div class="panel-body">
        <div class="table-wrap"><table>
          <thead><tr id="headRow"></tr></thead>
          <tbody id="tbody"><tr><td colspan="20" class="loading">加载中...</td></tr></tbody>
        </table></div>
        <div class="pagination" id="pager"></div>
      </div>
    </div>`;
  document.getElementById('contentArea').innerHTML = html;

  // 表头
  const cols = cfg.columns.map(parseDef);
  document.getElementById('headRow').innerHTML =
    cols.map(c => `<th>${c[1]}</th>`).join('') + '<th>操作</th>';

  // 事件绑定
  const searchInput = document.getElementById('searchInput');
  let timer;
  searchInput.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => { state.search = e.target.value; state.page = 1; loadData(); }, 300);
  });
  (cfg.filters || []).forEach(f => {
    const [key] = parseDef(f);
    document.getElementById('filter-' + key).addEventListener('change', e => {
      state.filters[key] = e.target.value; state.page = 1; loadData();
    });
  });

  await loadData();
}

/* ============ 配料管理：银豹式导入模板 / 导入 / 导出 ============ */
window.downloadIngredientTemplate = function () {
  window.open(API_BASE + '/api/ingredients/template');
};

window.importIngredients = async function (input) {
  const file = input.files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append('file', file);
  try {
    const res = await fetch(API_BASE + '/api/ingredients/import', { method: 'POST', body: fd });
    const j = await res.json();
    if (!res.ok) throw new Error(j.detail || '导入失败');
    let msg = `导入完成：新增 ${j.created} 条`;
    if (j.skipped) msg += `，跳过 ${j.skipped} 条`;
    if (j.errors && j.errors.length) msg += '；' + j.errors.slice(0, 3).join('；');
    toast(msg);
    input.value = '';
    if (state.entity === 'ingredients') loadData();
  } catch (e) { toast(e.message); input.value = ''; }
};

window.exportIngredients = function () {
  window.open(API_BASE + '/api/ingredients/export');
};

async function loadData() {
  const entity = state.entity;
  const cfg = ENTITY_CONFIG[entity];
  const params = { search: state.search, page: state.page, ...state.filters };
  let data;
  try {
    const res = await apiGet(entity, params);
    data = res.items;
    state._total = res.total;
  } catch (e) { toast(e.message); return; }

  if (isMobile()) {
    renderMobileCards(data, cfg, entity);
    renderPager(data.length);
    return;
  }

  const cols = cfg.columns.map(parseDef);
  const tbody = document.getElementById('tbody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="${cols.length + 1}" class="empty">暂无数据，点击「+ 新增」添加记录</td></tr>`;
  } else {
    tbody.innerHTML = data.map(row => {
      const tds = cols.map(c => {
        const [key, , mod] = c;
        let val = row[key];
        if (state.entity === 'units' && key === 'conversion') {
          const f = Number(row.factor || 0);
          return `<td>1 ${escapeHtml(row.symbol || '')} = ${f} ${escapeHtml(row.base_unit || '')}</td>`;
        }
        if (state.entity === 'prep' && key === 'materials') return `<td>${renderPrepMaterials(val)}</td>`;
        if (key === 'items_summary') return `<td>${renderPOItemsSummary(row.items)}</td>`;
        if (mod === 'tag') return `<td>${val ? tag(val) : '—'}</td>`;
        if (mod === 'money') return `<td>${fmtMoney(val)}</td>`;
        return `<td>${escapeHtml(val ?? '—')}</td>`;
      }).join('');
      return `<tr>${tds}
        <td><div class="btn-group">
          ${state.entity === 'purchase_orders' ? renderPOActions(row, entity) : `
            <button class="btn btn-outline btn-sm" onclick="openForm('${entity}', ${row.id})">编辑</button>
            <button class="btn btn-danger btn-sm" onclick="delItem('${entity}', ${row.id})">删除</button>`}
        </div></td></tr>`;
    }).join('');
  }
  renderPager(data.length);
}

function renderPager(count) {
  const totalPages = Math.max(1, Math.ceil((state._total || count) / 200));
  const cur = state.page;
  let p = '';
  p += `<button ${cur <= 1 ? 'disabled' : ''} onclick="goPage(${cur - 1})">‹</button>`;
  for (let i = 1; i <= Math.min(totalPages, 5); i++)
    p += `<button class="${i === cur ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  if (totalPages > 5) p += `<button disabled>…</button><button onclick="goPage(${totalPages})">${totalPages}</button>`;
  p += `<button ${cur >= totalPages ? 'disabled' : ''} onclick="goPage(${cur + 1})">›</button>`;
  document.getElementById('pager').innerHTML = p;
}
function goPage(p) { state.page = p; loadData(); }

/* ============ 新增 / 编辑 表单弹窗（银豹式：分组 + 开关 + 毛利率） ============ */
async function openForm(entity, id, preset) {
  const cfg = ENTITY_CONFIG[entity];
  let data = {};
  if (id) { try { data = await api('/api/' + entity + '/' + id); } catch (e) { toast(e.message); return; } }
  if (!id && preset) Object.assign(data, preset);

  const fkSources = [];
  const formHtml = cfg.form.map(def => {
    const [key, label, type, extra] = parseDef(def);

    // 分组标题
    if (key === 'section') {
      return `<div class="form-section"><div class="form-section-title">${escapeHtml(label)}</div></div>`;
    }
    // 毛利率展示（只读，随进价/售价实时计算）
    if (type === 'margin') {
      const cost = parseFloat(data.cost_price) || 0;
      const sale = parseFloat(data.sale_price) || 0;
      const gm = sale > 0 ? ((sale - cost) / sale * 100).toFixed(2) + '%' : '0.00%';
      return `<div class="form-group margin-box"><div>
          <label>毛利率（自动计算）</label>
          <div class="margin-hint">公式：毛利率 = (售价 − 进价) ÷ 售价</div>
        </div><div class="margin-val" id="grossMargin">${gm}</div></div>`;
    }
    // 开关（启用状态带 启用/禁用 文案；其余为布尔）
    if (type === 'switch') {
      let onVal = true, offVal = false, onLabel = '开启', offLabel = '关闭';
      if (extra) {
        const parts = extra.split(',');
        onVal = parts[0]; offVal = parts[1]; onLabel = parts[0]; offLabel = parts[1];
      }
      const checked = extra ? (data[key] === onVal) : !!data[key];
      return `<div class="form-group switch-group">
        <label>${label}</label>
        <label class="switch"><input type="checkbox" data-key="${key}" data-type="switch"
          data-on='${JSON.stringify(onVal)}' data-off='${JSON.stringify(offVal)}' ${checked ? 'checked' : ''}>
          <span class="slider"></span></label>
        <span class="sw-label" id="sw-${key}">${checked ? onLabel : offLabel}</span>
      </div>`;
    }
    // 下拉
    if (type === 'select') {
      const opts = extra.split(',');
      const curVal = (data[key] === undefined || data[key] === null || data[key] === '') ? null : String(data[key]);
      const ctrl = `<select data-key="${key}">` + opts.map(o => `<option value="${o}" ${curVal === o ? 'selected' : ''}>${o}</option>`).join('') + `</select>`;
      return `<div class="form-group"><label>${label}</label>${ctrl}</div>`;
    }
    // 外键
    if (type === 'fk') {
      fkSources.push({ key, source: extra, value: data[key] });
      const ctrl = `<select data-key="${key}" data-fk="1"><option value="">加载中...</option></select>`;
      return `<div class="form-group"><label>${label}</label>${ctrl}</div>`;
    }
    // 预制配料：仅从库存管理中已登记的配料选取
    if (type === 'prepmaterials') {
      return `<div class="form-group prep-mat-group" style="grid-column:1 / -1">
        <label>${label}</label>
        <div class="prep-mat-box" id="prepMatBox"><div class="loading">正在从库存管理加载配料...</div></div>
        <input type="hidden" data-key="${key}" id="prepMaterialsVal" value="${escapeHtml(data[key] ?? '')}">
      </div>`;
    }
    // 配料类别上级（按级别过滤可选父级）
    if (type === 'catparent') {
      return `<div class="form-group"><label>${label}</label>
        <select data-key="${key}" data-type="catparent" id="catParentSel"><option value="0">（无上级 / 顶级）</option></select></div>`;
    }
    // 配料类别三级联选（一级→二级→三级），保存叶子名称
    if (type === 'cat3') {
      return `<div class="form-group" style="grid-column:1 / -1">
        <label>${label}</label>
        <div class="cat3-wrap">
          <select class="cat3-sel" data-lvl="1" id="cat3-1"><option value="">一级分类</option></select>
          <span class="cat3-sep">›</span>
          <select class="cat3-sel" data-lvl="2" id="cat3-2" disabled><option value="">二级分类</option></select>
          <span class="cat3-sep">›</span>
          <select class="cat3-sel" data-lvl="3" id="cat3-3" disabled><option value="">三级分类</option></select>
          <input type="hidden" data-key="${key}" id="cat3Val" value="${escapeHtml(data[key] ?? '')}">
        </div></div>`;
    }
    // 普通输入
    const t = type === 'number' ? 'number' : (type === 'password' ? 'password' : 'text');
    const val = (data[key] ?? '');
    const numAttr = type === 'number' ? ' step="any"' : '';
    const ctrl = `<input type="${t}"${numAttr} data-key="${key}" value="${escapeHtml(val)}">`;
    return `<div class="form-group"><label>${label}</label>${ctrl}</div>`;
  }).join('');

  const width = (entity === 'ingredients' || entity === 'prep') ? 820 : 680;
  showModal((id ? '编辑' : '新增') + cfg.title.replace(/[🏭🏢🏪👤🧂📦📉⚙️⏰🚚]\s*/, ''),
    `<div class="form-row">${formHtml}</div>`,
    async () => {
      const payload = {};
      document.querySelectorAll('#modalContent [data-key]').forEach(el => {
        const k = el.dataset.key;
        if (el.dataset.type === 'switch') {
          const on = JSON.parse(el.dataset.on), off = JSON.parse(el.dataset.off);
          payload[k] = el.checked ? on : off;
        } else if (el.type === 'number') {
          payload[k] = el.value === '' ? null : Number(el.value);
        } else if (el.dataset.fk) {
          payload[k] = el.value === '' ? null : Number(el.value);
        } else {
          payload[k] = el.value;
        }
      });
      // 配料类别整数字段强转 + 名称必填
      if (entity === 'categories') {
        ['level', 'parent_id', 'sort'].forEach(k => {
          if (payload[k] !== undefined && payload[k] !== '') payload[k] = Number(payload[k]);
        });
        if (!payload.name || !String(payload.name).trim()) { toast('请输入分类名称'); return; }
      }
      try {
        if (id) await apiUpdate(entity, id, payload);
        else await apiCreate(entity, payload);
        toast(id ? '更新成功' : '新增成功');
        closeModal();
        if (entity === 'categories') renderCategories();
        else loadData();
      } catch (e) { toast(e.message); }
    });

  // 毛利率实时联动
  const costEl = document.querySelector('#modalContent [data-key="cost_price"]');
  const saleEl = document.querySelector('#modalContent [data-key="sale_price"]');
  const syncGross = () => {
    const gmEl = document.getElementById('grossMargin');
    if (!gmEl) return;
    const cost = parseFloat(costEl.value) || 0;
    const sale = parseFloat(saleEl.value) || 0;
    if (sale <= 0) { gmEl.textContent = '0.00%'; gmEl.className = 'margin-val'; return; }
    const r = (sale - cost) / sale * 100;
    gmEl.textContent = r.toFixed(2) + '%';
    gmEl.className = 'margin-val ' + (r < 0 ? 'neg' : 'pos');
  };
  if (costEl) costEl.addEventListener('input', syncGross);
  if (saleEl) saleEl.addEventListener('input', syncGross);

  // 开关文案联动
  document.querySelectorAll('#modalContent [data-type="switch"]').forEach(sw => {
    sw.addEventListener('change', () => {
      const lbl = document.getElementById('sw-' + sw.dataset.key);
      if (lbl) lbl.textContent = sw.checked ? JSON.parse(sw.dataset.on) : JSON.parse(sw.dataset.off);
    });
  });

  // 加载外键选项
  for (const fk of fkSources) {
    try {
      const res = await apiGet(fk.source);
      const sel = document.querySelector(`#modalContent select[data-key="${fk.key}"]`);
      sel.innerHTML = `<option value="">请选择</option>` +
        res.items.map(it => `<option value="${it.id}" ${String(it.id) === String(fk.value) ? 'selected' : ''}>${escapeHtml(it.name)}</option>`).join('');
    } catch (e) { toast('加载关联数据失败: ' + e.message); }
  }

  // 预制配料：从库存管理加载可选取的配料
  if (entity === 'prep') {
    loadPrepMats();
  }
  // 配料类别：加载可选父级（按级别过滤），带入预设 parent_id
  if (entity === 'categories') {
    loadCatParent(data.parent_id);
  }
  // 配料：三级分类联选
  if (entity === 'ingredients') {
    loadCat3();
  }
}

/* 预制配料多选（数据源：库存管理 inventory） */
async function loadPrepMats() {
  const box = document.getElementById('prepMatBox');
  if (!box) return;
  let inv;
  try { inv = (await apiGet('inventory')).items; }
  catch (e) { box.innerHTML = `<div class="empty">加载库存配料失败：${escapeHtml(e.message)}</div>`; return; }
  let sel = [];
  try { sel = JSON.parse(document.getElementById('prepMaterialsVal').value || '[]'); } catch (e) { sel = []; }
  if (!Array.isArray(sel)) sel = [];
  const selMap = {};
  sel.forEach(s => { selMap[s.i] = s.q; });
  if (!inv.length) {
    box.innerHTML = `<div class="empty">库存管理中暂无已登记配料，请先在「库存管理」录入。</div>`;
    return;
  }
  box.innerHTML = `<div class="prep-mat-hint">仅可从「库存管理」中已登记的配料里选择；括号内为当前库存实时数据。</div>
    <div class="prep-mat-list">` + inv.map(it => {
      const iid = it.ingredient_id;
      const checked = String(iid) in selMap;
      const q = checked ? selMap[iid] : '';
      const st = it.status || '正常';
      return `<div class="prep-mat-row">
        <label class="switch sm"><input type="checkbox" class="pm-chk" data-i="${iid}" data-n="${escapeHtml(it.ingredient_name || '')}" ${checked ? 'checked' : ''}><span class="slider"></span></label>
        <span class="pm-name">${escapeHtml(it.ingredient_name || '')}</span>
        <span class="pm-stock tag ${tagClass(st)}">${escapeHtml(st)} · 库存 ${Number(it.current_stock || 0)}</span>
        <input type="number" class="pm-qty" data-i="${iid}" placeholder="用量" value="${escapeHtml(q)}" step="any" ${checked ? '' : 'disabled'}>
      </div>`;
    }).join('') + `</div>
    <div class="prep-mat-foot">已选 <b id="pmCount">${sel.length}</b> 种配料</div>`;
  box.querySelectorAll('.pm-chk').forEach(chk => {
    chk.addEventListener('change', () => {
      const qty = box.querySelector('.pm-qty[data-i="' + chk.dataset.i + '"]');
      qty.disabled = !chk.checked;
      if (chk.checked && qty.value === '') qty.value = 1;
      rebuildPrepMats();
    });
  });
  box.querySelectorAll('.pm-qty').forEach(q => q.addEventListener('input', rebuildPrepMats));
  rebuildPrepMats();
}

/* 叫货单物料摘要渲染 */
function renderPOItemsSummary(itemsJson) {
  if (!itemsJson) return '—';
  let arr;
  try { arr = JSON.parse(itemsJson); } catch (e) { return escapeHtml(itemsJson); }
  if (!Array.isArray(arr) || !arr.length) return '—';
  return arr.map(x => `${escapeHtml(x.n || '')}×${x.q}${escapeHtml(x.u || '')}`).join('，');
}

/* 叫货单操作按钮渲染 */
function renderPOActions(row, entity) {
  const status = row.status;
  const btns = [];
  if (status === '待审核') {
    btns.push(`<button class="btn btn-primary btn-sm" onclick="poAction('approve',${row.id})">通过</button>`);
    btns.push(`<button class="btn btn-danger btn-sm" onclick="poAction('reject',${row.id})">拒绝</button>`);
  }
  if (status === '已通过') {
    btns.push(`<button class="btn btn-primary btn-sm" onclick="poAction('ship',${row.id})">发货</button>`);
  }
  if (status === '已发货') {
    btns.push(`<button class="btn btn-success btn-sm" onclick="poAction('receive',${row.id})">签收</button>`);
  }
  btns.push(`<button class="btn btn-outline btn-sm" onclick="openForm('${entity}',${row.id})">详情</button>`);
  return btns.join('');
}

window.poAction = async function (action, id) {
  if (action === 'reject') {
    const note = prompt('请输入拒绝原因：');
    if (note === null) return;
    try {
      await api('/api/purchase-orders/' + id + '/reject', { method: 'POST', body: JSON.stringify({ note }) });
      toast('已拒绝'); loadData();
    } catch (e) { toast(e.message); }
    return;
  }
  if (action === 'approve') {
    if (!confirm('确认通过该叫货单？')) return;
    try {
      await api('/api/purchase-orders/' + id + '/approve', { method: 'POST', body: JSON.stringify({}) });
      toast('已通过'); loadData();
    } catch (e) { toast(e.message); }
    return;
  }
  if (action === 'ship') {
    showModal('🚚 发货信息', `
      <div class="form-group"><label>物流公司</label><input id="shipCompany" placeholder="顺丰物流"></div>
      <div class="form-group"><label>发货仓库</label><input id="shipWarehouse" placeholder="杭州总仓"></div>
      <div class="form-group"><label>总重量</label><input id="shipWeight" placeholder="210 kg"></div>
      <div class="form-group"><label>预计到达日期</label><input id="shipEta" placeholder="07-20"></div>`,
      async () => {
        try {
          const payload = {
            logistics_company: document.getElementById('shipCompany').value,
            warehouse: document.getElementById('shipWarehouse').value,
            total_weight: document.getElementById('shipWeight').value,
            eta: document.getElementById('shipEta').value,
          };
          await api('/api/purchase-orders/' + id + '/ship', { method: 'POST', body: JSON.stringify(payload) });
          toast('发货成功，总仓库存已扣减'); closeModal(); loadData();
        } catch (e) { toast(e.message); }
      });
    return;
  }
  if (action === 'receive') {
    if (!confirm('确认签收该批货物？签收后门店库存将自动增加。')) return;
    try {
      await api('/api/purchase-orders/' + id + '/receive', { method: 'POST' });
      toast('签收成功，门店库存已更新'); loadData();
    } catch (e) { toast(e.message); }
    return;
  }
};

/* 叫货单新建：选择供应商 → 选择配料 → 填数量 */
async function renderPOCreate() {
  const me = currentUser;
  let suppliers = [], ingredients = [], inventory = [], stores = [];
  try {
    const [sRes, iRes, invRes, stRes] = await Promise.all([
      apiGet('suppliers', { page_size: 500 }),
      apiGet('ingredients', { page_size: 500 }),
      apiGet('inventory', { page_size: 500 }),
      apiGet('stores', { page_size: 500 }),
    ]);
    suppliers = sRes.items;
    ingredients = iRes.items;
    inventory = invRes.items;
    stores = stRes.items;
  } catch (e) { toast(e.message); return; }

  // 默认门店：当前用户关联的门店
  const defaultStoreId = me.related_id && (me.role === 'store' || me.role === 'staff') ? me.related_id : '';

  const html = `
    <div class="panel"><div class="panel-header"><h3>📋 新建叫货单</h3></div>
    <div class="panel-body">
      <div class="form-group"><label>叫货门店</label>
        <select id="poStore" onchange="loadPOStockAlerts()"><option value="">请选择</option>
          ${stores.map(s => `<option value="${s.id}" ${String(defaultStoreId) === String(s.id) ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}
        </select></div>

      <!-- 库存预警提醒区域 -->
      <div id="poStockAlerts" style="margin:12px 0;"></div>

      <div class="form-group"><label>供应商</label>
        <select id="poSupplier" onchange="loadPOSupplierIngredients()"><option value="">请选择</option>
          ${suppliers.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')}
        </select></div>
      <div id="poItemsBox"></div>
    </div>
    <div style="padding:12px 20px;border-top:1px solid var(--border);text-align:right;">
      <button class="btn btn-outline" onclick="navigate('purchase_orders','叫货管理')">取消</button>
      <button class="btn btn-primary" onclick="submitPO()">提交叫货单</button>
    </div></div>`;
  document.getElementById('contentArea').innerHTML = html;

  stores_cache = stores;
  window._poIngredients = ingredients;
  window._poInventory = inventory;
  // 初始加载库存预警
  setTimeout(() => loadPOStockAlerts(), 200);
}

/* 加载选中门店的库存预警 */
window.loadPOStockAlerts = async function () {
  const box = document.getElementById('poStockAlerts');
  if (!box) return;
  const storeId = Number(document.getElementById('poStore').value);
  if (!storeId) { box.innerHTML = ''; return; }

  // 获取该门店库存 + 总仓库存
  let invData = window._poInventory || [];
  if (!invData.length) {
    try { invData = (await apiGet('inventory', { page_size: 500 })).items; window._poInventory = invData; } catch { return; }
  }
  // 筛选该门店库存 + 总仓中低于安全库存的
  const alerts = invData.filter(inv => {
    const isStore = (inv.store_id === storeId || inv.store_id === null);
    if (!isStore) return false;
    const stock = inv.current_stock || 0;
    const safety = inv.safety_stock || 0;
    return stock < safety || inv.status === '库存不足' || inv.status === '低于安全库存';
  });

  if (!alerts.length) {
    box.innerHTML = '<div style="padding:10px 14px;background:#e6f9f0;border-radius:8px;font-size:13px;color:#00b894;">✅ 当前库存充足，无需叫货</div>';
    return;
  }

  const ings = window._poIngredients || [];
  box.innerHTML = `
    <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:12px 14px;margin-bottom:8px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;">
        <b style="color:#f39c12;font-size:13px;">⚠️ 库存预警提醒（${alerts.length} 项低于安全库存）</b>
        <button class="btn btn-primary btn-sm" onclick="addAllAlertsToPO()" style="font-size:11px;padding:4px 10px;">一键添加到叫货单</button>
      </div>
      ${alerts.map(a => {
        const ing = ings.find(i => i.id === a.ingredient_id) || {};
        const stock = a.current_stock || 0;
        const safety = a.safety_stock || 0;
        const suggest = Math.max(0, safety * 2 - stock); // 建议补到安全库存2倍
        const loc = a.store_id ? '门店库存' : '总仓';
        return `<div class="po-alert-item" data-i="${a.ingredient_id}" data-n="${escapeHtml(ing.name||'')}" data-u="${escapeHtml(ing.unit||'')}" data-q="${suggest}" data-sid="${ing.supplier_id||''}"
          style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid #fef3cd;font-size:12px;">
          <span style="flex:1;">📦 ${escapeHtml(ing.name||'配料#'+a.ingredient_id)} <span style="color:#888;">(${loc})</span></span>
          <span style="color:#e17055;white-space:nowrap;">库存 ${stock} / 安全 ${safety}</span>
          <span style="color:#636e72;white-space:nowrap;">建议补 ${suggest.toFixed(0)} ${escapeHtml(ing.unit||'')}</span>
          <button class="btn btn-outline btn-sm" onclick="addAlertToPO(this)" style="font-size:11px;padding:2px 8px;">+ 添加</button>
        </div>`;
      }).join('')}
    </div>`;
};

/* 单条预警添加到叫货清单 */
window.addAlertToPO = function (btn) {
  const item = btn.closest('.po-alert-item');
  const i = item.dataset.i, n = item.dataset.n, u = item.dataset.u, q = item.dataset.q, sid = item.dataset.sid;
  // 自动选择对应供应商
  if (sid) {
    const sel = document.getElementById('poSupplier');
    if (sel && sel.value !== sid) { sel.value = sid; loadPOSupplierIngredients(); }
  }
  // 延迟填充数量（等配料列表加载）
  setTimeout(() => {
    const qtyInput = document.querySelector(`.po-qty[data-i="${i}"]`);
    if (qtyInput) { qtyInput.value = parseFloat(q).toFixed(1); qtyInput.style.background = '#fffde7'; }
  }, 300);
  // 标记已添加
  item.style.opacity = '0.4';
  btn.textContent = '✓ 已添加'; btn.disabled = true;
};

/* 一键全部添加到叫货单 */
window.addAllAlertsToPO = function () {
  document.querySelectorAll('.po-alert-item button:not([disabled])').forEach(btn => addAlertToPO(btn));
};

window.loadPOSupplierIngredients = function () {
  const sid = Number(document.getElementById('poSupplier').value);
  if (!sid) { document.getElementById('poItemsBox').innerHTML = ''; return; }
  const ings = (window._poIngredients || []).filter(ing => ing.supplier_id === sid);
  if (!ings.length) {
    document.getElementById('poItemsBox').innerHTML = '<div class="empty">该供应商暂无配料</div>'; return;
  }
  document.getElementById('poItemsBox').innerHTML = `
    <label style="margin-top:12px;display:block;font-weight:600;">叫货配料</label>
    ${ings.map(ing => `
      <div style="display:flex;align-items:center;gap:8px;margin:8px 0;padding:8px;background:#fafbfc;border-radius:6px;">
        <span style="flex:1;font-size:13px;">${escapeHtml(ing.name)} (${escapeHtml(ing.unit||'')})</span>
        <input type="number" class="po-qty" data-i="${ing.id}" data-n="${escapeHtml(ing.name)}" data-u="${escapeHtml(ing.unit||'')}" placeholder="数量" style="width:80px;" min="0" step="any">
      </div>`).join('')}`;
};

window.submitPO = async function () {
  const storeId = Number(document.getElementById('poStore').value);
  const supplierId = Number(document.getElementById('poSupplier').value);
  if (!storeId || !supplierId) { toast('请选择门店和供应商'); return; }
  const items = [];
  document.querySelectorAll('.po-qty').forEach(el => {
    const q = parseFloat(el.value) || 0;
    if (q > 0) items.push({ i: Number(el.dataset.i), n: el.dataset.n, q, u: el.dataset.u || '' });
  });
  if (!items.length) { toast('请至少填写一种配料的叫货数量'); return; }
  try {
    await apiCreate('purchase_orders', {
      store_id: storeId, supplier_id: supplierId,
      items: JSON.stringify(items), status: '待审核',
    });
    toast('叫货单已提交');
    navigate('purchase_orders', '叫货管理');
  } catch (e) { toast(e.message); }
};

function rebuildPrepMats() {
  const box = document.getElementById('prepMatBox');
  if (!box) return;
  const items = [];
  box.querySelectorAll('.pm-chk:checked').forEach(chk => {
    const q = parseFloat(box.querySelector('.pm-qty[data-i="' + chk.dataset.i + '"]').value) || 0;
    items.push({ i: Number(chk.dataset.i), n: chk.dataset.n, q });
  });
  const val = document.getElementById('prepMaterialsVal');
  if (val) val.value = JSON.stringify(items);
  const c = document.getElementById('pmCount');
  if (c) c.textContent = items.length;
}

/* 预制配料列展示（解析 materials JSON） */
function renderPrepMaterials(v) {
  if (!v) return '—';
  let arr;
  try { arr = JSON.parse(v); } catch (e) { return escapeHtml(v); }
  if (!Array.isArray(arr) || !arr.length) return '—';
  const names = arr.map(x => `${escapeHtml(x.n || ('配料#' + x.i))}×${Number(x.q || 0)}`).join('，');
  return `${names} <span class="muted">(${arr.length}种)</span>`;
}

/* ============ 配料类别：三级分类树 ============ */
async function renderCategories() {
  let cats = [];
  try { cats = (await apiGet('categories', { page_size: 500 })).items; }
  catch (e) { toast(e.message); return; }
  const childrenOf = pid => cats.filter(c => (c.parent_id || 0) === pid);
  const root = childrenOf(0);
  const lvlText = l => l === 1 ? '一级' : l === 2 ? '二级' : '三级';
  function nodeHtml(c, depth) {
    const kids = childrenOf(c.id);
    const h = `<div class="cat-node" style="margin-left:${depth * 26}px">
      <span class="cat-dot lvl${c.level}"></span>
      <b class="cat-name">${escapeHtml(c.name)}</b>
      <span class="tag tag-default">${lvlText(c.level)}</span>
      <span class="cat-code">${escapeHtml(c.code || '')}</span>
      <span class="cat-actions">
        <button class="btn btn-outline btn-sm" onclick="openForm('categories', ${c.id})">编辑</button>
        ${c.level < 3 ? `<button class="btn btn-outline btn-sm" onclick="openForm('categories', null, {level:${c.level + 1}, parent_id:${c.id}})">+ 子级</button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="delItem('categories', ${c.id})">删除</button>
      </span>
    </div>`;
    return h + (kids.length ? `<div class="cat-children">` + kids.map(k => nodeHtml(k, depth + 1)).join('') + `</div>` : '');
  }
  const html = `<div class="panel"><div class="panel-header"><h3>🗂️ 配料类别（三级分类设置）</h3>
      <div class="btn-group"><button class="btn btn-primary btn-sm" onclick="openForm('categories', null, {level:1, parent_id:0})">+ 新增一级分类</button></div></div>
    <div class="panel-body">${root.length ? root.map(c => nodeHtml(c, 0)).join('') : '<div class="empty">暂无分类，点击「+ 新增一级分类」开始</div>'}</div></div>`;
  document.getElementById('contentArea').innerHTML = html;
}

/* 配料类别表单：按级别过滤可选父级 */
async function loadCatParent(presetParent) {
  const sel = document.getElementById('catParentSel');
  if (!sel) return;
  const lvlEl = document.querySelector('#modalContent [data-key="level"]');
  const lvl = lvlEl ? Number(lvlEl.value || 1) : 1;
  const cur = (presetParent !== undefined && presetParent !== null && presetParent !== '')
    ? String(presetParent)
    : ((document.querySelector('#modalContent [data-key="parent_id"]') || {}).value || '0');
  let cats = [];
  try { cats = (await apiGet('categories', { page_size: 500 })).items; } catch (e) { return; }
  const valid = cats.filter(c => c.level === lvl - 1);
  sel.innerHTML = '<option value="0">（无上级 / 顶级）</option>' +
    valid.map(c => `<option value="${c.id}" ${String(c.id) === String(cur) ? 'selected' : ''}>${escapeHtml(c.name)}</option>`).join('');
  if (lvlEl && !lvlEl.dataset.bound) { lvlEl.dataset.bound = '1'; lvlEl.addEventListener('change', loadCatParent); }
}

/* 配料表单：三级分类联选（一级›二级›三级），保存叶子名称 */
async function loadCat3() {
  const s1 = document.getElementById('cat3-1');
  if (!s1) return;
  const s2 = document.getElementById('cat3-2');
  const s3 = document.getElementById('cat3-3');
  const val = document.getElementById('cat3Val');
  if (!s2 || !s3 || !val) return;
  let cats = [];
  try { cats = (await apiGet('categories', { page_size: 500 })).items; } catch (e) { return; }
  const byId = {}; cats.forEach(c => byId[c.id] = c);
  const childrenOf = pid => { pid = Number(pid); return cats.filter(c => (c.parent_id || 0) === pid); };
  const l1 = childrenOf(0);
  s1.innerHTML = '<option value="">一级分类</option>' + l1.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  const fill2 = (pid) => {
    const kids = childrenOf(pid);
    s2.innerHTML = '<option value="">二级分类</option>' + kids.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    s2.disabled = !kids.length;
    if (!kids.length) { s3.innerHTML = '<option value="">三级分类</option>'; s3.disabled = true; }
  };
  const fill3 = (pid) => {
    const kids = childrenOf(pid);
    s3.innerHTML = '<option value="">三级分类</option>' + kids.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
    s3.disabled = !kids.length;
  };
  const update = () => { val.value = s3.value ? (byId[s3.value] ? byId[s3.value].name : '') : ''; };
  s1.addEventListener('change', () => {
    if (!s1.value) { s2.innerHTML = '<option value="">二级分类</option>'; s2.disabled = true; s3.innerHTML = '<option value="">三级分类</option>'; s3.disabled = true; update(); return; }
    fill2(s1.value); s3.innerHTML = '<option value="">三级分类</option>'; s3.disabled = true; update();
  });
  s2.addEventListener('change', () => {
    if (!s2.value) { s3.innerHTML = '<option value="">三级分类</option>'; s3.disabled = true; }
    else fill3(s2.value);
    update();
  });
  s3.addEventListener('change', update);
  // 预选：依据已存叶子名称
  if (val.value) {
    const leaf = cats.find(c => c.name === val.value && c.level === 3);
    if (leaf) {
      const p2 = byId[leaf.parent_id]; const p1 = p2 ? byId[p2.parent_id] : null;
      if (p1) s1.value = p1.id;
      fill2(p1 ? p1.id : 0);
      if (p2) s2.value = p2.id;
      fill3(p2 ? p2.id : 0);
      s3.value = leaf.id;
    }
  }
}

async function delItem(entity, id) {
  if (!confirm('确定删除该记录？此操作不可恢复。')) return;
  try {
    await apiDelete(entity, id);
    toast('删除成功');
    if (entity === 'categories') renderCategories();
    else loadData();
  } catch (e) { toast(e.message); }
}

/* ============ Modal ============ */
function showModal(title, bodyHtml, onConfirm, width) {
  const w = isMobile() ? '100%' : (width || 680);
  const wStyle = isMobile() ? 'width:100%' : `width:${w}px`;
  const overlay = document.getElementById('modalOverlay');
  document.getElementById('modalContent').innerHTML = `
    <div class="modal" style="${wStyle}">
    <div class="modal-header"><h3>${escapeHtml(title)}</h3><button class="modal-close" onclick="closeModal()">✕</button></div>
    <div class="modal-body">${bodyHtml}</div>
    <div class="modal-footer">
      <button class="btn btn-outline" onclick="closeModal()">取消</button>
      <button class="btn btn-primary" id="modalConfirm">确认</button>
    </div></div>`;
  overlay.classList.add('show');
  document.getElementById('modalConfirm').onclick = onConfirm;
}
function closeModal() { document.getElementById('modalOverlay').classList.remove('show'); }
document.getElementById('modalOverlay').addEventListener('click', e => { if (e.target === e.currentTarget) closeModal(); });

/* ============ 仪表盘 ============ */
async function renderDashboard() {
  let ings = [], inv = [], exp = [], logs = [], was = [];
  let expAlerts = { total: 0, items: [] };
  let wasStats = { total: 0, total_quantity: 0, total_amount: 0, by_type: {}, by_ingredient: {}, by_store: {} };
  let invAlerts = { total: 0, items: [] };
  try {
    [ings, inv, exp, logs, was, expAlerts, wasStats, invAlerts] = await Promise.all([
      apiGet('ingredients'), apiGet('inventory'), apiGet('expiry'), apiGet('logistics'), apiGet('wastage'),
      apiGet('expiry/alerts'), apiGet('wastage/stats'), apiGet('inventory/alerts'),
    ]);
  } catch (e) { toast(e.message); }

  const stockTotal = inv.items.reduce((s, r) => s + (Number(r.current_stock) || 0), 0);
  const expWarning = expAlerts.total;
  const wastageAmount = wasStats.total_amount || 0;
  const stockAlertCount = invAlerts.total;

  // 按类别统计库存
  const byCat = {};
  ings.items.forEach(i => {
    const invRow = inv.items.find(v => v.ingredient_id === i.id);
    if (!byCat[i.category]) byCat[i.category] = { sku: 0, stock: 0 };
    byCat[i.category].sku++;
    if (invRow) byCat[i.category].stock += Number(invRow.current_stock) || 0;
  });

  const expRows = (expAlerts.items || []).slice(0, 8).map(r => `<tr>
    <td>${escapeHtml(r.ingredient_name)}</td>
    <td>${escapeHtml(r.batch_no)}</td>
    <td>${escapeHtml(r.expiry_date)}</td>
    <td>${r.days_remaining != null ? (r.days_remaining < 0 ? '已过期' : '剩 ' + r.days_remaining + ' 天') : '-'}</td>
    <td>${tag(r.status)}</td></tr>`).join('') || '<tr><td colspan="5" class="empty">无临期预警</td></tr>';

  const wasTypeRows = Object.entries(wasStats.by_type || {}).map(([t, v]) => `<tr>
    <td>${escapeHtml(t)}</td><td>${Number(v.qty).toFixed(1)}</td><td>${fmtMoney(v.amt)}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">暂无损耗记录</td></tr>';

  const invRows = (invAlerts.items || []).slice(0, 8).map(a => `<tr>
    <td>${escapeHtml(a.ingredient_name)}</td>
    <td>${escapeHtml(a.store_name || '总仓')}</td>
    <td>${Number(a.current_stock).toFixed(0)} / 安全 ${Number(a.safety_stock).toFixed(0)}</td>
    <td>${tag(a.severity)}</td></tr>`).join('') || '<tr><td colspan="4" class="empty">库存均在安全线以上</td></tr>';

  const html = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-icon blue">🧂</div><div class="stat-info"><h3>${ings.total}</h3><p>配料种类总数</p></div></div>
      <div class="stat-card"><div class="stat-icon green">📦</div><div class="stat-info"><h3>${stockTotal.toLocaleString()}</h3><p>库存总量 (kg/L)</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">⚠️</div><div class="stat-info"><h3>${expWarning}</h3><p>临期预警批次</p></div></div>
      <div class="stat-card"><div class="stat-icon red">📉</div><div class="stat-info"><h3>${fmtMoney(wastageAmount)}</h3><p>累计损耗金额</p></div></div>
    </div>
    <div class="grid-2">
      <div class="panel"><div class="panel-header"><h3>📊 库存概览（按类别）</h3></div>
        <div class="panel-body"><table><thead><tr><th>类别</th><th>SKU数</th><th>库存量</th></tr></thead><tbody>
        ${Object.entries(byCat).map(([cat, v]) => `<tr><td>${cat}</td><td>${v.sku}</td><td>${v.stock.toLocaleString()}</td></tr>`).join('') || '<tr><td colspan="3" class="empty">暂无数据</td></tr>'}
        </tbody></table></div></div>
      <div class="panel"><div class="panel-header"><h3>⏰ 效期预警 - 临期物料</h3></div>
        <div class="panel-body"><table><thead><tr><th>物料</th><th>批次号</th><th>到期日</th><th>剩余</th><th>状态</th></tr></thead><tbody>
        ${expRows}
        </tbody></table></div></div>
    </div>
    <div class="grid-2">
      <div class="panel"><div class="panel-header"><h3>📉 损耗统计（按类型）</h3></div>
        <div class="panel-body"><table><thead><tr><th>损耗类型</th><th>数量</th><th>金额</th></tr></thead><tbody>
        ${wasTypeRows}
        </tbody></table>
        <div style="margin-top:10px;font-size:13px;color:var(--text-secondary);">合计：损耗 ${Number(wasStats.total_quantity||0).toFixed(1)}，金额 ${fmtMoney(wasStats.total_amount||0)}（${wasStats.total} 条记录）</div></div></div>
      <div class="panel"><div class="panel-header"><h3>🚨 安全库存预警（${stockAlertCount}）</h3></div>
        <div class="panel-body"><table><thead><tr><th>物料</th><th>门店</th><th>当前/安全</th><th>状态</th></tr></thead><tbody>
        ${invRows}
        </tbody></table></div></div>
    </div>
    <div class="panel"><div class="panel-header"><h3>🚚 最近物流动态</h3></div>
      <div class="panel-body"><table><thead><tr><th>物流单号</th><th>供应商</th><th>目的门店</th><th>物料明细</th><th>发货日期</th><th>预计到达</th><th>状态</th></tr></thead><tbody>
      ${logs.items.slice(0, 5).map(r => `<tr><td>${escapeHtml(r.code)}</td><td>${escapeHtml(r.supplier_name)}</td><td>${escapeHtml(r.store_name)}</td><td>${escapeHtml(r.details)}</td><td>${escapeHtml(r.ship_date)}</td><td>${escapeHtml(r.eta)}</td><td>${tag(r.status)}</td></tr>`).join('') || '<tr><td colspan="7" class="empty">暂无物流</td></tr>'}
      </tbody></table></div></div>`;
  document.getElementById('contentArea').innerHTML = html;
}

/* ============ 系统配置 ============ */
function renderSettings() {
  const html = `
    <div class="grid-2">
      <div class="panel"><div class="panel-header"><h3>🔧 系统参数配置</h3></div><div class="panel-body">
        <div class="form-group" style="margin-bottom:12px;"><label>损耗率预警阈值</label><input value="5%"></div>
        <div class="form-group" style="margin-bottom:12px;"><label>效期预警天数（黄色）</label><input value="30天"></div>
        <div class="form-group" style="margin-bottom:12px;"><label>效期预警天数（红色）</label><input value="7天"></div>
        <div class="form-group" style="margin-bottom:12px;"><label>安全库存系数</label><input value="1.2"></div>
        <div class="form-group" style="margin-bottom:12px;"><label>自动补货触发点</label><input value="安全库存 × 0.8"></div>
        <button class="btn btn-primary" onclick="toast('配置已保存')">保存配置</button>
      </div></div>
      <div class="panel"><div class="panel-header"><h3>📋 操作说明</h3></div><div class="panel-body">
        <p style="font-size:13px;line-height:1.8;color:var(--text-secondary)">
        • 系统涵盖 <b>供应商 / 品牌商 / 门店 / 店员</b> 四大组织角色管理。<br>
        • 核心业务包括 <b>配料、库存、出品损耗、配料预制、效期、物流</b> 六大模块，均已支持增删改查。<br>
        • 所有列表支持 <b>关键字搜索</b> 与 <b>条件筛选</b>。<br>
        • 关联数据（如门店所属品牌、库存对应物料）自动联动显示。<br>
        • 数据持久化于 SQLite 数据库，重启服务不丢失。
        </p>
      </div></div>
    </div>`;
  document.getElementById('contentArea').innerHTML = html;
}

/* ============ 组织架构树（供应商 → 品牌商 → 门店 → 店员） ============ */
async function renderOrgTree() {
  let tree = [];
  try { tree = await api('/org-tree'); } catch (e) { toast(e.message); }
  const colors = { '供应商': '#f4845f', '品牌商': '#7c3aed', '门店': '#00b894', '店员': '#636e72' };
  function nodeHtml(n, depth) {
    const hasChildren = n.children && n.children.length > 0;
    const c = colors[n.type] || '#999';
    const used = hasChildren ? n.children.length : 0;
    const quotaHtml = n.type !== '店员'
      ? `<span style="font-size:12px;color:#888;margin-left:8px;">已授权下级 <b>${used}</b> / 配额 ${n.quota || '不限'}</span>`
      : '';
    const toggleIcon = hasChildren
      ? `<span class="org-toggle" onclick="toggleOrgNode(event,this)">▶</span>`
      : `<span class="org-toggle org-toggle-empty"></span>`;
    let h = `<div class="org-node" data-org-name="${escapeHtml(n.name)}" data-org-type="${n.type}">
      <div class="org-card" onclick="${hasChildren ? `toggleOrgNode(event,this.querySelector('.org-toggle'))` : ''}" style="cursor:${hasChildren?'pointer':'default'}">
        ${toggleIcon}
        <span class="org-dot" style="background:${c}"></span>
        <span class="org-name"><b>${escapeHtml(n.name)}</b></span> <span class="tag tag-default">${n.type}</span> ${quotaHtml}
      </div>`;
    if (hasChildren) {
      h += `<div class="org-children" style="display:none;">` + n.children.map(cn => nodeHtml(cn, depth + 1)).join('') + `</div>`;
    }
    h += `</div>`;
    return h;
  }
  const html = `
    <div class="panel">
      <div class="panel-header">
        <h3>🏗️ 组织架构（供应商 → 品牌商 → 门店 → 店员）</h3>
        <span style="font-size:12px;color:#888;">点击 ▶ 展开下级 | 搜索快速定位节点</span>
      </div>
      <div class="panel-body">
        <style>
          .org-node{margin:3px 0;}
          .org-children{margin-left:22px;padding-left:18px;border-left:2px dashed #e0e0e0;}
          .org-card{padding:9px 14px;background:#fafbfc;border:1px solid #eef0f3;border-radius:8px;display:inline-block;margin:3px 0;transition:background .15s,opacity .2s;user-select:none;}
          .org-card:hover{background:#f0f4ff;}
          .org-dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px;vertical-align:middle;}
          .org-toggle{display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-right:4px;font-size:10px;color:#888;cursor:pointer;border-radius:4px;transition:all .2s;vertical-align:middle;flex-shrink:0;}
          .org-toggle:hover{background:#e3ecff;color:#333;}
          .org-toggle.open{transform:rotate(90deg);}
          .org-toggle-empty{visibility:hidden;}
          .org-node.dim > .org-card{opacity:0.35;}
          .org-search-box{display:flex;align-items:center;gap:8px;margin-bottom:14px;position:relative;}
          .org-search-box input{flex:1;padding:8px 12px 8px 34px;border:1px solid #d0d5dd;border-radius:8px;font-size:13px;outline:none;transition:border .2s;}
          .org-search-box input:focus{border-color:var(--primary);}
          .org-search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:14px;color:#999;pointer-events:none;}
          .org-search-count{font-size:12px;color:#888;white-space:nowrap;}
          .org-name mark{background:#fff3cd;color:#856404;border-radius:2px;padding:0 2px;}
          .org-node.match > .org-card{background:#fffde7;border-color:#ffe082;}
          .org-node.match.dim > .org-card{opacity:1;}
        </style>
        <div class="org-search-box">
          <span class="org-search-icon">🔍</span>
          <input id="orgSearchInput" type="text" placeholder="搜索节点名称（供应商/品牌/门店/店员）…" oninput="orgSearch()">
          <span class="org-search-count" id="orgSearchCount"></span>
        </div>
        <div id="orgTreeContainer">
          ${tree.map(n => nodeHtml(n, 0)).join('') || '<div class="empty">暂无组织数据</div>'}
        </div>
      </div>
    </div>`;
  document.getElementById('contentArea').innerHTML = html;
}

/* 组织树搜索 */
function orgSearch() {
  const input = document.getElementById('orgSearchInput');
  const container = document.getElementById('orgTreeContainer');
  const countEl = document.getElementById('orgSearchCount');
  const q = (input.value || '').trim().toLowerCase();
  
  const allNodes = Array.from(container.querySelectorAll('.org-node'));
  
  if (!q) {
    // 清空搜索：恢复折叠状态，去除所有高亮
    allNodes.forEach(n => n.classList.remove('dim', 'match'));
    container.querySelectorAll('.org-children').forEach(c => c.style.display = 'none');
    container.querySelectorAll('.org-toggle:not(.org-toggle-empty)').forEach(t => { t.classList.remove('open'); t.textContent = '▶'; });
    container.querySelectorAll('.org-name').forEach(el => { el.innerHTML = el.textContent; });
    countEl.textContent = '';
    return;
  }
  
  // 第一步：标记每个节点是否名称匹配
  const matchMap = new Map(); // node -> boolean
  allNodes.forEach(node => {
    const name = (node.dataset.orgName || '').toLowerCase();
    const type = (node.dataset.orgType || '').toLowerCase();
    matchMap.set(node, name.includes(q) || type.includes(q));
  });
  
  // 第二步：自底向上传播 —— 如果子节点匹配，父节点也标记为"有匹配子级"
  const hasMatchDescendant = new Map();
  allNodes.forEach(node => {
    let current = node.parentElement?.closest('.org-node');
    while (current) {
      if (matchMap.get(node)) {
        hasMatchDescendant.set(current, true);
      }
      current = current.parentElement?.closest('.org-node');
    }
  });
  
  // 第三步：展开所有匹配节点链上的父级
  allNodes.forEach(node => {
    const children = node.querySelector(':scope > .org-children');
    const toggle = node.querySelector(':scope > .org-card .org-toggle');
    if (!children) return;
    
    const selfMatches = matchMap.get(node);
    const descMatches = hasMatchDescendant.get(node);
    
    if (selfMatches || descMatches) {
      // 展开这个节点
      children.style.display = '';
      if (toggle && !toggle.classList.contains('org-toggle-empty')) {
        toggle.classList.add('open');
        toggle.textContent = '▼';
      }
    } else {
      children.style.display = 'none';
      if (toggle && !toggle.classList.contains('org-toggle-empty')) {
        toggle.classList.remove('open');
        toggle.textContent = '▶';
      }
    }
  });
  
  // 第四步：dim 非匹配节点 + 高亮匹配文字
  let matchCount = 0;
  allNodes.forEach(node => {
    const nameEl = node.querySelector('.org-name');
    if (matchMap.get(node)) {
      node.classList.add('match');
      node.classList.remove('dim');
      matchCount++;
      if (nameEl) {
        const text = nameEl.textContent;
        const idx = text.toLowerCase().indexOf(q);
        if (idx >= 0) {
          nameEl.innerHTML = escapeHtml(text.substring(0, idx)) + '<mark>' + escapeHtml(text.substring(idx, idx + q.length)) + '</mark>' + escapeHtml(text.substring(idx + q.length));
        }
      }
    } else {
      node.classList.remove('match');
      node.classList.add('dim');
      if (nameEl) nameEl.innerHTML = nameEl.textContent;
    }
  });
  
  countEl.textContent = matchCount > 0 ? `匹配 ${matchCount} 个节点` : '无匹配结果';
}

/* 树节点展开/折叠切换 */
function toggleOrgNode(event, toggleEl) {
  event.stopPropagation();
  const card = toggleEl.closest('.org-node');
  if (!card) return;
  const children = card.querySelector(':scope > .org-children');
  if (!children) return;
  if (children.style.display === 'none') {
    children.style.display = '';
    toggleEl.classList.add('open');
    toggleEl.textContent = '▼';
  } else {
    children.style.display = 'none';
    toggleEl.classList.remove('open');
    toggleEl.textContent = '▶';
  }
}

/* ============ 鸣智科技（顶层平台服务商）账号管理中心 ============ */
async function renderPlatform() {
  let plat = null, tiers = {};
  try {
    const ps = await apiGet('platforms');
    plat = ps.items[0] || null;
    const ents = ['suppliers', 'brands', 'stores', 'staff'];
    const res = await Promise.all(ents.map(e => apiGet(e)));
    ents.forEach((e, i) => { tiers[e] = res[i].total; });
  } catch (e) { toast(e.message); }

  const html = `
    <div class="stats-row">
      <div class="stat-card"><div class="stat-icon blue">🏛️</div><div class="stat-info"><h3>${plat ? escapeHtml(plat.name) : '—'}</h3><p>顶层开发服务商</p></div></div>
      <div class="stat-card"><div class="stat-icon green">🏭</div><div class="stat-info"><h3>${tiers.suppliers || 0}</h3><p>供应商账号</p></div></div>
      <div class="stat-card"><div class="stat-icon orange">🏢</div><div class="stat-info"><h3>${tiers.brands || 0}</h3><p>品牌商账号</p></div></div>
      <div class="stat-card"><div class="stat-icon red">🏪</div><div class="stat-info"><h3>${(tiers.stores || 0) + (tiers.staff || 0)}</h3><p>门店+店员账号</p></div></div>
    </div>

      <div class="panel">
      <div class="panel-header"><h3>🏛️ 鸣智科技 · 平台资料与组织总览</h3>
        <span style="font-size:12px;color:#888;">平台服务商为组织根节点，统一为各层级账号授权配额</span>
      </div>
      <div class="panel-body">
        ${plat ? `<div style="margin-bottom:16px;font-size:13px;color:var(--text-secondary);">
          平台联系人：${escapeHtml(plat.contact)} ｜ 电话：${escapeHtml(plat.phone)} ｜ 服务商级别：${escapeHtml(plat.level)} ｜ 授权供应商配额：${plat.max_suppliers}
        </div>` : ''}
        <div style="padding:11px 14px;background:#f5f8ff;border:1px solid #e3ecff;border-radius:8px;font-size:13px;color:#52647a;line-height:1.7;">
          各层级账号由对应管理员在「组织管理」中维护；新账号可通过左侧「申请层级」提交，由平台在「账号审批」中开通授权。
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="panel-header"><h3>📑 各层级账号概览</h3></div>
      <div class="panel-body">
        <table><thead><tr><th>层级</th><th>账号名称</th><th>登录账号</th><th>账号状态</th><th>注册时间</th><th>上级</th></tr></thead><tbody id="acctBody"><tr><td colspan="6" class="loading">加载中...</td></tr></tbody></table>
      </div>
    </div>`;
  document.getElementById('contentArea').innerHTML = html;

  // 加载账号概览（各层级前几条）
  const rows = [];
  const map = [
    { e: 'suppliers', pname: 'platform_name' },
    { e: 'brands', pname: 'supplier_name' },
    { e: 'stores', pname: 'brand_name' },
    { e: 'staff', pname: 'store_name' },
  ];
  try {
    const datas = await Promise.all(map.map(m => apiGet(m.e, { page_size: 50 })));
    datas.forEach((d, i) => {
      d.items.forEach(r => {
        rows.push(`<tr><td>${map[i].e === 'suppliers' ? '供应商' : map[i].e === 'brands' ? '品牌商' : map[i].e === 'stores' ? '门店' : '店员'}</td>
          <td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.username)}</td><td>${tag(r.account_status)}</td>
          <td>${escapeHtml(r.registered_at || '—')}</td><td>${escapeHtml(r[map[i].pname] || '—')}</td></tr>`);
      });
    });
    document.getElementById('acctBody').innerHTML = rows.join('') || '<tr><td colspan="6" class="empty">暂无账号</td></tr>';
  } catch (e) { toast(e.message); }
}

/* ============ 路由 ============ */
const ROUTERS = {
  dashboard: renderDashboard,
  platform: renderPlatform,
  orgtree: renderOrgTree,
  settings: renderSettings,
  apply: renderApply,
  approval: renderApproval,
  pending: renderPending,
  rejected: renderRejected,
  categories: renderCategories,
};
function navigate(page, label) {
  document.getElementById('pageTitle').textContent = label;
  setMobileTabActive(page);
  if (ROUTERS[page]) ROUTERS[page]();
  else if (ENTITY_CONFIG[page]) renderCrud(page);
  else document.getElementById('contentArea').innerHTML = '<div class="empty">页面建设中</div>';
}

document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', function () {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    this.classList.add('active');
    const label = this.textContent.trim().replace(/\d+$/, '');
    navigate(this.dataset.page, label);
  });
});

/* ============ 移动端 H5 适配 ============ */
function isMobile() {
  return window.innerWidth <= 768;
}

const MOBILE_TABS = [
  { id: 'dashboard', icon: '📊', label: '工作台', action: () => navigate('dashboard', '系统概览') },
  { id: 'business', icon: '🧩', label: '业务', sub: [
    { page: 'ingredients', icon: '🧂', label: '配料管理' },
    { page: 'inventory', icon: '📦', label: '库存管理' },
    { page: 'categories', icon: '🗂️', label: '配料类别' },
    { page: 'units', icon: '⚖️', label: '配料单位' },
    { page: 'wastage', icon: '📉', label: '出品损耗' },
    { page: 'prep', icon: '⚙️', label: '配料预制' },
    { page: 'expiry', icon: '⏰', label: '效期管理' },
    { page: 'logistics', icon: '🚚', label: '物流管理' },
    { page: 'purchase_orders', icon: '📋', label: '叫货管理' },
  ]},
  { id: 'org', icon: '👥', label: '组织', sub: [
    { page: 'orgtree', icon: '🏗️', label: '组织架构' },
    { page: 'platform', icon: '🏛️', label: '鸣智科技（平台）' },
    { page: 'suppliers', icon: '🏭', label: '供应商账号' },
    { page: 'brands', icon: '🏢', label: '品牌商账号' },
    { page: 'stores', icon: '🏪', label: '门店账号' },
    { page: 'staff', icon: '👤', label: '店员账号' },
    { page: 'approval', icon: '✅', label: '账号审批' },
  ]},
  { id: 'settings', icon: '⚙️', label: '设置', action: () => navigate('settings', '系统配置') },
];

function injectMobileTabBar() {
  if (!isMobile()) return;
  if (document.querySelector('.mobile-tabbar')) return;
  const bar = document.createElement('div');
  bar.className = 'mobile-tabbar';
  bar.innerHTML = MOBILE_TABS.map((t, i) =>
    `<div class="m-tab ${i === 0 ? 'active' : ''}" data-tab="${t.id}">
      <span class="m-tab-icon">${t.icon}</span>${t.label}
    </div>`).join('');
  document.body.appendChild(bar);
  bar.querySelectorAll('.m-tab').forEach(el => {
    el.addEventListener('click', () => {
      bar.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
      el.classList.add('active');
      const tab = MOBILE_TABS.find(t => t.id === el.dataset.tab);
      if (tab.action) tab.action();
      else if (tab.sub) openMobileSubnav(tab);
    });
  });
}

function openMobileSubnav(tab) {
  // 移除已有面板
  document.querySelectorAll('.mobile-subnav-overlay').forEach(o => o.remove());
  const overlay = document.createElement('div');
  overlay.className = 'mobile-subnav-overlay';
  const approvalBadge = document.getElementById('approvalBadge');
  const badgeCount = (approvalBadge && approvalBadge.style.display !== 'none') ? approvalBadge.textContent : '0';
  overlay.innerHTML = `
    <div class="mobile-subnav-sheet">
      <div class="ms-header"><span>${tab.label}</span><span class="ms-close">✕</span></div>
      ${tab.sub.map(s => `
        <div class="mobile-subnav-item" data-page="${s.page}">
          <span class="ms-icon">${s.icon}</span>${s.label}
          ${s.page === 'approval' && badgeCount !== '0' ? `<span class="ms-badge">${badgeCount}</span>` : ''}
        </div>`).join('')}
    </div>`;
  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('show'));
  overlay.querySelector('.ms-close').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  overlay.querySelectorAll('.mobile-subnav-item').forEach(el => {
    el.addEventListener('click', () => {
      overlay.remove();
      navigate(el.dataset.page, el.textContent.replace(/\d+/, '').trim());
    });
  });
}

function setMobileTabActive(page) {
  const bar = document.querySelector('.mobile-tabbar');
  if (!bar) return;
  bar.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
  for (const tab of MOBILE_TABS) {
    if (tab.id === page) { bar.querySelector(`[data-tab="${tab.id}"]`)?.classList.add('active'); return; }
    if (tab.sub && tab.sub.some(s => s.page === page)) {
      bar.querySelector(`[data-tab="${tab.id}"]`)?.classList.add('active'); return;
    }
  }
}

/* 移动端卡片渲染：替代表格行 */
function renderMobileCards(items, cfg, entity) {
  const panelBody = document.querySelector('.panel-body');
  if (!panelBody) return;
  // 移除旧卡片列表
  panelBody.querySelectorAll('.mobile-card-list').forEach(l => l.remove());
  const list = document.createElement('div');
  list.className = 'mobile-card-list';
  const cols = cfg.columns.map(def => parseDef(def));
  if (!items.length) { list.innerHTML = '<div class="empty">暂无数据</div>'; panelBody.appendChild(list); return; }
  items.forEach(row => {
    const card = document.createElement('div');
    card.className = 'mobile-card';
    // 取第一列作为标题，status 列作为标签
    const firstCol = cols[0];
    const firstVal = row[firstCol[0]];
    const statusCol = cols.find(c => c[2] === 'tag');
    const statusVal = statusCol ? row[statusCol[0]] : '';
    // 中间行（跳过标题列和标签列，取前 4 个）
    const midCols = cols.filter(c => c[0] !== firstCol[0] && c[2] !== 'tag').slice(0, 4);
    let rowsHtml = midCols.map(c => {
      let v = row[c[0]];
      if (v === undefined || v === null) v = '—';
      else if (c[2] === 'money') v = fmtMoney(v);
      else v = escapeHtml(String(v));
      return `<div class="mc-row"><span class="mc-label">${escapeHtml(c[1])}</span><span class="mc-value">${v}</span></div>`;
    }).join('');
    const titleHtml = escapeHtml(String(firstVal ?? '—'));
    const tagHtml = statusVal ? tag(statusVal) : '';
    card.innerHTML = `
      <div class="mc-header"><span class="mc-title">${titleHtml}</span>${tagHtml ? '<span class="mc-tag">' + tagHtml + '</span>' : ''}</div>
      <div class="mc-rows">${rowsHtml}</div>
      <div class="mc-actions">
        <button class="btn btn-outline btn-sm" data-action="edit" data-id="${row.id}">编辑</button>
        <button class="btn btn-danger btn-sm" data-action="del" data-id="${row.id}">删除</button>
      </div>`;
    list.appendChild(card);
  });
  panelBody.appendChild(list);
  // 绑定事件
  list.querySelectorAll('[data-action="edit"]').forEach(b => {
    b.addEventListener('click', () => openForm(entity, Number(b.dataset.id)));
  });
  list.querySelectorAll('[data-action="del"]').forEach(b => {
    b.addEventListener('click', () => delItem(entity, Number(b.dataset.id)));
  });
}

// ============ 统一账号 / 登录态 ============
const AUTH_KEY = 'milktea_auth';
let currentUser = null;
let stores_cache = [];
const ROLE_LABEL = { platform: '平台服务商', supplier: '供应商', brand: '品牌商', store: '门店', staff: '店员' };
const ROLE_ENTITY = { supplier: 'suppliers', brand: 'brands', store: 'stores', staff: 'staff' };
const APPLY_EXCLUDE = ['username', 'password', 'account_status', 'registered_at', 'code'];

function getAuth() { try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; } }
function setAuth(a) { localStorage.setItem(AUTH_KEY, JSON.stringify(a)); }
function clearAuth() { localStorage.removeItem(AUTH_KEY); }

const authApi = (path, opts = {}) => api('/auth' + path, opts);

function switchLoginTab(tab) {
  document.querySelectorAll('.login-tabs .lt').forEach(t => t.classList.toggle('active', t.dataset.lt === tab));
  document.getElementById('formLogin').classList.toggle('active', tab === 'login');
  document.getElementById('formRegister').classList.toggle('active', tab === 'register');
}

function showLogin() {
  document.body.classList.add('logged-out');
  currentUser = null;
}

async function doLogin(e) {
  e.preventDefault();
  const msg = document.getElementById('loginMsg');
  msg.className = 'login-msg'; msg.textContent = '登录中...';
  try {
    const me = await authApi('/login', { method: 'POST', body: JSON.stringify({
      username: document.getElementById('loginUser').value.trim(),
      password: document.getElementById('loginPwd').value,
    }) });
    await enterSystem(me);
  } catch (err) { msg.className = 'login-msg err'; msg.textContent = err.message; }
}

async function doRegister(e) {
  e.preventDefault();
  const msg = document.getElementById('regMsg');
  const user = document.getElementById('regUser').value.trim();
  const pwd = document.getElementById('regPwd').value;
  const phone = document.getElementById('regPhone').value.trim();
  if (user.length < 3) { msg.className = 'login-msg err'; msg.textContent = '登录账号至少 3 个字符'; return; }
  if (pwd.length < 6) { msg.className = 'login-msg err'; msg.textContent = '密码至少 6 位'; return; }
  msg.className = 'login-msg'; msg.textContent = '注册中...';
  try {
    const me = await authApi('/register', { method: 'POST', body: JSON.stringify({ username: user, password: pwd, phone }) });
    msg.className = 'login-msg ok'; msg.textContent = '注册成功，正在进入系统...';
    await enterSystem(me);
  } catch (err) { msg.className = 'login-msg err'; msg.textContent = err.message; }
}

async function enterSystem(me) {
  currentUser = me; setAuth(me);
  document.body.classList.remove('logged-out');
  await updateAuthUI(me);
  injectMobileTabBar();
  routeByStatus(me);
}

function doLogout() {
  clearAuth();
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPwd').value = '';
  document.getElementById('formLogin').classList.add('active');
  document.getElementById('formRegister').classList.remove('active');
  document.querySelectorAll('.login-tabs .lt').forEach(t => t.classList.toggle('active', t.dataset.lt === 'login'));
  document.getElementById('avatarMenu').classList.remove('show');
  document.querySelectorAll('.mobile-tabbar, .mobile-subnav-overlay').forEach(e => e.remove());
  showLogin();
}

/* ============ 头像下拉菜单 ============ */
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('headerAvatar').addEventListener('click', e => {
    e.stopPropagation();
    document.getElementById('avatarMenu').classList.toggle('show');
  });
  document.addEventListener('click', () => {
    document.getElementById('avatarMenu').classList.remove('show');
  });
});

window.viewMyProfile = async function () {
  const me = currentUser;
  if (!me) return;
  let extra = '';
  try {
    const acc = await api('/auth/accounts/' + me.id);
    extra = `<div style="margin-top:14px;padding:12px;background:#f8f9fa;border-radius:8px;font-size:13px;line-height:1.8;">
      <div>登录账号：<b>${escapeHtml(acc.username)}</b></div>
      <div>手机号：<b>${escapeHtml(acc.phone || '未填写')}</b></div>
      <div>角色：<b>${ROLE_LABEL[acc.role] || '未申请'}</b></div>
      <div>状态：<b>${escapeHtml(acc.status)}</b></div>
      <div>注册时间：<b>${escapeHtml(acc.registered_at || '—')}</b></div>
      <div>授权等级：<b>${escapeHtml(acc.level || '—')}</b></div>
      ${acc.related_name ? `<div>关联主体：<b>${escapeHtml(acc.related_name)}</b></div>` : ''}
    </div>`;
  } catch {}
  showModal('👤 我的资料', `<div style="text-align:center;padding:12px 0;">
    <div style="width:56px;height:56px;border-radius:50%;background:var(--primary);color:#fff;font-size:24px;line-height:56px;margin:0 auto 10px;font-weight:700;">${(me.username||'客').slice(0,1)}</div>
    <h3>${escapeHtml(me.username)}</h3></div>${extra}`,
    () => closeModal(), 420);
  document.getElementById('avatarMenu').classList.remove('show');
};

window.changeMyPassword = function () {
  showModal('🔒 修改密码', `<div class="form-group"><label>新密码</label><input type="password" id="newPwd" placeholder="至少 6 位"></div>
    <div class="form-group"><label>确认密码</label><input type="password" id="newPwd2" placeholder="再次输入"></div>`,
    async () => {
      const p1 = document.getElementById('newPwd').value;
      const p2 = document.getElementById('newPwd2').value;
      if (!p1 || p1.length < 6) { toast('密码至少 6 位'); return; }
      if (p1 !== p2) { toast('两次密码不一致'); return; }
      try {
        await authApi('/change-pwd', { method: 'POST', body: JSON.stringify({ account_id: currentUser.id, new_password: p1 }) });
        toast('密码修改成功，请重新登录');
        closeModal();
        doLogout();
      } catch (e) { toast(e.message); }
    });
  document.getElementById('avatarMenu').classList.remove('show');
};

window.viewMyStatus = function () {
  document.getElementById('avatarMenu').classList.remove('show');
  if (currentUser.status === '待审批') navigate('pending', '审批中');
  else if (currentUser.status === '已拒绝') navigate('rejected', '申请被驳回');
};

function routeByStatus(me) {
  if (me.status === '待审批') return navigate('pending', '审批中');
  if (me.status === '已拒绝') return navigate('rejected', '申请被驳回');
  // 待激活 / 正常：进入系统。待激活用户可在「申请层级」提交层级
  return navigate('dashboard', '系统概览');
}

async function updateAuthUI(me) {
  const roleText = ROLE_LABEL[me.role] || '未申请层级';
  const statusText = { '待激活': '待申请层级', '待审批': '审批中', '正常': '正常', '已拒绝': '已驳回' }[me.status] || me.status;
  document.getElementById('headerRole').textContent = `${roleText} · ${statusText}`;
  // 头像：优先关联主体名称首字，否则账号
  let nm = '';
  try { const r = await api('/auth/accounts/' + me.id); nm = r.related_name || r.username; } catch {}
  document.getElementById('headerAvatar').textContent = (nm || me.username || '客').slice(0, 1);
  // 头像下拉菜单显隐控制
  const isPlatform = me.role === 'platform';
  const isNormal = me.status === '正常';
  const isPending = me.status === '待审批';
  const isRejected = me.status === '已拒绝';
  const isFresh = me.status === '待激活';
  document.getElementById('amApply').style.display = (isFresh || isRejected) ? 'flex' : 'none';
  document.getElementById('amStatus').style.display = (isPending || isRejected) ? 'flex' : 'none';
  document.getElementById('amProfile').style.display = (isNormal || isPlatform) ? 'flex' : 'none';
  document.getElementById('amPwd').style.display = (isNormal || isPlatform) ? 'flex' : 'none';
  // 账号审批入口：仅平台服务商
  document.getElementById('navApproval').style.display = isPlatform ? 'flex' : 'none';
  if (isPlatform) {
    try {
      const d = await api('/auth/accounts?status=' + encodeURIComponent('待审批'));
      const badge = document.getElementById('approvalBadge');
      if (d.total > 0) { badge.style.display = 'inline-block'; badge.textContent = d.total; }
      else badge.style.display = 'none';
    } catch {}
  }

  // 导航项按角色可见性：只能看自己及下游
  const navVisible = {
    dashboard: true,
    platform: isPlatform,
    approval: isPlatform,
    suppliers: isPlatform,
    brands: isPlatform || me.role === 'supplier',
    stores: isPlatform || me.role === 'supplier' || me.role === 'brand',
    staff: isPlatform || me.role === 'supplier' || me.role === 'brand' || me.role === 'store',
    orgtree: true,  // org-tree 已按权限过滤
    settings: true,
    // 核心业务全部可见（数据已在后端过滤）
    ingredients: true, inventory: true, categories: true, units: true,
    wastage: true, prep: true, expiry: true, logistics: true,
  };
  document.querySelectorAll('.sidebar .nav-item[data-page]').forEach(el => {
    const page = el.dataset.page;
    if (navVisible[page] !== undefined) {
      el.style.display = navVisible[page] ? 'flex' : 'none';
    }
  });
  // 同步移动端子导航
  document.querySelectorAll('.mobile-subnav-item[data-page]').forEach(el => {
    const page = el.dataset.page;
    if (navVisible[page] !== undefined) {
      el.style.display = navVisible[page] ? 'flex' : 'none';
    }
  });
}

/* ============ 申请层级 ============ */
let applyRole = '';
async function renderApply() {
  const me = currentUser;
  if (me.status === '待审批') return renderPending();
  if (me.status === '已拒绝') return renderRejected();
  const roles = [
    { key: 'supplier', name: '供应商', icon: '🏭', desc: '原材料供应方，由平台授权' },
    { key: 'brand', name: '品牌商', icon: '🏢', desc: '茶饮品牌方，挂靠某供应商' },
    { key: 'store', name: '门店', icon: '🏪', desc: '线下门店，挂靠某品牌' },
    { key: 'staff', name: '店员', icon: '👤', desc: '门店店员，挂靠某门店' },
  ];
  const html = `
    <div class="panel">
      <div class="panel-header"><h3>📝 申请层级（选择您的账号类型）</h3>
        <span style="font-size:12px;color:#888;">提交后由鸣智科技后台手动审批，通过后方可正常使用系统</span></div>
      <div class="panel-body">
        <div class="grid-2" id="roleCards">
          ${roles.map(r => `<div class="stat-card" data-role="${r.key}" style="box-shadow:var(--shadow);cursor:pointer;" onclick="chooseApplyRole('${r.key}')">
            <div class="stat-icon orange">${r.icon}</div>
            <div class="stat-info" style="flex:1"><h3>${r.name}</h3><p>${r.desc}</p></div>
          </div>`).join('')}
        </div>
        <div id="applyFormBox"></div>
      </div>
    </div>`;
  document.getElementById('contentArea').innerHTML = html;
}

window.chooseApplyRole = async function (role) {
  applyRole = role;
  const entity = ROLE_ENTITY[role];
  const cfg = ENTITY_CONFIG[entity];
  const fields = cfg.form.filter(def => {
    const [key] = parseDef(def);
    return !APPLY_EXCLUDE.includes(key);
  });
  const formHtml = fields.map(def => {
    const [key, label, type, extra] = parseDef(def);
    let ctrl;
    if (type === 'select') {
      const opts = extra.split(',');
      ctrl = `<select data-key="${key}">` + opts.map(o => `<option value="${o}">${o}</option>`).join('') + `</select>`;
    } else if (type === 'fk') {
      ctrl = `<select data-key="${key}" data-fk="1"><option value="">加载中...</option></select>`;
    } else {
      const t = type === 'number' ? 'number' : (type === 'password' ? 'password' : 'text');
      ctrl = `<input type="${t}" data-key="${key}" placeholder="${label}">`;
    }
    return `<div class="form-group"><label>${label}</label>${ctrl}</div>`;
  }).join('');
  document.getElementById('applyFormBox').innerHTML = `
    <div class="panel" style="margin-top:16px;">
      <div class="panel-header"><h3>填写${ROLE_LABEL[role]}信息</h3></div>
      <div class="panel-body"><div class="form-row">${formHtml}</div>
        <div class="btn-group">
          <button class="btn btn-primary" onclick="submitApply()">提交层级申请</button>
          <button class="btn btn-outline" onclick="renderApply()">返回重选</button>
        </div>
      </div>
    </div>`;
  // 加载外键选项
  for (const def of fields) {
    const [key, , type, extra] = parseDef(def);
    if (type === 'fk') {
      try {
        const res = await apiGet(extra);
        const sel = document.querySelector(`#applyFormBox select[data-key="${key}"]`);
        sel.innerHTML = `<option value="">请选择</option>` +
          res.items.map(it => `<option value="${it.id}">${escapeHtml(it.name)}</option>`).join('');
      } catch (e) { toast('加载关联数据失败: ' + e.message); }
    }
  }
};

window.submitApply = async function () {
  const me = currentUser;
  const payload = { account_id: me.id, role: applyRole };
  document.querySelectorAll('#applyFormBox [data-key]').forEach(el => {
    if (el.value !== '') payload[el.dataset.key] = el.value;
  });
  if (!payload.name) { toast('请填写名称后再提交'); return; }
  try {
    const acct = await authApi('/apply', { method: 'POST', body: JSON.stringify(payload) });
    currentUser = acct; setAuth(acct);
    await updateAuthUI(acct);
    toast('申请已提交，等待鸣智后台审批');
    navigate('pending', '审批中');
  } catch (e) { toast(e.message); }
};

/* ============ 审批中（等待平台审核） ============ */
function renderPending() {
  document.getElementById('contentArea').innerHTML = `
    <div class="auth-status">
      <div class="big-icon">⏳</div>
      <h2>层级申请审核中</h2>
      <p>您的 <b>${ROLE_LABEL[currentUser.role] || ''}</b> 层级申请已提交，<br>
      正在由 <b>鸣智科技</b> 后台管理员手动审批。<br>审批通过后即可正常使用系统全部功能。</p>
      <div class="btn-group" style="justify-content:center;margin-top:18px;">
        <button class="btn btn-outline" onclick="refreshMe()">刷新状态</button>
      </div>
    </div>`;
}

window.refreshMe = async function () {
  try {
    const me = await api('/auth/accounts/' + currentUser.id);
    currentUser = me; setAuth(me);
    await updateAuthUI(me);
    routeByStatus(me);
  } catch (e) { toast(e.message); }
};

/* ============ 申请被驳回 ============ */
function renderRejected() {
  document.getElementById('contentArea').innerHTML = `
    <div class="auth-status">
      <div class="big-icon">🚫</div>
      <h2>层级申请未通过</h2>
      <p>审批意见：<b>${escapeHtml(currentUser.approve_note || '（无）')}</b><br>
      您可修改资料后重新提交申请。</p>
      <div class="btn-group" style="justify-content:center;margin-top:18px;">
        <button class="btn btn-primary" onclick="reApply()">重新申请</button>
      </div>
    </div>`;
}

window.reApply = async function () {
  try {
    const me = await authApi('/accounts/' + currentUser.id + '/reset', { method: 'POST' });
    currentUser = me; setAuth(me);
    await updateAuthUI(me);
    navigate('apply', '申请层级');
  } catch (e) { toast(e.message); }
};

/* ============ 账号审批（鸣智后台） ============ */
let approvalFilter = '待审批';
async function renderApproval() {
  const tabs = [['待审批', '待审批'], ['已拒绝', '已拒绝'], ['全部', '']];
  const html = `
    <div class="panel">
      <div class="panel-header"><h3>✅ 账号审批中心（鸣智科技后台）</h3>
        <span style="font-size:12px;color:#888;">对各层级提交的注册申请进行手动授权审批</span></div>
      <div class="panel-body">
        <div class="tabs" id="approvalTabs">
          ${tabs.map(t => `<div class="tab ${t[0] === approvalFilter ? 'active' : ''}" onclick="switchApprovalTab('${t[0]}')">${t[0] === '全部' ? '全部' : t[0] + ' (' + (t[0] === '待审批' ? '<span id="cntPending">-</span>' : (t[0] === '已拒绝' ? '<span id="cntReject">-</span>' : '')) + ')'}</div>`).join('')}
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>登录账号</th><th>手机号</th><th>申请层级</th><th>申请主体</th><th>注册时间</th><th>状态</th><th>操作</th></tr></thead>
          <tbody id="approvalBody"><tr><td colspan="7" class="loading">加载中...</td></tr></tbody>
        </table></div>
      </div>
    </div>`;
  document.getElementById('contentArea').innerHTML = html;
  loadApproval();
}

window.switchApprovalTab = function (f) {
  approvalFilter = f;
  document.querySelectorAll('#approvalTabs .tab').forEach(t => {
    const label = t.textContent.replace(/\(.*\)/, '').trim();
    t.classList.toggle('active', label === f);
  });
  loadApproval();
};

async function loadApproval() {
  const params = approvalFilter ? ('?status=' + encodeURIComponent(approvalFilter)) : '';
  let data = [];
  try { const res = await api('/auth/accounts' + params); data = res.items; }
  catch (e) { toast(e.message); return; }
  const tbody = document.getElementById('approvalBody');
  if (!data.length) {
    tbody.innerHTML = `<tr><td colspan="7" class="empty">暂无${approvalFilter || ''}申请</td></tr>`;
  } else {
    tbody.innerHTML = data.map(a => `
      <tr>
        <td>${escapeHtml(a.username)}</td>
        <td>${escapeHtml(a.phone || '—')}</td>
        <td>${ROLE_LABEL[a.role] || '—'}</td>
        <td>${escapeHtml(a.related_name || (a.role ? '（待完善）' : '未申请'))}</td>
        <td>${escapeHtml(a.registered_at || '—')}</td>
        <td>${tag(a.status)}</td>
        <td><div class="btn-group">
          ${a.status === '待审批' ? `<button class="btn btn-primary btn-sm" onclick="approveAccount(${a.id})">通过</button>
            <button class="btn btn-danger btn-sm" onclick="rejectAccount(${a.id})">驳回</button>` :
            (a.status === '已拒绝' ? `<button class="btn btn-outline btn-sm" onclick="viewNote('${escapeHtml(a.approve_note || '')}')">查看意见</button>` : '—')}
          ${a.related_id ? `<button class="btn btn-outline btn-sm" onclick="viewEntity('${ROLE_ENTITY[a.role] || ''}', ${a.related_id})">详情</button>` : ''}
        </div></td>
      </tr>`).join('');
  }
  // 更新计数
  try {
    const dp = await api('/auth/accounts?status=' + encodeURIComponent('待审批'));
    const dr = await api('/auth/accounts?status=' + encodeURIComponent('已拒绝'));
    const cp = document.getElementById('cntPending'); if (cp) cp.textContent = dp.total;
    const cr = document.getElementById('cntReject'); if (cr) cr.textContent = dr.total;
    const badge = document.getElementById('approvalBadge');
    if (dp.total > 0) { badge.style.display = 'inline-block'; badge.textContent = dp.total; } else badge.style.display = 'none';
  } catch {}
}

window.viewNote = function (note) {
  alert('审批意见：' + (note || '（无）'));
};

window.viewEntity = async function (entity, id) {
  try {
    const d = await api('/api/' + entity + '/' + id);
    const html = Object.entries(d).filter(([k]) => !['id', 'created_at', 'password', 'username'].includes(k))
      .map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #f0f0f0;font-size:13px;">
        <span style="color:#888;">${k}</span><b>${escapeHtml(v ?? '—')}</b></div>`).join('');
    showModal('申请主体详情', html, () => closeModal());
  } catch (e) { toast(e.message); }
};

window.approveAccount = function (id) {
  showModal('审批通过', `<div class="form-group"><label>审批意见（选填）</label>
    <textarea class="approve-note" id="noteInput" placeholder="如：资料齐全，准予开通"></textarea></div>
    <div class="form-group" style="margin-top:10px;"><label>授权等级</label>
    <input id="levelInput" placeholder="如：战略合作 / 核心供应商 / 一般供应商"></div>`,
    async () => {
      try {
        const note = document.getElementById('noteInput').value;
        const acct = await authApi('/accounts/' + id + '/approve', { method: 'POST', body: JSON.stringify({ approve_note: note }) });
        if (document.getElementById('levelInput').value) {
          // 仅记录到账号表 level 字段（演示）
          acct.level = document.getElementById('levelInput').value;
        }
        toast('已通过审批');
        closeModal();
        await updateAuthUI(currentUser);
        loadApproval();
      } catch (e) { toast(e.message); }
    });
};

window.rejectAccount = function (id) {
  showModal('审批驳回', `<div class="form-group"><label>驳回原因</label>
    <textarea class="approve-note" id="noteInput" placeholder="请填写驳回原因，便于对方修改"></textarea></div>`,
    async () => {
      try {
        const note = document.getElementById('noteInput').value || '不符合要求';
        await authApi('/accounts/' + id + '/reject', { method: 'POST', body: JSON.stringify({ approve_note: note }) });
        toast('已驳回');
        closeModal();
        loadApproval();
      } catch (e) { toast(e.message); }
    });
};

/* ============ 启动 ============ */
async function boot() {
  const a = getAuth();
  if (!a) { showLogin(); return; }
  try {
    const me = await api('/auth/accounts/' + a.id);
    currentUser = me; setAuth(me);
    document.body.classList.remove('logged-out');
    await updateAuthUI(me);
    routeByStatus(me);
  } catch (e) {
    clearAuth();
    showLogin();
  }
}
boot();
