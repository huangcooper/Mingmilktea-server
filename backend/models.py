"""数据模型定义：供应商、品牌商、门店、店员、配料、库存、损耗、预制、效期、物流"""
from datetime import datetime, date
from sqlalchemy import String, Integer, Float, Date, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from db import Base


def _now():
    return datetime.now()


class BaseMixin:
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)

    def to_dict(self):
        out = {}
        for c in self.__table__.columns:
            v = getattr(self, c.name)
            if isinstance(v, datetime):
                v = v.strftime("%Y-%m-%d %H:%M:%S") if v else ""
            elif isinstance(v, date):
                v = v.strftime("%Y-%m-%d") if v else ""
            out[c.name] = v
        return out


class Platform(Base, BaseMixin):
    """顶层开发服务商（如鸣智科技），负责所有层级账号的注册与管理"""
    __tablename__ = "platforms"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    contact = mapped_column(String(64))
    phone = mapped_column(String(32))
    level = mapped_column(String(32), default="顶级服务商")
    max_suppliers = mapped_column(Integer, default=0)   # 授权下级供应商数量配额(0=不限制)
    status = mapped_column(String(32), default="运营中")


class AccountMixin:
    """账号体系混入：各级实体均拥有独立账号"""
    username = mapped_column(String(64), unique=True)
    password = mapped_column(String(128), default="123456")
    account_status = mapped_column(String(32), default="待激活")  # 正常/停用/待激活
    registered_at = mapped_column(String(32))


class Account(Base, BaseMixin):
    """统一登录账号表：注册时仅含基础信息（无层级），登录后申请层级并经平台审批。

    状态流转：待激活(已注册未申请) → 待审批(已提交层级申请) → 正常(审批通过) / 已拒绝(审批驳回)
    role：platform/supplier/brand/store/staff（注册时为空，申请时写入）
    related_id：审批通过后关联的实体记录 id
    """
    __tablename__ = "accounts"
    username = mapped_column(String(64), unique=True)        # 登录账号
    password = mapped_column(String(128), default="123456")
    phone = mapped_column(String(32))
    role = mapped_column(String(32), default="")             # 层级角色，注册时为空
    status = mapped_column(String(32), default="待激活")      # 待激活/待审批/正常/已拒绝/停用
    level = mapped_column(String(32), default="")            # 授权等级（审批后由平台填写）
    related_id = mapped_column(Integer, default=0)           # 关联实体 id
    approve_note = mapped_column(String(256), default="")    # 平台审批意见
    registered_at = mapped_column(String(32))
    must_change_password = mapped_column(Boolean, default=False)  # 首次登录强制改密


class Supplier(Base, BaseMixin, AccountMixin):
    __tablename__ = "suppliers"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    type = mapped_column(String(32), default="贸易商")   # 贸易商/制造商/种植基地
    platform_id = mapped_column(Integer, ForeignKey("platforms.id"))  # 上级：平台服务商
    contact = mapped_column(String(64))
    phone = mapped_column(String(32))
    category = mapped_column(String(64))
    level = mapped_column(String(32))          # 战略合作/核心供应商/一般供应商
    supply_cycle = mapped_column(String(32))
    cooperation_start = mapped_column(String(32))
    total_amount = mapped_column(Float, default=0)
    max_brands = mapped_column(Integer, default=0)   # 授权下级品牌商数量配额(0=不限制)
    status = mapped_column(String(32), default="合作中")


class Brand(Base, BaseMixin, AccountMixin):
    __tablename__ = "brands"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    company = mapped_column(String(128))
    supplier_id = mapped_column(Integer, ForeignKey("suppliers.id"))  # 上级：供应商
    manager = mapped_column(String(64))
    phone = mapped_column(String(32))
    store_count = mapped_column(Integer, default=0)
    franchise_mode = mapped_column(String(32))
    created_at_date = mapped_column(String(32))
    max_stores = mapped_column(Integer, default=0)   # 授权下级门店数量配额(0=不限制)
    status = mapped_column(String(32), default="运营中")


class Store(Base, BaseMixin, AccountMixin):
    __tablename__ = "stores"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    brand_id = mapped_column(Integer, ForeignKey("brands.id"))  # 上级：品牌商
    type = mapped_column(String(32))           # 旗舰店/标准店
    manager = mapped_column(String(64))
    phone = mapped_column(String(32))
    address = mapped_column(String(256))
    area = mapped_column(String(32))
    staff_count = mapped_column(Integer, default=0)
    max_staff = mapped_column(Integer, default=0)   # 授权下级店员数量配额(0=不限制)
    status = mapped_column(String(32), default="营业中")


