# AI4S 机构网站

Leiden 式探索器，**不是综合排名**。Education 类高校，窗口 2019–2024（不含 2025）。

## 启动（给别人看）

不要把 `index.html` 直接发给别人双击打开——浏览器会拦截脚本。必须用下面的方式开一个网页地址。

在 `site` 目录运行：

```bash
cd site
python serve.py
```

窗口里会打印两类地址：

- **本机**：`http://127.0.0.1:5173/`
- **同一 Wi-Fi 的手机/电脑**：`http://192.168.x.x:5173/`（以窗口打印为准）

把「同一 Wi-Fi」那条发给队友即可。你的电脑要保持 `serve.py` 开着。

不要把 `http://localhost:5173` 发给别人——那只指向他们自己的电脑。

更新机构表后重跑：`python build_institution_master.py`。

## 已有页面

| 路径 | 内容 |
|------|------|
| `/` | 落地页：粒子缎带交互；进入探索后到概览 |
| `/home.html` | 概览：定位、入口卡片、机构数（n_ai4s ≥ 500） |
| `/explore/list.html` | 机构列表（Education，可搜、排序、门槛 200/500/1000/2000） |
| `/explore/chart.html` | 图表：默认 Ch05 规模—质量；另有 Ch03 高校图 + Ch04 图 6-1/6-4 |
| `/explore/map.html` | 地图占位 |
| `/explore/compare.html` | 中英对比 Tab A/B/C 已接入；D 占位 |
| `/institution.html?id=` | 机构详情 KPI（来自 master 表） |
| `/info/*` | 数据、指标、机构定义、负责任使用 |

中英切换在右上角（写入 localStorage）。

## 数据怎么来

- JOIN：`03_02` + `05_02` + `03_01` 的全球份额 → `data/institution_master.json`
- 合作不 JOIN 进机构表（Ch04 无各校合作率）
- Chart 默认图：`public/figures/ch05_fig2_x2000_zh.html` / `_en.html`（需同目录 `plotly.min.js`）

不要加国家模块、学科模块、合作网络图或综合排名。
