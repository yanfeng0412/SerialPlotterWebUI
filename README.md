# Web Serial Plotter

A modern, web-based Serial Plotter and Monitor tool built with React and Vite. It utilizes the Web Serial API to connect directly to serial devices (such as Arduino, ESP32, etc.) from your browser, allowing you to visualize data in real-time, view raw logs, and send commands.

## Features
- **Web Serial Connection**: Connect directly to serial devices via the browser (no native software required).
- **Real-Time Data Plotting**: Dynamically parses incoming serial data and plots it on interactive charts.
- **Multi-Chart Support**: Automatically creates separate charts based on the title tag in the data stream.
- **Log Viewer & Data Sending**: View raw TX/RX logs and send string commands back to the device.
- **Data Playback**: Upload previously saved log files (.txt, .csv, .log) to replay and analyze historical data.
- **Internationalization**: Supports English and Chinese UI.

## Data Protocol
To plot data on the charts, your serial device must format the output string as follows:
`{TITLE}value1,value2,value3...`

- `{TITLE}`: The name of the chart (e.g., `{Temperature}`, `{MotorSpeed}`).
- `value1,value2...`: Comma or space-separated numerical values to be plotted on the graph.

**Examples:**
```text
{Temp}25.4,26.1
{Motor}1500 1520 1490
```

## Local Deployment

If you want to run or deploy this project locally, follow these steps:

### Prerequisites
- Node.js (v18 or higher recommended)
- A browser that supports the Web Serial API (e.g., Chrome, Edge, Opera)

### Setup Instructions
1. Clone the repository and navigate into the project directory:
   ```bash
   git clone <repository-url>
   cd serialplotter_webuiversion
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. **Important**: Open your browser and navigate to `http://localhost:3000`. 
   *Note: The Web Serial API is a secure context feature. It is only available on `localhost`, `127.0.0.1`, or via HTTPS. If you access it via a local network IP (e.g., `http://192.168.1.x:3000`), the Serial API will be disabled unless you use HTTPS.*

---

# Web 串口绘图与调试工具 (Web Serial Plotter)

这是一个基于 React 和 Vite 构建的现代化 Web 串口绘图与监视工具。它利用 Web Serial API 直接在浏览器中连接串口设备（如 Arduino、ESP32 等），支持实时数据可视化、查看原始日志并发送指令。

## 主要功能
- **Web 串口连接**：无需安装客户端软件，直接通过浏览器连接串口硬件设备。
- **实时数据绘图**：动态解析串口接收到的数据，并实时绘制到交互式折线图中。
- **多图表支持**：根据数据流中的标题标签，自动分类并生成独立的选项卡和图表。
- **日志监视与发送**：查看带有时间戳的收发（TX/RX）日志，并支持向设备发送自定义指令。
- **数据回放**：支持上传本地历史日志文件（.txt、.csv、.log），进行数据回放和图表分析。
- **多语言**：内置中英文界面切换。

## 数据协议 (上发格式)
为了让工具正确识别并绘制图表，下位机（硬件设备）通过串口发送的数据必须符合以下格式规范：
`{图表标题}数值1,数值2,数值3...`

- `{图表标题}`：用于标识数据归属的图表名称，需包含在花括号中（例如 `{Temperature}`, `{Motor}`）。
- `数值1,数值2...`：需要绘制的数值，可以使用逗号或空格分隔。

**数据示例：**
```text
{Temp}25.4,26.1
{Motor}1500 1520 1490
```

## 本地部署指南

如果你希望在本地运行或部署此项目，请按照以下步骤操作：

### 环境要求
- Node.js (建议 v18 或更高版本)
- 支持 Web Serial API 的现代浏览器 (如 Chrome, Edge 等)

### 启动步骤
1. 克隆代码并进入项目目录：
   ```bash
   git clone <repository-url>
   cd serialplotter_webuiversion
   ```
2. 安装依赖包：
   ```bash
   npm install
   ```
3. 启动本地开发服务器：
   ```bash
   npm run dev
   ```
4. **重要提示**：在浏览器中打开 `http://localhost:3000`。
   *注意：Web Serial API 是一项安全限制极高的功能，只有在 `localhost`、`127.0.0.1` 或是使用了 `HTTPS` 协议的安全上下文中才能被浏览器授权使用。如果你通过局域网 IP（例如 `http://192.168.1.x:3000`）访问，Web Serial 将不被支持并可能报错。*