class Staff(Base, BaseMixin, AccountMixin):
    __tablename__ = "staff"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(64))
    role = mapped_column(String(32))           # 店长/副店长/制茶师/收银员/仓库管理员
    store_id = mapped_column(Integer, ForeignKey("stores.id"))
    phone = mapped_column(String(32))
    hire_date = mapped_column(String(32))
    permissions = mapped_column(String(128))
    qualification = mapped_column(String(32))
    status = mapped_column(String(32), default="在职")


class Ingredient(Base, BaseMixin):
    __tablename__ = "ingredients"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    category = mapped_column(String(64))
    barcode = mapped_column(String(64))              # 条码
    spec = mapped_column(String(64))
    unit = mapped_column(String(32))
    supplier_id = mapped_column(Integer, ForeignKey("suppliers.id"))
    cost_price = mapped_column(Float, default=0)
    sale_price = mapped_column(Float, default=0)      # 参考售价
    safety_stock = mapped_column(Float, default=0)    # 安全库存（库存下限）
    max_stock = mapped_column(Float, default=0)       # 库存上限
    location = mapped_column(String(64))             # 建议库位
    brand = mapped_column(String(64))                # 品牌
    shelf_life = mapped_column(String(32))           # 保质期（天/月）
    pinyin = mapped_column(String(64))               # 拼音码（检索辅助）
    status = mapped_column(String(32), default="启用")
    remark = mapped_column(String(256))              # 备注/商品描述
    # —— 银豹式拓展字段（开关 / 价格 / 拓展信息）——
    not_count_stock = mapped_column(Boolean, default=False)    # 不计库存
    multi_code = mapped_column(Boolean, default=False)         # 一品多码
    use_member_discount = mapped_column(Boolean, default=False)  # 会员折扣
    has_other_spec = mapped_column(Boolean, default=False)     # 其它规格
    label_print = mapped_column(Boolean, default=False)        # 标签打印
    refrigerated = mapped_column(Boolean, default=False)       # 冷藏
    unopened = mapped_column(Boolean, default=False)           # 未开封
    kitchen_ticket = mapped_column(Boolean, default=False)     # 厨房票打
    wholesale_price = mapped_column(Float, default=0)          # 批发价
    prep_time = mapped_column(Float, default=0)                # 准备时间(分钟)
    weight = mapped_column(Float, default=0)                   # 重量(kg)
    min_sale_qty = mapped_column(Float, default=0)             # 起售量
    flavor = mapped_column(String(64))                         # 商品口味
    tags = mapped_column(String(128))                          # 商品标签
    production_date = mapped_column(String(32))                # 生产日期
    image_url = mapped_column(String(256))                     # 图片链接


class Inventory(Base, BaseMixin):
    __tablename__ = "inventory"
    ingredient_id = mapped_column(Integer, ForeignKey("ingredients.id"))
    store_id = mapped_column(Integer, ForeignKey("stores.id"), nullable=True, default=None)
    current_stock = mapped_column(Float, default=0)
    safety_stock = mapped_column(Float, default=0)
    status = mapped_column(String(32), default="正常")
    last_in = mapped_column(String(32))
    last_out = mapped_column(String(32))
    location = mapped_column(String(32))


class Category(Base, BaseMixin):
    """配料类别（三级分类：一级 > 二级 > 三级，自关联 parent_id）"""
    __tablename__ = "categories"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    level = mapped_column(Integer, default=1)                 # 1/2/3 级
    parent_id = mapped_column(Integer, ForeignKey("categories.id"), default=0)
    sort = mapped_column(Integer, default=0)
    status = mapped_column(String(32), default="启用")
    remark = mapped_column(String(256))


class Unit(Base, BaseMixin):
    """配料单位及换算（例如：1 千克 = 1000 克）"""
    __tablename__ = "units"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(64))          # 单位名称：千克
    symbol = mapped_column(String(32))        # 符号：kg
    group = mapped_column(String(32))         # 计量类别：重量 / 容量 / 计数
    base_unit = mapped_column(String(64))     # 基准单位：克
    factor = mapped_column(Float, default=1)  # 换算系数：1 千克 = 1000 克
    status = mapped_column(String(32), default="启用")
    remark = mapped_column(String(256))


