import streamlit as st
import yfinance as yf
from yfinance import EquityQuery
import pandas as pd
import datetime
import requests

# ==================== 页面配置 ====================
st.set_page_config(
    page_title="HKScreener Pro - 香港股权筛选智能终端",
    layout="wide",
    page_icon="📈",
    initial_sidebar_state="collapsed"
)

# ==================== 极客级 UI 样式注入 (CSS) ====================
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=Noto+Sans+SC:wght@300;400;700&display=swap');
    
    :root {
        --bg-gradient: linear-gradient(135deg, #090a0f 0%, #121520 100%);
        --card-bg: rgba(30, 41, 59, 0.45);
        --card-border: rgba(255, 255, 255, 0.08);
        --text-main: #e2e8f0;
        --text-value: #ffffff;
        --text-muted: #a0aec0;
        --sidebar-bg: #0b0c10;
        --sidebar-border: rgba(255, 255, 255, 0.05);
        --index-card-bg: rgba(15, 23, 42, 0.6);
        --news-link: #3b82f6;
        --accent-pink: #ec4899;
        --shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.25);
        --hover-border: rgba(99, 102, 241, 0.4);
        --hover-shadow: 0 8px 32px 0 rgba(99, 102, 241, 0.15);
    }
    
    @media (prefers-color-scheme: light) {
        :root {
            --bg-gradient: linear-gradient(135deg, #f0f2f5 0%, #e4e8ec 100%);
            --card-bg: rgba(255, 255, 255, 0.85);
            --card-border: rgba(0, 0, 0, 0.07);
            --text-main: #374151;
            --text-value: #111827;
            --text-muted: #4b5563;
            --sidebar-bg: #ffffff;
            --sidebar-border: rgba(0, 0, 0, 0.08);
            --index-card-bg: rgba(255, 255, 255, 0.95);
            --news-link: #1d4ed8;
            --accent-pink: #db2777;
            --shadow: 0 8px 24px 0 rgba(148, 163, 184, 0.1);
            --hover-border: rgba(99, 102, 241, 0.35);
            --hover-shadow: 0 8px 24px 0 rgba(99, 102, 241, 0.15);
        }
    }
    
    /* 核心字体与背景设置 */
    html, body, [class*="css"] {
        font-family: 'Space Grotesk', 'Noto Sans SC', sans-serif;
    }
    
    /* 主体背景渐变与文字排版 */
    .stApp {
        background: var(--bg-gradient) !important;
        color: var(--text-main);
    }
    
    .main {
        background: transparent !important;
        color: var(--text-main);
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
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        padding: 22px;
        margin-bottom: 20px;
        backdrop-filter: blur(10px);
        box-shadow: var(--shadow);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .premium-card:hover {
        border-color: var(--hover-border);
        box-shadow: var(--hover-shadow);
        transform: translateY(-2px);
    }
    
    /* 大盘指数卡片特殊样式 */
    .index-card {
        background: var(--index-card-bg);
        border-left: 4px solid #6366f1;
    }
    
    /* 数据卡片值 */
    .metric-value {
        font-size: 1.8rem;
        font-weight: 700;
        color: var(--text-value);
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
        background-color: var(--sidebar-bg) !important;
        border-right: 1px solid var(--sidebar-border);
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
    
    /* 隐藏 Streamlit 默认的顶部 Deploy 按钮和主菜单，提升界面专业感 */
    header[data-testid="stHeader"], [data-testid="stHeader"] {
        display: none !important;
    }
    div.stAppDeployButton {
        display: none !important;
    }
    footer {
        visibility: hidden !important;
    }
    
    /* 移除顶部大块空白间距，紧凑排版 */
    div[data-testid="stMainBlockContainer"], .block-container {
        padding-top: 1.5rem !important;
        padding-bottom: 1.5rem !important;
    }
    
    /* 让 Streamlit 的 st.container(border=True) 变成我们的 premium-card 样式 */
    div[data-testid="stVerticalBlockBorderWrapper"] {
        background: var(--card-bg) !important;
        border: 1px solid var(--card-border) !important;
        border-radius: 16px !important;
        padding: 18px 22px !important;
        box-shadow: var(--shadow) !important;
    }
    
    /* 美化 Tabs 导航栏 */
    button[data-baseweb="tab"] {
        font-size: 1.05rem !important;
        font-weight: 600 !important;
        color: var(--text-muted) !important;
        border-bottom: 2px solid transparent !important;
        transition: all 0.2s ease !important;
    }
    button[data-baseweb="tab"][aria-selected="true"] {
        color: var(--text-value) !important;
        border-bottom: 2px solid #6366f1 !important;
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
if "selected_sectors_cn" not in st.session_state:
    st.session_state.selected_sectors_cn = []
if "buffett_filter" not in st.session_state:
    st.session_state.buffett_filter = False
if "last_screened_df" not in st.session_state:
    st.session_state.last_screened_df = None
if "selected_symbol" not in st.session_state:
    st.session_state.selected_symbol = ""
if "ggt_filter" not in st.session_state:
    st.session_state.ggt_filter = "不限"

def reset_filters():
    st.session_state.min_mcap = 0
    st.session_state.max_mcap = 0
    st.session_state.max_pe = 50
    st.session_state.min_volume = 0
    st.session_state.min_price = 0.0
    st.session_state.max_price = 0.0
    st.session_state.min_div_yield = 0.0
    st.session_state.min_change = -50.0
    st.session_state.selected_sectors_cn = []
    st.session_state.last_screened_df = None
    st.session_state.ggt_filter = "不限"
    st.session_state.buffett_filter = False

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
        st.session_state.selected_sectors_cn = ["金融服务 (Financial Services)", "公用事业 (Utilities)", "房地产 (Real Estate)"]
        st.session_state.buffett_filter = False
    elif template_name == "undervalued_growth":
        st.session_state.min_mcap = 1000000000  # 10亿 USD
        st.session_state.max_mcap = 0
        st.session_state.max_pe = 22
        st.session_state.min_volume = 500000
        st.session_state.min_price = 2.0
        st.session_state.max_price = 0.0
        st.session_state.min_div_yield = 1.0
        st.session_state.min_change = -50.0
        st.session_state.selected_sectors_cn = ["科技 (Technology)", "医疗健康 (Healthcare)", "通讯服务 (Communication Services)"]
        st.session_state.buffett_filter = False
    elif template_name == "microcap_alpha":
        st.session_state.min_mcap = 100000000  # 1亿 USD
        st.session_state.max_mcap = 1000000000  # 10亿 USD
        st.session_state.max_pe = 10
        st.session_state.min_volume = 50000
        st.session_state.min_price = 0.5
        st.session_state.max_price = 10.0
        st.session_state.min_div_yield = 2.0
        st.session_state.min_change = -50.0
        st.session_state.selected_sectors_cn = []
        st.session_state.buffett_filter = False
    elif template_name == "buffett_alpha":
        st.session_state.min_mcap = 1000000000  # 10亿 USD
        st.session_state.max_mcap = 0
        st.session_state.max_pe = 25
        st.session_state.min_volume = 100000
        st.session_state.min_price = 1.0
        st.session_state.max_price = 0.0
        st.session_state.min_div_yield = 1.0
        st.session_state.min_change = -50.0
        st.session_state.selected_sectors_cn = []
        st.session_state.buffett_filter = True

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

# ==================== 个股新闻抓取 ====================
@st.cache_data(ttl=600)  # 10分钟缓存
def fetch_stock_news(symbol):
    try:
        t = yf.Ticker(symbol)
        return t.news
    except Exception:
        return []

# ==================== 港股通名单抓取 ====================
@st.cache_data(ttl=86400)  # 24小时缓存
def fetch_stock_connect_list():
    url = "https://vip.stock.finance.sina.com.cn/quotes_service/api/json_v2.php/Market_Center.getHKStockData"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124"
    }
    symbols = set()
    page = 1
    while True:
        params = {
            "page": page,
            "num": 80,
            "sort": "symbol",
            "asc": 1,
            "node": "hgt_hk"
        }
        try:
            response = requests.get(url, params=params, headers=headers, timeout=5)
            data = response.json()
            if not data or len(data) == 0:
                break
            new_added = 0
            for item in data:
                sym = item.get('symbol', '')
                if sym:
                    if len(sym) == 5 and sym.startswith('0'):
                        formatted = f"{sym[1:]}.HK"
                    else:
                        formatted = f"{sym}.HK"
                    if formatted not in symbols:
                        symbols.add(formatted)
                        new_added += 1
            if new_added == 0:
                break
            page += 1
        except Exception:
            break
    return list(symbols)

# ==================== 巴菲特财务报表条件校验 ====================
@st.cache_data(ttl=3600)  # 缓存 1 小时，因为财务报表数据比较稳定，不需要频繁请求
def check_buffett_criteria(symbol):
    try:
        t = yf.Ticker(symbol)
        info = t.info
        
        # 1. 利润表核心率指标初步极速校验
        gross_margin = info.get('grossMargins')
        profit_margin = info.get('profitMargins')
        roe = info.get('returnOnEquity')
        
        # 毛利率持续稳定在 40% 以上
        if gross_margin is not None and gross_margin < 0.40:
            return False, f"毛利率为 {gross_margin*100:.1f}%, 低于 40% 门槛"
        # 净利率持续高于 20%
        if profit_margin is not None and profit_margin < 0.20:
            return False, f"净利率为 {profit_margin*100:.1f}%, 低于 20% 门槛"
        # 股本回报率 ROE 持续大于 20% (在此处取宽限下限 15% 校验任一年)
        if roe is not None and roe < 0.15:
            return False, f"股东权益报酬率 ROE 为 {roe*100:.1f}%, 低于 15% 核心底线"
            
        # 2. 深度三张表指标对齐与计算
        financials = t.financials
        balance_sheet = t.balance_sheet
        cashflow = t.cashflow
        
        if financials.empty or balance_sheet.empty or cashflow.empty:
            return True, "核心指标符合 (深度财务报表缺失，宽限通过)"
            
        # 净利润 (最新财年)
        net_income = None
        for label in ['Net Income', 'Net Income Common Stockholders', 'Net Income Continuous Operations']:
            if label in financials.index:
                net_income = financials.loc[label].iloc[0]
                break
        
        if net_income is None or pd.isna(net_income) or net_income <= 0:
            return False, "最新净利润为负或缺失，不符合巴菲特稳健标准"
            
        # 毛利润
        gross_profit = None
        if 'Gross Profit' in financials.index:
            gross_profit = financials.loc['Gross Profit'].iloc[0]
            
        # 销售及管理费用 (SG&A)
        sga = None
        for label in ['Selling General And Administration', 'Selling General Administrative', 'Selling General and Administrative']:
            if label in financials.index:
                sga = financials.loc[label].iloc[0]
                break
        
        # 缺失则尝试用销售费用 + 管理费用进行拼装
        if sga is None or pd.isna(sga):
            s_exp = financials.loc['Selling And Marketing Expense'].iloc[0] if 'Selling And Marketing Expense' in financials.index else 0
            g_exp = financials.loc['General And Administrative Expense'].iloc[0] if 'General And Administrative Expense' in financials.index else 0
            sga = abs(s_exp or 0) + abs(g_exp or 0)
            
        if gross_profit and sga and not pd.isna(gross_profit) and not pd.isna(sga) and gross_profit > 0:
            sga_ratio = abs(sga) / gross_profit
            if sga_ratio > 0.30:
                return False, f"销管费用 (SG&A) 占毛利比例达 {sga_ratio*100:.1f}%, 超出 30% 门槛"
                
        # 长期负债能在 3 至 4 年内通过净利润还清
        lt_debt = 0
        for label in ['Long Term Debt', 'Long Term Debt And Capital Lease Obligation']:
            if label in balance_sheet.index:
                val = balance_sheet.loc[label].iloc[0]
                if not pd.isna(val):
                    lt_debt = val
                    break
        
        debt_years = abs(lt_debt) / net_income
        if debt_years > 4.0:
            return False, f"长期负债需花 {debt_years:.1f} 年的净利润才能偿还, 超出 4 年门槛"
            
        # 资本支出 (CapEx) 占净利润比例低于 25%
        capex = 0
        for label in ['Capital Expenditure', 'Capital Expenditures']:
            if label in cashflow.index:
                val = cashflow.loc[label].iloc[0]
                if not pd.isna(val):
                    capex = val
                    break
                    
        capex_ratio = abs(capex) / net_income
        if capex_ratio > 0.25:
            return False, f"资本支出占净利润比例达 {capex_ratio*100:.1f}%, 超出 25% 门槛"
            
        return True, "符合巴菲特财务选股指标"
        
    except Exception as e:
        return True, f"符合核心指标 (报表分析校验被跳过: {str(e)})"

# ==================== 筛选结果展示与格式化 ====================
def display_screened_results(df_res):
    display_cols = ['symbol', 'shortName', 'regularMarketPrice', 'intradaymarketcap',
                    'peratio.lasttwelvemonths', 'dayvolume', 'percentchange',
                    'forward_dividend_yield', 'sector']
    existing_cols = [c for c in display_cols if c in df_res.columns]
    df_display = df_res[existing_cols].copy()
    
    if 'sector' in df_display.columns:
        inv_sector_map = {
            "Technology": "科技",
            "Financial Services": "金融服务",
            "Consumer Cyclical": "周期性消费",
            "Consumer Defensive": "防御性消费",
            "Healthcare": "医疗健康",
            "Industrials": "工业",
            "Basic Materials": "基础材料",
            "Energy": "能源",
            "Real Estate": "房地产",
            "Communication Services": "通讯服务",
            "Utilities": "公用事业"
        }
        df_display['sector'] = df_display['sector'].map(inv_sector_map).fillna(df_display['sector'])
    
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

# ==================== 资金流向大盘热力图 ====================
@st.cache_data(ttl=180)  # 3分钟缓存
def fetch_capital_heatmap_data():
    url = "https://push2.eastmoney.com/api/qt/clist/get"
    params = {
        "pn": 1,
        "pz": 48,  # 最活跃的前 48 只股票 (在栅格中形成整齐的行数)
        "po": 1,
        "np": 1,
        "ut": "bd1d9ddb04089700cf9c27f6f7426281",
        "fltt": 2,
        "invt": 2,
        "fid": "f6",  # 按照成交额 (f6) 排序，反映资金集中度
        "fs": "m:128+t:3,m:128+t:4",
        "fields": "f12,f14,f2,f3,f6,f62,f184"
    }
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124"
    }
    try:
        response = requests.get(url, params=params, headers=headers, timeout=5)
        res_json = response.json()
        diff = res_json.get('data', {}).get('diff', [])
        return diff
    except Exception:
        return []

def render_heatmap():
    raw_data = fetch_capital_heatmap_data()
    if not raw_data:
        st.warning("暂未获取到当日大盘成交数据，无法渲染热力图。")
        return
        
    cards_html = []
    for item in raw_data:
        code = item.get('f12', '')
        name = item.get('f14', '未知')
        price = item.get('f2', 0.0)
        change = item.get('f3', 0.0)
        turnover = item.get('f6', 0.0)
        net_inflow = item.get('f62', 0.0)
        
        if not code or change is None:
            continue
            
        # 根据涨跌幅决定颜色 (港股/A股传统：红涨绿跌，使用渐变强化立体感与视觉品味)
        if change > 4.0:
            bg_gradient = "linear-gradient(135deg, #ef4444, #991b1b)" # 强劲上涨
        elif change > 1.5:
            bg_gradient = "linear-gradient(135deg, #f87171, #c2410c)" # 温和上涨
        elif change > 0.0:
            bg_gradient = "linear-gradient(135deg, #fca5a5, #b91c1c)" # 微涨
        elif change < -4.0:
            bg_gradient = "linear-gradient(135deg, #10b981, #064e3b)" # 强劲下跌
        elif change < -1.5:
            bg_gradient = "linear-gradient(135deg, #34d399, #0f766e)" # 温和下跌
        elif change < 0.0:
            bg_gradient = "linear-gradient(135deg, #6ee7b7, #14b8a6)" # 微跌
        else:
            bg_gradient = "linear-gradient(135deg, #64748b, #475569)" # 平盘
            
        turnover_b = turnover / 1e8
        net_inflow_b = net_inflow / 1e8
        sign = "+" if change >= 0 else ""
        
        # 针对 Tooltip 中的正负符号和颜色应用 CSS 类别
        change_class = "up" if change >= 0 else "down"
        inflow_class = "up" if net_inflow >= 0 else "down"
        
        card_html = f"""
        <div class="card" style="background: {bg_gradient};">
            <div class="card-name">{name}</div>
            <div class="card-info">{code} | {sign}{change:.2f}%</div>
            <div class="tooltip-box">
                <div class="tooltip-title">{name} ({code})</div>
                <div class="tooltip-row">最新价格: <strong>{price:.2f} HKD</strong></div>
                <div class="tooltip-row">今日涨跌: <strong class="{change_class}">{sign}{change:.2f}%</strong></div>
                <div class="tooltip-row">当日成交: <strong>{turnover_b:.2f} 亿 HKD</strong></div>
                <div class="tooltip-row">主力净流入: <strong class="{inflow_class}">{net_inflow_b:+.2f} 亿 HKD</strong></div>
            </div>
        </div>
        """
        cards_html.append(card_html)
        
    all_cards = "\n".join(cards_html)
    
    html_code = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            html, body {{
                margin: 0;
                padding: 0;
                background-color: transparent;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                overflow-x: hidden;
            }}
            .grid-container {{
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(115px, 1fr));
                gap: 8px;
                padding: 8px 4px;
            }}
            .card {{
                position: relative;
                height: 60px;
                border-radius: 6px;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                cursor: pointer;
                box-shadow: 0 2px 4px rgba(0,0,0,0.15);
                transition: transform 0.15s ease, box-shadow 0.15s ease;
                user-select: none;
                box-sizing: border-box;
                padding: 4px;
                color: #ffffff;
            }}
            .card:hover {{
                transform: scale(1.06);
                box-shadow: 0 6px 15px rgba(0,0,0,0.4);
                z-index: 10;
            }}
            .card-name {{
                font-size: 12px;
                font-weight: bold;
                margin-bottom: 2px;
                text-align: center;
                width: 95%;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }}
            .card-info {{
                font-size: 10px;
                font-weight: 500;
                opacity: 0.95;
                text-shadow: 0 1px 2px rgba(0,0,0,0.5);
            }}
            .tooltip-box {{
                visibility: hidden;
                width: 180px;
                background-color: rgba(15, 23, 42, 0.98);
                border: 1px solid rgba(255, 255, 255, 0.15);
                border-radius: 6px;
                padding: 10px;
                position: absolute;
                z-index: 100;
                bottom: 118%;
                left: 50%;
                margin-left: -90px;
                box-shadow: 0 8px 24px rgba(0,0,0,0.6);
                opacity: 0;
                transition: opacity 0.15s ease;
                pointer-events: none;
                box-sizing: border-box;
                color: #fff;
            }}
            .card:hover .tooltip-box {{
                visibility: visible;
                opacity: 1;
            }}
            .tooltip-title {{
                font-weight: bold;
                font-size: 13px;
                border-bottom: 1px solid rgba(255,255,255,0.15);
                padding-bottom: 4px;
                margin-bottom: 6px;
                text-align: left;
            }}
            .tooltip-row {{
                font-size: 11px;
                line-height: 1.6;
                color: #cbd5e1;
                text-align: left;
            }}
            .tooltip-row strong {{
                color: #f8fafc;
            }}
            .tooltip-row strong.up {{
                color: #f87171;
            }}
            .tooltip-row strong.down {{
                color: #2dd4bf;
            }}
            
            /* 悬浮框的小三角指示器 */
            .tooltip-box::after {{
                content: "";
                position: absolute;
                top: 100%;
                left: 50%;
                margin-left: -5px;
                border-width: 5px;
                border-style: solid;
                border-color: rgba(15, 23, 42, 0.98) transparent transparent transparent;
            }}
        </style>
    </head>
    <body>
        <div class="grid-container">
            {all_cards}
        </div>
    </body>
    </html>
    """
    
    import streamlit.components.v1 as components
    components.html(html_code, height=450, scrolling=True)

# ==================== UI 标题头部 ====================
col_title, col_logo = st.columns([3, 1])
with col_title:
    st.markdown('<div class="gradient-title">HKScreener Pro</div>', unsafe_allow_html=True)
    st.markdown("<p style='font-size:1.0rem; color:var(--text-muted); margin: 0;'>香港交易所全部股票多因子高级智能筛选器 | 纯本地隐私安全运行</p>", unsafe_allow_html=True)
with col_logo:
    st.markdown("""
    <div style="display: flex; flex-direction: column; align-items: flex-end; justify-content: center; height: 100%; margin-top: 15px;">
        <div style="font-size: 0.8rem; font-weight: 600; color: #10b981; display: flex; align-items: center; gap: 5px; margin-bottom: 4px;">
            <span style="display: inline-block; width: 8px; height: 8px; background-color: #10b981; border-radius: 50%; box-shadow: 0 0 8px #10b981;"></span>
            本地安全运行 (Local Security)
        </div>
        <div style="font-size: 0.8rem; font-weight: 600; color: #3b82f6; display: flex; align-items: center; gap: 5px;">
            <span style="display: inline-block; width: 8px; height: 8px; background-color: #3b82f6; border-radius: 50%; box-shadow: 0 0 8px #3b82f6;"></span>
            港股通数据就绪 (Stock Connect Active)
        </div>
    </div>
    """, unsafe_allow_html=True)

# ==================== 顶部多因子选股控制台 ====================
SECTOR_MAP = {
    "科技 (Technology)": "Technology",
    "金融服务 (Financial Services)": "Financial Services",
    "周期性消费 (Consumer Cyclical)": "Consumer Cyclical",
    "防御性消费 (Consumer Defensive)": "Consumer Defensive",
    "医疗健康 (Healthcare)": "Healthcare",
    "工业 (Industrials)": "Industrials",
    "基础材料 (Basic Materials)": "Basic Materials",
    "能源 (Energy)": "Energy",
    "房地产 (Real Estate)": "Real Estate",
    "通讯服务 (Communication Services)": "Communication Services",
    "公用事业 (Utilities)": "Utilities"
}
sort_options = {
    "市值 (大→小)": ("intradaymarketcap", False),
    "市值 (小→大)": ("intradaymarketcap", True),
    "涨跌幅 (高→低)": ("percentchange", False),
    "成交量 (高→低)": ("dayvolume", False),
    "PE (低→高)": ("peratio.lasttwelvemonths", True),
}

with st.container(border=True):
    st.markdown('<div style="font-weight: 700; font-size: 1.15rem; color: var(--text-value); margin-bottom: 10px;">🔍 多因子智能筛选控制台</div>', unsafe_allow_html=True)
    
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        min_mcap = st.number_input("最小市值(USD)", min_value=0, key="min_mcap", step=100000000)
        max_mcap = st.number_input("最大市值(USD)", min_value=0, key="max_mcap", step=100000000)
        max_pe = st.slider("最大 PE (Trailing)", min_value=0, max_value=200, key="max_pe", step=1)
    with col2:
        min_price = st.number_input("最低价格(HKD)", min_value=0.0, key="min_price", step=0.1)
        max_price = st.number_input("最高价格(HKD)", min_value=0.0, key="max_price", step=0.1)
        min_volume = st.number_input("最小日成交量 (股)", min_value=0, key="min_volume", step=100000)
    with col3:
        min_change = st.slider("最低涨跌幅 (%)", min_value=-50.0, max_value=50.0, key="min_change", step=0.5)
        min_div_yield = st.slider("最低股息收益率 (%)", min_value=0.0, max_value=20.0, key="min_div_yield", step=0.1)
        sort_choice = st.selectbox("排序字段", list(sort_options.keys()))
    with col4:
        selected_sectors_cn = st.multiselect("所属行业 (Sectors)", options=list(SECTOR_MAP.keys()), key="selected_sectors_cn")
        ggt_filter = st.selectbox("港股通筛选 (Stock Connect)", ["不限", "仅限港股通", "排除港股通"], key="ggt_filter")
        buffett_filter = st.checkbox("🔒 开启巴菲特深度财报指标过滤", key="buffett_filter")
        st.button("🧹 重置筛选条件", type="secondary", on_click=reset_filters, use_container_width=True)

sort_field, sort_asc = sort_options[sort_choice]

# ==================== 主内容区：标签页式管理 ====================
tab1, tab2, tab3, tab4 = st.tabs(["🏛️ 大盘监控与量化策略", "🔍 香港股权筛选终端", "📊 个股深度图表分析", "📰 相关个股重大新闻"])

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
                    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase;">{name}</div>
                    <div class="metric-value">{val['price']:,.2f}</div>
                    <div class="{color_class}">{arrow} {sign}{val['change']:,.2f} ({sign}{val['pct']:.2f}%)</div>
                </div>
                """, unsafe_allow_html=True)
            else:
                st.markdown(f"""
                <div class="premium-card index-card">
                    <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600;">{name}</div>
                    <div class="metric-value">休市中/获取失败</div>
                    <div class="metric-delta-pos">--</div>
                </div>
                """, unsafe_allow_html=True)

    st.markdown("---")
    st.markdown("### 📊 当日港股资金集中度矩阵图 (资金规模 & 涨跌分布)")
    st.markdown("<p style='font-size:0.9rem; color:var(--text-muted);'>卡片按 <b>当日成交额从大到小排序</b>（反映资金集中度），颜色代表 <b>今日涨跌幅</b>（红升绿跌：红色上涨，绿色/青色下跌）。鼠标悬停在卡片上可查看主力资金净流入、最新股价及成交额详情。</p>", unsafe_allow_html=True)
    render_heatmap()

    st.markdown("---")
    st.markdown("### 💡 快捷量化策略模板 (一键应用)")
    st.markdown("点击以下策略，将自动同步参数到侧边栏。之后在左下角点击 **「执行筛选」** 即可完成分析。")
    
    col_row1_1, col_row1_2 = st.columns(2)
    
    with col_row1_1:
        st.markdown("""
        <div class="premium-card" style="height: 175px;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #6366f1;">💰 高股息蓝筹龙头</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin: 10px 0; line-height: 1.4;">
                寻找大型公用事业、金融服务、房地产领域的优质港股巨头。要求市值 <b>>50亿 USD</b>、市盈率 <b>&lt;12</b> 且股息率 <b>>6%</b>。
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("应用 “高股息蓝筹龙头” 策略", key="btn_high_div", on_click=apply_template, args=("high_div",)):
            st.success("「高股息蓝筹龙头」策略参数已填充，请切往下一标签页执行筛选！")
            
    with col_row1_2:
        st.markdown("""
        <div class="premium-card" style="height: 175px;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #a855f7;">🚀 低估值成长先锋</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin: 10px 0; line-height: 1.4;">
                聚焦中大型科技股、生物医药、通讯行业。寻找估值合理（PE <b>&lt;22</b>）、市值 <b>>10亿 USD</b> 且日均流动性较强的成长股。
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("应用 “低估值成长先锋” 策略", key="btn_growth", on_click=apply_template, args=("undervalued_growth",)):
            st.success("「低估值成长先锋」策略参数已填充，请切往下一标签页执行筛选！")
            
    st.markdown("<div style='margin-top: 15px;'></div>", unsafe_allow_html=True)
    col_row2_1, col_row2_2 = st.columns(2)
    
    with col_row2_1:
        st.markdown("""
        <div class="premium-card" style="height: 175px;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #ec4899;">🦄 小市值黑马探测</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin: 10px 0; line-height: 1.4;">
                在小市值（<b>1亿 ~ 10亿美元</b>）区间内，挑选估值极低（PE <b>&lt;10</b>）、价格坚实且兼具稳定分红（股息率 <b>>2%</b>）的小盘黑马。
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("应用 “小市值黑马探测” 策略", key="btn_microcap", on_click=apply_template, args=("microcap_alpha",)):
            st.success("「小市值黑马探测」策略参数已填充，请切往下一标签页执行筛选！")
            
    with col_row2_2:
        st.markdown("""
        <div class="premium-card" style="height: 175px;">
            <div style="font-weight: 700; font-size: 1.15rem; color: #eab308;">📖 巴菲特教你读财报选股</div>
            <div style="font-size: 0.85rem; color: var(--text-muted); margin: 10px 0; line-height: 1.4;">
                应用巴菲特护城河财务法则：毛利率<b>>40%</b>、净利率<b>>20%</b>、销管费<b>&lt;30%</b>、ROE<b>>15%</b>、负债可在<b>4年内还清</b>、资本支出<b>&lt;25%</b>。
            </div>
        </div>
        """, unsafe_allow_html=True)
        if st.button("应用 “巴菲特读财报” 策略", key="btn_buffett", on_click=apply_template, args=("buffett_alpha",)):
            st.success("「巴菲特教你读财报选股」策略及报表深度过滤已激活，请切往下一标签页执行筛选！")

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
    if st.session_state.selected_sectors_cn:
        selected_sectors_en = [SECTOR_MAP[s] for s in st.session_state.selected_sectors_cn]
        sector_queries = [EquityQuery('eq', ['sector', s]) for s in selected_sectors_en]
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
                        size=250
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
                # 巴菲特财务指标深度对齐过滤
                if st.session_state.buffett_filter:
                    with st.spinner("正在对齐并校验巴菲特深度财报指标 (利润表/资产负债表/现金流量表)..."):
                        buffett_passed = []
                        progress_bar = st.progress(0.0, text="正在加载并校验财务数据...")
                        
                        total_stocks = len(df_res)
                        for idx, row in enumerate(df_res.itertuples()):
                            sym = row.symbol
                            progress_bar.progress((idx + 0.1) / total_stocks, text=f"正在分析 {row.shortName} ({sym})...")
                            passed, reason = check_buffett_criteria(sym)
                            if passed:
                                buffett_passed.append(sym)
                                
                        progress_bar.empty()
                        df_res = df_res[df_res['symbol'].isin(buffett_passed)].copy()
                        
                # 港股通本地二次筛选
                if st.session_state.ggt_filter != "不限":
                    with st.spinner("正在安全获取并对齐港股通成份股名单..."):
                        ggt_list = fetch_stock_connect_list()
                    if ggt_list:
                        if st.session_state.ggt_filter == "仅限港股通":
                            df_res = df_res[df_res['symbol'].isin(ggt_list)].copy()
                        elif st.session_state.ggt_filter == "排除港股通":
                            df_res = df_res[~df_res['symbol'].isin(ggt_list)].copy()
                    else:
                        st.warning("未能成功拉取到港股通名单，本次将忽略港股通筛选条件。")

                if not df_res.empty:
                    display_screened_results(df_res)
                else:
                    st.warning("筛选池经过港股通过滤后没有符合条件的股票，请放宽条件重新选择。")
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
    st.session_state.selected_symbol = selected_symbol
    
    if selected_symbol:
        # 兼容简短代码如 0700 转换为 0700.HK
        if selected_symbol.isdigit():
            selected_symbol = f"{selected_symbol.zfill(4)}.HK"
            
        with st.spinner(f"正在拉取 {selected_symbol} 的财务数据和历史行情记录..."):
            try:
                ticker = yf.Ticker(selected_symbol)
                info = ticker.info
                
                if 'shortName' in info:
                    inv_sector_map = {
                        "Technology": "科技",
                        "Financial Services": "金融服务",
                        "Consumer Cyclical": "周期性消费",
                        "Consumer Defensive": "防御性消费",
                        "Healthcare": "医疗健康",
                        "Industrials": "工业",
                        "Basic Materials": "基础材料",
                        "Energy": "能源",
                        "Real Estate": "房地产",
                        "Communication Services": "通讯服务",
                        "Utilities": "公用事业"
                    }
                    sector_en = info.get('sector', 'N/A')
                    sector_cn = inv_sector_map.get(sector_en, sector_en)
                    # 显示高品质股票名片
                    st.markdown(f"""
                    <div class="premium-card" style="border-left: 4px solid #a855f7;">
                        <span style="font-size: 1.25rem; font-weight: 700; color: var(--text-value);">{info.get('shortName')} ({selected_symbol})</span> | 
                        <span style="color: var(--text-muted);">行业: {sector_cn} - {info.get('industry', 'N/A')}</span>
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

# -------------------- TAB 4: 相关个股重大新闻 --------------------
with tab4:
    st.markdown("### 📰 香港股市与个股重大新闻提示")
    
    # 确定要查询的股票代码
    news_symbol = st.session_state.selected_symbol if st.session_state.selected_symbol else "^HSI"
    
    col_news_left, col_news_right = st.columns([1, 1])
    
    with col_news_left:
        st.markdown(f"#### 🔍 当前关注股票/大盘新闻 ({news_symbol})")
        news_items = fetch_stock_news(news_symbol)
        
        if news_items:
            for item in news_items[:8]:  # 最多显示8条
                content = item.get('content', item)
                title = content.get('title', '无标题')
                link = content.get('canonicalUrl', {}).get('url', '#') if isinstance(content.get('canonicalUrl'), dict) else content.get('link', '#')
                publisher = content.get('provider', {}).get('displayName', '未知媒体') if isinstance(content.get('provider'), dict) else content.get('publisher', '未知媒体')
                
                pub_time = "未知时间"
                if 'pubDate' in content:
                    pub_time_str = content.get('pubDate', '')
                    if pub_time_str and 'T' in pub_time_str:
                        pub_time = pub_time_str.replace('T', ' ').replace('Z', '')[:16]
                elif 'providerPublishTime' in content:
                    pub_time_raw = content.get('providerPublishTime', 0)
                    if pub_time_raw:
                        pub_time = datetime.datetime.fromtimestamp(pub_time_raw).strftime('%Y-%m-%d %H:%M')
                
                # 使用 st.html 渲染原生 HTML 卡片，避免 Markdown 语法和闭合标签产生冲突
                card_html = f"""<div class="premium-card">
<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:5px; display:flex; justify-content:space-between;">
<span>📰 {publisher}</span>
<span>⏱️ {pub_time}</span>
</div>
<a href="{link}" target="_blank" style="text-decoration:none; font-weight:600; color:var(--news-link); font-size:1.0rem; display:block; margin-bottom:8px;">{title}</a>
<div>
<span style="background:rgba(99, 102, 241, 0.15); color:#a855f7; font-size:0.75rem; padding:2px 8px; border-radius:4px; font-weight:600;">{news_symbol}</span>
</div>
</div>"""
                st.html(card_html)
        else:
            st.info(f"暂未获取到 {news_symbol} 的近期相关重大新闻。")
            
    with col_news_right:
        st.markdown("#### 🏆 筛选池中个股聚合新闻 (最新动态)")
        
        # 获取筛选池股票列表的 news
        screened_tickers = []
        if st.session_state.last_screened_df is not None and not st.session_state.last_screened_df.empty:
            # 获取前5只股票以避免并发过大导致加载慢
            screened_tickers = st.session_state.last_screened_df['symbol'].head(5).tolist()
            
        if screened_tickers:
            st.markdown(f"<p style='font-size:0.85rem; color:var(--text-muted);'>正在聚合以下选股池中前 5 只股票的最新消息: {', '.join(screened_tickers)}</p>", unsafe_allow_html=True)
            aggregated_news = []
            seen_uuids = set()
            
            for t_sym in screened_tickers:
                t_news = fetch_stock_news(t_sym)
                for item in t_news:
                    uuid = item.get('uuid', item.get('id'))
                    if uuid not in seen_uuids:
                        seen_uuids.add(uuid)
                        item['_associated_ticker'] = t_sym
                        aggregated_news.append(item)
            
            # 健全的时间排序逻辑（支持 pubDate ISO 格式和 Unix 时间戳）
            def get_sort_key(x):
                c = x.get('content', x)
                if 'pubDate' in c:
                    try:
                        val = c.get('pubDate', '')
                        dt = datetime.datetime.fromisoformat(val.replace('Z', '+00:00'))
                        return dt.timestamp()
                    except:
                        return 0
                return c.get('providerPublishTime', 0)
                
            aggregated_news.sort(key=get_sort_key, reverse=True)
            
            if aggregated_news:
                for item in aggregated_news[:10]:  # 显示前10条
                    content = item.get('content', item)
                    title = content.get('title', '无标题')
                    link = content.get('canonicalUrl', {}).get('url', '#') if isinstance(content.get('canonicalUrl'), dict) else content.get('link', '#')
                    publisher = content.get('provider', {}).get('displayName', '未知媒体') if isinstance(content.get('provider'), dict) else content.get('publisher', '未知媒体')
                    associated_ticker = item.get('_associated_ticker', '港股')
                    
                    pub_time = "未知时间"
                    if 'pubDate' in content:
                        pub_time_str = content.get('pubDate', '')
                        if pub_time_str and 'T' in pub_time_str:
                            pub_time = pub_time_str.replace('T', ' ').replace('Z', '')[:16]
                    elif 'providerPublishTime' in content:
                        pub_time_raw = content.get('providerPublishTime', 0)
                        if pub_time_raw:
                            pub_time = datetime.datetime.fromtimestamp(pub_time_raw).strftime('%Y-%m-%d %H:%M')
                    
                    # 使用 st.html 渲染原生 HTML 卡片
                    card_html = f"""<div class="premium-card" style="border-left: 2px solid var(--accent-pink);">
<div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:5px; display:flex; justify-content:space-between;">
<span>📰 {publisher}</span>
<span>⏱️ {pub_time}</span>
</div>
<a href="{link}" target="_blank" style="text-decoration:none; font-weight:600; color:var(--accent-pink); font-size:1.0rem; display:block; margin-bottom:8px;">{title}</a>
<div>
<span style="background:rgba(236, 72, 153, 0.15); color:var(--accent-pink); font-size:0.75rem; padding:2px 8px; border-radius:4px; font-weight:600;">{associated_ticker}</span>
</div>
</div>"""
                    st.html(card_html)
            else:
                st.info("所选股票近期暂无重大新闻报道。")
        else:
            st.info("💡 请先在第二栏执行筛选获取选股池，或者在大盘和个股页面激活目标，这里将展示选股池中个股的聚合新闻动态。")

st.markdown("---")
st.caption("提示：此智能终端完全在您本地安全运行，与网页相比响应更快。若遇到数据获取慢，可能与网络连接 Yahoo Finance 的连通状况有关。")
