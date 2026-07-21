import streamlit as st
import yfinance as yf
from yfinance import EquityQuery
import pandas as pd
import datetime

# ==================== 页面配置 ====================
st.set_page_config(
    page_title="HKScreener Pro - 香港股权筛选智能终端",
    layout="wide",
    page_icon="📈",
    initial_sidebar_state="expanded"
)

# ==================== 极客级 UI 样式注入 (CSS) ====================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Noto+Sans+SC:wght@300;400;700&display=swap');
    
    /* 核心字体与背景设置 */
    html, body, [class*="css"] {
        font-family: 'Space Grotesk', 'Noto Sans SC', sans-serif;
    }
    
    /* 主体背景渐变与文字排版 */
    .main {
        background: linear-gradient(135deg, #090a0f 0%, #121520 100%);
        color: #e2e8f0;
    }
    
    /* 渐变标题 */
    .gradient-title {
        background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        font-weight: 700;
        font-size: 2.5rem !important;
        margin-bottom: 5px;
    }
    
    /* 毛玻璃高阶卡片 */
    .premium-card {
        background: rgba(30, 41, 59, 0.45);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 16px;
        padding: 22px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .premium-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        box-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.15);
        transform: translateY(-2px);
    }
    
    /* 大盘指数卡片特殊样式 */
    .index-card {
        background: rgba(15, 23, 42, 0.6);
        border-left: 4px solid #6366f1;
    }
    
    /* 数据卡片值 */
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: #ffffff;
        margin: 5px 0;
    }
    .metric-delta-pos {
        color: #10b981;
        font-size: 0.9rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 3px;
    }
    .metric-delta-neg {
        color: #ef4444;
        font-size: 0.9rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 3px;
    }
    
    /* 侧边栏样式微调 */
    section[data-testid="stSidebar"] {
        background-color: #0b0c10 !important;
        border-right: 1px solid rgba(255, 255, 255, 0.05);
    }
    
    /* 按钮样式增强 */
    div.stButton > button {
        background: linear-gradient(90deg, #4f46e5 0%, #7c3aed 100%) !important;
        color: white !important;
        border: none !important;
        border-radius: 10px !important;
        padding: 10px 20px !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 14px rgba(79, 70, 229, 0.3) !important;
        transition: all 0.25s ease-in-out !important;
        width: 100%;
    }
    div.stButton > button:hover {
        background: linear-gradient(90deg, #4338ca 0%, #6d28d9 100%) !important;
        box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5) !important;
        transform: translateY(-1px);
    }
</style>
""", unsafe_allow_html=True)

# ==================== 初始化 Session State (支持策略联动) ====================
if "min_mcap" not in st.session_state:
    st.session_state.min_mcap = 0
if "max_mcap" not in st.session_state:
    st.session_state.max_mcap = 0
if "max_pe" not in st.session_state:
    st.session_state.max_pe = 50
if "min_volume" not in st.session_state:
    st.session_state.min_volume = 0
if "min_price" not in st.session_state:
    st.session_state.min_price = 0.0
if "max_price" not in st.session_state:
    st.session_state.max_price = 0.0
if "min_div_yield" not in st.session_state:
    st.session_state.min_div_yield = 0.0
if "min_change" not in st.session_state:
    st.session_state.min_change = -50.0
if "selected_sectors" not in st.session_state:
    st.session_state.selected_sectors = []
if "last_screened_df" not in st.session_state:
    st.session_state.last_screened_df = None

def reset_filters():
    st.session_state.min_mcap = 0
    st.session_state.max_mcap = 0
    st.session_state.max_pe = 50
    st.session_state.min_volume = 0
    st.session_state.min_price = 0.0
    st.session_state.max_price = 0.0
    st.session_state.min_div_yield = 0.0
    st.session_state.min_change = -50.0
    st.session_state.selected_sectors = []
    st.session_state.last_screened_df = None

# ==================== 策略模板填充器 ====================
def apply_template(template_name):
    if template_name == "high_div":
        st.session_state.min_mcap = 5000000000  # 50亿 USD
        st.session_state.max_mcap = 0
        st.session_state.max_pe = 12
        st.session_state.min_volume = 100000
        st.session_state.min_price = 5.0
        st.session_state.max_price = 0.0
        st.session_state.min_div_yield = 6.0
        st.session_state.min_change = -50.0
        st.session_state.selected_sectors = ["Financial Services", "Utilities", "Real Estate"]
    elif template_name == "undervalued_growth":
        st.session_state.min_mcap = 1000000000  # 10亿 USD
        st.session_state.max_mcap = 0
        st.session_state.max_pe = 22
        st.session_state.min_volume = 500000
        st.session_state.min_price = 2.0
        st.session_state.max_price = 0.0
        st.session_state.min_div_yield = 1.0
        st.session_state.min_change = -50.0
        st.session_state.selected_sectors = ["Technology", "Healthcare", "Communication Services"]
    elif template_name == "microcap_alpha":
        st.session_state.min_mcap = 100000000  # 1亿 USD
        st.session_state.max_mcap = 1000000000  # 10亿 USD
        st.session_state.max_pe = 10
        st.session_state.min_volume = 50000
        st.session_state.min_price = 0.5
        st.session_state.max_price = 10.0
        st.session_state.min_div_yield = 2.0
        st.session_state.min_change = -50.0
        st.session_state.selected_sectors = []

# ==================== 大盘核心指数行情抓取 ====================
@st.cache_data(ttl=180)  # 3分钟缓存
def fetch_indices():
    indices = {
        "恒生指数 (HSI)": "^HSI",
        "恒生科技指数 (HSTECH)": "^HSTECH",
        "恒生国企指数 (HSCE)": "^HSCE"
    }
    data = {}
    for name, ticker in indices.items():
        try:
            t = yf.Ticker(ticker)
            hist = t.history(period="2d")
            if len(hist) >= 2:
                price = hist['Close'].iloc[-1]
                prev_close = hist['Close'].iloc[-2]
                change = price - prev_close
                pct_change = (change / prev_close) * 100
                data[name] = {"price": price, "change": change, "pct": pct_change}
            else:
                data[name] = {"price": 0.0, "change": 0.0, "pct": 0.0}
        except Exception:
            data[name] = {"price": 0.0, "change": 0.0, "pct": 0.0}
    return data

# ==================== UI 标题头部 ====================
col_title, col_logo = st.columns([5, 1])
with col_title:
    st.markdown('<div class="gradient-title">HKScreener Pro</div>', unsafe_allow_html=True)
    st.markdown("<p style='font-size:1.0rem; color:#a0aec0;'>香港交易所全部股票多因子高级智能筛选器 | 纯本地隐私安全运行</p>", unsafe_allow_html=True)

# ==================== 侧边栏：多因子筛选条件配置 ====================
st.sidebar.markdown("### 🔍 多因子筛选器")

# 侧边栏重置按钮
st.sidebar.button("🧹 重置筛选条件", type="secondary", on_click=reset_filters)

# 侧边栏具体过滤输入绑定
st.sidebar.markdown("---")
col_sidebar1, col_sidebar2 = st.sidebar.columns(2)
with col_sidebar1:
    min_mcap = st.number_input("最小市值(USD)", min_value=0, key="min_mcap", step=100000000)
with col_sidebar2:
    max_mcap = st.number_input("最大市值(USD)", min_value=0, key="max_mcap", step=100000000)

max_pe = st.sidebar.slider("最大 PE (Trailing)", min_value=0, max_value=200, key="max_pe", step=1)
min_volume = st.sidebar.number_input("最小日成交量 (股)", min_value=0, key="min_volume", step=100000)

col_sidebar3, col_sidebar4 = st.sidebar.columns(2)
with col_sidebar3:
    min_price = st.number_input("最低价格(HKD)", min_value=0.0, key="min_price", step=0.1)
with col_sidebar4:
    max_price = st.number_input("最高价格(HKD)", min_value=0.0, key="max_price", step=0.1)

sectors = [
    "Technology", "Financial Services", "Consumer Cyclical", "Consumer Defensive",
    "Healthcare", "Industrials", "Basic Materials", "Energy", "Real Estate",
    "Communication Services", "Utilities"
]
selected_sectors = st.sidebar.multiselect("所属行业 (Sectors)", options=sectors, key="selected_sectors")

min_div_yield = st.sidebar.slider("最低股息收益率 (%)", min_value=0.0, max_value=20.0, key="min_div_yield", step=0.1)
min_change = st.sidebar.slider("最低涨跌幅 (%)", min_value=-50.0, max_value=50.0, key="min_change", step=0.5)

st.sidebar.markdown("---")
# 排序选项
sort_options = {
    "市值 (大→小)": ("intradaymarketcap", False),
    "市值 (小→大)": ("intradaymarketcap", True),
    "涨跌幅 (高→低)": ("percentchange", False),
    "成交量 (高→低)": ("dayvolume", False),
    "PE (低→高)": ("peratio.lasttwelvemonths", True),
}
sort_choice = st.sidebar.selectbox("排序字段", list(sort_options.keys()))
sort_field, sort_asc = sort_options[sort_choice]

# ==================== 主内容区：标签页式管理 ====================
tab1, tab2, tab3 = st.tabs(["🏛️ 大盘监控与量化策略", "🔍 香港股权筛选终端", "📊 个股深度图表分析"])

# -------------------- TAB 1: 大盘监控与量化策略 --------------------
with tab1:
    st.markdown("### 🏛️ 香港大盘指数概览")
    indices_data = fetch_indices()
    cols = st.columns(3)
    for idx, (name, val) in enumerate(indices_data.items()):
        with cols[idx]:
            if val['price'] > 0:
                color_class = "metric-delta-pos" if val['pct'] >= 0 else "metric-delta-neg"
                arrow = "▲" if val['pct'] >= 0 else "▼"
                sign = "+" if val['pct'] >= 0 else ""
                st.markdown(f"""
                <div class="premium-card index-card">
                    <div style="font-size: 0.85rem; color: #a0aec0; font-weight: 600; text-transform: uppercase;">{name}</div>
                    <div class="metric-value">{val['price']:,.2f}</div>
                    <div class="{color_class}">{arrow} {sign}{val['change']:,.2f} ({sign}{val['pct']:.2f}%)</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="premium-card index-card">
                    <div style="font-size: 0.85rem; color: #a0aec0; font-weight: 600;">{name}</div>
                    <div class="metric-value">休市中/获取失败</div>
                    <div class="metric-delta-pos">--</div>
                </div>
                """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### 💡 快捷量化策略模板 (一键应用)")
    st.markdown("点击以下策略，将自动同步参数到侧边栏。之后在左下角点击 **「执行筛选」** 即可完成分析。")
    
    col_strat1, col_strat2, col_strat3 = st.columns(3)
    
    with col_strat1:
        st.markdown("""
        <div class="premium-card" style="height: 190px;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #6366f1;">💰 高股息蓝筹龙头</div>
            <div style="font-size: 0.85rem; color: #a0aec0; margin: 10px 0; line-height: 1.4;">
                寻找大型公用事业、金融服务、房地产领域的优质巨头。要求市值 <b>>50亿 USD</b>、市盈率 <b>&lt;12</b> 且股息率 <b>>6%</b>。
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("应用 “高股息蓝筹龙头” 策略", key="btn_high_div", on_click=apply_template, args=("high_div",)):
            st.success("「高股息蓝筹龙头」策略参数已填充，请切往下一标签页执行筛选！")
            
    with col_strat2:
        st.markdown("""
        <div class="premium-card" style="height: 190px;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #a855f7;">🚀 低估值成长先锋</div>
            <div style="font-size: 0.85rem; color: #a0aec0; margin: 10px 0; line-height: 1.4;">
                聚焦中大型科技股、生物医药、通讯行业。寻找估值合理（PE <b>&lt;22</b>）、市值 <b>>10亿 USD</b> 且日均流动性较强的成长股。
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("应用 “低估值成长先锋” 策略", key="btn_growth", on_click=apply_template, args=("undervalued_growth",)):
            st.success("「低估值成长先锋」策略参数已填充，请切往下一标签页执行筛选！")
            
    with col_strat3:
        st.markdown("""
        <div class="premium-card" style="height: 190px;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #ec4899;">🦄 小市值黑马探测</div>
            <div style="font-size: 0.85rem; color: #a0aec0; margin: 10px 0; line-height: 1.4;">
                在小市值（<b>1亿 ~ 10亿美元</b>）区间内，挑选估值极低（PE <b>&lt;10</b>）、价格坚实且兼具稳定分红（股息率 <b>>2%</b>）的小盘黑马。
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("应用 “小市值黑马探测” 策略", key="btn_microcap", on_click=apply_template, args=("microcap_alpha",)):
            st.success("「小市值黑马探测」策略参数已填充，请切往下一标签页执行筛选！")

# -------------------- TAB 2: 香港股权筛选终端 --------------------
with tab2:
    st.markdown("### 🔍 股权筛选及导出")
    
    # 动作按钮
    trigger_col, status_col = st.columns([1, 4])
    with trigger_col:
        execute_btn = st.button("🚀 执行筛选", type="primary")
    
    # 构建查询条件
    conditions = [EquityQuery('eq', ['region', 'hk'])]
    
    if st.session_state.min_mcap > 0:
        conditions.append(EquityQuery('gte', ['intradaymarketcap', st.session_state.min_mcap]))
    if st.session_state.max_mcap > 0:
        conditions.append(EquityQuery('lte', ['intradaymarketcap', st.session_state.max_mcap]))
    if st.session_state.max_pe < 200:
        conditions.append(EquityQuery('lt', ['peratio.lasttwelvemonths', st.session_state.max_pe]))
    if st.session_state.min_volume > 0:
        conditions.append(EquityQuery('gte', ['dayvolume', st.session_state.min_volume]))
    if st.session_state.min_price > 0:
        conditions.append(EquityQuery('gte', ['intradayprice', st.session_state.min_price]))
    if st.session_state.max_price > 0:
        conditions.append(EquityQuery('lte', ['intradayprice', st.session_state.max_price]))
    if st.session_state.selected_sectors:
        sector_queries = [EquityQuery('eq', ['sector', s]) for s in st.session_state.selected_sectors]
        if len(sector_queries) > 1:
            conditions.append(EquityQuery('or', sector_queries))
        else:
            conditions.append(sector_queries[0])
    
    # 修复原始股息收益率查询 bug（需要将输入的百分比除以 100 转换成分数）
    if st.session_state.min_div_yield > 0:
        conditions.append(EquityQuery('gte', ['forward_dividend_yield', st.session_state.min_div_yield / 100.0]))
        
    if st.session_state.min_change > -50:
        conditions.append(EquityQuery('gte', ['percentchange', st.session_state.min_change]))

    # 执行筛选逻辑
    if execute_btn or st.session_state.last_screened_df is not None:
        if execute_btn:
            with st.spinner("正在安全连接 Yahoo Finance 筛选器..."):
                try:
                    q = EquityQuery('and', conditions)
                    response = yf.screen(
                        q,
                        sortField=sort_field,
                        sortAsc=sort_asc,
                        size=500
                    )
                    if response and 'quotes' in response and len(response['quotes']) > 0:
                        df = pd.DataFrame(response['quotes'])
                        st.session_state.last_screened_df = df
                    else:
                        st.session_state.last_screened_df = pd.DataFrame()
                except Exception as e:
                    st.error(f"筛选请求失败: {str(e)}")
                    st.session_state.last_screened_df = None
        
        # 显示结果
        df_res = st.session_state.last_screened_df
        if df_res is not None:
            if not df_res.empty:
                display_cols = ['symbol', 'shortName', 'regularMarketPrice', 'intradaymarketcap',
                                'peratio.lasttwelvemonths', 'dayvolume', 'percentchange',
                                'forward_dividend_yield', 'sector']
                existing_cols = [c for c in display_cols if c in df_res.columns]
                df_display = df_res[existing_cols].copy()
                
                # 友好列名翻译与格式化
                rename_dict = {}
                if 'symbol' in df_display.columns: rename_dict['symbol'] = '股票代码'
                if 'shortName' in df_display.columns: rename_dict['shortName'] = '股票简称'
                if 'sector' in df_display.columns: rename_dict['sector'] = '行业'
                
                if 'regularMarketPrice' in df_display.columns:
                    df_display['价格(HKD)'] = df_display['regularMarketPrice'].round(2)
                    df_display.drop(columns=['regularMarketPrice'], inplace=True)
                if 'intradaymarketcap' in df_display.columns:
                    df_display['市值(亿USD)'] = (df_display['intradaymarketcap'] / 1e8).round(2)
                    df_display.drop(columns=['intradaymarketcap'], inplace=True)
                if 'peratio.lasttwelvemonths' in df_display.columns:
                    df_display['市盈率(PE)'] = df_display['peratio.lasttwelvemonths'].round(2)
                    df_display.drop(columns=['peratio.lasttwelvemonths'], inplace=True)
                if 'dayvolume' in df_display.columns:
                    df_display['成交量(股)'] = df_display['dayvolume'].astype(int)
                    df_display.drop(columns=['dayvolume'], inplace=True)
                if 'percentchange' in df_display.columns:
                    df_display['涨跌幅(%)'] = df_display['percentchange'].round(2)
                    df_display.drop(columns=['percentchange'], inplace=True)
                if 'forward_dividend_yield' in df_display.columns:
                    df_display['股息收益率(%)'] = (df_display['forward_dividend_yield'] * 100).round(2)
                    df_display.drop(columns=['forward_dividend_yield'], inplace=True)
                
                df_display.rename(columns=rename_dict, inplace=True)
                
                # 重新排序一下便于好看
                preferred_order = ['股票代码', '股票简称', '价格(HKD)', '涨跌幅(%)', '市值(亿USD)', '市盈率(PE)', '成交量(股)', '股息收益率(%)', '行业']
                actual_order = [c for c in preferred_order if c in df_display.columns]
                df_display = df_display[actual_order]
                
                # 展示美化后的表格
                st.success(f"🎉 成功筛选出 {len(df_display)} 只符合条件的香港股票！")
                
                st.dataframe(
                    df_display, 
                    use_container_width=True, 
                    hide_index=True,
                    height=400
                )
                
                # 下载按钮与可视化
                csv = df_display.to_csv(index=False).encode('utf-8')
                st.download_button(
                    label="📥 导出筛选结果为 CSV 表格",
                    data=csv,
                    file_name="hk_stock_screener_results.csv",
                    mime="text/csv"
                )
                
                # 行业占比可视化
                if '行业' in df_display.columns:
                    st.markdown("### 📊 筛选结果之行业分布情况")
                    sector_counts = df_display['行业'].value_counts()
                    st.bar_chart(sector_counts, use_container_width=True)
            else:
                st.warning("未检索到符合当前筛选器设定边界的香港股票，请放宽条件重新执行。")

# -------------------- TAB 3: 个股深度图表分析 --------------------
with tab3:
    st.markdown("### 📊 港股深度历史图表及财务指标")
    
    # 允许选择已筛选的股票，或自填港股代码
    symbol_list = []
    if st.session_state.last_screened_df is not None and not st.session_state.last_screened_df.empty:
        symbol_list = st.session_state.last_screened_df['symbol'].tolist()
    
    col_sel, col_input = st.columns([3, 2])
    with col_sel:
        select_sym = st.selectbox("从筛选出的列表中选择股票", options=["-- 请选择 --"] + symbol_list)
    with col_input:
        custom_sym = st.text_input("或者手动输入任意港股代码 (格式如: 0700.HK, 9988.HK)")
    
    selected_symbol = custom_sym.strip() if custom_sym else (select_sym if select_sym != "-- 请选择 --" else "")
    
    if selected_symbol:
        # 兼容简短代码如 0700 转换为 0700.HK
        if selected_symbol.isdigit():
            selected_symbol = f"{selected_symbol.zfill(4)}.HK"
            
        with st.spinner(f"正在拉取 {selected_symbol} 的财务数据和历史行情记录..."):
            try:
                ticker = yf.Ticker(selected_symbol)
                info = ticker.info
                
                if 'shortName' in info:
                    # 显示高品质股票名片
                    st.markdown(f"""
                    <div class="premium-card" style="border-left: 4px solid #a855f7;">
                        <span style="font-size: 1.25rem; font-weight: 700; color:#ffffff;">{info.get('shortName')} ({selected_symbol})</span> | 
                        <span style="color:#a0aec0;">行业: {info.get('sector', 'N/A')} - {info.get('industry', 'N/A')}</span>
                    </div>
                    """, unsafe_allow_html=True)
                    
                    # 展示关键财务基本面列
                    metric_cols = st.columns(5)
                    with metric_cols[0]:
                        st.metric("最新价格", f"{info.get('currentPrice', info.get('regularMarketPrice', 'N/A'))} HKD")
                    with metric_cols[1]:
                        st.metric("市盈率(PE Trailing)", f"{info.get('trailingPE', 'N/A')}")
                    with metric_cols[2]:
                        st.metric("远期市盈率(PE Forward)", f"{info.get('forwardPE', 'N/A')}")
                    with metric_cols[3]:
                        st.metric("股息收益率", f"{((info.get('dividendYield', 0) or 0) * 100):.2f}%" if info.get('dividendYield') else "无派息")
                    with metric_cols[4]:
                        st.metric("贝塔系数 (Beta 5Y)", f"{info.get('beta', 'N/A')}")
                    
                    # 绘制股价走势
                    hist = ticker.history(period="1y")
                    if not hist.empty:
                        st.markdown("#### 📈 过去一年日K收盘价走势曲线")
                        st.line_chart(hist['Close'], use_container_width=True)
                        
                        st.markdown("#### 📊 过去一年每日成交量")
                        st.bar_chart(hist['Volume'], use_container_width=True)
                    else:
                        st.warning("未能拉取到该股的历史行情数据曲线。")
                else:
                    st.error(f"未找到代码为 {selected_symbol} 的股票，请核实代码是否正确。")
            except Exception as e:
                st.error(f"拉取股票详情时发生错误: {str(e)}")
    else:
        st.info("💡 请先选择或输入一只股票代码（如 0700.HK 代表腾讯，9988.HK 代表阿里），以加载其深度历史走势图与财务指标分析。")

st.markdown("---")
st.caption("提示：此智能终端完全在您本地安全运行，与网页相比响应更快。若遇到数据获取慢，可能与网络连接 Yahoo Finance 的连通状况有关。")