class Wastage(Base, BaseMixin):
    __tablename__ = "wastage"
    code = mapped_column(String(32), unique=True)
    store_id = mapped_column(Integer, ForeignKey("stores.id"))
    ingredient_id = mapped_column(Integer, ForeignKey("ingredients.id"))
    type = mapped_column(String(32))           # 过期损耗/制作损耗/变质损耗/洒漏损耗
    quantity = mapped_column(Float, default=0)
    amount = mapped_column(Float, default=0)
    rate = mapped_column(String(32))
    responsible = mapped_column(String(64))
    date = mapped_column(String(32))
    status = mapped_column(String(32), default="待审核")


class Prep(Base, BaseMixin):
    __tablename__ = "prep"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    # 预制配料：仅从库存管理中登记的配料选取，结构化 JSON 存储 [{i:配料id, n:名称, q:用量}]
    materials = mapped_column(String(1024))
    quantity = mapped_column(String(64))
    duration = mapped_column(String(32))
    store_id = mapped_column(Integer, ForeignKey("stores.id"))
    plan_time = mapped_column(String(32))
    status = mapped_column(String(32), default="待执行")


class Expiry(Base, BaseMixin):
    __tablename__ = "expiry"
    batch_no = mapped_column(String(64), unique=True)
    ingredient_id = mapped_column(Integer, ForeignKey("ingredients.id"))
    production_date = mapped_column(String(32))
    shelf_life = mapped_column(String(32))     # 天数/月数
    expiry_date = mapped_column(String(32))
    batch_qty = mapped_column(Float, default=0)
    remaining_qty = mapped_column(Float, default=0)
    location = mapped_column(String(32))
    status = mapped_column(String(32), default="正常")


class Logistics(Base, BaseMixin):
    __tablename__ = "logistics"
    code = mapped_column(String(32), unique=True)
    logistics_type = mapped_column(String(32), default="供应商→品牌商")  # 工厂→供应商 / 供应商→品牌商 / 品牌商→门店
    factory_id = mapped_column(Integer, ForeignKey("factories.id"), nullable=True, default=None)
    supplier_id = mapped_column(Integer, ForeignKey("suppliers.id"))
    warehouse = mapped_column(String(64))
    store_id = mapped_column(Integer, ForeignKey("stores.id"), nullable=True, default=None)
    details = mapped_column(String(256))
    total_weight = mapped_column(String(64))
    logistics_company = mapped_column(String(64))
    ship_date = mapped_column(String(32))
    eta = mapped_column(String(32))
    actual_arrival = mapped_column(String(32))
    status = mapped_column(String(32), default="待发货")
    purchase_order_id = mapped_column(Integer, ForeignKey("purchase_orders.id"), nullable=True)


class PurchaseOrder(Base, BaseMixin):
    """门店叫货单：门店 → 供应商，含配料明细、状态流转、关联物流"""
    __tablename__ = "purchase_orders"
    code = mapped_column(String(32), unique=True)
    store_id = mapped_column(Integer, ForeignKey("stores.id"))
    supplier_id = mapped_column(Integer, ForeignKey("suppliers.id"))
    items = mapped_column(String(2048))  # JSON: [{i:配料id, n:名称, q:数量, u:单位}]
    total_amount = mapped_column(Float, default=0)
    status = mapped_column(String(32), default="待审核")  # 待审核/已拒绝/已通过/已发货/已签收
    approve_note = mapped_column(String(256), default="")
    logistics_id = mapped_column(Integer, ForeignKey("logistics.id"), nullable=True)


class AuditLog(Base, BaseMixin):
    """关键操作审计日志：登录 / 改密 / 业务数据增删改 等"""
    __tablename__ = "audit_logs"
    username = mapped_column(String(64), default="")        # 操作人账号
    role = mapped_column(String(32), default="")            # 角色
    action = mapped_column(String(64), default="")          # 操作类型
    target = mapped_column(String(64), default="")          # 操作对象实体
    target_id = mapped_column(Integer, default=0)           # 操作对象 id
    detail = mapped_column(String(512), default="")         # 说明
    ip = mapped_column(String(64), default="")              # 来源 IP


# ============================================================
# Phase 6 — 茶饮供应链生态闭环
# ============================================================

class Factory(Base, BaseMixin, AccountMixin):
    """原料工厂：茶农 / 糖厂 / 奶源基地 / 种植基地，供应链最上游"""
    __tablename__ = "factories"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))
    type = mapped_column(String(32), default="茶农")         # 茶农/糖厂/奶源基地/种植基地/加工厂
    platform_id = mapped_column(Integer, ForeignKey("platforms.id"))
    region = mapped_column(String(64))                       # 产地：福建安溪/云南普洱/广西南宁
    contact = mapped_column(String(64))
    phone = mapped_column(String(32))
    annual_capacity = mapped_column(String(64))              # 年产能力：500吨
    certifications = mapped_column(String(256))              # 资质：有机认证/ISO22000/HACCP
    quality_rating = mapped_column(Integer, default=0)       # 质量评分 0-100
    cooperation_start = mapped_column(String(32))
    status = mapped_column(String(32), default="合作中")     # 合作中/暂停/停用


class Recipe(Base, BaseMixin):
    """饮品配方研发：独立模块，配方的原料消耗作为库存损耗的一种来源"""
    __tablename__ = "recipes"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))                        # 配方名称：经典奶茶/杨枝甘露
    version = mapped_column(String(16), default="1.0")      # 版本号
    category = mapped_column(String(64))                     # 品类：奶茶/果茶/咖啡/冰沙
    cup_size = mapped_column(String(32), default="中杯500ml")# 杯型规格
    materials = mapped_column(String(2048))                  # JSON BOM: [{i:配料id, n:名称, q:用量, u:单位}]
    cost_per_cup = mapped_column(Float, default=0)           # 单杯原料成本
    sale_price_ref = mapped_column(Float, default=0)         # 建议售价
    steps = mapped_column(String(2048))                      # 制作步骤（JSON）
    developer = mapped_column(String(64))                    # 研发人
    status = mapped_column(String(32), default="研发中")     # 研发中/已定型/已停用
    remark = mapped_column(String(512))


class Device(Base, BaseMixin):
    """门店设备：奶茶机 / 收银机 / POS，一对多绑门店，MAC 全局唯一"""
    __tablename__ = "devices"
    code = mapped_column(String(32), unique=True)
    name = mapped_column(String(128))                        # 设备名称：鸣智奶茶机-1号
    store_id = mapped_column(Integer, ForeignKey("stores.id"))
    mac = mapped_column(String(32), unique=True, index=True) # MAC 地址，全局唯一
    type = mapped_column(String(32), default="奶茶机")      # 奶茶机/收银机/POS/标签秤
    model = mapped_column(String(64))                        # 型号：MZ-2000
    api_key = mapped_column(String(64), unique=True)         # API 鉴权 Key
    firmware = mapped_column(String(32))                     # 固件版本
    last_heartbeat = mapped_column(String(32))               # 最后心跳时间
    online = mapped_column(Boolean, default=False)           # 在线状态
    ip_address = mapped_column(String(64))                   # 设备IP
    status = mapped_column(String(32), default="正常")       # 正常/离线/故障/维护


class Consumption(Base, BaseMixin):
    """设备原料消耗记录：设备上报或手动录入，自动关联扣库存"""
    __tablename__ = "consumption"
    code = mapped_column(String(32), unique=True)
    device_id = mapped_column(Integer, ForeignKey("devices.id"))
    store_id = mapped_column(Integer, ForeignKey("stores.id"))
    ingredient_id = mapped_column(Integer, ForeignKey("ingredients.id"))
    quantity = mapped_column(Float, default=0)               # 消耗用量
    unit = mapped_column(String(32))                         # 单位
    batch_no = mapped_column(String(64))                     # 批号（追溯用）
    consume_time = mapped_column(String(32))                 # 消耗时间
    source = mapped_column(String(32), default="设备上报")   # 设备上报/手动录入/配方消耗
    recipe_id = mapped_column(Integer, ForeignKey("recipes.id"), nullable=True, default=None)
    status = mapped_column(String(32), default="已确认")     # 待确认/已确认/已冲正


class ReplenishRule(Base, BaseMixin):
    """自动补货规则：消耗驱动的智能叫货"""
    __tablename__ = "replenish_rules"
    code = mapped_column(String(32), unique=True)
    ingredient_id = mapped_column(Integer, ForeignKey("ingredients.id"))
    store_id = mapped_column(Integer, ForeignKey("stores.id"), nullable=True, default=None)
    safety_stock = mapped_column(Float, default=0)           # 安全库存
    reorder_point = mapped_column(Float, default=0)          # 订货点（触发补货）
    reorder_qty = mapped_column(Float, default=0)            # 建议补货量
    supplier_id = mapped_column(Integer, ForeignKey("suppliers.id"))
    lead_time_days = mapped_column(Integer, default=3)       # 供应商交货提前期(天)
    avg_daily_usage = mapped_column(Float, default=0)        # 日平均用量（系统自动计算）
    auto_approve = mapped_column(Boolean, default=False)     # 是否自动审批
    last_calc_time = mapped_column(String(32))               # 上次计算时间
    status = mapped_column(String(32), default="启用")       # 启用/停用
